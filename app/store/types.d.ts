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
 * Stato filtri per la sezione Classifiche (Leaderboard).
 */
export interface ClassificheFilters {
  period: TimePeriod;
  /** Vista corrente: quiz o risposte */
  view: 'quiz' | 'risposte';
  /** Scope: tutti gli utenti o solo seguiti */
  scope: 'generale' | 'seguiti';
  /** Campo di ordinamento per la classifica quiz */
  quizSortField: 'promosso' | 'bocciato';
  /** Direzione ordinamento classifica quiz */
  quizSortDir: 'asc' | 'desc';
  /** Campo di ordinamento per la classifica risposte */
  risposteSortField: 'copertura' | 'sbagliate' | 'corrette';
  /** Direzione ordinamento classifica risposte */
  risposteSortDir: 'asc' | 'desc';
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
  /** Filtri classifiche (leaderboard) */
  classifiche: ClassificheFilters;
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
  /** Aggiorna il periodo classifiche */
  setClassifichePeriod: (period: TimePeriod) => void;
  /** Aggiorna la vista classifiche (quiz/risposte) */
  setClassificheView: (view: ClassificheFilters['view']) => void;
  /** Aggiorna lo scope classifiche (generale/seguiti) */
  setClassificheScope: (scope: ClassificheFilters['scope']) => void;
  /** Aggiorna ordinamento classifica quiz */
  setClassificheQuizSort: (
    field: ClassificheFilters['quizSortField'],
    dir: ClassificheFilters['quizSortDir']
  ) => void;
  /** Aggiorna ordinamento classifica risposte */
  setClassificheRisposteSort: (
    field: ClassificheFilters['risposteSortField'],
    dir: ClassificheFilters['risposteSortDir']
  ) => void;
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
// Version Slice - Gestione versione app e aggiornamenti
// ============================================================

/**
 * Slice per la gestione della versione dell'applicazione.
 * Usato per rilevare aggiornamenti disponibili.
 */
export interface VersionSlice {
  /** Versione corrente salvata al primo caricamento (null se non ancora caricata) */
  currentVersion: string | null;
  /** Flag che indica se è disponibile un aggiornamento */
  updateAvailable: boolean;
  /** Imposta la versione corrente */
  setCurrentVersion: (version: string) => void;
  /** Verifica se è disponibile un aggiornamento confrontando con la versione del server */
  checkForUpdate: (serverVersion: string) => void;
  /** Resetta il flag updateAvailable (usato dopo il reload) */
  resetUpdateAvailable: () => void;
}

// ============================================================
// Sfide Slice - Stato sfide multiplayer
// ============================================================

/**
 * Stato di una sfida in arrivo (per il dialog globale).
 */
export interface IncomingChallengeState {
  /** ID del canale Ably per rispondere */
  challengeId: string;
  /** ID Clerk dell'utente sfidante */
  challengerId: string;
  /** Nome/nickname dello sfidante */
  challengerName: string;
  /** URL immagine dello sfidante */
  challengerImageUrl: string | null;
  /** Timestamp di quando è arrivata la sfida */
  receivedAt: number;
}

/**
 * Stato della sfida attiva (durante il gioco).
 */
export interface ActiveSfidaState {
  /** ID della sfida nel database */
  sfidaId: number;
  /** ID del quiz assegnato a questo player */
  quizId: number;
  /** ID Clerk dell'avversario */
  opponentId: string;
  /** Nome/nickname dell'avversario */
  opponentName: string;
  /** Timestamp ISO di inizio partita (condiviso) */
  gameStartedAt: string;
  /** Posizione corrente dell'avversario (da Ably presence) */
  opponentPos: number;
  /** Se l'avversario ha finito */
  opponentFinished: boolean;
}

/**
 * Slice per lo stato sfide multiplayer.
 */
/**
 * Dati per un rematch pendente (sfida di nuovo).
 */
export interface PendingRematchState {
  /** ID Clerk dell'avversario */
  opponentId: string;
  /** Nome dell'avversario (per il dialog) */
  opponentName: string;
}

export interface SfideSlice {
  /** Sfida attiva (null se nessuna sfida in corso) */
  activeSfida: ActiveSfidaState | null;
  /** Sfida in arrivo (per il dialog globale) */
  incomingChallenge: IncomingChallengeState | null;
  /** Rematch pendente da triggerare nella pagina sfide */
  pendingRematch: PendingRematchState | null;
  /** Filtro: mostra solo utenti seguiti nella lista online */
  sfideShowOnlyFollowed: boolean;
  /** Inizia una nuova sfida */
  startSfida: (sfida: ActiveSfidaState) => void;
  /** Aggiorna il progresso dell'avversario */
  updateOpponentProgress: (pos: number) => void;
  /** Segna l'avversario come finito */
  setOpponentFinished: () => void;
  /** Termina la sfida e resetta lo stato */
  endSfida: () => void;
  /** Imposta una sfida in arrivo */
  setIncomingChallenge: (challenge: IncomingChallengeState | null) => void;
  /** Imposta un rematch pendente */
  setPendingRematch: (rematch: PendingRematchState | null) => void;
  /** Toggle filtro solo seguiti */
  toggleSfideFollowedFilter: () => void;
}

// ============================================================
// App State - Combinazione di tutti gli slices
// ============================================================

/**
 * Stato globale dell'applicazione.
 * Combinazione di tutti gli slices.
 */
export type AppState = UISlice & FiltersSlice & QuizSlice & VersionSlice & SfideSlice;

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
  };
}
