/**
 * Box storico sfide — mostra le ultime 5 sfide dell'utente.
 *
 * Per ogni sfida mostra: avatar avversario, nickname, esito, data.
 */

import type { JSX } from 'react';
import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/tanstack-react-start';
import { useNavigate, Link } from '@tanstack/react-router';
import { orpc } from '~/lib/orpc';
import { Button } from '~/components/ui/button';
import { SFIDA_TIERS, getSfidaTierPillClasses } from '~/commons';
import type { SfidaTier } from '~/commons';

export function ChallengeHistory(): JSX.Element {
  const { userId } = useAuth();
  const navigate = useNavigate();

  const historyQuery = useQuery(
    orpc.sfide.history.queryOptions({
      enabled: Boolean(userId),
    }),
  );

  const sfide = historyQuery.data?.sfide ?? [];

  const handleRowClick = useCallback(
    (quizId: number | null, sfidaId: number, status: string): void => {
      if (status !== 'completed') return;
      if (quizId != null) {
        void navigate({
          to: '/main/rivedi-quiz',
          search: { quizId, back: 'sfide' as const },
        });
      } else {
        void navigate({
          to: '/main/rivedi-sfida',
          search: { sfidaId },
        });
      }
    },
    [navigate],
  );

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">Ultime Sfide</h2>
      </div>

      <div className="p-2">
        {sfide.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            Nessuna sfida ancora
          </div>
        ) : (
          <div className="space-y-1">
            {sfide.map((sfida) => {
              const isWinner = sfida.winner_id === userId;
              const isDraw =
                sfida.status === 'completed' && sfida.winner_id === null;
              const isAborted = sfida.status === 'aborted';

              let esito: string;
              let esitoColor: string;
              if (isAborted) {
                esito = 'Interrotta';
                esitoColor = 'text-muted-foreground';
              } else if (isDraw) {
                esito = 'Pareggio';
                esitoColor = 'text-yellow-400';
              } else if (isWinner) {
                esito = 'Vittoria';
                esitoColor = 'text-green-500';
              } else {
                esito = 'Sconfitta';
                esitoColor = 'text-red-500';
              }

              const dateStr = new Date(sfida.created_at).toLocaleDateString(
                'it-IT',
                {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                },
              );

              const isClickable = sfida.status === 'completed';
              const sfidaTypeLabel =
                SFIDA_TIERS[sfida.sfida_type as SfidaTier]?.label ??
                sfida.sfida_type;

              return (
                <div
                  key={sfida.sfida_id}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 ${isClickable ? 'cursor-pointer transition-colors hover:bg-muted/50' : ''}`}
                  role={isClickable ? 'button' : undefined}
                  tabIndex={isClickable ? 0 : undefined}
                  onClick={
                    isClickable
                      ? (): void =>
                          handleRowClick(
                            sfida.my_quiz_id,
                            sfida.sfida_id,
                            sfida.status
                          )
                      : undefined
                  }
                  onKeyDown={
                    isClickable
                      ? (e): void => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleRowClick(
                              sfida.my_quiz_id,
                              sfida.sfida_id,
                              sfida.status
                            );
                          }
                        }
                      : undefined
                  }
                >
                  {/* Avatar avversario */}
                  <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-muted">
                    {sfida.opponent_image_url ? (
                      <img
                        src={sfida.opponent_image_url}
                        alt={sfida.opponent_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <svg
                          className="h-5 w-5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium">
                      {sfida.opponent_username ?? sfida.opponent_name}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      {dateStr}
                      {sfidaTypeLabel && (
                        <span
                          className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${getSfidaTierPillClasses(sfida.sfida_type)}`}
                        >
                          {sfidaTypeLabel}
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Esito */}
                  <div className="flex flex-col items-end">
                    <span className={`text-xs font-semibold ${esitoColor}`}>
                      {esito}
                    </span>
                    {sfida.status === 'completed' && (
                      <span className="text-[10px] text-muted-foreground">
                        {sfida.my_correct} - {sfida.opponent_correct}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottone Vedi Tutte */}
      {sfide.length > 0 && (
        <div className="border-t border-border px-4 py-3">
          <Link to="/main/sfide/storico">
            <Button
              variant="ghost"
              className="w-full text-sm text-muted-foreground hover:text-foreground"
            >
              Vedi Tutte
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
