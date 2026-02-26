import type { StateCreator } from 'zustand';
import type {} from 'zustand/middleware/immer';
import type { AppState, VersionSlice } from '../types';

export const versionDefaults = {
  currentVersion: null as string | null,
  updateAvailable: false,
};

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
      if (state.currentVersion === null) {
        state.currentVersion = serverVersion;
        return;
      }

      if (state.currentVersion !== serverVersion) {
        state.updateAvailable = true;
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
