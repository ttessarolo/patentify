/**
 * Layout Sfide — sezione multiplayer online.
 *
 * Layout:
 * 1. Box Utenti Online (con filtro seguiti e click per sfidare)
 * 2. Box Storico Sfide (ultime 5 sfide)
 *
 * Gestisce la navigazione al quiz quando viene ricevuto un messaggio
 * `game-start` via Ably — sia come challenger (player A) che come
 * challenged (player B). Tutta la navigazione è centralizzata qui.
 */

import { useEffect, useRef } from 'react';
import type { JSX } from 'react';
import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router';
import { useAuth } from '@clerk/tanstack-react-start';
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
  const navigatedSfidaRef = useRef<number | null>(null);

  // Ascolta game-start sul canale utente — gestisce ENTRAMBI i player.
  // Il challenger (A) riceve il game-start che pubblica su se stesso.
  // Il challenged (B) riceve il game-start pubblicato da A.
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
        // Sono il challenger (player A)
        myQuizId = data.quizIdA;
        opponentId = data.playerBId;
      } else if (data.playerBId === userId) {
        // Sono il challenged (player B)
        myQuizId = data.quizIdB;
        opponentId = data.playerAId;
      } else {
        // Messaggio non destinato a me
        return;
      }

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

  return (
    <div className="flex flex-col gap-4 p-4">
      <Outlet />
    </div>
  );
}
