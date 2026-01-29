import React, { useState, useCallback } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useInfiniteQuery, useQuery, useMutation } from '@tanstack/react-query';
import { SearchField } from '~/components/esercitazione/SearchField';
import { FiltersBox } from '~/components/esercitazione/FiltersBox';
import { DomandaCard } from '~/components/domanda';
import { Button } from '~/components/ui/button';
import {
  getDomandeEsercitazione,
  getAmbitiDistinct,
} from '~/server/esercitazione';
import { authClient } from '~/lib/auth';
import { trackAttempt } from '~/server/track_attempt';
import { checkResponse } from '~/server/checkResponse';
import type {
  Domanda,
  CheckResponseResult,
  TrackAttemptResult,
} from '~/types/db';

/** Parametri per getDomandeEsercitazione (allineati al server) */
type DomandeQueryParams = {
  search?: string;
  ire_plus?: number;
  ambiguita?: number;
  difficolta?: number;
  titolo_quesito?: string;
  limit?: number;
  offset?: number;
};

/** Payload per checkResponse */
type CheckResponsePayload = {
  data: { domanda_id: number; answer_given: string };
};

/** Payload per trackAttempt (user_id obbligatorio dal client) */
type TrackAttemptPayload = {
  data: { domanda_id: number; answer_given: string; user_id: string };
};

export const Route = createFileRoute('/main/esercitazione')({
  component: EsercitazionePage,
});

function EsercitazionePage(): React.JSX.Element {
  const [search, setSearch] = useState('');
  const [irePlus, setIrePlus] = useState('all');
  const [ambiguita, setAmbiguita] = useState('all');
  const [difficolta, setDifficolta] = useState('all');
  const [titoloQuesito, setTitoloQuesito] = useState('all');

  const getDomandeFn = useServerFn(getDomandeEsercitazione);
  const getAmbitiFn = useServerFn(getAmbitiDistinct);
  const trackAttemptFn = useServerFn(trackAttempt);
  const checkResponseFn = useServerFn(checkResponse);

  // Limite per pagina
  const PAGE_LIMIT = 10;

  // Query infinita per ottenere le domande con paginazione
  const domandeQuery = useInfiniteQuery({
    queryKey: [
      'esercitazione',
      'domande',
      search,
      irePlus,
      ambiguita,
      difficolta,
      titoloQuesito,
    ],
    queryFn: async ({ pageParam }) => {
      const params: DomandeQueryParams = {
        limit: PAGE_LIMIT,
        offset: pageParam,
      };

      if (search) params.search = search;
      if (irePlus !== 'all') params.ire_plus = parseInt(irePlus, 10);
      if (ambiguita !== 'all') params.ambiguita = parseInt(ambiguita, 10);
      if (difficolta !== 'all') params.difficolta = parseInt(difficolta, 10);
      if (titoloQuesito !== 'all') params.titolo_quesito = titoloQuesito;

      return (
        getDomandeFn as unknown as (opts: {
          data: DomandeQueryParams;
        }) => Promise<Domanda[]>
      )({ data: params });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // Se l'ultima pagina ha meno elementi del limite, non ci sono altre pagine
      if (lastPage.length < PAGE_LIMIT) return undefined;
      // Altrimenti, calcola il prossimo offset
      return allPages.length * PAGE_LIMIT;
    },
  });

  // Elenco domande appiattito da tutte le pagine
  const domande = domandeQuery.data?.pages.flat() ?? [];

  // Query per ottenere gli ambiti
  const ambitiQuery = useQuery({
    queryKey: ['esercitazione', 'ambiti'],
    queryFn: async () =>
      (
        getAmbitiFn as unknown as (opts: {
          data: Record<string, never>;
        }) => Promise<string[]>
      )({ data: {} }),
    staleTime: 5 * 60 * 1000,
  });

  // Mutation per tracciare i tentativi (user_id obbligatorio dal client)
  const trackMutation = useMutation({
    mutationFn: async ({
      domanda_id,
      answer_given,
      user_id,
    }: {
      domanda_id: number;
      answer_given: string;
      user_id: string;
    }) =>
      (
        trackAttemptFn as unknown as (
          opts: TrackAttemptPayload
        ) => Promise<TrackAttemptResult>
      )({ data: { domanda_id, answer_given, user_id } }),
    onSuccess: () => {
      console.log('[client] trackAttempt completato con successo');
    },
    onError: (error) => {
      console.error('[client] Errore nel tracking:', error);
    },
  });

  // Handler per i filtri
  const handleSearchChange = useCallback((value: string): void => {
    setSearch(value);
  }, []);

  const handleIrePlusChange = useCallback((value: string): void => {
    setIrePlus(value);
  }, []);

  const handleAmbiguitaChange = useCallback((value: string): void => {
    setAmbiguita(value);
  }, []);

  const handleDifficoltaChange = useCallback((value: string): void => {
    setDifficolta(value);
  }, []);

  const handleTitoloQuesitoChange = useCallback((value: string): void => {
    setTitoloQuesito(value);
  }, []);

  // Handler quando l'utente risponde - traccia il tentativo (user_id dalla sessione)
  const handleAnswer = useCallback(
    async (domandaId: number, value: string): Promise<void> => {
      const session = await authClient.getSession();
      const user_id = session?.data?.user?.id;
      if (!user_id) {
        console.warn('[client] Nessuna sessione: tentativo non tracciato');
        return;
      }
      trackMutation.mutate({
        domanda_id: domandaId,
        answer_given: value,
        user_id,
      });
    },
    [trackMutation]
  );

  // Handler per verificare la risposta - restituisce true se corretta
  const handleCheckResponse = useCallback(
    async (domandaId: number, answerGiven: string): Promise<boolean> => {
      try {
        const result = await (
          checkResponseFn as unknown as (
            opts: CheckResponsePayload
          ) => Promise<CheckResponseResult>
        )({ data: { domanda_id: domandaId, answer_given: answerGiven } });
        return result.is_correct;
      } catch (error) {
        console.error('Errore verifica risposta:', error);
        return false;
      }
    },
    [checkResponseFn]
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-2 py-4 sm:px-4">
      {/* Titolo */}
      <h1 className="text-2xl font-bold">Esercitazione Libera</h1>

      {/* Campo di ricerca */}
      <SearchField
        value={search}
        onChange={handleSearchChange}
        placeholder="Cerca nella domanda..."
      />

      {/* Box filtri */}
      <FiltersBox
        irePlus={irePlus}
        ambiguita={ambiguita}
        difficolta={difficolta}
        titoloQuesito={titoloQuesito}
        ambitiOptions={ambitiQuery.data ?? []}
        onIrePlusChange={handleIrePlusChange}
        onAmbiguitaChange={handleAmbiguitaChange}
        onDifficoltaChange={handleDifficoltaChange}
        onTitoloQuesitoChange={handleTitoloQuesitoChange}
      />

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
          {domande.map((domanda: Domanda) => (
            <DomandaCard
              key={domanda.id}
              domanda={domanda}
              onAnswer={handleAnswer}
              showAnswerAfterResponse={true}
              onCheckResponse={handleCheckResponse}
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
