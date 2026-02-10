/**
 * AblyPresenceManager — componente globale montato in __root.tsx.
 *
 * Responsabilità:
 * - Connette il client Ably quando l'utente è autenticato
 * - Entra nella presence del canale sfide:lobby
 * - Traccia l'attività dell'utente (idle → leave, active → enter)
 * - Ascolta le sfide in arrivo sul canale sfide:user:{userId}
 * - Disconnette Ably al logout
 */

import { useEffect, useRef, useCallback } from 'react';
import type { JSX } from 'react';
import { useAuth } from '@clerk/tanstack-react-start';
import { getAblyRealtime, disconnectAbly } from '~/lib/ably-client';
import { useActivityTracker } from '~/hooks/useActivityTracker';
import type * as Ably from 'ably';

/** Timeout idle per la presenza: 5 minuti */
const PRESENCE_IDLE_TIMEOUT_MS = 5 * 60 * 1000;

export function AblyPresenceManager(): JSX.Element | null {
  const { userId, isSignedIn } = useAuth();
  const lobbyChannelRef = useRef<Ably.RealtimeChannel | null>(null);
  const isPresenceEnteredRef = useRef<boolean>(false);

  // Entra nella presence
  const enterPresence = useCallback((): void => {
    if (!lobbyChannelRef.current || isPresenceEnteredRef.current) return;
    isPresenceEnteredRef.current = true;
    lobbyChannelRef.current.presence.enter().catch(() => {
      isPresenceEnteredRef.current = false;
    });
  }, []);

  // Esci dalla presence
  const leavePresence = useCallback((): void => {
    if (!lobbyChannelRef.current || !isPresenceEnteredRef.current) return;
    isPresenceEnteredRef.current = false;
    lobbyChannelRef.current.presence.leave().catch(() => {
      // Ignora errori al leave
    });
  }, []);

  // Activity tracker
  useActivityTracker({
    idleTimeoutMs: PRESENCE_IDLE_TIMEOUT_MS,
    enabled: Boolean(isSignedIn && userId),
    onIdle: leavePresence,
    onActive: enterPresence,
  });

  // Connessione/disconnessione Ably
  useEffect(() => {
    if (!isSignedIn || !userId) {
      // Utente non autenticato: disconnetti
      disconnectAbly();
      isPresenceEnteredRef.current = false;
      lobbyChannelRef.current = null;
      return;
    }

    // Utente autenticato: connetti
    const ably = getAblyRealtime();

    if (ably.connection.state !== 'connected' && ably.connection.state !== 'connecting') {
      ably.connect();
    }

    const lobby = ably.channels.get('sfide:lobby');
    lobbyChannelRef.current = lobby;

    // Entra nella presence una volta connesso
    const handleConnected = (): void => {
      enterPresence();
    };

    if (ably.connection.state === 'connected') {
      enterPresence();
    } else {
      ably.connection.once('connected', handleConnected);
    }

    return (): void => {
      leavePresence();
      ably.connection.off('connected', handleConnected);
    };
  }, [isSignedIn, userId, enterPresence, leavePresence]);

  // Non renderizza nulla — è un componente logico
  return null;
}
