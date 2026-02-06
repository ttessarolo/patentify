import type { JSX } from 'react';
import { useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useInfiniteQuery } from '@tanstack/react-query';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Pill } from '~/components/ui/pill';
import { getQuizList } from '~/server/statistiche';
import type { TimePeriod, QuizTableRow, QuizListResult } from '~/types/db';

// ============================================================
// Helpers per formattazione data
// ============================================================

/** Giorni della settimana in italiano */
const GIORNI_SETTIMANA = [
  'Domenica',
  'Lunedì',
  'Martedì',
  'Mercoledì',
  'Giovedì',
  'Venerdì',
  'Sabato',
];

/** Mesi in italiano */
const MESI = [
  'Gennaio',
  'Febbraio',
  'Marzo',
  'Aprile',
  'Maggio',
  'Giugno',
  'Luglio',
  'Agosto',
  'Settembre',
  'Ottobre',
  'Novembre',
  'Dicembre',
];

/**
 * Formatta una data ISO in formato italiano leggibile.
 * Es: "Lunedì 5 Febbraio 2026, 14:30"
 */
function formatDataOra(isoString: string): string {
  const date = new Date(isoString);
  const giorno = GIORNI_SETTIMANA[date.getDay()];
  const numeroGiorno = date.getDate();
  const mese = MESI[date.getMonth()];
  const anno = date.getFullYear();
  const ore = date.getHours().toString().padStart(2, '0');
  const minuti = date.getMinutes().toString().padStart(2, '0');

  return `${giorno} ${numeroGiorno} ${mese} ${anno}, ${ore}:${minuti}`;
}

/**
 * Formatta una data ISO in formato compatto per mobile.
 * Es: "05/02/26 14:30"
 */
function formatDataOraCompact(isoString: string): string {
  const date = new Date(isoString);
  const giorno = date.getDate().toString().padStart(2, '0');
  const mese = (date.getMonth() + 1).toString().padStart(2, '0');
  const anno = date.getFullYear().toString().slice(-2);
  const ore = date.getHours().toString().padStart(2, '0');
  const minuti = date.getMinutes().toString().padStart(2, '0');

  return `${giorno}/${mese}/${anno} ${ore}:${minuti}`;
}

// ============================================================
// Column Helper e definizione colonne
// ============================================================

const columnHelper = createColumnHelper<QuizTableRow>();

const columns = [
  columnHelper.accessor('completed_at', {
    header: 'Data',
    cell: (info) => {
      const value = info.getValue();
      return (
        <div className="flex flex-col">
          <span className="hidden sm:inline">{formatDataOra(value)}</span>
          <span className="sm:hidden">{formatDataOraCompact(value)}</span>
        </div>
      );
    },
  }),
  columnHelper.accessor('errori', {
    header: 'Errori',
    cell: (info) => {
      const errori = info.getValue();
      return (
        <span className={errori > 4 ? 'font-bold text-red-500' : ''}>
          {errori}
        </span>
      );
    },
  }),
  columnHelper.accessor('promosso', {
    header: 'Esito',
    cell: (info) => {
      const promosso = info.getValue();
      return promosso ? (
        <Pill className="bg-green-500/15 text-green-500">Promosso</Pill>
      ) : (
        <Pill className="bg-red-500/15 text-red-500">Bocciato</Pill>
      );
    },
  }),
];

// ============================================================
// QuizTable Component
// ============================================================

interface QuizTableProps {
  /** Periodo temporale per filtrare i quiz */
  period: TimePeriod;
}

/** Numero di quiz per pagina */
const PAGE_SIZE = 20;

/**
 * Tabella dei quiz con infinite scroll.
 * Utilizza TanStack Table per la gestione delle colonne
 * e TanStack Query con useInfiniteQuery per la paginazione.
 */
export function QuizTable({ period }: QuizTableProps): JSX.Element {
  const navigate = useNavigate();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Server function
  const getQuizListFn = useServerFn(getQuizList);

  // Infinite query per la lista quiz
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ['statistiche', 'quiz-list', period],
    queryFn: async ({ pageParam = 0 }): Promise<QuizListResult> =>
      (
        getQuizListFn as unknown as (opts: {
          data: { period: TimePeriod; limit: number; offset: number };
        }) => Promise<QuizListResult>
      )({
        data: { period, limit: PAGE_SIZE, offset: pageParam },
      }),
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      return allPages.length * PAGE_SIZE;
    },
    initialPageParam: 0,
    staleTime: 2 * 60 * 1000,
  });

  // Flatten dei dati per la tabella (memoizzato per evitare ricreazioni)
  const flatData = useMemo(
    () => data?.pages.flatMap((page) => page.quiz) ?? [],
    [data?.pages]
  );

  // Setup TanStack Table
  const table = useReactTable({
    data: flatData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // Handler per click su riga
  const handleRowClick = useCallback(
    (quizId: number): void => {
      void navigate({
        to: '/main/rivedi-quiz',
        search: { quizId, back: 'quiz_stats' },
      });
    },
    [navigate]
  );

  // Ref per memorizzare lo stato corrente dell'infinite scroll
  const scrollStateRef = useRef({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isLoading,
  });

  // Aggiorna il ref ad ogni render (senza causare re-esecuzione del useEffect)
  scrollStateRef.current = {
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isLoading,
  };

  // Intersection Observer per infinite scroll
  // Si ri-crea solo quando cambia il period
  useEffect(() => {
    const currentRef = loadMoreRef.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        const state = scrollStateRef.current;

        // Non fare fetch se sta già caricando o non ci sono più pagine
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

    // Delay per evitare trigger immediato dopo cambio periodo
    const timeoutId = setTimeout(() => {
      observer.observe(currentRef);
    }, 200);

    return (): void => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [period]);

  // Loading state iniziale
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-lg bg-muted"
          />
        ))}
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="py-8 text-center text-red-500">
        Errore nel caricamento dei quiz
      </div>
    );
  }

  // Empty state
  if (flatData.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Nessun quiz completato nel periodo selezionato
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Tabella */}
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full">
          <thead className="bg-card">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground sm:px-4"
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
                onClick={(): void => handleRowClick(row.original.quiz_id)}
                className="cursor-pointer bg-card transition-colors hover:bg-muted/50"
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-3 py-3 text-sm sm:px-4 sm:py-4"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Loader per infinite scroll */}
      <div ref={loadMoreRef} className="flex justify-center py-4">
        {isFetchingNextPage && (
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
        )}
        {!hasNextPage && flatData.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {flatData.length} quiz totali
          </span>
        )}
      </div>
    </div>
  );
}
