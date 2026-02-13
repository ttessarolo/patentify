import type { JSX } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/tanstack-react-start';
import { Button } from '~/components/ui/button';
import { DomandaCard } from '~/components/domanda';
import { useTimePeriod } from '~/components/errori-ricorrenti';
import { orpc, client } from '~/lib/orpc';

type DomandaConErrori = Awaited<
  ReturnType<typeof client.errori.getMaggioriErrori>
>['domande'][number];

export const Route = createFileRoute('/main/errori-ricorrenti/maggiori-errori')(
  {
    component: MaggioriErroriPage,
  }
);

const PAGE_LIMIT = 10;

function MaggioriErroriPage(): JSX.Element {
  const period = useTimePeriod();
  const { userId } = useAuth();

  // Query infinita per paginazione
  const domandeQuery = useInfiniteQuery(
    orpc.errori.getMaggioriErrori.infiniteOptions({
      input: (pageParam: number) => ({
        period,
        limit: PAGE_LIMIT,
        offset: pageParam,
      }),
      initialPageParam: 0,
      getNextPageParam: (lastPage, _, lastParam): number | undefined =>
        lastPage.hasMore ? (lastParam ?? 0) + PAGE_LIMIT : undefined,
      staleTime: 2 * 60 * 1000,
    })
  );

  const domande = domandeQuery.data?.pages.flatMap((p) => p.domande) ?? [];

  // Handler vuoto per readOnly
  const handleAnswer = (): void => {
    // readOnly mode, no-op
  };

  return (
    <div className="space-y-4">
      {/* Header sticky: back + titolo */}
      <div className="sticky top-[calc(var(--header-height,3.5rem)+4.5rem)] sm:top-[calc(var(--header-height,3.5rem)+3rem)] z-10 border-b border-border bg-background py-2 shadow-[0_-1rem_0_0_var(--color-background)]">
        <div className="flex items-baseline gap-2">
          <Link
            to="/main/errori-ricorrenti"
            search={{ period }}
            className="inline-flex shrink-0 items-center justify-center text-3xl leading-none text-muted-foreground hover:text-foreground sm:text-4xl"
          >
            «
          </Link>
          <h1 className="text-xl font-bold">Domande con Maggiori Errori</h1>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Domande che hai sbagliato più volte nel periodo selezionato
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
          {domande.map((domanda: DomandaConErrori) => (
            <div key={domanda.id} className="relative">
              {/* Badge errori */}
              <div className="absolute -top-2 right-2 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                {domanda.errori_count}x errori
              </div>
              <DomandaCard
                domanda={{ ...domanda, skull: domanda.skull }}
                onAnswer={handleAnswer}
                learning={false}
                readOnly={true}
                initialAnswer={domanda.ultima_risposta ?? undefined}
                userId={userId}
                showSelectionGlow={false}
              />
            </div>
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
          Nessun errore nel periodo selezionato
        </p>
      )}
    </div>
  );
}
