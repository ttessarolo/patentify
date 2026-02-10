/**
 * ChallengeGameStartHandler — componente globale montato in __root.tsx.
 *
 * Ascolta l'evento `game-start` sul canale `sfide:user:{userId}` e
 * naviga al quiz multiplayer da qualsiasi pagina dell'app.
 *
 * Centralizza la navigazione che prima era in SfideLayout
 * (montato solo su /main/sfide/*), risolvendo il caso in cui l'utente
 * accetta una sfida da una pagina diversa.
 */

import { useEffect, useRef } from 'react';
import type { JSX } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '@clerk/tanstack-react-start';
import { useAppStore } from '~/store';
import { getAblyRealtime } from '~/lib/ably-client';
import type * as Ably from 'ably';

export function ChallengeGameStartHandler(): JSX.Element | null {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const startSfida = useAppStore((s) => s.startSfida);
  const navigatedSfidaRef = useRef<number | null>(null);

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

      // Evita navigazione doppia per la stessa sfida
      if (navigatedSfidaRef.current === data.sfidaId) return;

      // Determina il mio ruolo e il quiz associato
      let myQuizId: number;
      let opponentId: string;

      if (data.playerAId === userId) {
        myQuizId = data.quizIdA;
        opponentId = data.playerBId;
      } else if (data.playerBId === userId) {
        myQuizId = data.quizIdB;
        opponentId = data.playerAId;
      } else {
        return;
      }

      console.log(
        '[ChallengeGameStart] game-start ricevuto — sfidaId=%d, myQuizId=%d, role=%s',
        data.sfidaId,
        myQuizId,
        data.playerAId === userId ? 'challenger' : 'challenged',
      );

      navigatedSfidaRef.current = data.sfidaId;

      startSfida({
        sfidaId: data.sfidaId,
        quizId: myQuizId,
        opponentId,
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

    myChannel.subscribe('game-start', handleGameStart);

    return (): void => {
      myChannel.unsubscribe('game-start', handleGameStart);
    };
  }, [userId, navigate, startSfida]);

  return null;
}
