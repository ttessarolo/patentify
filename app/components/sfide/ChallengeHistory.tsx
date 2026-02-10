/**
 * Box storico sfide — mostra le ultime 5 sfide dell'utente.
 *
 * Per ogni sfida mostra: avatar avversario, nickname, esito, data.
 */

import type { JSX } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/tanstack-react-start';
import { orpc } from '~/lib/orpc';

export function ChallengeHistory(): JSX.Element {
  const { userId } = useAuth();

  const historyQuery = useQuery(
    orpc.sfide.history.queryOptions({
      enabled: Boolean(userId),
    }),
  );

  const sfide = historyQuery.data?.sfide ?? [];

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

              return (
                <div
                  key={sfida.sfida_id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2"
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
                    <span className="text-xs text-muted-foreground">
                      {dateStr}
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
    </div>
  );
}
