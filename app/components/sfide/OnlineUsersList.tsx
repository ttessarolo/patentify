/**
 * Lista utenti online — componente per la pagina Sfide.
 *
 * Mostra gli utenti attualmente online (dalla presence Ably),
 * con possibilità di filtrare solo i seguiti e di sfidare un utente.
 */

import { useMemo, useState, useCallback, useEffect } from 'react';
import type { JSX } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth, useUser } from '@clerk/tanstack-react-start';
import { useOnlineUsers } from '~/hooks/useOnlineUsers';
import { useChallengeFlow } from '~/hooks/useChallengeFlow';
import { UserCell } from '~/components/classifiche/UserCell';
import { OutgoingChallengeDialog } from './OutgoingChallengeDialog';
import { Button } from '~/components/ui/button';
import { StarOnIcon, StarOffIcon } from '~/icons';
import { useAppStore } from '~/store';
import { orpc } from '~/lib/orpc';

export function OnlineUsersList(): JSX.Element {
  const { userId } = useAuth();
  const { user: clerkUser } = useUser();
  const { onlineUserIds, isConnected } = useOnlineUsers({
    enabled: Boolean(userId),
  });

  const showOnlyFollowed = useAppStore((s) => s.sfideShowOnlyFollowed);
  const toggleFollowedFilter = useAppStore((s) => s.toggleSfideFollowedFilter);
  const pendingRematch = useAppStore((s) => s.pendingRematch);
  const setPendingRematch = useAppStore((s) => s.setPendingRematch);

  // Filtra via il proprio userId dalla lista
  const otherUserIds = useMemo(
    (): string[] => onlineUserIds.filter((id) => id !== userId),
    [onlineUserIds, userId],
  );

  // Fetch dettagli utenti online dal server
  const usersQuery = useQuery(
    orpc.sfide.onlineUsersDetails.queryOptions({
      input: { userIds: otherUserIds },
      enabled: otherUserIds.length > 0,
    }),
  );

  const users = usersQuery.data?.users ?? [];

  // Filtra per seguiti se attivo
  const displayedUsers = useMemo(() => {
    if (!showOnlyFollowed) return users;
    return users.filter((u) => u.is_following);
  }, [users, showOnlyFollowed]);

  // ---- Challenge flow ----
  const { phase, sendChallenge, resetChallenge } = useChallengeFlow({
    userId,
    enabled: Boolean(userId),
  });

  const [challengeTarget, setChallengeTarget] = useState<{
    userId: string;
    name: string;
  } | null>(null);

  const handleUserClick = useCallback(
    (targetUserId: string, targetName: string): void => {
      setChallengeTarget({ userId: targetUserId, name: targetName });
    },
    [],
  );

  const handleConfirmSend = useCallback((): void => {
    if (!challengeTarget) return;
    const myName =
      clerkUser?.username ?? clerkUser?.fullName ?? 'Utente';
    const myImageUrl = clerkUser?.imageUrl ?? null;
    sendChallenge(challengeTarget.userId, myName, myImageUrl);
  }, [challengeTarget, clerkUser, sendChallenge]);

  const handleCloseDialog = useCallback((): void => {
    setChallengeTarget(null);
    resetChallenge();
  }, [resetChallenge]);

  // ---- Rematch automatico (da schermata risultati) ----
  useEffect(() => {
    if (!pendingRematch || !clerkUser) return;

    const myName = clerkUser.username ?? clerkUser.fullName ?? 'Utente';
    const myImageUrl = clerkUser.imageUrl ?? null;

    // Imposta il target e invia la sfida
    setChallengeTarget({
      userId: pendingRematch.opponentId,
      name: pendingRematch.opponentName,
    });
    sendChallenge(pendingRematch.opponentId, myName, myImageUrl);

    // Consuma il rematch
    setPendingRematch(null);
  }, [pendingRematch, clerkUser, sendChallenge, setPendingRematch]);

  // Se la sfida è stata accettata e abbiamo i dati, naviga al quiz
  // (gestito nella route sfide.tsx)

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">Utenti Online</h2>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {otherUserIds.length}
          </span>
          {!isConnected && (
            <span className="text-xs text-muted-foreground">(connessione...)</span>
          )}
        </div>
        {/* Pill filtro seguiti */}
        <button
          type="button"
          onClick={toggleFollowedFilter}
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
            showOnlyFollowed
              ? 'border-yellow-400 text-yellow-400'
              : 'border-muted bg-muted text-muted-foreground hover:text-yellow-400'
          }`}
        >
          {showOnlyFollowed ? (
            <StarOnIcon className="h-3.5 w-3.5" />
          ) : (
            <StarOffIcon className="h-3.5 w-3.5" />
          )}
          <span>Seguiti</span>
        </button>
      </div>

      {/* Lista utenti */}
      <div className="max-h-80 overflow-y-auto p-2">
        {displayedUsers.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            {otherUserIds.length === 0
              ? 'Nessun utente online al momento'
              : showOnlyFollowed
                ? 'Nessun utente seguito online'
                : 'Caricamento...'}
          </div>
        ) : (
          <div className="space-y-1">
            {displayedUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-2 rounded-lg px-3 py-2"
              >
                <Button
                  size="sm"
                  onClick={() =>
                    handleUserClick(user.id, user.username ?? user.name)
                  }
                  className="shrink-0 bg-orange-500 text-xs font-semibold text-white hover:bg-orange-600"
                >
                  Sfida
                </Button>
                <div className="min-w-0 flex-1">
                  <UserCell
                    userId={user.id}
                    name={user.name}
                    username={user.username}
                    imageUrl={user.image_url}
                    isFollowing={user.is_following}
                    layout="header"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialog invio sfida */}
      {challengeTarget && (
        <OutgoingChallengeDialog
          open={Boolean(challengeTarget)}
          onClose={handleCloseDialog}
          targetName={challengeTarget.name}
          phase={phase}
          onConfirmSend={handleConfirmSend}
        />
      )}
    </div>
  );
}

/** Esporta sfidaData per uso nella route */
export { useChallengeFlow };
