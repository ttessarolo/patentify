import type { JSX } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/tanstack-react-start';
import { StarOffIcon, StarOnIcon } from '~/icons';
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
  /** Se l'utente è seguito */
  isFollowing: boolean;
  /**
   * Layout variant:
   * - 'default': bottone follow sotto il nome (desktop table)
   * - 'header': bottone follow in alto a destra (mobile card header)
   */
  layout?: 'default' | 'header';
}

/**
 * Cella "Utente" per le tabelle classifica.
 * Mostra avatar, nickname, nome completo e bottone follow.
 *
 * In layout 'header' il bottone follow è posizionato in alto a destra
 * come badge, ideale per l'header delle card mobile.
 */
export function UserCell({
  userId,
  name,
  username,
  imageUrl,
  isFollowing,
  layout = 'default',
}: UserCellProps): JSX.Element {
  const { userId: currentUserId, isLoaded: isAuthLoaded } = useAuth();
  const queryClient = useQueryClient();

  const followMutation = useMutation({
    mutationFn: async (
      action: 'add' | 'remove'
    ): Promise<{ success: boolean }> => {
      if (action === 'add') {
        return orpc.classifiche.addFollower.call({ targetUserId: userId });
      }
      return orpc.classifiche.removeFollower.call({ targetUserId: userId });
    },
    onSuccess: (): void => {
      // Invalida TUTTE le query classifiche (quiz + risposte, qualsiasi filtro)
      // perché il flag is_following cambia e lo scope 'seguiti' dipende dalla lista follower
      void queryClient.invalidateQueries({
        queryKey: ['classifiche'],
      });
    },
  });

  const isOwnUser = currentUserId === userId;

  const handleFollowToggle = (e: React.MouseEvent): void => {
    e.stopPropagation();
    if (followMutation.isPending || isOwnUser) return;
    followMutation.mutate(isFollowing ? 'remove' : 'add');
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

  const showFollowButton = isAuthLoaded && !isOwnUser;

  const followButtonElement = showFollowButton ? (
    <button
      type="button"
      onClick={handleFollowToggle}
      disabled={followMutation.isPending}
      className={`inline-flex w-fit shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors ${
        isFollowing
          ? 'border border-yellow-400 text-yellow-400 hover:bg-yellow-400/10'
          : 'bg-muted text-muted-foreground hover:text-yellow-400'
      } ${followMutation.isPending ? 'opacity-50' : ''}`}
      aria-label={isFollowing ? 'Smetti di seguire' : 'Segui'}
    >
      {isFollowing ? (
        <>
          <StarOnIcon className="h-3.5 w-3.5" />
          <span>Seguito</span>
        </>
      ) : (
        <>
          <StarOffIcon className="h-3.5 w-3.5" />
          <span>Segui</span>
        </>
      )}
    </button>
  ) : null;

  // ---- Layout 'header': bottone follow in alto a destra ----
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
        {followButtonElement}
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
        {followButtonElement && (
          <div className="mt-1">{followButtonElement}</div>
        )}
      </div>
    </div>
  );
}
