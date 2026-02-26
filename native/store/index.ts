import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import type {
  AppState,
  ErroriRicorrentiFilters,
  StatisticheFilters,
  ClassificheFilters,
} from '@commons/store/types';
import { createUISlice } from '@commons/store/slices/ui';
import {
  createFiltersSlice,
  erroriRicorrentiDefaults,
  statisticheDefaults,
  classificheDefaults,
} from '@commons/store/slices/filters';
import { createQuizSlice } from '@commons/store/slices/quiz';
import { createSfideSlice } from '@commons/store/slices/sfide';
import { createVersionSlice, versionDefaults } from '@commons/store/slices/version';

export const useNativeStore = create<AppState>()(
  persist(
    immer((...args) => ({
      ...createUISlice(...args),
      ...createFiltersSlice(...args),
      ...createQuizSlice(...args),
      ...createSfideSlice(...args),
      ...createVersionSlice(...args),
    })),
    {
      name: 'patentify-native-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        collapsedSections: state.collapsedSections,
        esercitazione: state.esercitazione,
        erroriRicorrenti: state.erroriRicorrenti,
        statistiche: state.statistiche,
        classifiche: state.classifiche,
        activeQuiz: state.activeQuiz,
        preferences: state.preferences,
        activeSfida: state.activeSfida,
        sfideShowOnlyFollowed: state.sfideShowOnlyFollowed,
        currentVersion: state.currentVersion,
      }),
      merge: (persistedState, currentState) => {
        const persisted = (persistedState ?? {}) as Partial<AppState>;

        const mergedErroriRicorrenti: ErroriRicorrentiFilters = {
          ...erroriRicorrentiDefaults,
          ...(persisted.erroriRicorrenti ?? {}),
        };

        const mergedStatistiche: StatisticheFilters = {
          ...statisticheDefaults,
          ...(persisted.statistiche ?? {}),
        };

        const mergedClassifiche: ClassificheFilters = {
          ...classificheDefaults,
          ...(persisted.classifiche ?? {}),
        };

        return {
          ...currentState,
          collapsedSections: persisted.collapsedSections ?? currentState.collapsedSections,
          esercitazione: persisted.esercitazione ?? currentState.esercitazione,
          activeQuiz: persisted.activeQuiz ?? currentState.activeQuiz,
          preferences: persisted.preferences ?? currentState.preferences,
          activeSfida: persisted.activeSfida ?? currentState.activeSfida,
          sfideShowOnlyFollowed: persisted.sfideShowOnlyFollowed ?? currentState.sfideShowOnlyFollowed,
          erroriRicorrenti: mergedErroriRicorrenti,
          statistiche: mergedStatistiche,
          classifiche: mergedClassifiche,
          currentVersion: persisted.currentVersion ?? versionDefaults.currentVersion,
          updateAvailable: versionDefaults.updateAvailable,
        };
      },
    }
  )
);
