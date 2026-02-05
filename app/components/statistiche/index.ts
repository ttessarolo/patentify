export { QuizStatsSection } from './QuizStatsSection';
export { QuizTable } from './QuizTable';

// Re-export da errori-ricorrenti con alias per statistiche
export {
  TimePeriodToolbar as StatisticheTimePeriodToolbar,
  useTimePeriodFor,
} from '../errori-ricorrenti/TimePeriodToolbar';
export type { PeriodSection } from '../errori-ricorrenti/TimePeriodToolbar';
import type { TimePeriod } from '~/types/db';
import { useTimePeriodFor } from '../errori-ricorrenti/TimePeriodToolbar';

/**
 * Hook per ottenere il periodo corrente per la sezione statistiche.
 */
export function useStatistichePeriod(): TimePeriod {
  return useTimePeriodFor('statistiche');
}
