import type { StateCreator } from 'zustand';
import type {} from 'zustand/middleware/immer';
import type {
  AppState,
  SfideSlice,
  ActiveSfidaState,
  IncomingChallengeState,
  PendingRematchState,
  PendingSfidaCompletionState,
} from '../types';

export const createSfideSlice: StateCreator<
  AppState,
  [['zustand/immer', never]],
  [],
  SfideSlice
> = (set) => ({
  activeSfida: null,
  incomingChallenge: null,
  pendingRematch: null,
  sfideShowOnlyFollowed: false,
  waitingForGameStart: false,
  pendingSfidaCompletion: null,

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
    challenge: IncomingChallengeState | null
  ): void => {
    set((state) => {
      state.incomingChallenge = challenge;
    });
  },

  setPendingRematch: (
    rematch: PendingRematchState | null
  ): void => {
    set((state) => {
      state.pendingRematch = rematch;
    });
  },

  toggleSfideFollowedFilter: (): void => {
    set((state) => {
      state.sfideShowOnlyFollowed = !state.sfideShowOnlyFollowed;
    });
  },

  setWaitingForGameStart: (v: boolean): void => {
    set((state) => {
      state.waitingForGameStart = v;
    });
  },

  setPendingSfidaCompletion: (
    data: PendingSfidaCompletionState | null
  ): void => {
    set((state) => {
      state.pendingSfidaCompletion = data;
    });
  },
});
