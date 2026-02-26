import type { QuizType, TimePeriod, Domanda } from '../types/db';
import type { SfidaTier } from '../constants';

export interface UISlice {
  collapsedSections: Record<string, boolean>;
  toggleSection: (key: string) => void;
  setSection: (key: string, open: boolean) => void;
}

export interface EsercitazioneFilters {
  search: string;
  irePlus: string;
  ambiguita: string;
  difficolta: string;
  titoloQuesito: string;
  ordinamentoCasuale: boolean;
}

export type ErroriRicorrentiChartType = 'pie' | 'bar';

export interface ErroriRicorrentiFilters {
  period: TimePeriod;
  chartType: ErroriRicorrentiChartType | null;
}

export interface StatisticheFilters {
  period: TimePeriod;
  chartType: ErroriRicorrentiChartType | null;
}

export interface ClassificheFilters {
  period: TimePeriod;
  view: 'quiz' | 'risposte';
  scope: 'generale' | 'seguiti';
  quizSortField: 'promosso' | 'bocciato';
  quizSortDir: 'asc' | 'desc';
  risposteSortField: 'copertura' | 'sbagliate' | 'corrette';
  risposteSortDir: 'asc' | 'desc';
}

export interface FiltersSlice {
  esercitazione: EsercitazioneFilters;
  erroriRicorrenti: ErroriRicorrentiFilters;
  statistiche: StatisticheFilters;
  classifiche: ClassificheFilters;
  setEsercitazioneFilter: <K extends keyof EsercitazioneFilters>(
    key: K,
    value: EsercitazioneFilters[K]
  ) => void;
  resetEsercitazioneFilters: () => void;
  setErroriRicorrentiPeriod: (period: TimePeriod) => void;
  setErroriRicorrentiChartType: (chartType: ErroriRicorrentiChartType) => void;
  toggleErroriRicorrentiChartType: (currentEffective: 'pie' | 'bar') => void;
  setStatistichePeriod: (period: TimePeriod) => void;
  setStatisticheChartType: (chartType: ErroriRicorrentiChartType) => void;
  toggleStatisticheChartType: (currentEffective: 'pie' | 'bar') => void;
  setClassifichePeriod: (period: TimePeriod) => void;
  setClassificheView: (view: ClassificheFilters['view']) => void;
  setClassificheScope: (scope: ClassificheFilters['scope']) => void;
  setClassificheQuizSort: (
    field: ClassificheFilters['quizSortField'],
    dir: ClassificheFilters['quizSortDir']
  ) => void;
  setClassificheRisposteSort: (
    field: ClassificheFilters['risposteSortField'],
    dir: ClassificheFilters['risposteSortDir']
  ) => void;
}

export type QuizStatus = 'playing' | 'finished' | 'abandoned' | 'time_expired';

export interface ActiveQuizState {
  quizId: number;
  startedAt: number;
  currentPos: number;
  correctCount: number;
  wrongCount: number;
  wrongAnswers: Array<{
    domanda: Domanda;
    answerGiven: string;
  }>;
  status: QuizStatus;
  finalTotalSeconds?: number;
}

export interface QuizPreferences {
  quizType: QuizType;
  boostErrors: boolean;
  boostSkull: boolean;
}

export interface QuizSlice {
  activeQuiz: ActiveQuizState | null;
  preferences: QuizPreferences;
  startQuiz: (quizId: number) => void;
  updateQuizProgress: (
    pos: number,
    correctCount: number,
    wrongCount: number,
    wrongAnswer?: { domanda: Domanda; answerGiven: string }
  ) => void;
  setQuizStatus: (status: QuizStatus) => void;
  setQuizFinalTime: (seconds: number) => void;
  endQuiz: () => void;
  setQuizPreference: <K extends keyof QuizPreferences>(
    key: K,
    value: QuizPreferences[K]
  ) => void;
}

export interface VersionSlice {
  currentVersion: string | null;
  updateAvailable: boolean;
  setCurrentVersion: (version: string) => void;
  checkForUpdate: (serverVersion: string) => void;
  resetUpdateAvailable: () => void;
}

export interface IncomingChallengeState {
  challengeId: string;
  challengerId: string;
  challengerName: string;
  challengerImageUrl: string | null;
  receivedAt: number;
  tier: SfidaTier;
}

export interface ActiveSfidaState {
  sfidaId: number;
  quizId: number;
  opponentId: string;
  opponentName: string;
  gameStartedAt: string;
  opponentPos: number;
  opponentFinished: boolean;
}

export interface PendingRematchState {
  opponentId: string;
  opponentName: string;
}

export interface PendingSfidaCompletionState {
  sfidaId: number;
  opponentName: string;
  sfidaType: SfidaTier;
  questionCount: number;
  durationSeconds: number;
}

export interface SfideSlice {
  activeSfida: ActiveSfidaState | null;
  incomingChallenge: IncomingChallengeState | null;
  pendingRematch: PendingRematchState | null;
  sfideShowOnlyFollowed: boolean;
  waitingForGameStart: boolean;
  pendingSfidaCompletion: PendingSfidaCompletionState | null;
  startSfida: (sfida: ActiveSfidaState) => void;
  updateOpponentProgress: (pos: number) => void;
  setOpponentFinished: () => void;
  endSfida: () => void;
  setIncomingChallenge: (challenge: IncomingChallengeState | null) => void;
  setPendingRematch: (rematch: PendingRematchState | null) => void;
  toggleSfideFollowedFilter: () => void;
  setWaitingForGameStart: (v: boolean) => void;
  setPendingSfidaCompletion: (data: PendingSfidaCompletionState | null) => void;
}

export type AppState = UISlice & FiltersSlice & QuizSlice & VersionSlice & SfideSlice;

export interface AppStateDefaults {
  ui: {
    collapsedSections: Record<string, boolean>;
  };
  filters: {
    esercitazione: EsercitazioneFilters;
    erroriRicorrenti: ErroriRicorrentiFilters;
    statistiche: StatisticheFilters;
    classifiche: ClassificheFilters;
  };
  quiz: {
    activeQuiz: ActiveQuizState | null;
    preferences: QuizPreferences;
  };
  version: {
    currentVersion: string | null;
    updateAvailable: boolean;
  };
  sfide: {
    activeSfida: ActiveSfidaState | null;
    incomingChallenge: IncomingChallengeState | null;
    pendingRematch: PendingRematchState | null;
    sfideShowOnlyFollowed: boolean;
    waitingForGameStart: boolean;
    pendingSfidaCompletion: PendingSfidaCompletionState | null;
  };
}
