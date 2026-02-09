import type { JSX } from 'react';
import { useRef, useEffect, useMemo, useCallback } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useInfiniteQuery } from '@tanstack/react-query';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useTimePeriodFor } from '~/components/errori-ricorrenti';
import { UserCell, SortableHeader, MobileSortControl } from '~/components/classifiche';
import { Pill } from '~/components/ui/pill';
import { useAppStore } from '~/store';
import { getClassificaRisposte } from '~/server/classifiche';
import type {
  TimePeriod,
  ClassificaRisposteRow,
  ClassificaRisposteResult,
  ClassificaScope,
} from '~/types/db';

export const Route = createFileRoute('/main/classifiche/risposte')({
  component: ClassificaRispostePage,
});

/** Numero di righe per pagina */
const PAGE_SIZE = 10;
/** Numero massimo di righe totali */
const MAX_ROWS = 50;

// ============================================================
// Helpers
// ============================================================

/**
 * Calcola percentuale sicura (evita divisione per zero).
 */
function safePercent(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

// ============================================================
// Column Helper
// ============================================================

const columnHelper = createColumnHelper<ClassificaRisposteRow>();

// ============================================================
// Component
// ============================================================

function ClassificaRispostePage(): JSX.Element {
  const period = useTimePeriodFor('classifiche');
  const scope = useAppStore((s) => s.classifiche.scope);
  const sortField = useAppStore((s) => s.classifiche.risposteSortField);
  const sortDir = useAppStore((s) => s.classifiche.risposteSortDir);
  const setRisposteSort = useAppStore((s) => s.setClassificheRisposteSort);

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const getClassificaRisposteFn = useServerFn(getClassificaRisposte);

  type RispostePayload = {
    data: {
      period: TimePeriod;
      scope: ClassificaScope;
      sortField: string;
      sortDir: string;
      limit: number;
      offset: number;
    };
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ['classifiche', 'risposte', period, scope, sortField, sortDir],
    queryFn: async ({ pageParam = 0 }): Promise<ClassificaRisposteResult> =>
      (
        getClassificaRisposteFn as unknown as (
          opts: RispostePayload
        ) => Promise<ClassificaRisposteResult>
      )({
        data: {
          period,
          scope,
          sortField,
          sortDir,
          limit: PAGE_SIZE,
          offset: pageParam,
        },
      }),
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      const totalLoaded = allPages.length * PAGE_SIZE;
      if (totalLoaded >= MAX_ROWS) return undefined;
      return totalLoaded;
    },
    initialPageParam: 0,
    staleTime: 2 * 60 * 1000,
  });

  // Flatten dati
  const flatData = useMemo(
    () => data?.pages.flatMap((page) => page.rows) ?? [],
    [data?.pages]
  );

  // Handler ordinamento (table header click)
  const handleSortClick = useCallback(
    (field: 'copertura' | 'sbagliate' | 'corrette'): void => {
      if (sortField === field) {
        setRisposteSort(field, sortDir === 'desc' ? 'asc' : 'desc');
      } else {
        setRisposteSort(field, 'desc');
      }
    },
    [sortField, sortDir, setRisposteSort]
  );

  // Handler mobile sort: cambio campo
  const handleMobileSortField = useCallback(
    (field: string): void => {
      const f = field as 'copertura' | 'sbagliate' | 'corrette';
      if (f !== sortField) {
        setRisposteSort(f, 'desc');
      }
    },
    [sortField, setRisposteSort]
  );

  // Handler mobile sort: toggle direzione
  const handleMobileDirToggle = useCallback((): void => {
    setRisposteSort(sortField, sortDir === 'desc' ? 'asc' : 'desc');
  }, [sortField, sortDir, setRisposteSort]);

  /** Opzioni per il selettore di ordinamento mobile */
  const mobileSortOptions = useMemo(
    () => [
      { value: 'copertura', label: '% Copertura' },
      { value: 'sbagliate', label: '% Sbagliate' },
      { value: 'corrette', label: '% Giuste' },
    ],
    []
  );

  // Definizione colonne
  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'utente',
        header: () => (
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Utente
          </span>
        ),
        cell: (info) => {
          const row = info.row.original;
          return (
            <UserCell
              userId={row.user_id}
              name={row.name}
              username={row.username}
              imageUrl={row.image_url}
              isFriend={row.is_friend}
            />
          );
        },
      }),
      columnHelper.display({
        id: 'copertura',
        header: () => (
          <SortableHeader
            label="% Copertura"
            isActive={sortField === 'copertura'}
            direction={sortField === 'copertura' ? sortDir : 'desc'}
            onClick={(): void => handleSortClick('copertura')}
          />
        ),
        cell: (info) => {
          const row = info.row.original;
          const percent = safePercent(
            row.domande_uniche,
            row.totale_domande_db
          );
          return (
            <div className="flex flex-col items-center gap-0.5">
              <Pill className="bg-teal-500/15 text-teal-500 text-sm font-bold">
                {percent}%
              </Pill>
              <span className="text-[10px] text-muted-foreground">
                {row.totale_risposte} Risposte
              </span>
            </div>
          );
        },
      }),
      columnHelper.display({
        id: 'sbagliate',
        header: () => (
          <SortableHeader
            label="% Sbagliate"
            isActive={sortField === 'sbagliate'}
            direction={sortField === 'sbagliate' ? sortDir : 'desc'}
            onClick={(): void => handleSortClick('sbagliate')}
          />
        ),
        cell: (info) => {
          const row = info.row.original;
          const percent = safePercent(
            row.risposte_errate,
            row.totale_risposte
          );
          return (
            <div className="flex flex-col items-center gap-0.5">
              <Pill className="bg-red-500/15 text-red-500 text-sm font-bold">
                {percent}%
              </Pill>
              <span className="text-[10px] text-muted-foreground">
                {row.risposte_errate} errori
              </span>
            </div>
          );
        },
      }),
      columnHelper.display({
        id: 'corrette',
        header: () => (
          <SortableHeader
            label="% Giuste"
            isActive={sortField === 'corrette'}
            direction={sortField === 'corrette' ? sortDir : 'desc'}
            onClick={(): void => handleSortClick('corrette')}
          />
        ),
        cell: (info) => {
          const row = info.row.original;
          const percent = safePercent(
            row.risposte_corrette,
            row.totale_risposte
          );
          return (
            <div className="flex flex-col items-center gap-0.5">
              <Pill className="bg-green-500/15 text-green-500 text-sm font-bold">
                {percent}%
              </Pill>
              <span className="text-[10px] text-muted-foreground">
                {row.risposte_corrette} corrette
              </span>
            </div>
          );
        },
      }),
    ],
    [sortField, sortDir, handleSortClick]
  );

  // Setup TanStack Table
  const table = useReactTable({
    data: flatData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // Ref per infinite scroll state
  const scrollStateRef = useRef({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isLoading,
  });

  scrollStateRef.current = {
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isLoading,
  };

  // Intersection Observer per infinite scroll
  useEffect(() => {
    const currentRef = loadMoreRef.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        const state = scrollStateRef.current;
        if (
          first.isIntersecting &&
          state.hasNextPage &&
          !state.isFetchingNextPage &&
          !state.isLoading
        ) {
          void state.fetchNextPage();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    const timeoutId = setTimeout(() => {
      observer.observe(currentRef);
    }, 200);

    return (): void => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [period, scope, sortField, sortDir]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-lg bg-muted"
          />
        ))}
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="py-8 text-center text-red-500">
        Errore nel caricamento della classifica
      </div>
    );
  }

  // Empty state
  if (flatData.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Nessun dato disponibile per il periodo selezionato
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* ===================== MOBILE: card layout ===================== */}
      <div className="sm:hidden">
        {/* Controllo ordinamento mobile */}
        <MobileSortControl
          sortOptions={mobileSortOptions}
          currentField={sortField}
          currentDir={sortDir}
          onFieldChange={handleMobileSortField}
          onDirToggle={handleMobileDirToggle}
        />

        {/* Lista card */}
        <div className="mt-2 space-y-2">
          {flatData.map((row) => {
            const percentCopertura = safePercent(
              row.domande_uniche,
              row.totale_domande_db
            );
            const percentSbagliate = safePercent(
              row.risposte_errate,
              row.totale_risposte
            );
            const percentCorrette = safePercent(
              row.risposte_corrette,
              row.totale_risposte
            );

            return (
              <div
                key={row.user_id}
                className="rounded-lg border border-border bg-card p-3"
              >
                {/* Info utente */}
                <UserCell
                  userId={row.user_id}
                  name={row.name}
                  username={row.username}
                  imageUrl={row.image_url}
                  isFriend={row.is_friend}
                />

                {/* Dati risposte — griglia 3 colonne fisse */}
                <div className="mt-3 grid grid-cols-3">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Copertura
                    </span>
                    <Pill className="bg-teal-500/15 text-teal-500 text-sm font-bold">
                      {percentCopertura}%
                    </Pill>
                    <span className="text-[10px] text-muted-foreground">
                      {row.totale_risposte} Risp.
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Sbagliate
                    </span>
                    <Pill className="bg-red-500/15 text-red-500 text-sm font-bold">
                      {percentSbagliate}%
                    </Pill>
                    <span className="text-[10px] text-muted-foreground">
                      {row.risposte_errate} errori
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Giuste
                    </span>
                    <Pill className="bg-green-500/15 text-green-500 text-sm font-bold">
                      {percentCorrette}%
                    </Pill>
                    <span className="text-[10px] text-muted-foreground">
                      {row.risposte_corrette} corrette
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ===================== DESKTOP: tabella ===================== */}
      <div className="hidden sm:block">
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full">
            <thead className="bg-card">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-3 py-3 text-left sm:px-4"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-border">
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="bg-card transition-colors hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-3 py-3 text-sm sm:px-4 sm:py-4"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Loader per infinite scroll */}
      <div ref={loadMoreRef} className="flex justify-center py-4">
        {isFetchingNextPage && (
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
        )}
      </div>
    </div>
  );
}
