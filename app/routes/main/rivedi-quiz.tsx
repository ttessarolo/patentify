import type { JSX } from 'react';
import { useState, useCallback } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/tanstack-react-start';
import { z } from 'zod';

import { Button } from '~/components/ui/button';
import { DomandaCard } from '~/components/domanda';
import { ShareQuizButton } from '~/components/share-quiz-button';
import { orpc, client } from '~/lib/orpc';

// Schema per i search params
const searchSchema = z.object({
  quizId: z.coerce.number().int().positive(),
  back: z.enum(['quiz_stats', 'sfide']).optional(),
});

type ViewMode = 'choosing' | 'view_answers' | 'answer_questions';

/** Mappa del parametro `back` alla rotta di destinazione */
const BACK_ROUTES: Record<string, string> = {
  quiz_stats: '/main/statistiche',
  sfide: '/main/sfide',
};

export const Route = createFileRoute('/main/rivedi-quiz')({
  validateSearch: searchSchema,
  component: RivediQuizPage,
});

function RivediQuizPage(): JSX.Element {
  const { quizId, back } = Route.useSearch();
  const { userId } = useAuth();

  // Stato per la modalità di visualizzazione
  const [viewMode, setViewMode] = useState<ViewMode>('choosing');

  // Query per ottenere il quiz completo
  const quizQuery = useQuery({
    ...orpc.quiz.getFull.queryOptions({ input: { quiz_id: quizId } }),
    staleTime: 5 * 60 * 1000, // 5 minuti
  });

  // Handler per verificare la risposta (usato in modalità answer_questions)
  const handleCheckResponse = useCallback(
    async (domandaId: number, answerGiven: string): Promise<boolean> => {
      const result = await client.attempt.check({
        domanda_id: domandaId,
        answer_given: answerGiven,
      });
      return result.is_correct;
    },
    []
  );

  // Handler per tracciare la risposta (NON associata al quiz originale)
  const handleAnswer = useCallback(
    async (domandaId: number, answerGiven: string): Promise<void> => {
      try {
        await client.attempt.track({
          domanda_id: domandaId,
          answer_given: answerGiven,
        });
      } catch (error) {
        console.error('Errore nel tracciamento risposta:', error);
      }
    },
    []
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
        <div className="flex items-baseline gap-2">
          {back && BACK_ROUTES[back] && (
            <Link
              to={BACK_ROUTES[back]}
              className="inline-flex shrink-0 items-center justify-center text-3xl leading-none text-muted-foreground hover:text-foreground"
            >
              «
            </Link>
          )}
          <h1 className="text-2xl font-bold">Rivedi Quiz</h1>
        </div>
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
        <div className="mb-6 flex items-baseline gap-2">
          {back && BACK_ROUTES[back] && (
            <Link
              to={BACK_ROUTES[back]}
              className="inline-flex shrink-0 items-center justify-center text-3xl leading-none text-muted-foreground hover:text-foreground"
            >
              «
            </Link>
          )}
          <h1 className="text-2xl font-bold">Quiz Completo</h1>
        </div>

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
        <div className="mb-6 flex items-baseline gap-2">
          {back && BACK_ROUTES[back] && (
            <Link
              to={BACK_ROUTES[back]}
              className="inline-flex shrink-0 items-center justify-center text-3xl leading-none text-muted-foreground hover:text-foreground"
            >
              «
            </Link>
          )}
          <h1 className="text-2xl font-bold">Rispondi alle Domande</h1>
        </div>
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
