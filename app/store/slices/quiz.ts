/**
 * Quiz Slice - Gestione stato quiz attivo e preferenze.
 * Supporta ripresa sessione con timer persistente.
 */

import type { StateCreator } from 'zustand';
import type { Domanda } from '~/types/db';
import type { AppState, QuizSlice, QuizPreferences } from '../types';

/**
 * Valori default per le preferenze quiz.
 */
export const quizPreferencesDefaults: QuizPreferences = {
  quizType: 'standard',
  boostErrors: false,
  boostSkull: false,
};

/**
 * Crea lo slice Quiz con Immer.
 */
export const createQuizSlice: StateCreator<
  AppState,
  [['zustand/immer', never]],
  [],
  QuizSlice
> = (set) => ({
  activeQuiz: null,
  preferences: { ...quizPreferencesDefaults },

  startQuiz: (quizId: number): void => {
    set((state) => {
      state.activeQuiz = {
        quizId,
        startedAt: Date.now(),
        currentPos: 1,
        correctCount: 0,
        wrongCount: 0,
        wrongAnswers: [],
      };
    });
  },

  updateQuizProgress: (
    pos: number,
    correctCount: number,
    wrongCount: number,
    wrongAnswer?: { domanda: Domanda; answerGiven: string }
  ): void => {
    set((state) => {
      if (state.activeQuiz) {
        state.activeQuiz.currentPos = pos;
        state.activeQuiz.correctCount = correctCount;
        state.activeQuiz.wrongCount = wrongCount;
        if (wrongAnswer) {
          state.activeQuiz.wrongAnswers.push(wrongAnswer);
        }
      }
    });
  },

  endQuiz: (): void => {
    set((state) => {
      state.activeQuiz = null;
    });
  },

  setQuizPreference: <K extends keyof QuizPreferences>(
    key: K,
    value: QuizPreferences[K]
  ): void => {
    set((state) => {
      state.preferences[key] = value;
    });
  },
});
