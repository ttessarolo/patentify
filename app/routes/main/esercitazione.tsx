import type { JSX } from 'react';
import { useCallback, useRef, useEffect, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useInfiniteQuery, useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@clerk/tanstack-react-start';
import { z } from 'zod';
import { FiltersReveal } from '~/components/esercitazione/FiltersReveal';
import { DomandaCard } from '~/components/domanda';
import { Button } from '~/components/ui/button';
import { RandomIcon } from '~/icons';
import { useAppStore } from '~/store';
import { orpc, client } from '~/lib/orpc';
import type { DomandaWithSkull } from '~/types/db';

// Schema per i search params (titolo_quesito opzionale)
const searchSchema = z.object({
  titolo_quesito: z.string().optional(),
});

export const Route = createFileRoute('/main/esercitazione')({
  validateSearch: searchSchema,
  component: EsercitazionePage,
});

function EsercitazionePage(): JSX.Element {
  // Legge i search params dall'URL
  const searchParams = Route.useSearch();

  // Filtri persistenti dallo store Zustand
  const filters = useAppStore((s) => s.esercitazione);
  const setFilter = useAppStore((s) => s.setEsercitazioneFilter);

  // Stato locale per visibility (non necessario persistere)
  const [isFiltersSectionVisible, setIsFiltersSectionVisible] = useState(true);

  // Deriva i valori dallo store
  const {
    search,
    irePlus,
    ambiguita,
    difficolta,
    titoloQuesito: localTitoloQuesito,
    ordinamentoCasuale: ordinamentoCasualeStore,
  } = filters;
  // Default true per retrocompatibilità con stato persistito senza la chiave
  const ordinamentoCasuale = ordinamentoCasualeStore ?? true;

  // Deriva titoloQuesito dall'URL quando presente, altrimenti usa lo state dallo store (evita setState in effect)
  const titoloQuesito =
    searchParams.titolo_quesito !== undefined
      ? searchParams.titolo_quesito
      : localTitoloQuesito;

  const filtersSectionRef = useRef<HTMLDivElement>(null);

  // Get userId from Clerk (for UI purposes only - server handles auth)
  const { userId } = useAuth();

  // Limite per pagina
  const PAGE_LIMIT = 10;

  // Query infinita per ottenere le domande con paginazione
  const domandeQuery = useInfiniteQuery(
    orpc.esercitazione.getDomande.infiniteOptions({
      input: (pageParam: number) => {
        const params: {
          limit: number;
          offset: number;
          ordinamento_casuale?: boolean;
          search?: string;
          ire_plus?: number;
          ambiguita?: number;
          difficolta?: number;
          titolo_quesito?: string;
        } = {
          limit: PAGE_LIMIT,
          offset: pageParam,
          ordinamento_casuale: ordinamentoCasuale,
        };
        if (search) params.search = search;
        if (irePlus !== 'all') params.ire_plus = parseInt(irePlus, 10);
        if (ambiguita !== 'all') params.ambiguita = parseInt(ambiguita, 10);
        if (difficolta !== 'all') params.difficolta = parseInt(difficolta, 10);
        if (titoloQuesito !== 'all') params.titolo_quesito = titoloQuesito;
        return params;
      },
      initialPageParam: 0,
      getNextPageParam: (lastPage, allPages) => {
        if (lastPage.length < PAGE_LIMIT) return undefined;
        return allPages.length * PAGE_LIMIT;
      },
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    })
  );

  // Elenco domande appiattito da tutte le pagine
  const domande = domandeQuery.data?.pages.flat() ?? [];

  // Query per ottenere gli ambiti
  const ambitiQuery = useQuery({
    ...orpc.esercitazione.getAmbiti.queryOptions({ input: {} }),
    staleTime: 5 * 60 * 1000,
  });

  // Mutation per tracciare i tentativi (user_id handled server-side via Clerk)
  const trackMutation = useMutation({
    ...orpc.attempt.track.mutationOptions(),
    onSuccess: () => {
      console.log('[client] trackAttempt completato con successo');
    },
    onError: (error) => {
      console.error('[client] Errore nel tracking:', error);
    },
  });

  // Handler per i filtri (usano lo store Zustand)
  const handleSearchChange = useCallback(
    (value: string): void => {
      setFilter('search', value);
    },
    [setFilter]
  );

  const handleIrePlusChange = useCallback(
    (value: string): void => {
      setFilter('irePlus', value);
    },
    [setFilter]
  );

  const handleAmbiguitaChange = useCallback(
    (value: string): void => {
      setFilter('ambiguita', value);
    },
    [setFilter]
  );

  const handleDifficoltaChange = useCallback(
    (value: string): void => {
      setFilter('difficolta', value);
    },
    [setFilter]
  );

  const handleTitoloQuesitoChange = useCallback(
    (value: string): void => {
      setFilter('titoloQuesito', value);
    },
    [setFilter]
  );

  const handleOrdinamentoCasualeChange = useCallback(
    (value: boolean): void => {
      setFilter('ordinamentoCasuale', value);
    },
    [setFilter]
  );

  // Handler quando l'utente risponde - traccia il tentativo (user_id handled server-side)
  const handleAnswer = useCallback(
    async (domandaId: number, value: string): Promise<void> => {
      // Server will get userId from Clerk auth() - no need to pass it from client
      trackMutation.mutate({
        domanda_id: domandaId,
        answer_given: value,
      });
    },
    [trackMutation]
  );

  // Handler per verificare la risposta - restituisce true se corretta
  const handleCheckResponse = useCallback(
    async (domandaId: number, answerGiven: string): Promise<boolean> => {
      try {
        const result = await client.attempt.check({
          domanda_id: domandaId,
          answer_given: answerGiven,
        });
        return result.is_correct;
      } catch (error) {
        console.error('Errore verifica risposta:', error);
        return false;
      }
    },
    []
  );

  // Intersection Observer per rilevare quando i filtri escono dalla viewport
  useEffect(() => {
    const ref = filtersSectionRef.current;
    if (!ref) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsFiltersSectionVisible(entry.isIntersecting);
      },
      { threshold: 0 }
    );

    observer.observe(ref);
    return (): void => {
      observer.disconnect();
    };
  }, []);

  // Calcola il numero di filtri attivi
  const activeFiltersCount = [
    search !== '',
    irePlus !== 'all',
    ambiguita !== 'all',
    difficolta !== 'all',
    titoloQuesito !== 'all',
  ].filter(Boolean).length;

  // Handler per scrollare ai filtri
  const handleScrollToFilters = useCallback((): void => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-4 px-2 pt-2 pb-4 sm:space-y-6 sm:px-4 sm:pt-4">
      {/* Box sticky filtri - appare quando i filtri escono dalla viewport */}
      {!isFiltersSectionVisible && (
        <button
          type="button"
          onClick={handleScrollToFilters}
          className="fixed left-1/2 top-[calc(var(--header-height,3.5rem)+2px)] z-9 -translate-x-1/2 flex cursor-pointer items-center gap-2 rounded-full bg-orange-500/65 px-4 py-2 text-sm font-medium text-white shadow-lg transition-colors hover:bg-orange-600"
        >
          Filtri
          <span className="inline-flex items-center justify-center rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-orange-600">
            {activeFiltersCount}
          </span>
          {ordinamentoCasuale && (
            <RandomIcon
              className="ml-0.5 h-4 w-4 shrink-0 text-white"
              aria-hidden
            />
          )}
        </button>
      )}

      {/* Sezione filtri (osservata dall'Intersection Observer) */}
      <div ref={filtersSectionRef} className="space-y-4 sm:space-y-6">
        {/* Titolo con link back a Errori Ricorrenti se titolo_quesito presente */}
        <div className="flex items-center justify-center gap-2 sm:justify-start">
          {searchParams.titolo_quesito && (
            <Link
              to="/main/errori-ricorrenti"
              className="flex items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Torna a Errori Ricorrenti"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 19l-7-7 7-7M18 19l-7-7 7-7"
                />
              </svg>
            </Link>
          )}
          <h1 className="text-center text-2xl font-bold sm:text-left">
            Esercitazione Libera
          </h1>
        </div>

        {/* Filtri collapsible */}
        <FiltersReveal
          search={search}
          onSearchChange={handleSearchChange}
          irePlus={irePlus}
          ambiguita={ambiguita}
          difficolta={difficolta}
          titoloQuesito={titoloQuesito}
          ambitiOptions={ambitiQuery.data ?? []}
          onIrePlusChange={handleIrePlusChange}
          onAmbiguitaChange={handleAmbiguitaChange}
          onDifficoltaChange={handleDifficoltaChange}
          onTitoloQuesitoChange={handleTitoloQuesitoChange}
          activeFiltersCount={activeFiltersCount}
          ordinamentoCasuale={ordinamentoCasuale}
          onOrdinamentoCasualeChange={handleOrdinamentoCasualeChange}
        />
      </div>

      {/* Stato di caricamento iniziale */}
      {domandeQuery.isLoading && (
        <p className="text-center text-muted-foreground">
          Caricamento domande...
        </p>
      )}

      {/* Errore */}
      {domandeQuery.isError && (
        <p className="text-center text-red-600">
          Errore nel caricamento delle domande
        </p>
      )}

      {/* Lista domande */}
      {domande.length > 0 && (
        <div className="space-y-4">
          {domande.map((domanda: DomandaWithSkull) => (
            <DomandaCard
              key={domanda.id}
              domanda={domanda}
              onAnswer={handleAnswer}
              showAnswerAfterResponse={true}
              onCheckResponse={handleCheckResponse}
              userId={userId}
            />
          ))}

          {/* Bottone Carica Altre */}
          {domandeQuery.hasNextPage && (
            <div className="flex justify-center pt-4">
              <Button
                type="button"
                onClick={() => domandeQuery.fetchNextPage()}
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

      {/* Nessuna domanda trovata */}
      {domandeQuery.data && domande.length === 0 && (
        <p className="text-center text-muted-foreground">
          Nessuna domanda trovata con i filtri selezionati
        </p>
      )}

      {/* Errore tracking (toast-like) */}
      {trackMutation.isError && (
        <div className="fixed bottom-4 right-4 rounded-md bg-red-100 p-4 text-red-800 shadow-lg">
          {trackMutation.error instanceof Error
            ? trackMutation.error.message
            : 'Errore nel salvataggio del progresso'}
        </div>
      )}
    </div>
  );
}
