/**
 * Layout Sfide — sezione multiplayer online.
 *
 * Layout:
 * 1. Box Utenti Online (con filtro seguiti e click per sfidare)
 * 2. Box Storico Sfide (ultime 5 sfide)
 *
 * Gestisce anche la navigazione al quiz quando una sfida viene accettata
 * (sia come challenger che come challenged).
 */

import { useEffect, useRef } from 'react';
import type { JSX } from 'react';
import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router';
import { useAuth } from '@clerk/tanstack-react-start';
import { useChallengeFlow } from '~/hooks/useChallengeFlow';
import { useAppStore } from '~/store';
import { getAblyRealtime } from '~/lib/ably-client';
import type * as Ably from 'ably';

export const Route = createFileRoute('/main/sfide')({
  component: SfideLayout,
});

function SfideLayout(): JSX.Element {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const startSfida = useAppStore((s) => s.startSfida);

  const { phase, sfidaData, resetChallenge } = useChallengeFlow({
    userId,
    enabled: Boolean(userId),
  });

  const navigatedRef = useRef<boolean>(false);

  // Naviga al quiz quando la sfida è stata creata (come challenger)
  useEffect(() => {
    if (phase === 'accepted' && sfidaData && !navigatedRef.current) {
      navigatedRef.current = true;

      // Determina quale quizId è per questo player
      // Il challenger è player A
      const myQuizId = sfidaData.quizIdA;

      startSfida({
        sfidaId: sfidaData.sfidaId,
        quizId: myQuizId,
        opponentId: '',
        opponentName: '',
        gameStartedAt: sfidaData.gameStartedAt,
        opponentPos: 0,
        opponentFinished: false,
      });

      void navigate({
        to: '/main/sfide/quiz',
        search: {
          sfidaId: sfidaData.sfidaId,
          quizId: myQuizId,
          opponentName: 'Avversario',
          gameStartedAt: sfidaData.gameStartedAt,
        },
      });

      resetChallenge();
    }
  }, [phase, sfidaData, navigate, startSfida, resetChallenge]);

  // Ascolta game-start come player B (challenged)
  useEffect(() => {
    if (!userId) return;

    const ably = getAblyRealtime();
    const myChannel = ably.channels.get(`sfide:user:${userId}`);

    const handleGameStart = (message: Ably.InboundMessage): void => {
      const data = message.data as {
        sfidaId: number;
        quizIdA: number;
        quizIdB: number;
        gameStartedAt: string;
        playerAId: string;
        playerBId: string;
      };

      // Solo se io sono player B
      if (data.playerBId !== userId) return;

      const myQuizId = data.quizIdB;

      startSfida({
        sfidaId: data.sfidaId,
        quizId: myQuizId,
        opponentId: data.playerAId,
        opponentName: '',
        gameStartedAt: data.gameStartedAt,
        opponentPos: 0,
        opponentFinished: false,
      });

      void navigate({
        to: '/main/sfide/quiz',
        search: {
          sfidaId: data.sfidaId,
          quizId: myQuizId,
          opponentName: 'Avversario',
          gameStartedAt: data.gameStartedAt,
        },
      });
    };

    // Ascolta su game-start pubblicato sul canale utente
    myChannel.subscribe('game-start', handleGameStart);

    return (): void => {
      myChannel.unsubscribe('game-start', handleGameStart);
    };
  }, [userId, navigate, startSfida]);

  return (
    <div className="flex flex-col gap-4 p-4">
      <Outlet />
    </div>
  );
}
