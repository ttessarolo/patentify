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
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
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
import {
  StopIcon,
  CorrectIcon,
  WrongIcon,
} from '~/icons';
import { useAppStore } from '~/store';
import { orpc, client } from '~/lib/orpc';
import { getAblyRealtime } from '~/lib/ably-client';
import type { Domanda } from '~/types/db';
import type { TimerTickPayload } from '~/types/components';
import { QUIZ_SIZE, QUIZ_DURATION_SECONDS, MAX_ERRORS } from '~/commons';
import type * as Ably from 'ably';

// ============================================================
// Tipi
// ============================================================

export interface MultiplayerQuizProps {
  /** ID della sfida */
  sfidaId: number;
  /** ID del quiz assegnato a questo player */
  quizId: number;
  /** Nome/nickname dell'avversario */
  opponentName: string;
  /** Timestamp ISO di inizio partita (condiviso) */
  gameStartedAt: string;
  /** Callback quando il quiz finisce (per mostrare i risultati) */
  onComplete: (result: MultiplayerQuizResult) => void;
  /** Callback per tornare alla pagina sfide */
  onBack: () => void;
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
}

/** Timeout inattivita durante la sfida: 2 minuti */
const INACTIVITY_TIMEOUT_MS = 2 * 60 * 1000;

type MultiplayerStatus = 'playing' | 'finished' | 'waiting_opponent' | 'abandoned' | 'time_expired';

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
}: MultiplayerQuizProps): JSX.Element {
  const { userId } = useAuth();

  // Store Zustand per stato avversario
  const opponentPos = useAppStore((s) => s.activeSfida?.opponentPos ?? 0);
  const opponentFinished = useAppStore((s) => s.activeSfida?.opponentFinished ?? false);
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

  // Calcola tempo iniziale trascorso dal game_started_at
  const initialElapsed = useMemo((): number => {
    const startedAtMs = new Date(gameStartedAt).getTime();
    const elapsedMs = Date.now() - startedAtMs;
    const elapsedSeconds = Math.floor(elapsedMs / 1000);
    return Math.max(0, Math.min(elapsedSeconds, QUIZ_DURATION_SECONDS));
  }, [gameStartedAt]);

  // Refs
  const lastElapsedRef = useRef<number>(initialElapsed);
  const abortedRef = useRef<boolean>(false);
  const gameChannelRef = useRef<Ably.RealtimeChannel | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const inactivityTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Query per la domanda corrente
  const domandaQuery = useQuery({
    ...orpc.quiz.getDomanda.queryOptions({
      input: { quiz_id: quizId, quiz_pos: currentPos },
    }),
    enabled: status === 'playing' && currentPos <= QUIZ_SIZE,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  // Mutations
  const trackMutation = useMutation(orpc.attempt.track.mutationOptions());
  const completeMutation = useMutation(orpc.quiz.complete.mutationOptions());
  const completeSfidaMutation = useMutation(orpc.sfide.complete.mutationOptions());
  const abortSfidaMutation = useMutation(orpc.sfide.abort.mutationOptions());

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
        // Timeout inattivita — abort
        if (!abortedRef.current) {
          abortedRef.current = true;
          setStatus('abandoned');
          abortSfidaMutation.mutate({ sfida_id: sfidaId });
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
  }, [status, sfidaId, abortSfidaMutation]);

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
    abortSfidaMutation.mutate({ sfida_id: sfidaId });
  }, [status, sfidaId, abortSfidaMutation]);

  // ---- Answer handler ----
  const handleAnswer = useCallback(
    async (domandaId: number, answerGiven: string): Promise<void> => {
      if (status !== 'playing') return;
      resetInactivity();

      let newCorrectCount = correctCount;
      let newWrongCount = wrongCount;

      try {
        const result = await trackMutation.mutateAsync({
          domanda_id: domandaId,
          answer_given: answerGiven,
          quiz_id: quizId,
          quiz_pos: currentPos,
        });

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

      // Pubblica progresso su Ably
      if (gameChannelRef.current) {
        const newPos = currentPos < QUIZ_SIZE ? currentPos + 1 : currentPos;
        gameChannelRef.current.presence.update({ pos: newPos }).catch(() => {});
      }

      if (currentPos < QUIZ_SIZE) {
        setCurrentPos(currentPos + 1);
      } else {
        // Quiz completato!
        const finalSeconds = lastElapsedRef.current;
        const promosso = newWrongCount <= MAX_ERRORS;

        setStatus('waiting_opponent');

        // Completa il quiz sul server
        completeMutation.mutate({ quiz_id: quizId });

        // Completa la sfida per questo player
        completeSfidaMutation.mutate(
          { sfida_id: sfidaId, correct_count: newCorrectCount },
          {
            onSuccess: async (data) => {
              // Pubblica finish su Ably — AWAIT per evitare race condition
              // (onComplete causa unmount che cancella il canale Ably)
              if (gameChannelRef.current) {
                try {
                  await gameChannelRef.current.presence
                    .update({ pos: QUIZ_SIZE, finished: true });
                  await gameChannelRef.current.publish('player-finished', {
                    playerId: userId,
                  });
                } catch {
                  // Ignora errori Ably
                }
              }

              if (data.both_finished) {
                // Determina opponentCorrect dal lato server:
                // completeSfida ritorna player_a_correct e player_b_correct
                // ma non sappiamo se siamo A o B. Usiamo la differenza.
                const myServerCorrect = newCorrectCount;
                const opponentServerCorrect =
                  data.player_a_correct === myServerCorrect
                    ? data.player_b_correct
                    : data.player_a_correct;

                onComplete({
                  correctCount: newCorrectCount,
                  wrongCount: newWrongCount,
                  promosso,
                  finalTotalSeconds: finalSeconds,
                  wrongAnswers,
                  opponentCorrect: opponentServerCorrect,
                  winnerId: data.winner_id,
                });
              }
            },
          },
        );
      }
    },
    [
      status, quizId, currentPos, correctCount, wrongCount,
      trackMutation, completeMutation, completeSfidaMutation,
      domandaQuery.data, sfidaId, userId, wrongAnswers,
      resetInactivity, onComplete,
    ],
  );

  // ---- Quando l'avversario finisce (e noi eravamo in attesa) ----
  useEffect(() => {
    if (status !== 'waiting_opponent' || !opponentFinished) return;

    let cancelled = false;

    void (async (): Promise<void> => {
      try {
        // Recupera i dati reali dal server
        const result = await client.sfide.result({ sfida_id: sfidaId });
        if (cancelled) return;

        const promosso = wrongCount <= MAX_ERRORS;
        onComplete({
          correctCount,
          wrongCount,
          promosso,
          finalTotalSeconds: lastElapsedRef.current,
          wrongAnswers,
          opponentCorrect: result.opponent_correct,
          winnerId: result.winner_id,
        });
      } catch {
        if (cancelled) return;
        // Fallback: mostra risultati con dati locali se la chiamata fallisce
        const promosso = wrongCount <= MAX_ERRORS;
        onComplete({
          correctCount,
          wrongCount,
          promosso,
          finalTotalSeconds: lastElapsedRef.current,
          wrongAnswers,
          opponentCorrect: null,
          winnerId: undefined,
        });
      }
    })();

    return (): void => {
      cancelled = true;
    };
  }, [status, opponentFinished, sfidaId, correctCount, wrongCount, wrongAnswers, onComplete]);

  // ---- Abandon handler ----
  const handleConfirmAbandon = useCallback((): void => {
    if (abortedRef.current) return;
    abortedRef.current = true;
    setAbandonDialogOpen(false);
    setStatus('abandoned');
    abortSfidaMutation.mutate({ sfida_id: sfidaId });
  }, [sfidaId, abortSfidaMutation]);

  // Force leave waiting — tenta di recuperare dati reali dal server
  const handleForceLeaveWaiting = useCallback((): void => {
    const promosso = wrongCount <= MAX_ERRORS;
    const localResult: MultiplayerQuizResult = {
      correctCount,
      wrongCount,
      promosso,
      finalTotalSeconds: lastElapsedRef.current,
      wrongAnswers,
      opponentCorrect: null,
      winnerId: undefined,
    };

    // Tenta di ottenere i dati dal server (fire-and-forget con fallback)
    void (async (): Promise<void> => {
      try {
        const result = await client.sfide.result({ sfida_id: sfidaId });
        onComplete({
          ...localResult,
          opponentCorrect: result.opponent_correct,
          winnerId: result.winner_id,
        });
      } catch {
        // Se fallisce, usa i dati locali
        onComplete(localResult);
      }
    })();
  }, [correctCount, wrongCount, wrongAnswers, sfidaId, onComplete]);

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
        <div className="text-sm text-muted-foreground">
          Avversario: domanda {opponentPos} / {QUIZ_SIZE}
        </div>
        <div className="animate-pulse text-4xl">...</div>
        <Button variant="outline" onClick={handleForceLeaveWaiting} className="mt-4">
          Non attendere e vedi i risultati
        </Button>
      </div>
    );
  }

  // ============================================================
  // Render — Abbandonato / Time expired
  // ============================================================
  if (status === 'abandoned' || status === 'time_expired') {
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
    <div className="mx-auto max-w-2xl px-4 py-4" onClick={resetInactivity}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between rounded-lg bg-card p-3 shadow-sm">
        {/* Sinistra: posizione + bottone abbandona */}
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold">
            {currentPos} / {QUIZ_SIZE}
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
          seconds={QUIZ_DURATION_SECONDS}
          initialElapsed={initialElapsed}
          startMode="countdown"
          cycleMode={false}
          onTick={handleTimerTick}
          onEnd={handleTimerEnd}
          className="text-sm"
        />
      </div>

      {/* Barra progresso avversario */}
      <div className="mb-4 rounded-lg border border-border bg-card/50 px-3 py-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {opponentName}:
          </span>
          <span className={`font-semibold ${opponentFinished ? 'text-green-500' : 'text-primary'}`}>
            {opponentFinished ? 'Completato' : `Domanda ${opponentPos} / ${QUIZ_SIZE}`}
          </span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all duration-300 ${opponentFinished ? 'bg-green-500' : 'bg-primary'}`}
            style={{ width: `${opponentFinished ? 100 : (opponentPos / QUIZ_SIZE) * 100}%` }}
          />
        </div>
      </div>

      {/* Domanda */}
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

      {/* Modale conferma abbandono */}
      <AlertDialog open={abandonDialogOpen} onOpenChange={setAbandonDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Vuoi abbandonare la sfida?</AlertDialogTitle>
            <AlertDialogDescription>
              Se abbandoni la sfida, il quiz sarà considerato non valido.
              Il tuo avversario potrà continuare.
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
