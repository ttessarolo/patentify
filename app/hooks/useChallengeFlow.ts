/**
 * Hook per gestire il flusso completo di una sfida multiplayer.
 *
 * - Invio sfida a un utente target
 * - Attesa risposta (con timeout 30s)
 * - Ricezione sfide in arrivo
 * - Risposta a sfide ricevute
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type * as Ably from 'ably';
import { getAblyRealtime } from '~/lib/ably-client';
import { client } from '~/lib/orpc';
import { useAppStore } from '~/store';

/** Timeout per la risposta alla sfida: 30 secondi */
const CHALLENGE_TIMEOUT_MS = 30_000;

// ============================================================
// Types
// ============================================================

export type ChallengePhase =
  | 'idle'
  | 'sending'
  | 'waiting_response'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'error';

interface ChallengeRequestMessage {
  type: 'challenge-request';
  challengeId: string;
  challengerId: string;
  challengerName: string;
  challengerImageUrl: string | null;
}

interface ChallengeResponseMessage {
  type: 'challenge-response';
  challengeId: string;
  accepted: boolean;
  responderId: string;
}

interface UseChallengeFlowOptions {
  /** userId corrente (Clerk) */
  userId: string | null | undefined;
  /** Se il hook è abilitato */
  enabled?: boolean;
}

interface UseChallengeFlowReturn {
  /** Fase corrente del flusso sfida */
  phase: ChallengePhase;
  /** Invia una sfida a un utente target */
  sendChallenge: (
    targetUserId: string,
    myName: string,
    myImageUrl: string | null,
  ) => void;
  /** Rispondi a una sfida in arrivo */
  respondToChallenge: (accept: boolean) => void;
  /** Reset del flusso */
  resetChallenge: () => void;
  /** Dati della sfida creata (dopo accettazione) */
  sfidaData: {
    sfidaId: number;
    quizIdA: number;
    quizIdB: number;
    gameStartedAt: string;
  } | null;
}

