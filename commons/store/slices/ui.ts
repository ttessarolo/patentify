import type { StateCreator } from 'zustand';
import type {} from 'zustand/middleware/immer';
import type { AppState, UISlice } from '../types';

export const uiDefaults = {
  collapsedSections: {} as Record<string, boolean>,
};

export const createUISlice: StateCreator<
  AppState,
  [],
  [],
  UISlice
> = (set) => ({
  collapsedSections: uiDefaults.collapsedSections,

  toggleSection: (key: string): void => {
    set((state) => {
      const current = state.collapsedSections[key] ?? false;
      return {
        collapsedSections: {
          ...state.collapsedSections,
          [key]: !current,
        },
      };
    });
  },

  setSection: (key: string, open: boolean): void => {
    set((state) => {
      return {
        collapsedSections: {
          ...state.collapsedSections,
          [key]: open,
        },
      };
    });
  },
});
