import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@clerk/tanstack-react-start';
import { Timer, formatSecondsToHHMMSS } from '~/components/timer';
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
import { StopIcon } from '~/icons';
import { getQuizDomanda, abortQuiz, completeQuiz } from '~/server/quiz';
import { trackAttempt } from '~/server/track_attempt';
import type {
  Domanda,
  GetQuizDomandaResult,
  AbortQuizResult,
  CompleteQuizResult,
  TrackAttemptResult,
} from '~/types/db';
import type { TimerTickPayload } from '~/types/components';

// ============================================================
// Tipi
// ============================================================

export interface QuizProps {
  quizId: number;
  onEnd: () => void;
}

type QuizStatus = 'playing' | 'finished' | 'abandoned' | 'time_expired';

/** Payload per getQuizDomanda */
type GetQuizDomandaPayload = {
  data: { quiz_id: number; quiz_pos: number };
};

/** Payload per abortQuiz */
type AbortQuizPayload = {
  data: { quiz_id: number };
};

/** Payload per completeQuiz */
type CompleteQuizPayload = {
  data: { quiz_id: number };
};

/** Payload per trackAttempt */
type TrackAttemptPayload = {
  data: {
    domanda_id: number;
    answer_given: string;
    quiz_id?: number;
    quiz_pos?: number;
  };
};

import { QUIZ_SIZE, QUIZ_DURATION_SECONDS, MAX_ERRORS } from '~/commons';

// ============================================================
// Componente Quiz
// ============================================================

