/**
 * Storico completo sfide — elenco di tutte le sfide con filtri.
 *
 * Tre filtri: Tutte (arancione), Vinte (verde), Perse (rosso).
 * Ogni riga completata è cliccabile → rivedi-quiz con back=sfide.
 */

import type { JSX } from 'react';
import { useState, useCallback } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/tanstack-react-start';
import { orpc } from '~/lib/orpc';
import { Button } from '~/components/ui/button';
import { SFIDA_TIERS, getSfidaTierPillClasses } from '~/commons';
import type { SfidaTier } from '~/commons';

type SfideFilter = 'all' | 'won' | 'lost';

export const Route = createFileRoute('/main/sfide/storico')({
  component: StoricoSfidePage,
});

function StoricoSfidePage(): JSX.Element {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<SfideFilter>('all');

  const historyQuery = useQuery({
    ...orpc.sfide.historyAll.queryOptions({ input: { filter } }),
    enabled: Boolean(userId),
  });

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

  const filterButtons: { value: SfideFilter; label: string; activeClass: string }[] = [
    { value: 'all', label: 'Tutte', activeClass: 'bg-orange-500 text-white hover:bg-orange-600' },
    { value: 'won', label: 'Vinte', activeClass: 'bg-green-500 text-white hover:bg-green-600' },
    { value: 'lost', label: 'Perse', activeClass: 'bg-red-500 text-white hover:bg-red-600' },
  ];

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* Header */}
      <div className="mb-4 flex items-baseline gap-2">
        <Link
          to="/main/sfide"
          className="inline-flex shrink-0 items-center justify-center text-3xl leading-none text-muted-foreground hover:text-foreground"
        >
          «
        </Link>
        <h1 className="text-2xl font-bold">Storico Sfide</h1>
      </div>

      {/* Filtri */}
      <div className="mb-4 flex gap-2">
        {filterButtons.map((btn) => (
          <Button
            key={btn.value}
            variant="outline"
            size="sm"
            className={
              filter === btn.value
                ? btn.activeClass
                : 'text-muted-foreground'
            }
            onClick={(): void => setFilter(btn.value)}
          >
            {btn.label}
          </Button>
        ))}
      </div>

      {/* Elenco */}
      <div className="rounded-xl border border-border bg-card">
        {historyQuery.isLoading ? (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            Caricamento...
          </div>
        ) : sfide.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            Nessuna sfida trovata
          </div>
        ) : (
          <div className="divide-y divide-border">
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
                  className={`flex items-center gap-3 px-4 py-3 ${isClickable ? 'cursor-pointer transition-colors hover:bg-muted/50' : ''}`}
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
    </div>
  );
}
