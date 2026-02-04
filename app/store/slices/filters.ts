/**
 * Filters Slice - Gestione filtri utente persistenti.
 * Esercitazione, Errori Ricorrenti, etc.
 */

import type { StateCreator } from 'zustand';
import type { TimePeriod } from '~/types/db';
import type { AppState, FiltersSlice, EsercitazioneFilters } from '../types';

/**
 * Valori default per i filtri esercitazione.
 */
export const esercitazioneDefaults: EsercitazioneFilters = {
  search: '',
  irePlus: 'all',
  ambiguita: 'all',
  difficolta: 'all',
  titoloQuesito: 'all',
  ordinamentoCasuale: true,
};

/**
 * Valori default per i filtri errori ricorrenti.
 */
export const erroriRicorrentiDefaults = {
  period: 'tutti' as TimePeriod,
};

/**
 * Crea lo slice Filters con Immer.
 */
export const createFiltersSlice: StateCreator<
  AppState,
  [['zustand/immer', never]],
  [],
  FiltersSlice
> = (set) => ({
  esercitazione: { ...esercitazioneDefaults },
  erroriRicorrenti: { ...erroriRicorrentiDefaults },

  setEsercitazioneFilter: <K extends keyof EsercitazioneFilters>(
    key: K,
    value: EsercitazioneFilters[K]
  ): void => {
    set((state) => {
      state.esercitazione[key] = value;
    });
  },

  resetEsercitazioneFilters: (): void => {
    set((state) => {
      state.esercitazione = { ...esercitazioneDefaults };
    });
  },

  setErroriRicorrentiPeriod: (period: TimePeriod): void => {
    set((state) => {
      state.erroriRicorrenti.period = period;
    });
  },
});
