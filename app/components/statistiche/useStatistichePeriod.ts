import type { TimePeriod } from '~/types/db';
import { useTimePeriodFor } from '../errori-ricorrenti/useTimePeriod';

/**
 * Hook per ottenere il periodo corrente per la sezione statistiche.
 */
export function useStatistichePeriod(): TimePeriod {
  return useTimePeriodFor('statistiche');
}
