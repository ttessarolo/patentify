/**
 * Tipi per le tabelle NeonDB (introspezionati via Neon MCP).
 * - utente: schema public (sincronizzato da Clerk webhook)
 * - domande, quiz, user_domanda_attempt: schema public
 *
 * Autenticazione gestita da Clerk. user_id nelle tabelle è l'ID Clerk (text).
 *
 * NOTA: I tipi per parametri/risultati delle API sono ora definiti come Zod schemas
 * in `app/server/schemas/` e inferiti con `z.infer<>`. I tipi qui sotto sono solo
 * le interfacce delle tabelle DB (utili per reference e query raw).
 */

/** Ruoli utente disponibili */
export type UserRole = 'admin';

/** Schema public - utente sincronizzato da Clerk webhook */
export interface Utente {
  /** ID Clerk (es. user_2xxx) - PK */
  id: string;
  name: string;
  /** Username Clerk (può essere null se non impostato) */
  username: string | null;
  email: string;
  email_verified: boolean;
  image_url: string | null;
  /** Ruoli assegnati all'utente (es. ['admin']) */
  roles: UserRole[];
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
  /** Media ire_plus delle domande del quiz */
  ire_plus: number | null;
  /** Media ire delle domande del quiz */
  ire: number | null;
  /** Media difficoltà delle domande del quiz */
  difficolta: number | null;
  /** Media ambiguità delle domande del quiz */
  ambiguita: number | null;
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

/** Tabella public.amici - relazione follow unidirezionale */
export interface Amicizia {
  /** ID Clerk dell'utente che segue (FK a utente.id) */
  user_id: string;
  /** ID Clerk dell'utente seguito (FK a utente.id) */
  friend_id: string;
  created_at: string;
}

/** Status ammessi per sfida (CHECK constraint) */
export type SfidaStatus = 'in_progress' | 'completed' | 'aborted';

/** Tabella public.sfide */
export interface Sfida {
  id: number;
  created_at: string;
  /** ID Clerk del player A (chi ha lanciato la sfida) */
  player_a_id: string;
  /** ID Clerk del player B (chi ha accettato la sfida) */
  player_b_id: string;
  /** ID quiz assegnato al player A */
  quiz_id_a: number;
  /** ID quiz assegnato al player B */
  quiz_id_b: number;
  /** ID Clerk del vincitore (null se non completata) */
  winner_id: string | null;
  status: SfidaStatus;
  /** Risposte corrette player A */
  player_a_correct: number;
  /** Risposte corrette player B */
  player_b_correct: number;
  /** Se player A ha finito il quiz */
  player_a_finished: boolean;
  /** Se player B ha finito il quiz */
  player_b_finished: boolean;
  /** Timestamp inizio partita (condiviso per timer sincronizzato) */
  game_started_at: string;
}

/** Periodo temporale per filtri */
export type TimePeriod = 'oggi' | 'settimana' | 'mese' | 'tutti';

/** Domanda con flag skull */
export interface DomandaWithSkull extends Domanda {
  skull: boolean;
}