export function useChallengeFlow(
  options: UseChallengeFlowOptions,
): UseChallengeFlowReturn {
  const { userId, enabled = true } = options;

  const [phase, setPhase] = useState<ChallengePhase>('idle');
  const [sfidaData, setSfidaData] = useState<{
    sfidaId: number;
    quizIdA: number;
    quizIdB: number;
    gameStartedAt: string;
  } | null>(null);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingChallengeIdRef = useRef<string | null>(null);
  const channelRef = useRef<Ably.RealtimeChannel | null>(null);

  const setIncomingChallenge = useAppStore((s) => s.setIncomingChallenge);

  // Cleanup timeout
  const clearChallengeTimeout = useCallback((): void => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // ---- Invio sfida ----
  const sendChallenge = useCallback(
    (
      targetUserId: string,
      myName: string,
      myImageUrl: string | null,
    ): void => {
      if (!userId) return;

      const challengeId = `${userId}-${targetUserId}-${Date.now()}`;
      pendingChallengeIdRef.current = challengeId;
      setPhase('sending');

      const ably = getAblyRealtime();
      const targetChannel = ably.channels.get(`sfide:user:${targetUserId}`);

      const message: ChallengeRequestMessage = {
        type: 'challenge-request',
        challengeId,
        challengerId: userId,
        challengerName: myName,
        challengerImageUrl: myImageUrl,
      };

      targetChannel
        .publish('challenge-request', message)
        .then(() => {
          setPhase('waiting_response');

          // Timer 30s per il timeout
          timeoutRef.current = setTimeout(() => {
            if (pendingChallengeIdRef.current === challengeId) {
              setPhase('expired');
              pendingChallengeIdRef.current = null;
            }
          }, CHALLENGE_TIMEOUT_MS);
        })
        .catch(() => {
          setPhase('error');
        });
    },
    [userId],
  );

  // ---- Risposta a sfida in arrivo ----
  const respondToChallenge = useCallback(
    (accept: boolean): void => {
      if (!userId) return;

      const incoming = useAppStore.getState().incomingChallenge;
      if (!incoming) return;

      const ably = getAblyRealtime();
      const challengerChannel = ably.channels.get(
        `sfide:user:${incoming.challengerId}`,
      );

      const response: ChallengeResponseMessage = {
        type: 'challenge-response',
        challengeId: incoming.challengeId,
        accepted: accept,
        responderId: userId,
      };

      challengerChannel.publish('challenge-response', response);

      // Pulisci l'incoming challenge
      setIncomingChallenge(null);

      if (accept) {
        // L'utente che ha accettato attende che il challenger crei la sfida
        // (il messaggio game-start arriverà via game channel)
        setPhase('accepted');
      }
    },
    [userId, setIncomingChallenge],
  );

  // ---- Ascolto sfide in arrivo e risposte ----
  useEffect(() => {
    if (!enabled || !userId) return;

    const ably = getAblyRealtime();
    const myChannel = ably.channels.get(`sfide:user:${userId}`);
    channelRef.current = myChannel;

    // Ascolto richieste di sfida in arrivo
    const handleChallengeRequest = (
      message: Ably.InboundMessage,
    ): void => {
      const data = message.data as ChallengeRequestMessage;
      if (data.type !== 'challenge-request') return;

      setIncomingChallenge({
        challengeId: data.challengeId,
        challengerId: data.challengerId,
        challengerName: data.challengerName,
        challengerImageUrl: data.challengerImageUrl,
        receivedAt: Date.now(),
      });
    };

    // Ascolto risposte alle mie sfide
    const handleChallengeResponse = (
      message: Ably.InboundMessage,
    ): void => {
      const data = message.data as ChallengeResponseMessage;
      if (data.type !== 'challenge-response') return;

      // Verifica che sia la risposta alla mia sfida pendente
      if (data.challengeId !== pendingChallengeIdRef.current) return;

      clearChallengeTimeout();
      pendingChallengeIdRef.current = null;

      if (data.accepted) {
        // Crea la sfida sul server
        setPhase('accepted');
        void (async (): Promise<void> => {
          try {
            const result = await client.sfide.create({
              opponentId: data.responderId,
            });
            setSfidaData({
              sfidaId: result.sfida_id,
              quizIdA: result.quiz_id_a,
              quizIdB: result.quiz_id_b,
              gameStartedAt: result.game_started_at,
            });

            const gameStartPayload = {
              sfidaId: result.sfida_id,
              quizIdA: result.quiz_id_a,
              quizIdB: result.quiz_id_b,
              gameStartedAt: result.game_started_at,
              playerAId: userId,
              playerBId: data.responderId,
            };

            // Pubblica game-start sul canale della sfida
            const gameChannel = ably.channels.get(
              `sfide:game:${result.sfida_id}`,
            );
            await gameChannel.publish('game-start', gameStartPayload);

            // Pubblica game-start sul canale utente dell'avversario
            // (per far navigare l'avversario al quiz)
            const opponentUserChannel = ably.channels.get(
              `sfide:user:${data.responderId}`,
            );
            await opponentUserChannel.publish('game-start', gameStartPayload);

            // Pubblica game-start sul proprio canale utente
            // (per triggerare la navigazione in SfideLayout anche per il challenger)
            const myUserChannel = ably.channels.get(
              `sfide:user:${userId}`,
            );
            await myUserChannel.publish('game-start', gameStartPayload);
          } catch {
            setPhase('error');
          }
        })();
      } else {
        setPhase('rejected');
      }
    };

    myChannel.subscribe('challenge-request', handleChallengeRequest);
    myChannel.subscribe('challenge-response', handleChallengeResponse);

    return (): void => {
      myChannel.unsubscribe('challenge-request', handleChallengeRequest);
      myChannel.unsubscribe('challenge-response', handleChallengeResponse);
      channelRef.current = null;
      clearChallengeTimeout();
    };
  }, [enabled, userId, setIncomingChallenge, clearChallengeTimeout]);

  // ---- Reset ----
  const resetChallenge = useCallback((): void => {
    clearChallengeTimeout();
    pendingChallengeIdRef.current = null;
    setPhase('idle');
    setSfidaData(null);
  }, [clearChallengeTimeout]);

  return {
    phase,
    sendChallenge,
    respondToChallenge,
    resetChallenge,
    sfidaData,
  };
}
