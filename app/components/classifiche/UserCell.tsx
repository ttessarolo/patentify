import type { JSX } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/tanstack-react-start';
import { FriendAddIcon, FriendOnIcon } from '~/icons';
import { addFriend, removeFriend } from '~/server/classifiche';
import type { FriendActionResult } from '~/types/db';

interface UserCellProps {
  /** ID utente */
  userId: string;
  /** Nome completo */
  name: string;
  /** Username / nickname */
  username: string | null;
  /** URL immagine profilo */
  imageUrl: string | null;
  /** Se l'utente è amico */
  isFriend: boolean;
}

/**
 * Cella "Utente" per le tabelle classifica.
 * Mostra avatar, nickname, nome completo e bottone amicizia.
 */
export function UserCell({
  userId,
  name,
  username,
  imageUrl,
  isFriend,
}: UserCellProps): JSX.Element {
  const { userId: currentUserId, isLoaded: isAuthLoaded } = useAuth();
  const queryClient = useQueryClient();

  const addFriendFn = useServerFn(addFriend);
  const removeFriendFn = useServerFn(removeFriend);

  type FriendPayload = { data: { friendId: string } };

  const friendMutation = useMutation({
    mutationFn: async (action: 'add' | 'remove'): Promise<FriendActionResult> => {
      if (action === 'add') {
        return (
          addFriendFn as unknown as (
            opts: FriendPayload
          ) => Promise<FriendActionResult>
        )({ data: { friendId: userId } });
      }
      return (
        removeFriendFn as unknown as (
          opts: FriendPayload
        ) => Promise<FriendActionResult>
      )({ data: { friendId: userId } });
    },
    onSuccess: (): void => {
      // Invalida TUTTE le query classifiche (quiz + risposte, qualsiasi filtro)
      // perché il flag is_friend cambia e lo scope 'amici' dipende dalla lista amici
      void queryClient.invalidateQueries({
        queryKey: ['classifiche'],
      });
    },
  });

  const isOwnUser = currentUserId === userId;

  const handleFriendToggle = (e: React.MouseEvent): void => {
    e.stopPropagation();
    if (friendMutation.isPending || isOwnUser) return;
    friendMutation.mutate(isFriend ? 'remove' : 'add');
  };

  return (
    <div className="flex items-center gap-3">
      {/* Avatar */}
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <svg
              className="h-6 w-6"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
        )}
      </div>

      {/* Info utente */}
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-semibold">
          {username || name}
        </span>
        <span className="truncate text-xs text-muted-foreground">{name}</span>

        {/* Bottone amicizia (non mostrare per se stessi, né prima che auth sia caricato) */}
        {isAuthLoaded && !isOwnUser && (
          <button
            type="button"
            onClick={handleFriendToggle}
            disabled={friendMutation.isPending}
            className={`mt-1 inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors ${
              isFriend
                ? 'bg-teal-500/15 text-teal-500 hover:bg-teal-500/25'
                : 'bg-green-500/15 text-green-500 hover:bg-green-500/25'
            } ${friendMutation.isPending ? 'opacity-50' : ''}`}
            aria-label={isFriend ? 'Rimuovi amico' : 'Aggiungi amico'}
          >
            {isFriend ? (
              <>
                <FriendOnIcon className="h-3.5 w-3.5" />
                <span>Amico</span>
              </>
            ) : (
              <>
                <FriendAddIcon className="h-3.5 w-3.5" />
                <span>Aggiungi Amico</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
