/**
 * MultiplayerQuiz — componente quiz per le sfide multiplayer.
 *
 * Differenze rispetto a Quiz standard:
 * - Timer sincronizzato da `game_started_at` (timestamp condiviso dal server)
 * - Indicatore progresso avversario in real-time (via Ably presence)
 * - Pubblicazione del proprio progresso su Ably
 * - Gestione fine partita e attesa avversario
 * - Timeout inattivita 2 minuti
 */

import type { JSX } from 'react';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@clerk/tanstack-react-start';
import { Timer } from '~/components/timer';
import { DomandaCard } from '~/components/domanda';
import { Button } from '~/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog';
import { StopIcon, CorrectIcon, WrongIcon } from '~/icons';
import { useAppStore } from '~/store';
import { orpc, client } from '~/lib/orpc';
import { getAblyRealtime } from '~/lib/ably-client';
import type { Domanda } from '~/types/db';
import type { TimerTickPayload } from '~/types/components';
import { MAX_ERRORS } from '~/commons';
import type { SfidaTier } from '~/commons';
import type * as Ably from 'ably';

// ============================================================
// Tipi
// ============================================================

export interface MultiplayerQuizProps {
  /** ID della sfida */
  sfidaId: number;
  /** ID del quiz assegnato a questo player (0 per sfide non-full) */
  quizId: number;
  /** Nome/nickname dell'avversario */
  opponentName: string;
  /** Timestamp ISO di inizio partita (condiviso) */
  gameStartedAt: string;
  /** Callback quando il quiz finisce (per mostrare i risultati) */
  onComplete: (result: MultiplayerQuizResult) => void;
  /** Callback per tornare alla pagina sfide */
  onBack: () => void;
  /** Tipo di sfida */
  sfidaType?: SfidaTier;
  /** Numero di domande nella sfida */
  questionCount?: number;
  /** Durata in secondi */
  durationSeconds?: number;
}

export interface MultiplayerQuizResult {
  correctCount: number;
  wrongCount: number;
  promosso: boolean;
  finalTotalSeconds: number;
  wrongAnswers: Array<{ domanda: Domanda; answerGiven: string }>;
  /** Risposte corrette dell'avversario (dal server, null se non disponibile) */
  opponentCorrect: number | null;
  /** ID del vincitore (dal server, undefined se non disponibile) */
  winnerId: string | null | undefined;
  /** Tempo impiegato dall'avversario in secondi (dal server, null se non disponibile) */
  opponentTotalSeconds: number | null;
}

/** Timeout inattivita durante la sfida: 2 minuti */
const INACTIVITY_TIMEOUT_MS = 2 * 60 * 1000;

type MultiplayerStatus =
  | 'playing'
  | 'finished'
  | 'waiting_opponent'
  | 'abandoned'
  | 'time_expired';

// ============================================================
// Componente
// ============================================================

