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

/** Tabella public.quiz */
export interface Quiz {
  id: number;
  /** ID Clerk (FK a utente.id) */
  user_id: string;
  created_at: string;
  completed_at: string | null;
  status: QuizStatus;
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
