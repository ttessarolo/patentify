import React, { useCallback } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useInfiniteQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@clerk/tanstack-react-start';
import { Button } from '~/components/ui/button';
import { DomandaCard } from '~/components/domanda';
import { useTimePeriod } from '~/components/errori-ricorrenti';
import { getDomandeSbagliate } from '~/server/errori-ricorrenti';
import { trackAttempt } from '~/server/track_attempt';
import { checkResponse } from '~/server/checkResponse';
import type {
  TimePeriod,
  DomandeErroriResult,
  DomandaConErrori,
  CheckResponseResult,
  TrackAttemptResult,
} from '~/types/db';

export const Route = createFileRoute(
  '/main/errori-ricorrenti/domande-sbagliate'
)({
  component: DomandeSbagliatePage,
});

const PAGE_LIMIT = 10;

type DomandePayload = {
  data: { period: TimePeriod; limit: number; offset: number };
};
type CheckResponsePayload = {
  data: { domanda_id: number; answer_given: string };
};
type TrackAttemptPayload = {
  data: { domanda_id: number; answer_given: string };
};

function DomandeSbagliatePage(): React.JSX.Element {
  const period = useTimePeriod();
  const { userId } = useAuth();

  const getSbagliateFn = useServerFn(getDomandeSbagliate);
  const trackAttemptFn = useServerFn(trackAttempt);
  const checkResponseFn = useServerFn(checkResponse);

  // Query infinita per paginazione
  const domandeQuery = useInfiniteQuery({
    queryKey: ['errori-ricorrenti', 'domande-sbagliate', period],
    queryFn: async ({ pageParam }): Promise<DomandeErroriResult> =>
      (
        getSbagliateFn as unknown as (
          opts: DomandePayload
        ) => Promise<DomandeErroriResult>
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

  // Mutation per tracking
  const trackMutation = useMutation({
    mutationFn: async ({
      domanda_id,
      answer_given,
    }: {
      domanda_id: number;
      answer_given: string;
    }): Promise<TrackAttemptResult> =>
      (
        trackAttemptFn as unknown as (
          opts: TrackAttemptPayload
        ) => Promise<TrackAttemptResult>
      )({ data: { domanda_id, answer_given } }),
  });

  const handleAnswer = useCallback(
    async (domandaId: number, value: string): Promise<void> => {
      trackMutation.mutate({ domanda_id: domandaId, answer_given: value });
    },
    [trackMutation]
  );

  const handleCheckResponse = useCallback(
    async (domandaId: number, answerGiven: string): Promise<boolean> => {
      try {
        const result = await (
          checkResponseFn as unknown as (
            opts: CheckResponsePayload
          ) => Promise<CheckResponseResult>
        )({ data: { domanda_id: domandaId, answer_given: answerGiven } });
        return result.is_correct;
      } catch {
        return false;
      }
    },
    [checkResponseFn]
  );

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
        <h1 className="text-xl font-bold">Domande Sbagliate</h1>
      </div>

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
            <DomandaCard
              key={domanda.id}
              domanda={{ ...domanda, skull: domanda.skull }}
              onAnswer={handleAnswer}
              showAnswerAfterResponse={true}
              onCheckResponse={handleCheckResponse}
              userId={userId}
              learning={true}
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
          Nessuna domanda sbagliata nel periodo selezionato
        </p>
      )}
    </div>
  );
}
