import type { JSX } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import {
  QuizStatsSection,
  QuizTable,
  StatisticheTimePeriodToolbar,
  useStatistichePeriod,
} from '~/components/statistiche';
import { orpc } from '~/lib/orpc';

// Schema per i search params
// NON usare .default() qui, altrimenti sovrascrive sempre il valore dello store
const searchSchema = z.object({
  period: z.enum(['oggi', 'settimana', 'mese', 'tutti']).optional(),
});

export const Route = createFileRoute('/main/statistiche')({
  validateSearch: searchSchema,
  component: StatistichePage,
});

function StatistichePage(): JSX.Element {
  const period = useStatistichePeriod();

  // Query per statistiche quiz
  const statsQuery = useQuery({
    ...orpc.statistiche.getQuizStats.queryOptions({ input: { period } }),
    staleTime: 2 * 60 * 1000,
  });

  return (
    <div className="mx-auto max-w-4xl px-2 pb-4 sm:px-4">
      {/* Blocco sticky: toolbar + titolo */}
      <div className="sticky top-(--header-height,3.5rem) z-20 -mx-2 bg-background px-2 pb-0 sm:-mx-4 sm:px-4">
        <StatisticheTimePeriodToolbar
          currentPeriod={period}
          section="statistiche"
          disableSticky
        />
        <h1 className="my-2 text-center text-2xl font-bold sm:text-left sm:text-3xl">
          Statistiche Quiz
        </h1>
      </div>

      {/* Contenuto */}
      <div className="space-y-4 sm:space-y-6">
        {/* Sezione Statistiche + Grafico */}
        <QuizStatsSection
          stats={
            statsQuery.data ?? {
              quiz_svolti: 0,
              quiz_promossi: 0,
              quiz_bocciati: 0,
            }
          }
          isLoading={statsQuery.isLoading}
          period={period}
        />

        {/* Tabella Quiz con infinite scroll */}
        <div className="px-4">
          <QuizTable period={period} />
        </div>
      </div>
    </div>
  );
}
