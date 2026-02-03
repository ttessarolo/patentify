import React from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/tanstack-react-start';
import { Button } from '~/components/ui/button';
import { DomandaCard } from '~/components/domanda';
import { useTimePeriod } from '~/components/errori-ricorrenti';
import { getDomandeSkull } from '~/server/errori-ricorrenti';
import type { TimePeriod, DomandeSkullResult, DomandaSkull } from '~/types/db';

export const Route = createFileRoute(
  '/main/errori-ricorrenti/skull-selezionate'
)({
  component: SkullSelezionatePage,
});

const PAGE_LIMIT = 10;

type DomandePayload = {
  data: { period: TimePeriod; limit: number; offset: number };
};

function SkullSelezionatePage(): React.JSX.Element {
  const period = useTimePeriod();
  const { userId } = useAuth();

  const getSkullFn = useServerFn(getDomandeSkull);

  // Query infinita per paginazione
  const domandeQuery = useInfiniteQuery({
    queryKey: ['errori-ricorrenti', 'skull-selezionate-full', period],
    queryFn: async ({ pageParam }): Promise<DomandeSkullResult> =>
      (
        getSkullFn as unknown as (
          opts: DomandePayload
        ) => Promise<DomandeSkullResult>
      )({
        data: { period, limit: PAGE_LIMIT, offset: pageParam },
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages): number | undefined => {
      if (!lastPage.hasMore) return undefined;
      return allPages.length * PAGE_LIMIT;
    },
    staleTime: 2 * 60 * 1000,
  });

  const domande = domandeQuery.data?.pages.flatMap((p) => p.domande) ?? [];

  // Handler vuoto per readOnly
  const handleAnswer = (): void => {
    // readOnly mode, no-op
  };

  return (
    <div className="space-y-4">
      {/* Header con back link */}
      <div className="flex items-center gap-2">
        <Link
          to="/main/errori-ricorrenti"
          search={{ period }}
          className="text-muted-foreground hover:text-foreground"
        >
          &larr;
        </Link>
        <h1 className="text-xl font-bold">Domande Skull</h1>
      </div>

      <p className="text-sm text-muted-foreground">
        Tutte le domande che hai marcato come difficili, dalla più recente
      </p>

      {/* Loading */}
      {domandeQuery.isLoading && (
        <p className="text-center text-muted-foreground">
          Caricamento domande...
        </p>
      )}

      {/* Error */}
      {domandeQuery.isError && (
        <p className="text-center text-red-500">Errore nel caricamento</p>
      )}

      {/* Lista domande */}
      {domande.length > 0 && (
        <div className="space-y-4">
          {domande.map((domanda: DomandaSkull) => (
            <DomandaCard
              key={domanda.id}
              domanda={{ ...domanda, skull: true }}
              onAnswer={handleAnswer}
              learning={false}
              readOnly={true}
              initialAnswer={domanda.ultima_risposta ?? undefined}
              userId={userId}
            />
          ))}

          {/* Bottone Carica Altre */}
          {domandeQuery.hasNextPage && (
            <div className="flex justify-center pt-4">
              <Button
                type="button"
                onClick={(): void => {
                  void domandeQuery.fetchNextPage();
                }}
                disabled={domandeQuery.isFetchingNextPage}
              >
                {domandeQuery.isFetchingNextPage
                  ? 'Caricamento...'
                  : 'Carica Altre'}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Nessuna domanda */}
      {domandeQuery.data && domande.length === 0 && (
        <p className="text-center text-muted-foreground">
          Non hai ancora marcato nessuna domanda come Skull
        </p>
      )}
    </div>
  );
}
