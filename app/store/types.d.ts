/**
 * Tipi per lo store Zustand globale.
 * Organizzato in slices per separare le responsabilità.
 */

import type { QuizType, TimePeriod, Domanda } from '~/types/db';

// ============================================================
// UI Slice - Stato UI (sezioni collapsible)
// ============================================================

/**
 * Slice per lo stato UI persistente.
 * Gestisce l'apertura/chiusura delle sezioni collapsible.
 */
export interface UISlice {
  /** Mappa chiave sezione → stato aperto/chiuso */
  collapsedSections: Record<string, boolean>;
  /** Toggle dello stato di una sezione */
  toggleSection: (key: string) => void;
  /** Imposta lo stato di una sezione */
  setSection: (key: string, open: boolean) => void;
}

// ============================================================
// Filters Slice - Filtri utente
// ============================================================

/**
 * Stato filtri per la sezione Esercitazione.
 */
export interface EsercitazioneFilters {
  search: string;
  irePlus: string;
  ambiguita: string;
  difficolta: string;
  titoloQuesito: string;
  /** Se true, risultati con ORDER BY RANDOM(); se false, ordine naturale DB (d.id) */
  ordinamentoCasuale: boolean;
}

/** Tipo di grafico per la sezione Errori Ricorrenti */
export type ErroriRicorrentiChartType = 'pie' | 'bar';

/**
 * Stato filtri per la sezione Errori Ricorrenti.
 */
export interface ErroriRicorrentiFilters {
  period: TimePeriod;
  /** Tipo di grafico selezionato (default: 'pie') */
  chartType: ErroriRicorrentiChartType;
}

/**
 * Stato filtri per la sezione Statistiche Quiz.
 */
export interface StatisticheFilters {
  period: TimePeriod;
  /** Tipo di grafico selezionato (default: 'pie') */
  chartType: ErroriRicorrentiChartType;
}

/**
 * Slice per i filtri utente persistenti.
 */
export interface FiltersSlice {
  /** Filtri esercitazione */
  esercitazione: EsercitazioneFilters;
  /** Filtri errori ricorrenti */
  erroriRicorrenti: ErroriRicorrentiFilters;
  /** Filtri statistiche quiz */
  statistiche: StatisticheFilters;
  /** Aggiorna un filtro esercitazione */
  setEsercitazioneFilter: <K extends keyof EsercitazioneFilters>(
    key: K,
    value: EsercitazioneFilters[K]
  ) => void;
  /** Reset filtri esercitazione ai valori default */
  resetEsercitazioneFilters: () => void;
  /** Aggiorna il periodo errori ricorrenti */
  setErroriRicorrentiPeriod: (period: TimePeriod) => void;
  /** Aggiorna il tipo di grafico errori ricorrenti */
  setErroriRicorrentiChartType: (chartType: ErroriRicorrentiChartType) => void;
  /** Toggle del tipo di grafico errori ricorrenti */
  toggleErroriRicorrentiChartType: () => void;
  /** Aggiorna il periodo statistiche */
  setStatistichePeriod: (period: TimePeriod) => void;
  /** Aggiorna il tipo di grafico statistiche */
  setStatisticheChartType: (chartType: ErroriRicorrentiChartType) => void;
  /** Toggle del tipo di grafico statistiche */
  toggleStatisticheChartType: () => void;
}

// ============================================================
// Quiz Slice - Stato quiz attivo e preferenze
// ============================================================

/**
 * Stato del quiz (playing, finished, abandoned, time_expired).
 */
export type QuizStatus = 'playing' | 'finished' | 'abandoned' | 'time_expired';

/**
 * Stato del quiz attivo (persistito per ripresa sessione).
 */
export interface ActiveQuizState {
  /** ID del quiz nel database */
  quizId: number;
  /** Timestamp Unix ms di inizio quiz (per calcolo tempo trascorso) */
  startedAt: number;
  /** Posizione corrente (1-based) */
  currentPos: number;
  /** Conteggio risposte corrette */
  correctCount: number;
  /** Conteggio risposte errate */
  wrongCount: number;
  /** Domande sbagliate con risposta data */
  wrongAnswers: Array<{
    domanda: Domanda;
    answerGiven: string;
  }>;
  /** Stato corrente del quiz (persistito per ripresa dopo refresh) */
  status: QuizStatus;
  /** Tempo totale trascorso in secondi al completamento */
  finalTotalSeconds?: number;
}

/**
 * Preferenze per la generazione quiz.
 */
export interface QuizPreferences {
  quizType: QuizType;
  boostErrors: boolean;
  boostSkull: boolean;
}

/**
 * Slice per lo stato quiz e preferenze.
 */
export interface QuizSlice {
  /** Quiz attivo (null se nessun quiz in corso) */
  activeQuiz: ActiveQuizState | null;
  /** Preferenze per la generazione quiz */
  preferences: QuizPreferences;
  /** Inizia un nuovo quiz */
  startQuiz: (quizId: number) => void;
  /** Aggiorna il progresso del quiz */
  updateQuizProgress: (
    pos: number,
    correctCount: number,
    wrongCount: number,
    wrongAnswer?: { domanda: Domanda; answerGiven: string }
  ) => void;
  /** Aggiorna lo stato del quiz (finished, abandoned, time_expired) */
  setQuizStatus: (status: QuizStatus) => void;
  /** Salva il tempo totale trascorso al completamento */
  setQuizFinalTime: (seconds: number) => void;
  /** Termina il quiz e resetta lo stato (quando utente torna al form) */
  endQuiz: () => void;
  /** Aggiorna una preferenza quiz */
  setQuizPreference: <K extends keyof QuizPreferences>(
    key: K,
    value: QuizPreferences[K]
  ) => void;
}

// ============================================================
// App State - Combinazione di tutti gli slices
// ============================================================

/**
 * Stato globale dell'applicazione.
 * Combinazione di tutti gli slices.
 */
export type AppState = UISlice & FiltersSlice & QuizSlice;

/**
 * Valori di default per lo stato iniziale.
 */
export interface AppStateDefaults {
  ui: {
    collapsedSections: Record<string, boolean>;
  };
  filters: {
    esercitazione: EsercitazioneFilters;
    erroriRicorrenti: ErroriRicorrentiFilters;
    statistiche: StatisticheFilters;
  };
  quiz: {
    activeQuiz: ActiveQuizState | null;
    preferences: QuizPreferences;
  };
}
