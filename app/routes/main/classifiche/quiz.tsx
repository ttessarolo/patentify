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
import { getClassificaQuiz } from '~/server/classifiche';
import type {
  TimePeriod,
  ClassificaQuizRow,
  ClassificaQuizResult,
  ClassificaScope,
} from '~/types/db';

export const Route = createFileRoute('/main/classifiche/quiz')({
  component: ClassificaQuizPage,
});

/** Numero di righe per pagina */
const PAGE_SIZE = 10;
/** Numero massimo di righe totali */
const MAX_ROWS = 50;

// ============================================================
// Column Helper
// ============================================================

const columnHelper = createColumnHelper<ClassificaQuizRow>();

// ============================================================
// Component
// ============================================================

function ClassificaQuizPage(): JSX.Element {
  const period = useTimePeriodFor('classifiche');
  const scope = useAppStore((s) => s.classifiche.scope);
  const sortField = useAppStore((s) => s.classifiche.quizSortField);
  const sortDir = useAppStore((s) => s.classifiche.quizSortDir);
  const setQuizSort = useAppStore((s) => s.setClassificheQuizSort);

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const getClassificaQuizFn = useServerFn(getClassificaQuiz);

  type ClassificaPayload = {
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
    queryKey: ['classifiche', 'quiz', period, scope, sortField, sortDir],
    queryFn: async ({ pageParam = 0 }): Promise<ClassificaQuizResult> =>
      (
        getClassificaQuizFn as unknown as (
          opts: ClassificaPayload
        ) => Promise<ClassificaQuizResult>
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
    (field: 'promosso' | 'bocciato'): void => {
      if (sortField === field) {
        setQuizSort(field, sortDir === 'desc' ? 'asc' : 'desc');
      } else {
        setQuizSort(field, 'desc');
      }
    },
    [sortField, sortDir, setQuizSort]
  );

  // Handler mobile sort: cambio campo
  const handleMobileSortField = useCallback(
    (field: string): void => {
      const f = field as 'promosso' | 'bocciato';
      if (f !== sortField) {
        setQuizSort(f, 'desc');
      }
    },
    [sortField, setQuizSort]
  );

  // Handler mobile sort: toggle direzione
  const handleMobileDirToggle = useCallback((): void => {
    setQuizSort(sortField, sortDir === 'desc' ? 'asc' : 'desc');
  }, [sortField, sortDir, setQuizSort]);

  /** Opzioni per il selettore di ordinamento mobile */
  const mobileSortOptions = useMemo(
    () => [
      { value: 'promosso', label: 'Promosso' },
      { value: 'bocciato', label: 'Bocciato' },
    ],
    []
  );

  // Definizione colonne (dipende da stato)
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
      columnHelper.accessor('bocciato', {
        header: () => (
          <SortableHeader
            label="Bocciato"
            isActive={sortField === 'bocciato'}
            direction={sortField === 'bocciato' ? sortDir : 'desc'}
            onClick={(): void => handleSortClick('bocciato')}
          />
        ),
        cell: (info) => {
          const value = info.getValue();
          return (
            <div className="flex justify-center">
              <Pill className="bg-red-500/15 text-red-500 text-sm font-bold">
                {value}
              </Pill>
            </div>
          );
        },
      }),
      columnHelper.accessor('promosso', {
        header: () => (
          <SortableHeader
            label="Promosso"
            isActive={sortField === 'promosso'}
            direction={sortField === 'promosso' ? sortDir : 'desc'}
            onClick={(): void => handleSortClick('promosso')}
          />
        ),
        cell: (info) => {
          const value = info.getValue();
          return (
            <div className="flex justify-center">
              <Pill className="bg-green-500/15 text-green-500 text-sm font-bold">
                {value}
              </Pill>
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
          {flatData.map((row) => (
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

              {/* Dati quiz — griglia 3 colonne fisse, sx + dx occupate, centro vuota */}
              <div className="mt-3 grid grid-cols-3">
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Bocciato
                  </span>
                  <Pill className="bg-red-500/15 text-red-500 text-sm font-bold">
                    {row.bocciato}
                  </Pill>
                </div>
                {/* Colonna centrale vuota */}
                <div />
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Promosso
                  </span>
                  <Pill className="bg-green-500/15 text-green-500 text-sm font-bold">
                    {row.promosso}
                  </Pill>
                </div>
              </div>
            </div>
          ))}
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
