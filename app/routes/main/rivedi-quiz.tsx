import React, { useState, useCallback } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/tanstack-react-start';
import { z } from 'zod';

import { Button } from '~/components/ui/button';
import { DomandaCard } from '~/components/domanda';
import { ShareQuizButton } from '~/components/share-quiz-button';
import { getFullQuiz } from '~/server/quiz';
import { checkResponse } from '~/server/checkResponse';
import { trackAttempt } from '~/server/track_attempt';
import type {
  GetFullQuizResult,
  CheckResponseResult,
  TrackAttemptResult,
} from '~/types/db';

// Schema per i search params
const searchSchema = z.object({
  quizId: z.coerce.number().int().positive(),
});

/** Payload per getFullQuiz */
type GetFullQuizPayload = {
  data: { quiz_id: number };
};

/** Payload per checkResponse */
type CheckResponsePayload = {
  data: { domanda_id: number; answer_given: string };
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

type ViewMode = 'choosing' | 'view_answers' | 'answer_questions';

export const Route = createFileRoute('/main/rivedi-quiz')({
  validateSearch: searchSchema,
  component: RivediQuizPage,
});

function RivediQuizPage(): React.JSX.Element {
  const { quizId } = Route.useSearch();
  const { userId } = useAuth();

  // Stato per la modalità di visualizzazione
  const [viewMode, setViewMode] = useState<ViewMode>('choosing');

  // Server functions
  const getFullQuizFn = useServerFn(getFullQuiz);
  const checkResponseFn = useServerFn(checkResponse);
  const trackAttemptFn = useServerFn(trackAttempt);

  // Query per ottenere il quiz completo
  const quizQuery = useQuery({
    queryKey: ['quiz', 'full', quizId],
    queryFn: async () =>
      (
        getFullQuizFn as unknown as (
          opts: GetFullQuizPayload
        ) => Promise<GetFullQuizResult>
      )({ data: { quiz_id: quizId } }),
    staleTime: 5 * 60 * 1000, // 5 minuti
  });

  // Handler per verificare la risposta (usato in modalità answer_questions)
  const handleCheckResponse = useCallback(
    async (domandaId: number, answerGiven: string): Promise<boolean> => {
      const result = await (
        checkResponseFn as unknown as (
          opts: CheckResponsePayload
        ) => Promise<CheckResponseResult>
      )({ data: { domanda_id: domandaId, answer_given: answerGiven } });
      return result.is_correct;
    },
    [checkResponseFn]
  );

  // Handler per tracciare la risposta (NON associata al quiz originale)
  const handleAnswer = useCallback(
    async (domandaId: number, answerGiven: string): Promise<void> => {
      try {
        await (
          trackAttemptFn as unknown as (
            opts: TrackAttemptPayload
          ) => Promise<TrackAttemptResult>
        )({
          data: {
            domanda_id: domandaId,
            answer_given: answerGiven,
            // NON passiamo quiz_id e quiz_pos così viene registrata come esercitazione libera
          },
        });
      } catch (error) {
        console.error('Errore nel tracciamento risposta:', error);
      }
    },
    [trackAttemptFn]
  );

  // Handler vuoto per modalità view_answers (non fa nulla)
  const handleNoOp = useCallback((): void => {
    // Non fa nulla - le risposte sono in sola lettura
  }, []);

  // Loading state
  if (quizQuery.isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-2 md:py-8">
        <div className="py-8 text-center text-muted-foreground">
          Caricamento quiz...
        </div>
      </div>
    );
  }

  // Error state
  if (quizQuery.isError) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-2 md:py-8">
        <div className="py-8 text-center text-red-600">
          Errore nel caricamento del quiz
        </div>
      </div>
    );
  }

  const quizData = quizQuery.data;

  if (!quizData) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-2 md:py-8">
        <div className="py-8 text-center text-muted-foreground">
          Quiz non trovato
        </div>
      </div>
    );
  }

  // Schermata di scelta
  if (viewMode === 'choosing') {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-6 px-4 py-2 md:py-16 text-center">
        <h1 className="text-2xl font-bold">Rivedi Quiz</h1>
        <p className="text-muted-foreground">
          Vuoi vedere anche le risposte già date?
        </p>

        <div className="flex w-full flex-col gap-4">
          <Button
            onClick={(): void => setViewMode('view_answers')}
            className="w-full border border-white bg-transparent text-white hover:bg-white/10"
          >
            Sì
          </Button>
          <Button
            onClick={(): void => setViewMode('answer_questions')}
            className="w-full border border-white bg-transparent text-white hover:bg-white/10"
          >
            No, voglio rispondere alle domande
          </Button>
        </div>
      </div>
    );
  }

  // Modalità visualizzazione risposte già date
  if (viewMode === 'view_answers') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-2 md:py-8">
        <h1 className="mb-6 text-2xl font-bold">Quiz Completo</h1>

        <div className="flex flex-col gap-4">
          {quizData.domande.map((item) => (
            <DomandaCard
              key={`view-${item.domanda.id}-${item.quiz_pos}`}
              domanda={item.domanda}
              onAnswer={handleNoOp}
              learning={true}
              readOnly={true}
              initialAnswer={item.answer_given ?? undefined}
              userId={userId}
            />
          ))}
        </div>

        {/* Bottone Condividi Quiz */}
        <div className="mt-8 flex justify-center">
          <ShareQuizButton quizId={quizId} className="w-full max-w-xs" />
        </div>
      </div>
    );
  }

  // Modalità risposta alle domande (esercitazione libera)
  if (viewMode === 'answer_questions') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-2 md:py-8">
        <h1 className="mb-6 text-2xl font-bold">Rispondi alle Domande</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Le tue risposte verranno registrate come esercitazione libera.
        </p>

        <div className="flex flex-col gap-4">
          {quizData.domande.map((item) => (
            <DomandaCard
              key={`answer-${item.domanda.id}-${item.quiz_pos}`}
              domanda={item.domanda}
              onAnswer={handleAnswer}
              learning={true}
              showAnswerAfterResponse={true}
              onCheckResponse={handleCheckResponse}
              userId={userId}
            />
          ))}
        </div>

        {/* Bottone Condividi Quiz */}
        <div className="mt-8 flex justify-center">
          <ShareQuizButton quizId={quizId} className="w-full max-w-xs" />
        </div>
      </div>
    );
  }

  return <></>;
}
