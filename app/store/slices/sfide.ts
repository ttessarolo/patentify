/**
 * Sfide Slice - Gestione stato sfide multiplayer.
 * Traccia sfida attiva, sfida in arrivo e filtri.
 */

import type { StateCreator } from 'zustand';
import type {
  AppState,
  SfideSlice,
  ActiveSfidaState,
  IncomingChallengeState,
} from '../types';

/**
 * Crea lo slice Sfide con Immer.
 */
export const createSfideSlice: StateCreator<
  AppState,
  [['zustand/immer', never]],
  [],
  SfideSlice
> = (set) => ({
  activeSfida: null,
  incomingChallenge: null,
  sfideShowOnlyFollowed: false,

  startSfida: (sfida: ActiveSfidaState): void => {
    set((state) => {
      state.activeSfida = sfida;
    });
  },

  updateOpponentProgress: (pos: number): void => {
    set((state) => {
      if (state.activeSfida) {
        state.activeSfida.opponentPos = pos;
      }
    });
  },

  setOpponentFinished: (): void => {
    set((state) => {
      if (state.activeSfida) {
        state.activeSfida.opponentFinished = true;
      }
    });
  },

  endSfida: (): void => {
    set((state) => {
      state.activeSfida = null;
    });
  },

  setIncomingChallenge: (
    challenge: IncomingChallengeState | null,
  ): void => {
    set((state) => {
      state.incomingChallenge = challenge;
    });
  },

  toggleSfideFollowedFilter: (): void => {
    set((state) => {
      state.sfideShowOnlyFollowed = !state.sfideShowOnlyFollowed;
    });
  },
});