export function Quiz({ quizId, onEnd }: QuizProps): React.JSX.Element {
  const { userId } = useAuth();

  // Stato
  const [currentPos, setCurrentPos] = useState(1);
  const [status, setStatus] = useState<QuizStatus>('playing');
  const [abandonDialogOpen, setAbandonDialogOpen] = useState(false);
  
  // Stato per tracciare i risultati
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);

  // Stato per tracciare il tempo finale (secondi trascorsi quando il quiz termina)
  const [finalTotalSeconds, setFinalTotalSeconds] = useState<number | null>(null);

  // Stato per accumulare le domande sbagliate
  const [wrongAnswers, setWrongAnswers] = useState<
    Array<{ domanda: Domanda; answerGiven: string }>
  >([]);

  // Ref per tracciare se il quiz è stato abortito (per evitare chiamate doppie)
  const abortedRef = useRef(false);
  const quizIdRef = useRef(quizId);

  // Ref per tracciare il tempo trascorso (aggiornato da onTick del Timer)
  const lastElapsedRef = useRef(0);

  // Server functions
  const getQuizDomandaFn = useServerFn(getQuizDomanda);
  const abortQuizFn = useServerFn(abortQuiz);
  const completeQuizFn = useServerFn(completeQuiz);
  const trackAttemptFn = useServerFn(trackAttempt);

  // Query per ottenere la domanda corrente
  const domandaQuery = useQuery({
    queryKey: ['quiz', quizId, 'domanda', currentPos],
    queryFn: async () =>
      (
        getQuizDomandaFn as unknown as (
          opts: GetQuizDomandaPayload
        ) => Promise<GetQuizDomandaResult>
      )({ data: { quiz_id: quizId, quiz_pos: currentPos } }),
    enabled: status === 'playing' && currentPos <= QUIZ_SIZE,
    staleTime: Infinity, // La domanda non cambia
    refetchOnWindowFocus: false,
  });

  // Mutation per tracciare la risposta
  const trackMutation = useMutation({
    mutationFn: async (params: {
      domanda_id: number;
      answer_given: string;
      quiz_id: number;
      quiz_pos: number;
    }) =>
      (
        trackAttemptFn as unknown as (
          opts: TrackAttemptPayload
        ) => Promise<TrackAttemptResult>
      )({ data: params }),
  });

  // Mutation per abortire il quiz
  const abortMutation = useMutation({
    mutationFn: async () =>
      (abortQuizFn as unknown as (opts: AbortQuizPayload) => Promise<AbortQuizResult>)({
        data: { quiz_id: quizId },
      }),
  });

  // Mutation per completare il quiz
  const completeMutation = useMutation({
    mutationFn: async () =>
      (
        completeQuizFn as unknown as (
          opts: CompleteQuizPayload
        ) => Promise<CompleteQuizResult>
      )({ data: { quiz_id: quizId } }),
  });

  // Handler per aggiornare il tempo trascorso (chiamato dal Timer ogni secondo)
  const handleTimerTick = useCallback((payload: TimerTickPayload): void => {
    lastElapsedRef.current = payload.elapsed;
  }, []);

  // Handler per la risposta dell'utente
  const handleAnswer = useCallback(
    async (domandaId: number, answerGiven: string): Promise<void> => {
      if (status !== 'playing') return;

      try {
        // Traccia la risposta e attende il risultato
        const result = await trackMutation.mutateAsync({
          domanda_id: domandaId,
          answer_given: answerGiven,
          quiz_id: quizId,
          quiz_pos: currentPos,
        });

        // Aggiorna i contatori
        if (result.is_correct) {
          setCorrectCount((prev) => prev + 1);
        } else {
          setWrongCount((prev) => prev + 1);
          // Salva la domanda sbagliata per mostrarla nella schermata finale
          if (domandaQuery.data) {
            setWrongAnswers((prev) => [
              ...prev,
              { domanda: domandaQuery.data.domanda, answerGiven },
            ]);
          }
        }
      } catch (error) {
        console.error('Errore nel tracciamento risposta:', error);
      }

      // Passa alla domanda successiva
      if (currentPos < QUIZ_SIZE) {
        setCurrentPos((prev) => prev + 1);
      } else {
        // Quiz completato - salva il tempo prima di cambiare stato
        setFinalTotalSeconds(lastElapsedRef.current);
        setStatus('finished');
        completeMutation.mutate();
      }
    },
    [status, quizId, currentPos, trackMutation, completeMutation, domandaQuery.data]
  );

  // Handler per scadenza timer
  const handleTimerEnd = useCallback((): void => {
    if (status !== 'playing' || abortedRef.current) return;
    abortedRef.current = true;
    // Salva il tempo prima di cambiare stato
    setFinalTotalSeconds(lastElapsedRef.current);
    setStatus('time_expired');
    abortMutation.mutate();
  }, [status, abortMutation]);

  // Handler per conferma abbandono
  const handleConfirmAbandon = useCallback((): void => {
    if (abortedRef.current) return;
    abortedRef.current = true;
    setAbandonDialogOpen(false);
    setStatus('abandoned');
    abortMutation.mutate();
  }, [abortMutation]);

  // Handler per tornare alla pagina principale
  const handleBackToSimulazione = useCallback((): void => {
    onEnd();
  }, [onEnd]);

  // Anti-cheating: aborta il quiz se l'utente lascia la pagina
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent): void => {
      if (status === 'playing' && !abortedRef.current) {
        // Mostra messaggio di conferma
        e.preventDefault();
        // Tenta di abortire il quiz con sendBeacon
        const url = '/api/abort-quiz'; // Fallback, ma usiamo la mutation
        navigator.sendBeacon?.(
          url,
          JSON.stringify({ quiz_id: quizIdRef.current })
        );
      }
    };

    const handleVisibilityChange = (): void => {
      if (
        document.visibilityState === 'hidden' &&
        status === 'playing' &&
        !abortedRef.current
      ) {
        // L'utente ha lasciato la pagina/tab
        abortedRef.current = true;
        abortMutation.mutate();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return (): void => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [status, abortMutation]);

  // Aggiorna ref quando quizId cambia
  useEffect(() => {
    quizIdRef.current = quizId;
  }, [quizId]);

  // ============================================================
  // Render schermate di fine
  // ============================================================

  if (status === 'finished') {
    const totalAnswered = correctCount + wrongCount;
    const isPassed = wrongCount <= MAX_ERRORS;
    const avgTimePerQuestion =
      totalAnswered > 0 && finalTotalSeconds != null
        ? Math.round(finalTotalSeconds / totalAnswered)
        : null;

    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-4 py-16">
        {/* Risultato principale */}
        <div className="text-center">
          {isPassed ? (
            <h1 className="text-4xl font-bold text-green-600">Promosso!!!</h1>
          ) : (
            <h1 className="text-4xl font-bold text-red-600">Bocciato</h1>
          )}
        </div>

        {/* Statistiche */}
        <div className="mt-4 space-y-2 text-center text-lg">
          <p>
            <span className="font-semibold">Domande risposte:</span>{' '}
            {totalAnswered}
          </p>
          <p>
            <span className="font-semibold text-green-600">Corrette:</span>{' '}
            {correctCount}
          </p>
          <p>
            <span className="font-semibold text-red-600">Errori:</span>{' '}
            {wrongCount}
            {wrongCount > MAX_ERRORS && (
              <span className="text-sm text-muted-foreground">
                {' '}
                (max {MAX_ERRORS})
              </span>
            )}
          </p>
          {/* Tempo totale */}
          {finalTotalSeconds != null && (
            <p>
              <span className="font-semibold">Tempo totale:</span>{' '}
              {formatSecondsToHHMMSS(finalTotalSeconds)}
            </p>
          )}
          {/* Tempo medio per domanda */}
          {avgTimePerQuestion != null && (
            <p>
              <span className="font-semibold">Tempo medio per domanda:</span>{' '}
              {avgTimePerQuestion} s
            </p>
          )}
        </div>

        <Button onClick={handleBackToSimulazione} className="mt-6">
          Torna a Simulazione Quiz
        </Button>

        {/* Sezione Domande Sbagliate */}
        {wrongAnswers.length > 0 && (
          <div className="mt-8 w-full">
            <h2 className="mb-4 text-center text-xl font-bold">
              Domande Sbagliate
            </h2>
            <div className="flex flex-col gap-4">
              {wrongAnswers.map((item, index) => (
                <DomandaCard
                  key={`wrong-${item.domanda.id}-${index}`}
                  domanda={item.domanda}
                  onAnswer={(): void => {}}
                  learning={true}
                  readOnly={true}
                  initialAnswer={item.answerGiven}
                  userId={userId}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (status === 'time_expired') {
    const totalAnswered = correctCount + wrongCount;
    const avgTimePerQuestion =
      totalAnswered > 0 && finalTotalSeconds != null
        ? Math.round(finalTotalSeconds / totalAnswered)
        : null;

    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-600">Tempo Scaduto!</h1>
          <p className="mt-2 text-muted-foreground">
            Il tempo a disposizione è terminato. Le domande rimanenti non sono
            state conteggiate.
          </p>
        </div>

        {/* Statistiche parziali */}
        <div className="mt-4 space-y-2 text-center text-lg">
          <p>
            <span className="font-semibold">Domande risposte:</span>{' '}
            {totalAnswered} / {QUIZ_SIZE}
          </p>
          <p>
            <span className="font-semibold text-green-600">Corrette:</span>{' '}
            {correctCount}
          </p>
          <p>
            <span className="font-semibold text-red-600">Errori:</span>{' '}
            {wrongCount}
          </p>
          {/* Tempo totale */}
          {finalTotalSeconds != null && (
            <p>
              <span className="font-semibold">Tempo totale:</span>{' '}
              {formatSecondsToHHMMSS(finalTotalSeconds)}
            </p>
          )}
          {/* Tempo medio per domanda */}
          {avgTimePerQuestion != null && (
            <p>
              <span className="font-semibold">Tempo medio per domanda:</span>{' '}
              {avgTimePerQuestion} s
            </p>
          )}
        </div>

        <Button onClick={handleBackToSimulazione} className="mt-6">
          Torna a Simulazione Quiz
        </Button>

        {/* Sezione Domande Sbagliate */}
        {wrongAnswers.length > 0 && (
          <div className="mt-8 w-full">
            <h2 className="mb-4 text-center text-xl font-bold">
              Domande Sbagliate
            </h2>
            <div className="flex flex-col gap-4">
              {wrongAnswers.map((item, index) => (
                <DomandaCard
                  key={`wrong-${item.domanda.id}-${index}`}
                  domanda={item.domanda}
                  onAnswer={(): void => {}}
                  learning={true}
                  readOnly={true}
                  initialAnswer={item.answerGiven}
                  userId={userId}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (status === 'abandoned') {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-6 px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-orange-600">Quiz Abbandonato</h1>
        <p className="text-muted-foreground">
          Hai abbandonato il quiz. Le domande rimanenti non sono state
          conteggiate.
        </p>
        <Button onClick={handleBackToSimulazione} className="mt-4">
          Torna a Simulazione Quiz
        </Button>
      </div>
    );
  }

  // ============================================================
  // Render quiz in corso
  // ============================================================

  return (
    <div className="mx-auto max-w-2xl px-4 py-4">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between rounded-lg bg-card p-4 shadow-sm">
        {/* Sinistra: posizione + bottone abbandona */}
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold">
            {currentPos} / {QUIZ_SIZE}
          </span>
          <button
            type="button"
            onClick={(): void => setAbandonDialogOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-red-500 transition-colors hover:bg-red-500/10"
            aria-label="Abbandona quiz"
          >
            <StopIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Destra: Timer */}
        <Timer
          seconds={QUIZ_DURATION_SECONDS}
          startMode="countdown"
          cycleMode={false}
          onTick={handleTimerTick}
          onEnd={handleTimerEnd}
          className="text-sm"
        />
      </div>

      {/* Corpo: Domanda */}
      {domandaQuery.isLoading && (
        <div className="py-8 text-center text-muted-foreground">
          Caricamento domanda...
        </div>
      )}

      {domandaQuery.isError && (
        <div className="py-8 text-center text-red-600">
          Errore nel caricamento della domanda
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
            <AlertDialogTitle>Vuoi abbandonare il quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              Se abbandoni il quiz, le domande rimanenti non verranno
              conteggiate e il quiz sarà considerato incompleto.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAbandon}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Abbandona
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Export del componente per uso esterno
