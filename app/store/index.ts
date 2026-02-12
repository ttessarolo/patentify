/**
 * Store Zustand globale per Patentify.
 *
 * Caratteristiche:
 * - Immer middleware per updates immutabili
 * - Persist middleware per localStorage
 * - skipHydration per compatibilità SSR con TanStack Start
 * - Slices pattern per organizzazione modulare
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import type {
  AppState,
  ErroriRicorrentiFilters,
  StatisticheFilters,
  ClassificheFilters,
} from './types';
import { createUISlice } from './slices/ui';
import {
  createFiltersSlice,
  erroriRicorrentiDefaults,
  statisticheDefaults,
  classificheDefaults,
} from './slices/filters';
import { createQuizSlice } from './slices/quiz';
import { createSfideSlice } from './slices/sfide';
import { createVersionSlice, versionDefaults } from './slices/version';

/**
 * Store globale dell'applicazione.
 *
 * Uso:
 * ```tsx
 * const isOpen = useAppStore((s) => s.collapsedSections['filters']);
 * const toggleSection = useAppStore((s) => s.toggleSection);
 * ```
 *
 * IMPORTANTE: Lo store usa skipHydration per evitare mismatch SSR.
 * Chiamare `useAppStore.persist.rehydrate()` nel root component.
 */
export const useAppStore = create<AppState>()(
  persist(
    immer((...args) => ({
      // UI Slice
      ...createUISlice(...args),
      // Filters Slice
      ...createFiltersSlice(...args),
      // Quiz Slice
      ...createQuizSlice(...args),
      // Sfide Slice
      ...createSfideSlice(...args),
      // Version Slice
      ...createVersionSlice(...args),
    })),
    {
      name: 'patentify-store',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true, // IMPORTANTE per SSR - rehydrate manualmente
      partialize: (state) => ({
        // Persisti solo lo stato necessario, escludi le funzioni
        collapsedSections: state.collapsedSections,
        esercitazione: state.esercitazione,
        erroriRicorrenti: state.erroriRicorrenti,
        statistiche: state.statistiche,
        classifiche: state.classifiche,
        activeQuiz: state.activeQuiz,
        preferences: state.preferences,
        // Sfide state
        activeSfida: state.activeSfida,
        sfideShowOnlyFollowed: state.sfideShowOnlyFollowed,
        // Version state
        currentVersion: state.currentVersion,
      }),
      // Merge personalizzato per gestire correttamente i nested objects
      // Il default di Zustand fa shallow merge che può sovrascrivere
      // i campi nested con i default
      merge: (persistedState, currentState) => {
        const persisted = (persistedState ?? {}) as Partial<AppState>;

        // Deep merge per erroriRicorrenti
        const mergedErroriRicorrenti: ErroriRicorrentiFilters = {
          ...erroriRicorrentiDefaults,
          ...(persisted.erroriRicorrenti ?? {}),
        };

        // Deep merge per statistiche
        const mergedStatistiche: StatisticheFilters = {
          ...statisticheDefaults,
          ...(persisted.statistiche ?? {}),
        };

        // Deep merge per classifiche
        const mergedClassifiche: ClassificheFilters = {
          ...classificheDefaults,
          ...(persisted.classifiche ?? {}),
        };

        return {
          ...currentState,
          // Sovrascriviamo con i valori persistiti (shallow per i campi top-level)
          collapsedSections: persisted.collapsedSections ?? currentState.collapsedSections,
          esercitazione: persisted.esercitazione ?? currentState.esercitazione,
          activeQuiz: persisted.activeQuiz ?? currentState.activeQuiz,
          preferences: persisted.preferences ?? currentState.preferences,
          // Sfide state
          activeSfida: persisted.activeSfida ?? currentState.activeSfida,
          sfideShowOnlyFollowed: persisted.sfideShowOnlyFollowed ?? currentState.sfideShowOnlyFollowed,
          // Deep merge per gli oggetti che hanno nested values
          erroriRicorrenti: mergedErroriRicorrenti,
          statistiche: mergedStatistiche,
          classifiche: mergedClassifiche,
          // Version state
          currentVersion: persisted.currentVersion ?? versionDefaults.currentVersion,
          // Non persistiamo updateAvailable - viene sempre ricalcolato
          updateAvailable: versionDefaults.updateAvailable,
        };
      },
    }
  )
);

// Re-export types per comodità
export type { AppState } from './types';
export type {
  UISlice,
  FiltersSlice,
  QuizSlice,
  VersionSlice,
  SfideSlice,
  ActiveQuizState,
  QuizPreferences,
  QuizStatus,
  ActiveSfidaState,
  IncomingChallengeState,
  PendingSfidaCompletionState,
  PendingRematchState,
  EsercitazioneFilters,
  ErroriRicorrentiFilters,
  StatisticheFilters,
  ClassificheFilters,
  ErroriRicorrentiChartType,
} from './types';
