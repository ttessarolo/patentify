/**
 * Route per rivedere le domande di una sfida completata (non-full).
 * Le sfide full usano rivedi-quiz con quizId; le sfide non-full
 * (Speed, Medium, Half Quiz) usano questa route con sfidaId.
 */

import type { JSX } from 'react';
import { useCallback } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/tanstack-react-start';
import { z } from 'zod';

import { DomandaCard } from '~/components/domanda';
import { orpc } from '~/lib/orpc';
import { SFIDA_TIERS } from '~/commons';
import type { SfidaTier } from '~/commons';

const searchSchema = z.object({
  sfidaId: z.coerce.number().int().positive(),
});

export const Route = createFileRoute('/main/rivedi-sfida')({
  validateSearch: searchSchema,
  component: RivediSfidaPage,
});

function RivediSfidaPage(): JSX.Element {
  const { sfidaId } = Route.useSearch();
  const { userId } = useAuth();

  const sfidaQuery = useQuery({
    ...orpc.sfide.getFull.queryOptions({ input: { sfida_id: sfidaId } }),
    staleTime: 5 * 60 * 1000,
  });

  const handleNoOp = useCallback((): void => {
    // Non fa nulla - le risposte sono in sola lettura
  }, []);

  if (sfidaQuery.isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-2 md:py-8">
        <div className="py-8 text-center text-muted-foreground">
          Caricamento sfida...
        </div>
      </div>
    );
  }

  if (sfidaQuery.isError) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-2 md:py-8">
        <div className="py-8 text-center text-red-600">
          Errore nel caricamento della sfida
        </div>
      </div>
    );
  }

  const sfidaData = sfidaQuery.data;

  if (!sfidaData || sfidaData.domande.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-2 md:py-8">
        <div className="py-8 text-center text-muted-foreground">
          Sfida non trovata o nessuna risposta registrata
        </div>
      </div>
    );
  }

  const tierLabel =
    SFIDA_TIERS[sfidaData.sfida_type as SfidaTier]?.label ?? sfidaData.sfida_type;

  return (
    <div className="mx-auto max-w-2xl px-4 py-2 md:py-8">
      <div className="mb-6 flex items-baseline gap-2">
        <Link
          to="/main/sfide"
          className="inline-flex shrink-0 items-center justify-center text-3xl leading-none text-muted-foreground hover:text-foreground"
        >
          «
        </Link>
        <h1 className="text-2xl font-bold">
          Sfida {tierLabel} — Risposte date
        </h1>
      </div>

      <div className="flex flex-col gap-4">
        {sfidaData.domande.map((item) => (
          <DomandaCard
            key={`view-${item.domanda.id}-${item.quiz_pos}`}
            domanda={item.domanda}
            onAnswer={handleNoOp}
            learning={true}
            readOnly={true}
            initialAnswer={item.answer_given ?? undefined}
            userId={userId}
          />
        ))}
      </div>

      <div className="mt-8">
        <Link
          to="/main/sfide"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          ← Torna alle Sfide
        </Link>
      </div>
    </div>
  );
}