export function MultiplayerQuiz({
  sfidaId,
  quizId,
  opponentName,
  gameStartedAt,
  onComplete,
  onBack,
  sfidaType = 'full',
  questionCount = 40,
  durationSeconds = 1800,
}: MultiplayerQuizProps): JSX.Element {
  const { userId } = useAuth();

  // Determina se usare quiz_id o sfida_id per le domande
  const isFullQuiz = sfidaType === 'full' && quizId > 0;

  // Store Zustand per stato avversario
  const opponentPos = useAppStore((s) => s.activeSfida?.opponentPos ?? 0);
  const opponentFinished = useAppStore(
    (s) => s.activeSfida?.opponentFinished ?? false
  );
  const updateOpponentProgress = useAppStore((s) => s.updateOpponentProgress);
  const setOpponentFinished = useAppStore((s) => s.setOpponentFinished);

  // Stato locale
  const [status, setStatus] = useState<MultiplayerStatus>('playing');
  const [currentPos, setCurrentPos] = useState<number>(1);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [wrongCount, setWrongCount] = useState<number>(0);
  const [wrongAnswers, setWrongAnswers] = useState<
    Array<{ domanda: Domanda; answerGiven: string }>
  >([]);
  const [abandonDialogOpen, setAbandonDialogOpen] = useState<boolean>(false);
  const [opponentForfeited, setOpponentForfeited] = useState<boolean>(false);

  // Tempo iniziale trascorso dal game_started_at, calibrato con ably.time()
  // null = calibrazione in corso, number = calibrazione completata
  const [initialElapsed, setInitialElapsed] = useState<number | null>(null);

  // Refs
  const lastElapsedRef = useRef<number>(0);
  const abortedRef = useRef<boolean>(false);
  const gameChannelRef = useRef<Ably.RealtimeChannel | null>(null);
  const lastActivityRef = useRef<number>(0);
  const inactivityTimerRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  // Inizializza il timestamp di ultima attivita al mount
  useEffect(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Calibrazione clock via ably.time() al mount:
  // Calcola l'offset tra il clock locale e il server Ably, poi determina
  // il tempo reale trascorso da game_started_at. Fallback su Date.now() se fallisce.
  useEffect(() => {
    let cancelled = false;

    const calibrate = async (): Promise<void> => {
      const startedAtMs = new Date(gameStartedAt).getTime();

      try {
        const ably = getAblyRealtime();
        const serverTimeMs = await ably.time();
        if (cancelled) return;

        const elapsedMs = serverTimeMs - startedAtMs;
        const elapsedSeconds = Math.max(
          0,
          Math.min(Math.floor(elapsedMs / 1000), durationSeconds),
        );
        setInitialElapsed(elapsedSeconds);
      } catch {
        // Fallback: usa il clock locale se ably.time() fallisce
        if (cancelled) return;
        const elapsedMs = Date.now() - startedAtMs;
        const elapsedSeconds = Math.max(
          0,
          Math.min(Math.floor(elapsedMs / 1000), durationSeconds),
        );
        setInitialElapsed(elapsedSeconds);
      }
    };

    void calibrate();

    return (): void => {
      cancelled = true;
    };
  }, [gameStartedAt, durationSeconds]);


  // Query per la domanda corrente — usa quiz.getDomanda per full, sfide.getDomanda per non-full
  const domandaQueryFull = useQuery({
    ...orpc.quiz.getDomanda.queryOptions({
      input: { quiz_id: quizId, quiz_pos: currentPos },
    }),
    enabled: isFullQuiz && status === 'playing' && currentPos <= questionCount,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const domandaQuerySfida = useQuery({
    ...orpc.sfide.getDomanda.queryOptions({
      input: { sfida_id: sfidaId, quiz_pos: currentPos },
    }),
    enabled: !isFullQuiz && status === 'playing' && currentPos <= questionCount,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  // Unifica le due query in un singolo oggetto
  const domandaQuery = isFullQuiz ? domandaQueryFull : domandaQuerySfida;

  // Mutations
  const trackMutation = useMutation(orpc.attempt.track.mutationOptions());
  const completeMutation = useMutation(orpc.quiz.complete.mutationOptions());
  const completeSfidaMutation = useMutation(
    orpc.sfide.complete.mutationOptions()
  );
  const forfeitSfidaMutation = useMutation(
    orpc.sfide.forfeit.mutationOptions()
  );

  // ---- Ably game channel ----
  useEffect(() => {
    const ably = getAblyRealtime();
    const channel = ably.channels.get(`sfide:game:${sfidaId}`);
    gameChannelRef.current = channel;

    // Entra nella presence del canale di gioco
    channel.presence.enter({ pos: 1 }).catch(() => {});

    // Ascolta aggiornamenti presenza avversario
    const handlePresenceUpdate = (msg: Ably.PresenceMessage): void => {
      if (msg.clientId !== userId) {
        const data = msg.data as { pos?: number; finished?: boolean } | null;
        if (data?.pos) {
          updateOpponentProgress(data.pos);
        }
        if (data?.finished) {
          setOpponentFinished();
        }
      }
    };

    channel.presence.subscribe('enter', handlePresenceUpdate);
    channel.presence.subscribe('update', handlePresenceUpdate);

    // Ascolta eventi di gioco
    const handlePlayerFinished = (msg: Ably.InboundMessage): void => {
      const data = msg.data as { playerId?: string } | null;
      if (data?.playerId && data.playerId !== userId) {
        setOpponentFinished();
      }
    };

    channel.subscribe('player-finished', handlePlayerFinished);

    // Ascolta forfeit dell'avversario (timeout o inattività)
    const handlePlayerForfeited = (msg: Ably.InboundMessage): void => {
      const data = msg.data as { playerId?: string } | null;
      if (data?.playerId && data.playerId !== userId) {
        setOpponentForfeited(true);
      }
    };

    channel.subscribe('player-forfeited', handlePlayerForfeited);

    // Sync iniziale della presenza avversario
    void (async (): Promise<void> => {
      try {
        const members = await channel.presence.get();
        for (const m of members) {
          if (m.clientId !== userId) {
            const data = m.data as { pos?: number; finished?: boolean } | null;
            if (data?.pos) updateOpponentProgress(data.pos);
            if (data?.finished) setOpponentFinished();
          }
        }
      } catch {
        // Ignora errori
      }
    })();

    return (): void => {
      channel.presence.leave().catch(() => {});
      channel.presence.unsubscribe();
      channel.unsubscribe();
      gameChannelRef.current = null;
    };
  }, [sfidaId, userId, updateOpponentProgress, setOpponentFinished]);

  // ---- Inactivity timer (2 min) ----
  useEffect(() => {
    if (status !== 'playing') {
      if (inactivityTimerRef.current) {
        clearInterval(inactivityTimerRef.current);
      }
      return;
    }

    inactivityTimerRef.current = setInterval(() => {
      if (Date.now() - lastActivityRef.current > INACTIVITY_TIMEOUT_MS) {
        // Timeout inattivita — forfeit (l'utente perde)
        if (!abortedRef.current) {
          abortedRef.current = true;
          setStatus('abandoned');
          forfeitSfidaMutation.mutate(
            { sfida_id: sfidaId, correct_count: correctCount, elapsed_seconds: lastElapsedRef.current },
            {
              onSuccess: async (data) => {
                // Pubblica forfeit su Ably per notificare l'avversario
                if (gameChannelRef.current) {
                  try {
                    await gameChannelRef.current.publish('player-forfeited', {
                      playerId: userId,
                    });
                  } catch {
                    // Ignora errori Ably
                  }
                }

                const myWrong = questionCount - data.my_correct;
                const promosso =
                  sfidaType === 'full' ? myWrong <= MAX_ERRORS : false;
                onComplete({
                  correctCount: data.my_correct,
                  wrongCount: myWrong,
                  promosso,
                  finalTotalSeconds: lastElapsedRef.current,
                  wrongAnswers,
                  opponentCorrect: data.opponent_correct,
                  winnerId: data.winner_id,
                  opponentTotalSeconds: data.opponent_elapsed_seconds,
                });
              },
            },
          );
        }
        if (inactivityTimerRef.current) {
          clearInterval(inactivityTimerRef.current);
        }
      }
    }, 10_000);

    return (): void => {
      if (inactivityTimerRef.current) {
        clearInterval(inactivityTimerRef.current);
      }
    };
  }, [status, sfidaId, forfeitSfidaMutation, correctCount, questionCount, sfidaType, userId, wrongAnswers, onComplete]);

  // Reset inactivity on user interaction
  const resetInactivity = useCallback((): void => {
    lastActivityRef.current = Date.now();
  }, []);

  // Timer handlers
  const handleTimerTick = useCallback((payload: TimerTickPayload): void => {
    lastElapsedRef.current = payload.elapsed;
  }, []);

  const handleTimerEnd = useCallback((): void => {
    if (status !== 'playing' || abortedRef.current) return;
    abortedRef.current = true;
    setStatus('time_expired');
    forfeitSfidaMutation.mutate(
      { sfida_id: sfidaId, correct_count: correctCount, elapsed_seconds: lastElapsedRef.current },
      {
        onSuccess: async (data) => {
          // Pubblica forfeit su Ably per notificare l'avversario
          if (gameChannelRef.current) {
            try {
              await gameChannelRef.current.publish('player-forfeited', {
                playerId: userId,
              });
            } catch {
              // Ignora errori Ably
            }
          }

          const myWrong = questionCount - data.my_correct;
          const promosso =
            sfidaType === 'full' ? myWrong <= MAX_ERRORS : false;
          onComplete({
            correctCount: data.my_correct,
            wrongCount: myWrong,
            promosso,
            finalTotalSeconds: lastElapsedRef.current,
            wrongAnswers,
            opponentCorrect: data.opponent_correct,
            winnerId: data.winner_id,
            opponentTotalSeconds: data.opponent_elapsed_seconds,
          });
        },
      },
    );
  }, [status, sfidaId, forfeitSfidaMutation, correctCount, questionCount, sfidaType, userId, wrongAnswers, onComplete]);

  // ---- Answer handler ----
  const handleAnswer = useCallback(
    async (domandaId: number, answerGiven: string): Promise<void> => {
      if (status !== 'playing') return;
      resetInactivity();

      let newCorrectCount = correctCount;
      let newWrongCount = wrongCount;

      try {
        const result = await trackMutation.mutateAsync(
          isFullQuiz
            ? {
                domanda_id: domandaId,
                answer_given: answerGiven,
                quiz_id: quizId,
                quiz_pos: currentPos,
              }
            : {
                domanda_id: domandaId,
                answer_given: answerGiven,
                sfida_id: sfidaId,
                quiz_pos: currentPos,
              }
        );

        if (result.is_correct) {
          newCorrectCount = correctCount + 1;
          setCorrectCount(newCorrectCount);
        } else {
          newWrongCount = wrongCount + 1;
          setWrongCount(newWrongCount);
          if (domandaQuery.data) {
            setWrongAnswers((prev) => [
              ...prev,
              { domanda: domandaQuery.data!.domanda, answerGiven },
            ]);
          }
        }
      } catch (error) {
        console.error('Errore nel tracciamento risposta:', error);
      }

      // Accumula wrongAnswers aggiornato per onComplete (evita stale closure)
      const updatedWrongAnswers =
        !domandaQuery.data || newWrongCount === wrongCount
          ? wrongAnswers
          : [
              ...wrongAnswers,
              { domanda: domandaQuery.data.domanda, answerGiven },
            ];

      // Pubblica progresso su Ably
      if (gameChannelRef.current) {
        const newPos = currentPos < questionCount ? currentPos + 1 : currentPos;
        gameChannelRef.current.presence.update({ pos: newPos }).catch(() => {});
      }

      if (currentPos < questionCount) {
        setCurrentPos(currentPos + 1);
      } else {
        // Quiz completato!
        const finalSeconds = lastElapsedRef.current;
        // Promosso/bocciato solo per sfide full
        const promosso = sfidaType === 'full' ? newWrongCount <= MAX_ERRORS : false;

        setStatus('waiting_opponent');

        // Completa il quiz sul server (solo per full quiz)
        if (isFullQuiz) {
          completeMutation.mutate({ quiz_id: quizId });
        }

        // Completa la sfida per questo player
        completeSfidaMutation.mutate(
          { sfida_id: sfidaId, correct_count: newCorrectCount, elapsed_seconds: finalSeconds },
          {
            onSuccess: async (data) => {
              // Pubblica finish su Ably — AWAIT per evitare race condition
              // (onComplete causa unmount che cancella il canale Ably)
              if (gameChannelRef.current) {
                try {
                  await gameChannelRef.current.presence.update({
                    pos: questionCount,
                    finished: true,
                  });
                  await gameChannelRef.current.publish('player-finished', {
                    playerId: userId,
                  });
                } catch {
                  // Ignora errori Ably
                }
              }

              if (data.both_finished) {
                onComplete({
                  correctCount: newCorrectCount,
                  wrongCount: newWrongCount,
                  promosso,
                  finalTotalSeconds: finalSeconds,
                  wrongAnswers: updatedWrongAnswers,
                  opponentCorrect: data.opponent_correct,
                  winnerId: data.winner_id,
                  opponentTotalSeconds: data.opponent_elapsed_seconds,
                });
              }
            },
          }
        );
      }
    },
    [
      status,
      quizId,
      currentPos,
      correctCount,
      wrongCount,
      trackMutation,
      completeMutation,
      completeSfidaMutation,
      domandaQuery.data,
      sfidaId,
      userId,
      wrongAnswers,
      resetInactivity,
      onComplete,
      isFullQuiz,
      questionCount,
      sfidaType,
    ]
  );

  // ---- Quando l'avversario finisce (e noi eravamo in attesa) ----
  useEffect(() => {
    if (status !== 'waiting_opponent' || !opponentFinished) return;

    let cancelled = false;

    void (async (): Promise<void> => {
      try {
        // Recupera i dati reali dal server (source of truth per avoidare stale closure)
        const result = await client.sfide.result({ sfida_id: sfidaId });
        if (cancelled) return;

        const myCorrect = result.my_correct;
        const myWrong = questionCount - myCorrect;
        const promosso = sfidaType === 'full' ? myWrong <= MAX_ERRORS : false;
        onComplete({
          correctCount: myCorrect,
          wrongCount: myWrong,
          promosso,
          finalTotalSeconds: result.my_elapsed_seconds ?? lastElapsedRef.current,
          wrongAnswers,
          opponentCorrect: result.opponent_correct,
          winnerId: result.winner_id,
          opponentTotalSeconds: result.opponent_elapsed_seconds,
        });
      } catch {
        if (cancelled) return;
        // Fallback: mostra risultati con dati locali se la chiamata fallisce
        const promosso = sfidaType === 'full' ? wrongCount <= MAX_ERRORS : false;
        onComplete({
          correctCount,
          wrongCount,
          promosso,
          finalTotalSeconds: lastElapsedRef.current,
          wrongAnswers,
          opponentCorrect: null,
          winnerId: undefined,
          opponentTotalSeconds: null,
        });
      }
    })();

    return (): void => {
      cancelled = true;
    };
  }, [
    status,
    opponentFinished,
    sfidaId,
    correctCount,
    wrongCount,
    wrongAnswers,
    onComplete,
    questionCount,
    sfidaType,
  ]);

  // ---- Polling fallback: verifica server ogni 4s quando in attesa avversario ----
  useEffect(() => {
    if (status !== 'waiting_opponent') return;

    const interval = setInterval(async (): Promise<void> => {
      try {
        const result = await client.sfide.result({ sfida_id: sfidaId });
        if (result.both_finished) {
          clearInterval(interval);
          const myCorrect = result.my_correct;
          const myWrong = questionCount - myCorrect;
          const promossoValue = sfidaType === 'full' ? myWrong <= MAX_ERRORS : false;
          onComplete({
            correctCount: myCorrect,
            wrongCount: myWrong,
            promosso: promossoValue,
            finalTotalSeconds: result.my_elapsed_seconds ?? lastElapsedRef.current,
            wrongAnswers,
            opponentCorrect: result.opponent_correct,
            winnerId: result.winner_id,
            opponentTotalSeconds: result.opponent_elapsed_seconds,
          });
        }
      } catch {
        // Ignora errori di polling
      }
    }, 4000);

    return (): void => {
      clearInterval(interval);
    };
  }, [status, sfidaId, wrongAnswers, onComplete, sfidaType, questionCount]);

  // ---- Quando l'avversario forfetta (timeout/inattività) mentre stiamo giocando ----
  useEffect(() => {
    if (!opponentForfeited) return;
    // Se siamo già in uno stato terminale, ignora
    if (status !== 'playing' && status !== 'waiting_opponent') return;

    let cancelled = false;

    void (async (): Promise<void> => {
      try {
        // La sfida è già completata dal server (forfeit dell'avversario).
        // Recupera i risultati finali.
        const result = await client.sfide.result({ sfida_id: sfidaId });
        if (cancelled) return;

        const myCorrect = result.my_correct;
        const myWrong = questionCount - myCorrect;
        const promosso = sfidaType === 'full' ? myWrong <= MAX_ERRORS : false;
        onComplete({
          correctCount: myCorrect,
          wrongCount: myWrong,
          promosso,
          finalTotalSeconds: result.my_elapsed_seconds ?? lastElapsedRef.current,
          wrongAnswers,
          opponentCorrect: result.opponent_correct,
          winnerId: result.winner_id,
          opponentTotalSeconds: result.opponent_elapsed_seconds,
        });
      } catch {
        if (cancelled) return;
        // Fallback con dati locali
        const promosso = sfidaType === 'full' ? wrongCount <= MAX_ERRORS : false;
        onComplete({
          correctCount,
          wrongCount,
          promosso,
          finalTotalSeconds: lastElapsedRef.current,
          wrongAnswers,
          opponentCorrect: null,
          winnerId: undefined,
          opponentTotalSeconds: null,
        });
      }
    })();

    return (): void => {
      cancelled = true;
    };
  }, [
    opponentForfeited,
    status,
    sfidaId,
    correctCount,
    wrongCount,
    wrongAnswers,
    onComplete,
    questionCount,
    sfidaType,
  ]);

  // ---- Abandon handler ----
  const handleConfirmAbandon = useCallback((): void => {
    if (abortedRef.current) return;
    abortedRef.current = true;
    setAbandonDialogOpen(false);
    setStatus('abandoned');
    forfeitSfidaMutation.mutate(
      { sfida_id: sfidaId, correct_count: correctCount, elapsed_seconds: lastElapsedRef.current },
      {
        onSuccess: async (data) => {
          if (gameChannelRef.current) {
            try {
              await gameChannelRef.current.publish('player-forfeited', {
                playerId: userId,
              });
            } catch {
              // Ignora errori Ably
            }
          }

          const myWrong = questionCount - data.my_correct;
          const promosso =
            sfidaType === 'full' ? myWrong <= MAX_ERRORS : false;
          onComplete({
            correctCount: data.my_correct,
            wrongCount: myWrong,
            promosso,
            finalTotalSeconds: lastElapsedRef.current,
            wrongAnswers,
            opponentCorrect: data.opponent_correct,
            winnerId: data.winner_id,
            opponentTotalSeconds: data.opponent_elapsed_seconds,
          });
        },
      },
    );
  }, [sfidaId, forfeitSfidaMutation, correctCount, questionCount, sfidaType, userId, wrongAnswers, onComplete]);

  const setPendingSfidaCompletion = useAppStore((s) => s.setPendingSfidaCompletion);

  // Force leave waiting — tenta di recuperare dati reali dal server
  const handleForceLeaveWaiting = useCallback((): void => {
    const promossoValue = sfidaType === 'full' ? wrongCount <= MAX_ERRORS : false;
    const localResult: MultiplayerQuizResult = {
      correctCount,
      wrongCount,
      promosso: promossoValue,
      finalTotalSeconds: lastElapsedRef.current,
      wrongAnswers,
      opponentCorrect: null,
      winnerId: undefined,
      opponentTotalSeconds: null,
    };

    // Imposta pending completion nello store per la notifica globale
    setPendingSfidaCompletion({
      sfidaId,
      opponentName,
      sfidaType,
      questionCount,
      durationSeconds,
    });

    // Tenta di ottenere i dati dal server (fire-and-forget con fallback)
    void (async (): Promise<void> => {
      try {
        const result = await client.sfide.result({ sfida_id: sfidaId });
        if (result.both_finished) {
          setPendingSfidaCompletion(null);
          const myCorrect = result.my_correct;
          const myWrong = questionCount - myCorrect;
          onComplete({
            correctCount: myCorrect,
            wrongCount: myWrong,
            promosso: sfidaType === 'full' ? myWrong <= MAX_ERRORS : false,
            finalTotalSeconds: result.my_elapsed_seconds ?? lastElapsedRef.current,
            wrongAnswers,
            opponentCorrect: result.opponent_correct,
            winnerId: result.winner_id,
            opponentTotalSeconds: result.opponent_elapsed_seconds,
          });
        } else {
          onComplete(localResult);
        }
      } catch {
        onComplete(localResult);
      }
    })();
  }, [correctCount, wrongCount, wrongAnswers, sfidaId, onComplete, opponentName, sfidaType, questionCount, durationSeconds, setPendingSfidaCompletion]);

  // ============================================================
  // Render — Calibrazione timer in corso
  // ============================================================
  if (initialElapsed === null) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-6 px-4 py-4 md:py-16 text-center">
        <div className="animate-pulse text-muted-foreground">
          Sincronizzazione timer...
        </div>
      </div>
    );
  }

  // ============================================================
  // Render — Attesa avversario
  // ============================================================
  if (status === 'waiting_opponent') {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-6 px-4 py-4 md:py-16 text-center">
        <h1 className="text-2xl font-bold text-primary">Hai Finito!</h1>
        <p className="text-muted-foreground">
          In attesa che{' '}
          <span className="font-semibold text-foreground">{opponentName}</span>{' '}
          finisca il quiz...
        </p>
        {/* Barra progresso avversario */}
        <div className="w-full max-w-sm rounded-lg border border-border bg-card/50 px-3 py-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{opponentName}:</span>
            <span
              className={`font-semibold ${opponentFinished ? 'text-green-500' : 'text-primary'}`}
            >
              {opponentFinished
                ? 'Completato'
                : `Domanda ${opponentPos} / ${questionCount}`}
          </span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all duration-300 ${opponentFinished ? 'bg-green-500' : 'bg-primary'}`}
              style={{
                width: `${opponentFinished ? 100 : (opponentPos / questionCount) * 100}%`,
              }}
            />
          </div>
        </div>
        <div className="animate-pulse text-4xl">...</div>
        <Button
          variant="outline"
          onClick={handleForceLeaveWaiting}
          className="mt-4"
        >
          Vedi i tuoi risultati
        </Button>
      </div>
    );
  }

  // ============================================================
  // Render — Abbandonato / Time expired (transizione verso risultati)
  // ============================================================
  if (status === 'abandoned' || status === 'time_expired') {
    // Se il forfeit mutation è in corso, mostra un indicatore di caricamento
    if (forfeitSfidaMutation.isPending) {
      return (
        <div className="mx-auto flex max-w-lg flex-col items-center gap-6 px-4 py-4 md:py-16 text-center">
          <h1 className="text-2xl font-bold text-orange-600">
            {status === 'time_expired' ? 'Tempo Scaduto!' : 'Sfida Abbandonata'}
          </h1>
          <div className="animate-pulse text-muted-foreground">
            Registrazione risultati...
          </div>
        </div>
      );
    }

    // Fallback: mostra risultati parziali se il forfeit è fallito
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-6 px-4 py-4 md:py-16 text-center">
        <h1 className="text-2xl font-bold text-orange-600">
          {status === 'time_expired' ? 'Tempo Scaduto!' : 'Sfida Abbandonata'}
        </h1>
        <p className="text-muted-foreground">
          {status === 'time_expired'
            ? 'Il tempo a disposizione è terminato.'
            : 'Hai abbandonato la sfida.'}
        </p>
        <div className="space-y-2 text-lg">
          <div className="flex items-center justify-center gap-2">
            <CorrectIcon className="h-5 w-5 text-green-500" />
            <span>Corrette: {correctCount}</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <WrongIcon className="h-5 w-5 text-red-500" />
            <span>Sbagliate: {wrongCount}</span>
          </div>
        </div>
        <Button onClick={onBack} className="mt-4">
          Torna alle Sfide
        </Button>
      </div>
    );
  }

  // ============================================================
  // Render — Quiz in corso
  // ============================================================
  return (
    <div
      className="mx-auto w-full max-w-2xl px-4 py-4"
      onClick={resetInactivity}
    >
      {/* Header — dimensione fissa orizzontale (non si restringe durante loading) */}
      <div className="mb-4 flex shrink-0 items-center justify-between rounded-lg bg-card p-3 shadow-sm">
        {/* Sinistra: posizione + bottone abbandona */}
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold">
            {currentPos} / {questionCount}
          </span>
          <Button
            type="button"
            variant="outline"
            onClick={(): void => setAbandonDialogOpen(true)}
            className="group h-8 shrink-0 border border-red-600 bg-transparent px-2 text-white hover:bg-red-600 hover:text-white"
          >
            <StopIcon className="h-4 w-4 shrink-0 text-red-600 group-hover:text-white" />
          </Button>
        </div>

        {/* Destra: Timer sincronizzato */}
        <Timer
          seconds={durationSeconds}
          initialElapsed={initialElapsed}
          startMode="countdown"
          cycleMode={false}
          onTick={handleTimerTick}
          onEnd={handleTimerEnd}
          className="text-sm"
        />
      </div>

      {/* Barra progresso avversario — dimensione fissa (non si restringe durante loading) */}
      <div className="mb-4 shrink-0 rounded-lg border border-border bg-card/50 px-3 py-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{opponentName}:</span>
          <span
            className={`font-semibold ${opponentFinished ? 'text-green-500' : 'text-primary'}`}
          >
            {opponentFinished
              ? 'Completato'
              : `Domanda ${opponentPos} / ${questionCount}`}
          </span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all duration-300 ${opponentFinished ? 'bg-green-500' : 'bg-primary'}`}
            style={{
              width: `${opponentFinished ? 100 : (opponentPos / questionCount) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Domanda — container a dimensione fissa per evitare salti di layout */}
      <div className="w-full min-h-[350px]">
        {domandaQuery.isLoading && (
          <div className="py-8 text-center text-muted-foreground">
            Caricamento domanda...
          </div>
        )}

        {domandaQuery.isError && (
          <div className="flex flex-col items-center gap-4 py-8">
            <p className="text-center text-red-600">
              Errore nel caricamento della domanda
            </p>
            <Button
              variant="outline"
              onClick={(): void => {
                void domandaQuery.refetch();
              }}
              disabled={domandaQuery.isFetching}
            >
              Ricarica
            </Button>
          </div>
        )}

        {domandaQuery.data && (
          <DomandaCard
            key={`${quizId}-${currentPos}`}
            domanda={domandaQuery.data.domanda}
            onAnswer={handleAnswer}
            learning={false}
            showAnswerAfterResponse={false}
            userId={userId}
          />
        )}
      </div>

      {/* Modale conferma abbandono */}
      <AlertDialog open={abandonDialogOpen} onOpenChange={setAbandonDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Vuoi abbandonare la sfida?</AlertDialogTitle>
            <AlertDialogDescription>
              Se abbandoni la sfida, il quiz sarà considerato non valido. Il tuo
              avversario potrà continuare.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAbandon}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Abbandona Sfida
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
