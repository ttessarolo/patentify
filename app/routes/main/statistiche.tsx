import type { JSX } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import {
  QuizStatsSection,
  QuizTable,
  StatisticheTimePeriodToolbar,
  useStatistichePeriod,
} from '~/components/statistiche';
import { getQuizStats } from '~/server/statistiche';
import type { TimePeriod, QuizStatsResult } from '~/types/db';

// Schema per i search params
// NON usare .default() qui, altrimenti sovrascrive sempre il valore dello store
const searchSchema = z.object({
  period: z.enum(['oggi', 'settimana', 'mese', 'tutti']).optional(),
});

/** Payload types per server functions */
type StatsPayload = { data: { period: TimePeriod } };

export const Route = createFileRoute('/main/statistiche')({
  validateSearch: searchSchema,
  component: StatistichePage,
});

function StatistichePage(): JSX.Element {
  const period = useStatistichePeriod();

  // Server function
  const getStatsFn = useServerFn(getQuizStats);

  // Query per statistiche quiz
  const statsQuery = useQuery({
    queryKey: ['statistiche', 'quiz-stats', period],
    queryFn: async (): Promise<QuizStatsResult> =>
      (
        getStatsFn as unknown as (opts: StatsPayload) => Promise<QuizStatsResult>
      )({
        data: { period },
      }),
    staleTime: 2 * 60 * 1000,
  });

  return (
    <div className="mx-auto max-w-4xl px-2 pb-4 sm:px-4">
      {/* Toolbar sticky: attaccata alla navbar (nessuno spazio sopra) */}
      <StatisticheTimePeriodToolbar currentPeriod={period} section="statistiche" />

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
