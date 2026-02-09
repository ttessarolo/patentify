/**
 * Filters Slice - Gestione filtri utente persistenti.
 * Esercitazione, Errori Ricorrenti, Statistiche, etc.
 */

import type { StateCreator } from 'zustand';
import type { TimePeriod } from '~/types/db';
import type {
  AppState,
  FiltersSlice,
  EsercitazioneFilters,
  ErroriRicorrentiChartType,
  ClassificheFilters,
} from '../types';

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
  chartType: 'pie' as ErroriRicorrentiChartType,
};

/**
 * Valori default per i filtri statistiche quiz.
 */
export const statisticheDefaults = {
  period: 'tutti' as TimePeriod,
  chartType: 'pie' as ErroriRicorrentiChartType,
};

/**
 * Valori default per i filtri classifiche (leaderboard).
 */
export const classificheDefaults: ClassificheFilters = {
  period: 'tutti' as TimePeriod,
  view: 'quiz',
  scope: 'generale',
  quizSortField: 'promosso',
  quizSortDir: 'desc',
  risposteSortField: 'corrette',
  risposteSortDir: 'desc',
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
  statistiche: { ...statisticheDefaults },
  classifiche: { ...classificheDefaults },

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

  setErroriRicorrentiChartType: (chartType: ErroriRicorrentiChartType): void => {
    set((state) => {
      state.erroriRicorrenti.chartType = chartType;
    });
  },

  toggleErroriRicorrentiChartType: (): void => {
    set((state) => {
      state.erroriRicorrenti.chartType =
        state.erroriRicorrenti.chartType === 'pie' ? 'bar' : 'pie';
    });
  },

  setStatistichePeriod: (period: TimePeriod): void => {
    set((state) => {
      state.statistiche.period = period;
    });
  },

  setStatisticheChartType: (chartType: ErroriRicorrentiChartType): void => {
    set((state) => {
      state.statistiche.chartType = chartType;
    });
  },

  toggleStatisticheChartType: (): void => {
    set((state) => {
      state.statistiche.chartType =
        state.statistiche.chartType === 'pie' ? 'bar' : 'pie';
    });
  },

  setClassifichePeriod: (period: TimePeriod): void => {
    set((state) => {
      state.classifiche.period = period;
    });
  },

  setClassificheView: (view: ClassificheFilters['view']): void => {
    set((state) => {
      state.classifiche.view = view;
    });
  },

  setClassificheScope: (scope: ClassificheFilters['scope']): void => {
    set((state) => {
      state.classifiche.scope = scope;
    });
  },

  setClassificheQuizSort: (
    field: ClassificheFilters['quizSortField'],
    dir: ClassificheFilters['quizSortDir']
  ): void => {
    set((state) => {
      state.classifiche.quizSortField = field;
      state.classifiche.quizSortDir = dir;
    });
  },

  setClassificheRisposteSort: (
    field: ClassificheFilters['risposteSortField'],
    dir: ClassificheFilters['risposteSortDir']
  ): void => {
    set((state) => {
      state.classifiche.risposteSortField = field;
      state.classifiche.risposteSortDir = dir;
    });
  },
});
