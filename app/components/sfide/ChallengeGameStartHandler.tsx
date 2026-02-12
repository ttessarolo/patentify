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
  const setWaitingForGameStart = useAppStore((s) => s.setWaitingForGameStart);
  const navigatedSfidaRef = useRef<number | null>(null);

  useEffect(() => {
    if (!userId) return;

    const ably = getAblyRealtime();
    const myChannel = ably.channels.get(`sfide:user:${userId}`);

    const handleGameStart = (message: Ably.InboundMessage): void => {
      const data = message.data as {
        sfidaId: number;
        quizIdA: number | null;
        quizIdB: number | null;
        gameStartedAt: string;
        playerAId: string;
        playerBId: string;
        sfidaType?: string;
        questionCount?: number;
        durationSeconds?: number;
      };

      // Evita navigazione doppia per la stessa sfida
      if (navigatedSfidaRef.current === data.sfidaId) return;

      // Resetta l'overlay "Generazione Quiz" per chi accetta
      setWaitingForGameStart(false);

      // Determina il mio ruolo e il quiz associato
      let myQuizId: number | null;
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
        quizId: myQuizId ?? 0,
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
          quizId: myQuizId ?? 0,
          opponentName: 'Avversario',
          gameStartedAt: data.gameStartedAt,
          sfidaType: (data.sfidaType ?? 'full') as 'seed' | 'medium' | 'half_quiz' | 'full',
          questionCount: data.questionCount ?? 40,
          durationSeconds: data.durationSeconds ?? 1800,
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
