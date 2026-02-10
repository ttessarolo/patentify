import { useSearch } from '@tanstack/react-router';
import { useAppStore } from '~/store';
import type { TimePeriod } from '~/types/db';

/**
 * Tipo per identificare la sezione dello store da usare.
 */
export type PeriodSection = 'erroriRicorrenti' | 'statistiche' | 'classifiche';

/**
 * Hook generico per ottenere il periodo corrente per una sezione specifica.
 * Priorità:
 * 1. Se URL ha period esplicito → usa quello (permette link condivisi)
 * 2. Altrimenti → usa lo store (persistenza utente tra sessioni)
 *
 * Zustand gestisce automaticamente il re-render dopo l'idratazione,
 * quindi non serve un fallback hardcoded.
 */
export function useTimePeriodFor(section: PeriodSection): TimePeriod {
  const search = useSearch({ strict: false }) as { period?: TimePeriod };
  const storePeriod = useAppStore((s) => {
    if (section === 'statistiche') return s.statistiche.period;
    if (section === 'classifiche') return s.classifiche.period;
    return s.erroriRicorrenti.period;
  });
  const urlPeriod = search?.period;

  // Se URL ha period valido, usa quello (sempre)
  if (
    urlPeriod === 'oggi' ||
    urlPeriod === 'settimana' ||
    urlPeriod === 'mese' ||
    urlPeriod === 'tutti'
  ) {
    return urlPeriod;
  }

  // Ritorna storePeriod - Zustand gestisce automaticamente il re-render
  // dopo l'idratazione (valore default → valore persistito)
  return storePeriod;
}

/**
 * Hook per ottenere il periodo corrente per erroriRicorrenti.
 * Wrapper per retrocompatibilità.
 */
export function useTimePeriod(): TimePeriod {
  return useTimePeriodFor('erroriRicorrenti');
}
