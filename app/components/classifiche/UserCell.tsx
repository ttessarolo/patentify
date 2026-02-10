import type { JSX } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/tanstack-react-start';
import { FriendAddIcon, FriendOnIcon } from '~/icons';
import { orpc } from '~/lib/orpc';

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
  /**
   * Layout variant:
   * - 'default': bottone amicizia sotto il nome (desktop table)
   * - 'header': bottone amicizia in alto a destra (mobile card header)
   */
  layout?: 'default' | 'header';
}

/**
 * Cella "Utente" per le tabelle classifica.
 * Mostra avatar, nickname, nome completo e bottone amicizia.
 *
 * In layout 'header' il bottone amicizia è posizionato in alto a destra
 * come badge, ideale per l'header delle card mobile.
 */
export function UserCell({
  userId,
  name,
  username,
  imageUrl,
  isFriend,
  layout = 'default',
}: UserCellProps): JSX.Element {
  const { userId: currentUserId, isLoaded: isAuthLoaded } = useAuth();
  const queryClient = useQueryClient();

  const friendMutation = useMutation({
    mutationFn: async (
      action: 'add' | 'remove'
    ): Promise<{ success: boolean }> => {
      if (action === 'add') {
        return orpc.classifiche.addFriend.call({ friendId: userId });
      }
      return orpc.classifiche.removeFriend.call({ friendId: userId });
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

  // ---- Elementi condivisi ----

  const avatarElement = (
    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>
      )}
    </div>
  );

  const showFriendButton = isAuthLoaded && !isOwnUser;

  const friendButtonElement = showFriendButton ? (
    <button
      type="button"
      onClick={handleFriendToggle}
      disabled={friendMutation.isPending}
      className={`inline-flex w-fit shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors ${
        isFriend
          ? 'border border-green-500 text-white hover:bg-green-500/10'
          : 'bg-muted text-muted-foreground hover:bg-muted/80'
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
          <span>Aggiungi</span>
        </>
      )}
    </button>
  ) : null;

  // ---- Layout 'header': bottone amicizia in alto a destra ----
  if (layout === 'header') {
    return (
      <div className="flex items-start gap-3">
        {avatarElement}
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-semibold">
            {username || name}
          </span>
          <span className="truncate text-xs text-muted-foreground">{name}</span>
        </div>
        {friendButtonElement}
      </div>
    );
  }

  // ---- Layout 'default': bottone sotto il nome ----
  return (
    <div className="flex items-center gap-3">
      {avatarElement}
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-semibold">
          {username || name}
        </span>
        <span className="truncate text-xs text-muted-foreground">{name}</span>
        {friendButtonElement && (
          <div className="mt-1">{friendButtonElement}</div>
        )}
      </div>
    </div>
  );
}
