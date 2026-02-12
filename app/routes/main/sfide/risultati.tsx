/**
 * Route per visualizzare i risultati completi di una sfida.
 * Usata quando l'utente torna ai risultati dopo la notifica globale.
 */

import type { JSX } from 'react';
import { useCallback } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useAuth, useUser } from '@clerk/tanstack-react-start';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { ChallengeResults } from '~/components/sfide/ChallengeResults';
import { orpc } from '~/lib/orpc';
import { Loader2 } from 'lucide-react';
import type { SfidaTier } from '~/commons';

const searchSchema = z.object({
  sfidaId: z.coerce.number().int().positive(),
});

export const Route = createFileRoute('/main/sfide/risultati')({
  validateSearch: searchSchema,
  component: SfidaRisultatiPage,
});

function SfidaRisultatiPage(): JSX.Element {
  const { sfidaId } = Route.useSearch();
  const { userId } = useAuth();
  const { user: clerkUser } = useUser();
  const navigate = useNavigate();

  const resultQuery = useQuery({
    ...orpc.sfide.result.queryOptions({
      input: { sfida_id: sfidaId },
    }),
    enabled: Boolean(userId),
    refetchOnWindowFocus: false,
  });

  const handleBack = useCallback((): void => {
    void navigate({ to: '/main/sfide' });
  }, [navigate]);

  const handleReviewQuiz = useCallback((): void => {
    // Per la review del quiz, torniamo alle sfide per ora
    void navigate({ to: '/main/sfide' });
  }, [navigate]);

  const handleRematch = useCallback((): void => {
    void navigate({ to: '/main/sfide' });
  }, [navigate]);

  if (resultQuery.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (resultQuery.isError || !resultQuery.data) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Impossibile caricare i risultati.</p>
        <button
          type="button"
          className="text-primary underline"
          onClick={handleBack}
        >
          Torna alle Sfide
        </button>
      </div>
    );
  }

  const data = resultQuery.data;
  const myName = clerkUser?.username ?? clerkUser?.fullName ?? 'Tu';

  return (
    <ChallengeResults
      myResult={{
        correctCount: data.my_correct,
        wrongCount: data.question_count - data.my_correct,
        promosso: data.sfida_type === 'full' ? data.my_correct >= (data.question_count - 4) : false,
        finalTotalSeconds: 0,
        wrongAnswers: [],
        opponentCorrect: data.opponent_correct,
        winnerId: data.winner_id ?? undefined,
      }}
      myName={myName}
      opponentName="Avversario"
      opponentCorrect={data.opponent_correct}
      winnerId={data.winner_id}
      myUserId={userId ?? ''}
      onBack={handleBack}
      onReviewQuiz={handleReviewQuiz}
      onRematch={handleRematch}
      sfidaType={data.sfida_type as SfidaTier}
      challengeStillInProgress={!data.both_finished}
      questionCount={data.question_count}
    />
  );
}
