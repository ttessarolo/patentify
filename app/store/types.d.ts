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

/**
 * Stato filtri per la sezione Errori Ricorrenti.
 */
export interface ErroriRicorrentiFilters {
  period: TimePeriod;
}

/**
 * Slice per i filtri utente persistenti.
 */
export interface FiltersSlice {
  /** Filtri esercitazione */
  esercitazione: EsercitazioneFilters;
  /** Filtri errori ricorrenti */
  erroriRicorrenti: ErroriRicorrentiFilters;
  /** Aggiorna un filtro esercitazione */
  setEsercitazioneFilter: <K extends keyof EsercitazioneFilters>(
    key: K,
    value: EsercitazioneFilters[K]
  ) => void;
  /** Reset filtri esercitazione ai valori default */
  resetEsercitazioneFilters: () => void;
  /** Aggiorna il periodo errori ricorrenti */
  setErroriRicorrentiPeriod: (period: TimePeriod) => void;
}

// ============================================================
// Quiz Slice - Stato quiz attivo e preferenze
// ============================================================

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
  /** Termina il quiz (completato, abbandonato, tempo scaduto) */
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
  };
  quiz: {
    activeQuiz: ActiveQuizState | null;
    preferences: QuizPreferences;
  };
}
