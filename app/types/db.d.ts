/**
 * Tipi per le tabelle NeonDB (introspezionati via Neon MCP).
 * - utente: schema public (sincronizzato da Clerk webhook)
 * - domande, quiz, user_domanda_attempt: schema public
 *
 * Autenticazione gestita da Clerk. user_id nelle tabelle è l'ID Clerk (text).
 */

/** Schema public - utente sincronizzato da Clerk webhook */
export interface Utente {
  /** ID Clerk (es. user_2xxx) - PK */
  id: string;
  name: string;
  email: string;
  email_verified: boolean;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

/** Tabella public.domande */
export interface Domanda {
  id: number;
  ire_plus: number | null;
  domanda: string | null;
  risposta: string | null;
  ambiguita: number | null;
  ambiguita_triggers: string | null;
  difficolta: number | null;
  difficolta_fattori: string | null;
  titolo_quesito: string | null;
  id_quesito: string | null;
  ire: number | null;
  immagine_path: string | null;
}

/** Status ammessi per quiz (CHECK constraint) */
export type QuizStatus = 'in_progress' | 'completed' | 'abandoned';

/** Tipo di quiz (CHECK constraint) */
export type QuizType = 'standard' | 'difficile' | 'ambiguo';

/** Tabella public.quiz */
export interface Quiz {
  id: number;
  /** ID Clerk (FK a utente.id) */
  user_id: string;
  created_at: string;
  completed_at: string | null;
  status: QuizStatus;
  /** Tipo di quiz: standard, difficile, ambiguo */
  quiz_type: QuizType;
  /** Se true, preferisce domande già sbagliate dall'utente */
  boost_errors: boolean;
  /** Se true, preferisce domande marcate come skull */
  boost_skull: boolean;
  /** Esito del quiz: true = promosso, false = bocciato, null = non completato */
  promosso: boolean | null;
}

/** Tabella public.user_domanda_attempt */
export interface UserDomandaAttempt {
  id: number;
  /** ID Clerk (FK a utente.id) */
  user_id: string;
  domanda_id: number;
  quiz_id: number | null;
  /** Posizione nel quiz (1-40), richiesto se quiz_id è valorizzato */
  quiz_pos: number | null;
  asked_at: string;
  answered_at: string | null;
  answer_given: string | null;
  is_correct: boolean | null;
}

/** Tabella public.user_domanda_skull */
export interface UserDomandaSkull {
  /** ID Clerk (FK a utente.id) */
  user_id: string;
  /** FK a domande.id */
  domanda_id: number;
  inserted_at: string;
}

/** Domanda con flag skull (usato quando la query fa JOIN con user_domanda_skull) */
export interface DomandaWithSkull extends Domanda {
  skull: boolean;
}

// ============================================================
// Tipi per parametri e risposte delle Server Functions
// ============================================================

/** Parametri per getDomandeEsercitazione */
export interface GetDomandeParams {
  search?: string;
  ire_plus?: number;
  ambiguita?: number;
  difficolta?: number;
  titolo_quesito?: string;
  limit?: number;
  offset?: number;
}

/** Parametri per getAmbitiDistinct */
export interface GetAmbitiParams {
  ttlMs?: number;
}

/** Parametri per checkResponse */
export interface CheckResponseParams {
  domanda_id: number;
  answer_given: string;
}

/** Risultato di checkResponse */
export interface CheckResponseResult {
  is_correct: boolean;
}

/** Parametri per trackAttempt (user_id ottenuto server-side via Clerk auth()) */
export interface TrackAttemptParams {
  domanda_id: number;
  answer_given: string;
  /** Se forniti quiz_id e quiz_pos, fa UPDATE invece di INSERT */
  quiz_id?: number;
  /** Posizione della domanda nel quiz (1-40) */
  quiz_pos?: number;
}

/** Risultato di trackAttempt */
export interface TrackAttemptResult {
  success: boolean;
  is_correct: boolean;
  attempt_id?: number;
}

/** Parametri per domandaUserStats (user_id ottenuto server-side via Clerk auth()) */
export interface DomandaUserStatsParams {
  domanda_id: number;
}

/** Risultato di domandaUserStats */
export interface DomandaUserStatsResult {
  total: number;
  correct: number;
  wrong: number;
}

/** Parametri per addSkull/removeSkull (user_id ottenuto server-side via Clerk auth()) */
export interface SkullParams {
  domanda_id: number;
}

/** Risultato di addSkull/removeSkull */
export interface SkullResult {
  success: boolean;
}

// ============================================================
// Tipi per Server Functions Quiz (simulazione)
// ============================================================

/** Parametri per generateQuiz (user_id ottenuto server-side via Clerk auth()) */
export interface GenerateQuizParams {
  quiz_type: QuizType;
  boost_errors: boolean;
  boost_skull: boolean;
}

/** Risultato di generateQuiz */
export interface GenerateQuizResult {
  quiz_id: number;
}

/** Parametri per getQuizDomanda (user_id ottenuto server-side via Clerk auth()) */
export interface GetQuizDomandaParams {
  quiz_id: number;
  quiz_pos: number;
}

/** Risultato di getQuizDomanda */
export interface GetQuizDomandaResult {
  domanda: Domanda;
  domanda_id: number;
}

/** Parametri per abortQuiz (user_id ottenuto server-side via Clerk auth()) */
export interface AbortQuizParams {
  quiz_id: number;
}

/** Risultato di abortQuiz */
export interface AbortQuizResult {
  success: boolean;
}

/** Parametri per completeQuiz (user_id ottenuto server-side via Clerk auth()) */
export interface CompleteQuizParams {
  quiz_id: number;
}

/** Risultato di completeQuiz */
export interface CompleteQuizResult {
  success: boolean;
  /** Esito del quiz: true = promosso, false = bocciato */
  promosso: boolean;
  /** Numero di errori commessi */
  errors: number;
  /** Numero di risposte corrette */
  correct: number;
}

/** Risultato di getQuizBoostCounts */
export interface GetQuizBoostCountsResult {
  /** Numero di domande distinte sbagliate dall'utente */
  errors_count: number;
  /** Numero di domande marcate come skull dall'utente */
  skull_count: number;
}

// ============================================================
// Tipi per getFullQuiz (condivisione quiz)
// ============================================================

/** Parametri per getFullQuiz (NON richiede autenticazione per permettere condivisione) */
export interface GetFullQuizParams {
  quiz_id: number;
}

/** Singola domanda del quiz con risposta data */
export interface QuizDomandaWithAnswer {
  /** Posizione della domanda nel quiz (1-40) */
  quiz_pos: number;
  /** Dati della domanda */
  domanda: Domanda;
  /** Risposta data dall'utente (null se non risposta) */
  answer_given: string | null;
  /** Se la risposta era corretta (null se non risposta) */
  is_correct: boolean | null;
}

/** Risultato di getFullQuiz */
export interface GetFullQuizResult {
  /** ID del quiz */
  quiz_id: number;
  /** Tipo di quiz */
  quiz_type: QuizType;
  /** Status del quiz */
  status: QuizStatus;
  /** Esito del quiz (null se non completato) */
  promosso: boolean | null;
  /** Data di creazione */
  created_at: string;
  /** Data di completamento (null se non completato) */
  completed_at: string | null;
  /** Array delle domande con risposte */
  domande: QuizDomandaWithAnswer[];
}

// ============================================================
// Tipi per Errori Ricorrenti
// ============================================================

/** Periodo temporale per filtri errori ricorrenti */
export type TimePeriod = 'oggi' | 'settimana' | 'mese' | 'tutti';

/** Parametri per le server functions errori ricorrenti */
export interface ErroriRicorrentiParams {
  period: TimePeriod;
  limit?: number;
  offset?: number;
}

/** Risultato di getErroriStats */
export interface ErroriStatsResult {
  /** Percentuale domande uniche risposte / totale domande DB */
  copertura: number;
  /** Numero totale risposte date (non uniche) */
  totale_risposte: number;
  /** Numero risposte corrette (non uniche) */
  risposte_corrette: number;
  /** Numero risposte errate (non uniche) */
  risposte_errate: number;
  /** Numero domande uniche marcate skull */
  skull_count: number;
  /** Numero domande uniche a cui l'utente ha risposto */
  domande_uniche_risposte: number;
  /** Totale domande nel DB */
  totale_domande_db: number;
}

/** Categoria con conteggio errori */
export interface CategoriaErrori {
  titolo_quesito: string;
  errori_count: number;
  /** Percentuale errori rispetto al totale risposte */
  percentuale: number;
}

/** Domanda con conteggio errori e ultima risposta data */
export interface DomandaConErrori extends Domanda {
  /** Numero di volte che l'utente ha sbagliato questa domanda */
  errori_count: number;
  /** Ultima risposta data dall'utente */
  ultima_risposta: string | null;
  /** Flag skull */
  skull: boolean;
}

/** Domanda con conteggio risposte corrette */
export interface DomandaConEsatte extends Domanda {
  /** Numero di volte che l'utente ha risposto correttamente */
  esatte_count: number;
  /** Ultima risposta data dall'utente */
  ultima_risposta: string | null;
  /** Flag skull */
  skull: boolean;
}

/** Domanda skull con data inserimento */
export interface DomandaSkull extends Domanda {
  /** Data in cui è stata marcata come skull */
  inserted_at: string;
  /** Ultima risposta data dall'utente (se presente) */
  ultima_risposta: string | null;
  /** Flag skull (sempre true per questo tipo) */
  skull: boolean;
}

/** Risultato di getTopCategorieErrori */
export interface TopCategorieErroriResult {
  categorie: CategoriaErrori[];
}

/** Risultato di getDomandeMaggioriErrori / getDomandeSbagliate */
export interface DomandeErroriResult {
  domande: DomandaConErrori[];
  hasMore: boolean;
}

/** Risultato di getDomandeMaggioriEsatte */
export interface DomandeEsatteResult {
  domande: DomandaConEsatte[];
  hasMore: boolean;
}

/** Risultato di getDomandeSkull */
export interface DomandeSkullResult {
  domande: DomandaSkull[];
  hasMore: boolean;
}

/** Risultato di getAllCategorieErrori */
export interface AllCategorieErroriResult {
  categorie: CategoriaErrori[];
}

/** Granularità temporale per timeline */
export type TimeGranularity = 'hour' | 'day' | 'week' | 'month';

/** Singolo punto dati timeline */
export interface TimelineDataPoint {
  /** Label per asse X (es. "14:00", "Lun", "Sett 1") */
  label: string;
  /** ISO string per ordinamento */
  timestamp: string;
  /** Numero totale risposte */
  totale: number;
  /** Numero risposte corrette */
  corrette: number;
  /** Numero risposte errate */
  errate: number;
}

/** Risultato di getTimelineStats */
export interface TimelineStatsResult {
  /** Granularità dei dati */
  granularity: TimeGranularity;
  /** Punti dati della timeline */
  data: TimelineDataPoint[];
}

// ============================================================
// Tipi per Statistiche Quiz
// ============================================================

/** Risultato di getQuizStats */
export interface QuizStatsResult {
  /** Numero totale di quiz completati nel periodo */
  quiz_svolti: number;
  /** Numero di quiz con esito positivo (promosso) */
  quiz_promossi: number;
  /** Numero di quiz con esito negativo (bocciato) */
  quiz_bocciati: number;
}

/** Singola riga per tabella quiz */
export interface QuizTableRow {
  /** ID del quiz */
  quiz_id: number;
  /** Data/ora di completamento */
  completed_at: string;
  /** Numero di errori commessi nel quiz */
  errori: number;
  /** Esito del quiz: true = promosso, false = bocciato */
  promosso: boolean;
}

/** Risultato di getQuizList */
export interface QuizListResult {
  /** Lista dei quiz */
  quiz: QuizTableRow[];
  /** Se ci sono altri quiz da caricare */
  hasMore: boolean;
}

/** Singolo punto dati timeline per quiz */
export interface QuizTimelineDataPoint {
  /** Label per asse X (es. "14:00", "Lun", "Sett 1") */
  label: string;
  /** ISO string per ordinamento */
  timestamp: string;
  /** Numero totale quiz completati */
  totale: number;
  /** Numero quiz promossi */
  promossi: number;
  /** Numero quiz bocciati */
  bocciati: number;
}

/** Risultato di getQuizTimeline */
export interface QuizTimelineStatsResult {
  /** Granularità dei dati */
  granularity: TimeGranularity;
  /** Punti dati della timeline */
  data: QuizTimelineDataPoint[];
}
