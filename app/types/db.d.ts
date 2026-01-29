/**
 * Tipi per le tabelle NeonDB (introspezionati via Neon MCP).
 * - user, session: schema neon_auth (Neon Auth managed)
 * - domande, quiz, user_domanda_attempt: schema public
 */

/** Schema neon_auth - utente gestito da Neon Auth */
export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: string;
  updatedAt: string;
  role: string | null;
  banned: boolean | null;
  banReason: string | null;
  banExpires: string | null;
}

/** Schema neon_auth - sessione Neon Auth */
export interface Session {
  id: string;
  expiresAt: string;
  token: string;
  createdAt: string;
  updatedAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  userId: string;
  impersonatedBy: string | null;
  activeOrganizationId: string | null;
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
  user_id: string;
  created_at: string;
  completed_at: string | null;
  status: QuizStatus;
}

/** Tabella public.user_domanda_attempt */
export interface UserDomandaAttempt {
  id: number;
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

/** Parametri per trackAttempt (user_id obbligatorio, passato dal client) */
export interface TrackAttemptParams {
  domanda_id: number;
  answer_given: string;
  user_id: string;
}

/** Risultato di trackAttempt */
export interface TrackAttemptResult {
  success: boolean;
  is_correct: boolean;
  attempt_id?: number;
}
