/**
 * ChallengeCompletionHandler — componente globale montato in __root.tsx.
 *
 * Quando un player ha finito la sfida ma l'avversario no,
 * ascolta il canale Ably `sfide:game:{sfidaId}` per l'evento `player-finished`.
 * In alternativa fa polling ogni 5s su `client.sfide.result()`.
 *
 * Quando l'avversario finisce, mostra un toast con link ai risultati.
 */

import { useEffect, useRef, useCallback } from 'react';
import type { JSX } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAppStore } from '~/store';
import { getAblyRealtime } from '~/lib/ably-client';
import { client } from '~/lib/orpc';
import { toast } from 'sonner';
import type * as Ably from 'ably';

/** Polling interval in ms */
const POLL_INTERVAL_MS = 5_000;

export function ChallengeCompletionHandler(): JSX.Element | null {
  const pending = useAppStore((s) => s.pendingSfidaCompletion);
  const setPending = useAppStore((s) => s.setPendingSfidaCompletion);
  const navigate = useNavigate();
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const channelRef = useRef<Ably.RealtimeChannel | null>(null);
  const handledRef = useRef<number | null>(null);

  const cleanup = useCallback((): void => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }
  }, []);

  const handleOpponentFinished = useCallback(
    (sfidaId: number, opponentName: string): void => {
      if (handledRef.current === sfidaId) return;
      handledRef.current = sfidaId;

      cleanup();
      setPending(null);

      toast.success(`${opponentName} ha terminato la sfida!`, {
        description: 'Clicca per vedere i risultati completi.',
        duration: 10_000,
        action: {
          label: 'Vedi Risultati',
          onClick: (): void => {
            void navigate({
              to: '/main/sfide/risultati',
              search: { sfidaId },
            });
          },
        },
      });
    },
    [cleanup, setPending, navigate],
  );

  useEffect(() => {
    if (!pending) {
      cleanup();
      return;
    }

    const { sfidaId, opponentName } = pending;

    // 1. Ascolta via Ably
    try {
      const ably = getAblyRealtime();
      const channel = ably.channels.get(`sfide:game:${sfidaId}`);
      channelRef.current = channel;

      channel.subscribe('player-finished', (): void => {
        handleOpponentFinished(sfidaId, opponentName);
      });
    } catch {
      // Ably potrebbe non essere disponibile
    }

    // 2. Polling fallback
    pollingRef.current = setInterval(() => {
      void (async (): Promise<void> => {
        try {
          const result = await client.sfide.result({ sfida_id: sfidaId });
          if (result.both_finished) {
            handleOpponentFinished(sfidaId, opponentName);
          }
        } catch {
          // Ignora errori di polling
        }
      })();
    }, POLL_INTERVAL_MS);

    return cleanup;
  }, [pending, handleOpponentFinished, cleanup]);

  return null;
}
