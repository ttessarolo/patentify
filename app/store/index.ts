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

import type { AppState } from './types';
import { createUISlice } from './slices/ui';
import { createFiltersSlice } from './slices/filters';
import { createQuizSlice } from './slices/quiz';

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
        activeQuiz: state.activeQuiz,
        preferences: state.preferences,
      }),
    }
  )
);

// Re-export types per comodità
export type { AppState } from './types';
export type {
  UISlice,
  FiltersSlice,
  QuizSlice,
  ActiveQuizState,
  QuizPreferences,
  QuizStatus,
  EsercitazioneFilters,
  ErroriRicorrentiFilters,
} from './types';
