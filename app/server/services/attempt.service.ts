/**
 * Service per gestione tentativi di risposta e statistiche domanda.
 */

import { sql } from '~/lib/db';
import { verifyAnswer } from './answer.service';

// ============================================================
// trackAttempt
// ============================================================

export interface TrackAttemptInput {
  domanda_id: number;
  answer_given: string;
  quiz_id?: number;
  quiz_pos?: number;
  /** Per sfide non-full (Speed, Medium, Half): sfida_id al posto di quiz_id */
  sfida_id?: number;
}

export interface TrackAttemptOutput {
  success: boolean;
  is_correct: boolean;
  attempt_id?: number;
}

export async function trackAttempt(
  userId: string,
  input: TrackAttemptInput,
): Promise<TrackAttemptOutput> {
  const { domanda_id, answer_given, quiz_id, quiz_pos, sfida_id } = input;

  // Validazione: (quiz_id E quiz_pos) OPPURE (sfida_id E quiz_pos) per UPDATE, oppure nessuno per INSERT
  const hasQuiz = quiz_id !== undefined && quiz_pos !== undefined;
  const hasSfida = sfida_id !== undefined && quiz_pos !== undefined;
  if (hasQuiz && hasSfida) {
    throw new Error('Fornire quiz_id O sfida_id, non entrambi');
  }
  if (quiz_id !== undefined && quiz_pos === undefined) {
    throw new Error('quiz_pos richiesto quando quiz_id è fornito');
  }
  if (quiz_pos !== undefined && quiz_id === undefined && sfida_id === undefined) {
    throw new Error('quiz_pos richiede quiz_id o sfida_id');
  }

  const is_correct = await verifyAnswer(domanda_id, answer_given);
  const now = new Date().toISOString();

  // Se sfida_id e quiz_pos sono forniti (sfide non-full), fa UPDATE per sfida_id
  if (sfida_id !== undefined && quiz_pos !== undefined) {
    const existingRow = await sql`
      SELECT id FROM user_domanda_attempt
      WHERE sfida_id = ${sfida_id}
        AND quiz_pos = ${quiz_pos}
        AND user_id = ${userId}
        AND domanda_id = ${domanda_id}
    `;

    if (!existingRow || existingRow.length === 0) {
      throw new Error('Tentativo sfida non trovato');
    }

    const attempt_id = Number((existingRow[0] as { id: number | string }).id);

    await sql`
      UPDATE user_domanda_attempt
      SET
        answered_at = ${now},
        answer_given = ${answer_given},
        is_correct = ${is_correct}
      WHERE id = ${attempt_id}
    `;

    return { success: true, is_correct, attempt_id };
  }

  // Se quiz_id e quiz_pos sono forniti (quiz full), fa UPDATE per quiz_id
  if (quiz_id !== undefined && quiz_pos !== undefined) {
    const existingRow = await sql`
      SELECT id FROM user_domanda_attempt
      WHERE quiz_id = ${quiz_id}
        AND quiz_pos = ${quiz_pos}
        AND user_id = ${userId}
        AND domanda_id = ${domanda_id}
    `;

    if (!existingRow || existingRow.length === 0) {
      throw new Error('Tentativo quiz non trovato');
    }

    const attempt_id = Number((existingRow[0] as { id: number | string }).id);

    await sql`
      UPDATE user_domanda_attempt
      SET
        answered_at = ${now},
        answer_given = ${answer_given},
        is_correct = ${is_correct}
      WHERE id = ${attempt_id}
    `;

    return { success: true, is_correct, attempt_id };
  }

  // Nessun quiz_id/sfida_id: INSERT (esercitazione libera)
  const result = await sql`
    INSERT INTO user_domanda_attempt (
      user_id, domanda_id, quiz_id, quiz_pos,
      asked_at, answered_at, answer_given, is_correct
    ) VALUES (
      ${userId}, ${domanda_id}, ${null}, ${null},
      ${now}, ${now}, ${answer_given}, ${is_correct}
    )
    RETURNING id
  `;

  const attempt_id = Number((result[0] as { id: number | string }).id);

  return { success: true, is_correct, attempt_id };
}

// ============================================================
// checkResponse (pubblica)
// ============================================================

export async function checkResponse(
  domandaId: number,
  answerGiven: string,
): Promise<{ is_correct: boolean }> {
  const is_correct = await verifyAnswer(domandaId, answerGiven);
  return { is_correct };
}

// ============================================================
// domandaUserStats
// ============================================================

export interface DomandaUserStatsOutput {
  total: number;
  correct: number;
  wrong: number;
}

export async function domandaUserStats(
  userId: string | null,
  domandaId: number,
): Promise<DomandaUserStatsOutput> {
  if (!userId) {
    return { total: 0, correct: 0, wrong: 0 };
  }

  const result = await sql`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE is_correct = true)::int AS correct,
      COUNT(*) FILTER (WHERE is_correct = false)::int AS wrong
    FROM user_domanda_attempt
    WHERE user_id = ${userId} AND domanda_id = ${domandaId}
  `;

  const row = result[0] as
    | { total: number; correct: number; wrong: number }
    | undefined;

  return {
    total: row?.total ?? 0,
    correct: row?.correct ?? 0,
    wrong: row?.wrong ?? 0,
  };
}
