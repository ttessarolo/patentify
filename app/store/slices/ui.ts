/**
 * UI Slice - Gestione stato UI persistente.
 * Sezioni collapsible, visibility filtri, etc.
 */

import type { StateCreator } from 'zustand';
import type { AppState, UISlice } from '../types';

/**
 * Valori default per lo stato UI.
 */
export const uiDefaults = {
  collapsedSections: {} as Record<string, boolean>,
};

/**
 * Crea lo slice UI con Immer.
 */
export const createUISlice: StateCreator<
  AppState,
  [['zustand/immer', never]],
  [],
  UISlice
> = (set) => ({
  collapsedSections: uiDefaults.collapsedSections,

  toggleSection: (key: string): void => {
    set((state) => {
      const current = state.collapsedSections[key] ?? false;
      state.collapsedSections[key] = !current;
    });
  },

  setSection: (key: string, open: boolean): void => {
    set((state) => {
      state.collapsedSections[key] = open;
    });
  },
});
