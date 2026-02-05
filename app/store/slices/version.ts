/**
 * Version Slice - Gestione versione app e aggiornamenti.
 * Rileva quando è disponibile una nuova versione dell'applicazione.
 */

import type { StateCreator } from 'zustand';
import type { AppState, VersionSlice } from '../types';

/**
 * Valori default per lo stato versione.
 */
export const versionDefaults = {
  currentVersion: null as string | null,
  updateAvailable: false,
};

/**
 * Crea lo slice Version con Immer.
 */
export const createVersionSlice: StateCreator<
  AppState,
  [['zustand/immer', never]],
  [],
  VersionSlice
> = (set) => ({
  currentVersion: versionDefaults.currentVersion,
  updateAvailable: versionDefaults.updateAvailable,

  setCurrentVersion: (version: string): void => {
    set((state) => {
      state.currentVersion = version;
    });
  },

  checkForUpdate: (serverVersion: string): void => {
    set((state) => {
      // Se non abbiamo ancora una versione salvata, la salviamo senza mostrare update
      if (state.currentVersion === null) {
        state.currentVersion = serverVersion;
        return;
      }

      // Se la versione del server è diversa da quella salvata, c'è un aggiornamento
      if (state.currentVersion !== serverVersion) {
        state.updateAvailable = true;
        // IMPORTANTE: Aggiorna currentVersion alla nuova versione così che dopo
        // il reload non venga rilevato nuovamente un aggiornamento
        state.currentVersion = serverVersion;
      }
    });
  },

  resetUpdateAvailable: (): void => {
    set((state) => {
      state.updateAvailable = false;
    });
  },
});
