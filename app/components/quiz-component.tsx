import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
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
import { useNavigate } from '@tanstack/react-router';
import { StopIcon, QuizIcon, CorrectIcon, WrongIcon, TimelapseIcon, AvgTimeIcon } from '~/icons';
import { useAppStore, type QuizStatus } from '~/store';
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
  const navigate = useNavigate();

  // Store Zustand per stato persistente
  const activeQuiz = useAppStore((s) => s.activeQuiz);
  const updateQuizProgress = useAppStore((s) => s.updateQuizProgress);
  const setQuizStatus = useAppStore((s) => s.setQuizStatus);
  const setQuizFinalTime = useAppStore((s) => s.setQuizFinalTime);

  // Calcola tempo iniziale trascorso (per ripresa sessione)
  // Se activeQuiz.quizId === quizId, calcola il tempo trascorso da startedAt
  const initialElapsed = useMemo((): number => {
    if (activeQuiz && activeQuiz.quizId === quizId) {
      const elapsedMs = Date.now() - activeQuiz.startedAt;
      const elapsedSeconds = Math.floor(elapsedMs / 1000);
      // Non superare la durata massima del quiz
      return Math.min(elapsedSeconds, QUIZ_DURATION_SECONDS);
    }
    return 0;
  }, [activeQuiz, quizId]);

  // Lo status viene ora dallo store (persistito) per sopravvivere ai refresh
  const status: QuizStatus = activeQuiz?.quizId === quizId ? activeQuiz.status : 'playing';

  // Stato iniziale: riprende dallo store se disponibile
  const [currentPos, setCurrentPos] = useState(
    activeQuiz?.quizId === quizId ? activeQuiz.currentPos : 1
  );
  const [abandonDialogOpen, setAbandonDialogOpen] = useState(false);
  
  // Stato per tracciare i risultati (riprende dallo store se disponibile)
  const [correctCount, setCorrectCount] = useState(
    activeQuiz?.quizId === quizId ? activeQuiz.correctCount : 0
  );
  const [wrongCount, setWrongCount] = useState(
    activeQuiz?.quizId === quizId ? activeQuiz.wrongCount : 0
  );

  // Il tempo finale viene ora dallo store (persistito) per sopravvivere ai refresh
  const finalTotalSeconds: number | null = activeQuiz?.quizId === quizId
    ? activeQuiz.finalTotalSeconds ?? null
    : null;

  // Stato per accumulare le domande sbagliate (riprende dallo store se disponibile)
  const [wrongAnswers, setWrongAnswers] = useState<
    Array<{ domanda: Domanda; answerGiven: string }>
  >(activeQuiz?.quizId === quizId ? activeQuiz.wrongAnswers : []);

  // Ref per tracciare se il quiz è stato abortito (per evitare chiamate doppie)
  const abortedRef = useRef(false);
  const quizIdRef = useRef(quizId);

  // Ref per tracciare il tempo trascorso (aggiornato da onTick del Timer)
  const lastElapsedRef = useRef(initialElapsed);

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

      let newCorrectCount = correctCount;
      let newWrongCount = wrongCount;
      let wrongAnswer: { domanda: Domanda; answerGiven: string } | undefined;

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
          newCorrectCount = correctCount + 1;
          setCorrectCount(newCorrectCount);
        } else {
          newWrongCount = wrongCount + 1;
          setWrongCount(newWrongCount);
          // Salva la domanda sbagliata per mostrarla nella schermata finale
          if (domandaQuery.data) {
            wrongAnswer = { domanda: domandaQuery.data.domanda, answerGiven };
            setWrongAnswers((prev) => [...prev, wrongAnswer!]);
          }
        }
      } catch (error) {
        console.error('Errore nel tracciamento risposta:', error);
      }

      // Passa alla domanda successiva
      if (currentPos < QUIZ_SIZE) {
        const newPos = currentPos + 1;
        setCurrentPos(newPos);
        // Aggiorna lo store per persistenza
        updateQuizProgress(newPos, newCorrectCount, newWrongCount, wrongAnswer);
      } else {
        // Quiz completato - salva il tempo e lo status nello store (persistiti)
        setQuizFinalTime(lastElapsedRef.current);
        setQuizStatus('finished');
        completeMutation.mutate();
      }
    },
    [status, quizId, currentPos, correctCount, wrongCount, trackMutation, completeMutation, domandaQuery.data, updateQuizProgress, setQuizStatus, setQuizFinalTime]
  );

  // Handler per scadenza timer
  const handleTimerEnd = useCallback((): void => {
    if (status !== 'playing' || abortedRef.current) return;
    abortedRef.current = true;
    // Salva il tempo e lo status nello store (persistiti)
    setQuizFinalTime(lastElapsedRef.current);
    setQuizStatus('time_expired');
    abortMutation.mutate();
  }, [status, abortMutation, setQuizStatus, setQuizFinalTime]);

  // Handler per conferma abbandono
  const handleConfirmAbandon = useCallback((): void => {
    if (abortedRef.current) return;
    abortedRef.current = true;
    setAbandonDialogOpen(false);
    setQuizStatus('abandoned');
    abortMutation.mutate();
  }, [abortMutation, setQuizStatus]);

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

  // Handler per navigare alla pagina di revisione quiz
  const handleReviewQuiz = useCallback((): void => {
    void navigate({
      to: '/main/rivedi-quiz',
      search: { quizId },
    });
  }, [navigate, quizId]);

  if (status === 'finished') {
    const totalAnswered = correctCount + wrongCount;
    const isPassed = wrongCount <= MAX_ERRORS;
    const avgTimePerQuestion =
      totalAnswered > 0 && finalTotalSeconds != null
        ? Math.round(finalTotalSeconds / totalAnswered)
        : null;

    return (
      <div className="mx-auto flex max-w-2xl flex-col items-start gap-6 px-4 py-4 md:py-16">
        {/* Risultato principale - allineato a sinistra */}
        <div className="w-full">
          {isPassed ? (
            <h1 className="text-4xl font-bold text-green-600">Promosso 🥳 !!!</h1>
          ) : (
            <h1 className="text-4xl font-bold text-red-600">Bocciato</h1>
          )}
        </div>

        {/* Statistiche - allineate a sinistra con icone */}
        <div className="mt-4 w-full space-y-3 text-lg">
          <div className="flex items-center gap-2">
            <QuizIcon className="h-5 w-5 shrink-0 text-pink-500" />
            <span className="font-semibold">Domande Totali:</span>{' '}
            {totalAnswered}
          </div>
          <div className="flex items-center gap-2">
            <CorrectIcon className="h-5 w-5 shrink-0 text-green-500" />
            <span className="font-semibold text-green-600">Corrette:</span>{' '}
            {correctCount}
          </div>
          <div className="flex items-center gap-2">
            <WrongIcon className="h-5 w-5 shrink-0 text-red-500" />
            <span className="font-semibold text-red-600">Sbagliate:</span>{' '}
            {wrongCount}
            {wrongCount > MAX_ERRORS && (
              <span className="text-sm text-muted-foreground">
                {' '}
                (max {MAX_ERRORS})
              </span>
            )}
          </div>
          {/* Tempo totale */}
          {finalTotalSeconds != null && (
            <div className="flex items-center gap-2">
              <TimelapseIcon className="h-5 w-5 shrink-0 text-blue-500" />
              <span className="font-semibold">Tempo totale:</span>{' '}
              {formatSecondsToHHMMSS(finalTotalSeconds)}
            </div>
          )}
          {/* Tempo medio per domanda */}
          {avgTimePerQuestion != null && (
            <div className="flex items-center gap-2">
              <AvgTimeIcon className="h-5 w-5 shrink-0 text-blue-500" />
              <span className="font-semibold">Tempo medio per domanda:</span>{' '}
              {avgTimePerQuestion} s
            </div>
          )}
        </div>

        {/* Bottoni */}
        <div className="mt-6 flex w-full flex-col gap-3">
          <Button
            onClick={handleBackToSimulazione}
            className="w-full border border-white bg-transparent text-white hover:bg-white/10"
          >
            Torna a Simulazione Quiz
          </Button>
          <Button
            onClick={handleReviewQuiz}
            className="w-full border border-white bg-transparent text-white hover:bg-white/10"
          >
            Rivedi Quiz Completo
          </Button>
        </div>

        {/* Sezione Domande Sbagliate */}
        {wrongAnswers.length > 0 && (
          <div className="mt-8 w-full">
            <h2 className="mb-4 text-left text-lg font-bold">
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
      <div className="mx-auto flex max-w-2xl flex-col items-start gap-6 px-4 py-4 md:py-16">
        <div className="w-full">
          <h1 className="text-4xl font-bold text-red-600">Tempo Scaduto!</h1>
          <p className="mt-2 text-muted-foreground">
            Il tempo a disposizione è terminato. Le domande rimanenti non sono
            state conteggiate.
          </p>
        </div>

        {/* Statistiche parziali - allineate a sinistra con icone */}
        <div className="mt-4 w-full space-y-3 text-lg">
          <div className="flex items-center gap-2">
            <QuizIcon className="h-5 w-5 shrink-0 text-pink-500" />
            <span className="font-semibold">Domande Totali:</span>{' '}
            {totalAnswered} / {QUIZ_SIZE}
          </div>
          <div className="flex items-center gap-2">
            <CorrectIcon className="h-5 w-5 shrink-0 text-green-500" />
            <span className="font-semibold text-green-600">Corrette:</span>{' '}
            {correctCount}
          </div>
          <div className="flex items-center gap-2">
            <WrongIcon className="h-5 w-5 shrink-0 text-red-500" />
            <span className="font-semibold text-red-600">Sbagliate:</span>{' '}
            {wrongCount}
          </div>
          {/* Tempo totale */}
          {finalTotalSeconds != null && (
            <div className="flex items-center gap-2">
              <TimelapseIcon className="h-5 w-5 shrink-0 text-blue-500" />
              <span className="font-semibold">Tempo totale:</span>{' '}
              {formatSecondsToHHMMSS(finalTotalSeconds)}
            </div>
          )}
          {/* Tempo medio per domanda */}
          {avgTimePerQuestion != null && (
            <div className="flex items-center gap-2">
              <AvgTimeIcon className="h-5 w-5 shrink-0 text-blue-500" />
              <span className="font-semibold">Tempo medio per domanda:</span>{' '}
              {avgTimePerQuestion} s
            </div>
          )}
        </div>

        {/* Bottoni */}
        <div className="mt-6 flex w-full flex-col gap-3">
          <Button
            onClick={handleBackToSimulazione}
            className="w-full border border-white bg-transparent text-white hover:bg-white/10"
          >
            Torna a Simulazione Quiz
          </Button>
          <Button
            onClick={handleReviewQuiz}
            className="w-full border border-white bg-transparent text-white hover:bg-white/10"
          >
            Rivedi Quiz Completo
          </Button>
        </div>

        {/* Sezione Domande Sbagliate */}
        {wrongAnswers.length > 0 && (
          <div className="mt-8 w-full">
            <h2 className="mb-4 text-left text-lg font-bold">
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
      <div className="mx-auto flex max-w-lg flex-col items-center gap-6 px-4 py-4 md:py-16 text-center">
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
          <Button
            type="button"
            variant="outline"
            onClick={(): void => setAbandonDialogOpen(true)}
            className="group h-8 shrink-0 border border-red-600 bg-transparent px-2.5 text-white hover:bg-red-600 hover:text-white sm:px-3"
          >
            <StopIcon className="h-4 w-4 shrink-0 text-red-600 sm:mr-1.5 group-hover:text-white" />
            <span className="hidden sm:inline">Abbandona Quiz</span>
          </Button>
        </div>

        {/* Destra: Timer */}
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

      {/* Corpo: Domanda */}
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
            {domandaQuery.isFetching ? 'Caricamento...' : 'Ricarica Domanda'}
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
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Abbandona Quiz
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Export del componente per uso esterno
