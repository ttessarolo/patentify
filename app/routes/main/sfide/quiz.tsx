/**
 * Route per il quiz di una sfida multiplayer.
 *
 * Riceve sfidaId, quizId, opponentName e gameStartedAt come search params.
 * Monta MultiplayerQuiz e, al termine, mostra ChallengeResults.
 */

import type { JSX } from 'react';
import { useState, useCallback } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useAuth, useUser } from '@clerk/tanstack-react-start';
import { z } from 'zod';
import {
  MultiplayerQuiz,
  type MultiplayerQuizResult,
} from '~/components/sfide/MultiplayerQuiz';
import { ChallengeResults } from '~/components/sfide/ChallengeResults';
import { useAppStore } from '~/store';

// Schema per i search params
const searchSchema = z.object({
  sfidaId: z.coerce.number().int().positive(),
  quizId: z.coerce.number().int().positive(),
  opponentName: z.string(),
  gameStartedAt: z.string(),
});

export const Route = createFileRoute('/main/sfide/quiz')({
  validateSearch: searchSchema,
  component: SfidaQuizPage,
});

function SfidaQuizPage(): JSX.Element {
  const { sfidaId, quizId, opponentName, gameStartedAt } = Route.useSearch();
  const { userId } = useAuth();
  const { user: clerkUser } = useUser();
  const navigate = useNavigate();
  const endSfida = useAppStore((s) => s.endSfida);
  const opponentId = useAppStore((s) => s.activeSfida?.opponentId ?? null);
  const setPendingRematch = useAppStore((s) => s.setPendingRematch);

  const [result, setResult] = useState<MultiplayerQuizResult | null>(null);

  const handleComplete = useCallback(
    (quizResult: MultiplayerQuizResult): void => {
      setResult(quizResult);
    },
    [],
  );

  const handleBack = useCallback((): void => {
    endSfida();
    void navigate({ to: '/main/sfide' });
  }, [navigate, endSfida]);

  const handleReviewQuiz = useCallback((): void => {
    void navigate({
      to: '/main/rivedi-quiz',
      search: { quizId },
    });
  }, [navigate, quizId]);

  const handleRematch = useCallback((): void => {
    if (!opponentId) return;
    // Salva il rematch target nello store e naviga alla pagina sfide
    setPendingRematch({ opponentId, opponentName });
    endSfida();
    void navigate({ to: '/main/sfide' });
  }, [opponentId, opponentName, setPendingRematch, endSfida, navigate]);

  // Mostra risultati se il quiz è finito
  if (result) {
    const myName =
      clerkUser?.username ?? clerkUser?.fullName ?? 'Tu';

    return (
      <ChallengeResults
        myResult={result}
        myName={myName}
        opponentName={opponentName}
        opponentCorrect={result.opponentCorrect ?? 0}
        winnerId={result.winnerId ?? null}
        myUserId={userId ?? ''}
        onBack={handleBack}
        onReviewQuiz={handleReviewQuiz}
        onRematch={handleRematch}
      />
    );
  }

  // Quiz in corso
  return (
    <MultiplayerQuiz
      sfidaId={sfidaId}
      quizId={quizId}
      opponentName={opponentName}
      gameStartedAt={gameStartedAt}
      onComplete={handleComplete}
      onBack={handleBack}
    />
  );
}
