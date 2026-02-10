/**
 * Hook per la sottoscrizione alla presenza nel canale sfide:lobby.
 *
 * Ritorna la lista degli userId attualmente online,
 * aggiornata in real-time (enter/leave).
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type * as Ably from 'ably';
import { getAblyRealtime } from '~/lib/ably-client';

interface UseOnlineUsersOptions {
  /** Se il hook è abilitato (default: true) */
  enabled?: boolean;
}

interface UseOnlineUsersReturn {
  /** Lista dei clientId (userId Clerk) attualmente online */
  onlineUserIds: string[];
  /** Se la connessione è attiva */
  isConnected: boolean;
}

export function useOnlineUsers(
  options: UseOnlineUsersOptions = {},
): UseOnlineUsersReturn {
  const { enabled = true } = options;

  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const channelRef = useRef<Ably.RealtimeChannel | null>(null);

  const syncPresence = useCallback(async (): Promise<void> => {
    if (!channelRef.current) return;
    try {
      const members = await channelRef.current.presence.get();
      const ids = members
        .map((m) => m.clientId)
        .filter((id): id is string => Boolean(id));
      setOnlineUserIds(ids);
    } catch {
      // Ignora errori di presenza durante disconnessione
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const ably = getAblyRealtime();
    const channel = ably.channels.get('sfide:lobby');
    channelRef.current = channel;

    const handleEnter = (): void => {
      void syncPresence();
    };

    const handleLeave = (): void => {
      void syncPresence();
    };

    const handleConnected = (): void => {
      setIsConnected(true);
    };

    const handleDisconnected = (): void => {
      setIsConnected(false);
    };

    // Sottoscrivi agli eventi di presenza
    channel.presence.subscribe('enter', handleEnter);
    channel.presence.subscribe('leave', handleLeave);

    // Ascolta lo stato della connessione
    ably.connection.on('connected', handleConnected);
    ably.connection.on('disconnected', handleDisconnected);
    ably.connection.on('closed', handleDisconnected);

    // Sync iniziale
    void syncPresence();

    if (ably.connection.state === 'connected') {
      setIsConnected(true);
    }

    return (): void => {
      channel.presence.unsubscribe('enter', handleEnter);
      channel.presence.unsubscribe('leave', handleLeave);
      ably.connection.off('connected', handleConnected);
      ably.connection.off('disconnected', handleDisconnected);
      ably.connection.off('closed', handleDisconnected);
      channelRef.current = null;
    };
  }, [enabled, syncPresence]);

  return { onlineUserIds, isConnected };
}
