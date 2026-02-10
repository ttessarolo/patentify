/**
 * Service per la gestione delle sfide multiplayer.
 *
 * Funzioni pure: ricevono userId e input espliciti.
 * Nessuna gestione auth o validazione (delegata alle procedures).
 */

import { sql } from '~/lib/db';
import { generateQuiz } from './quiz.service';
import { QUIZ_SIZE, MAX_ERRORS } from '~/commons';
import type { SfidaStatus } from '~/types/db';

// ============================================================
// Types (interni al service)
// ============================================================

interface CreateSfidaResult {
  sfida_id: number;
  quiz_id_a: number;
  quiz_id_b: number;
  game_started_at: string;
}

interface CompleteSfidaResult {
  success: boolean;
  both_finished: boolean;
  winner_id: string | null;
  player_a_correct: number;
  player_b_correct: number;
  promosso: boolean;
}

interface SfidaHistoryRow {
  sfida_id: number;
  created_at: string;
  opponent_id: string;
  opponent_name: string;
  opponent_username: string | null;
  opponent_image_url: string | null;
  winner_id: string | null;
  status: SfidaStatus;
  my_correct: number;
  opponent_correct: number;
}

interface OnlineUserDetail {
  id: string;
  name: string;
  username: string | null;
  image_url: string | null;
  is_following: boolean;
}

// ============================================================
// createSfida
// ============================================================

/**
 * Crea una nuova sfida multiplayer.
 * Genera un quiz standard per entrambi i giocatori (stesse domande)
 * e inserisce il record nella tabella sfide.
 */
export async function createSfida(
  playerAId: string,
  playerBId: string,
): Promise<CreateSfidaResult> {
  // 1. Genera quiz per player A (standard, no boost)
  const quizA = await generateQuiz(playerAId, 'standard', false, false);

  // 2. Leggi le domande selezionate per il quiz A (in ordine di quiz_pos)
  const domandeResult = await sql`
    SELECT domanda_id, quiz_pos
    FROM user_domanda_attempt
    WHERE quiz_id = ${quizA.quiz_id} AND user_id = ${playerAId}
    ORDER BY quiz_pos ASC
  `;

  // 3. Crea quiz per player B (stesse domande, stesso ordine)
  const quizBResult = await sql`
    INSERT INTO quiz (user_id, status, quiz_type, boost_errors, boost_skull)
    VALUES (${playerBId}, 'in_progress', 'standard', false, false)
    RETURNING id
  `;
  const quizBId = Number((quizBResult[0] as { id: number | string }).id);

  // Inserisci le stesse domande nello stesso ordine per player B
  for (const row of domandeResult as { domanda_id: number; quiz_pos: number }[]) {
    await sql`
      INSERT INTO user_domanda_attempt (
        user_id, domanda_id, quiz_id, quiz_pos,
        answered_at, answer_given, is_correct
      ) VALUES (
        ${playerBId}, ${row.domanda_id}, ${quizBId}, ${row.quiz_pos},
        ${null}, ${null}, ${null}
      )
    `;
  }

  // Fire-and-forget: calcola medie indicatori per il quiz B
  const domandaIds = (domandeResult as { domanda_id: number }[]).map(
    (r) => r.domanda_id,
  );
  void sql`
    UPDATE quiz SET
      ire_plus = sub.avg_ire_plus,
      ire = sub.avg_ire,
      difficolta = sub.avg_difficolta,
      ambiguita = sub.avg_ambiguita
    FROM (
      SELECT
        AVG(d.ire_plus)::real as avg_ire_plus,
        AVG(d.ire)::real as avg_ire,
        AVG(d.difficolta)::real as avg_difficolta,
        AVG(d.ambiguita)::real as avg_ambiguita
      FROM domande d
      WHERE d.id = ANY(${domandaIds})
    ) sub
    WHERE quiz.id = ${quizBId}
  `;

  // 4. Crea record sfida
  const sfidaResult = await sql`
    INSERT INTO sfide (player_a_id, player_b_id, quiz_id_a, quiz_id_b)
    VALUES (${playerAId}, ${playerBId}, ${quizA.quiz_id}, ${quizBId})
    RETURNING id, game_started_at::text
  `;

  const sfida = sfidaResult[0] as { id: number | string; game_started_at: string };

  return {
    sfida_id: Number(sfida.id),
    quiz_id_a: quizA.quiz_id,
    quiz_id_b: quizBId,
    game_started_at: sfida.game_started_at,
  };
}

// ============================================================
// completeSfida
// ============================================================

/**
 * Segna un player come "finito" nella sfida.
 * Se entrambi hanno finito, calcola il vincitore.
 */
export async function completeSfida(
  sfidaId: number,
  playerId: string,
  correctCount: number,
): Promise<CompleteSfidaResult> {
  // Identifica se il player è A o B
  const sfidaResult = await sql`
    SELECT player_a_id, player_b_id, player_a_finished, player_b_finished,
           player_a_correct, player_b_correct, status
    FROM sfide
    WHERE id = ${sfidaId}
  `;

  if (!sfidaResult || sfidaResult.length === 0) {
    throw new Error('Sfida non trovata');
  }

  const sfida = sfidaResult[0] as {
    player_a_id: string;
    player_b_id: string;
    player_a_finished: boolean;
    player_b_finished: boolean;
    player_a_correct: number;
    player_b_correct: number;
    status: string;
  };

  if (sfida.status !== 'in_progress') {
    throw new Error('Sfida non in corso');
  }

  const isPlayerA = playerId === sfida.player_a_id;
  const isPlayerB = playerId === sfida.player_b_id;
  if (!isPlayerA && !isPlayerB) {
    throw new Error('Utente non partecipante alla sfida');
  }

  // Aggiorna il conteggio e il flag finished per il player
  if (isPlayerA) {
    await sql`
      UPDATE sfide
      SET player_a_correct = ${correctCount}, player_a_finished = true
      WHERE id = ${sfidaId}
    `;
  } else {
    await sql`
      UPDATE sfide
      SET player_b_correct = ${correctCount}, player_b_finished = true
      WHERE id = ${sfidaId}
    `;
  }

  // Ricalcola lo stato
  const updatedA = isPlayerA ? correctCount : sfida.player_a_correct;
  const updatedB = isPlayerB ? correctCount : sfida.player_b_correct;
  const aFinished = isPlayerA ? true : sfida.player_a_finished;
  const bFinished = isPlayerB ? true : sfida.player_b_finished;
  const bothFinished = aFinished && bFinished;

  const wrongCount = QUIZ_SIZE - correctCount;
  const promosso = wrongCount <= MAX_ERRORS;

  if (bothFinished) {
    // Determina il vincitore
    let winnerId: string | null = null;
    if (updatedA > updatedB) winnerId = sfida.player_a_id;
    else if (updatedB > updatedA) winnerId = sfida.player_b_id;
    // Pareggio: winnerId resta null

    await sql`
      UPDATE sfide
      SET status = 'completed', winner_id = ${winnerId}
      WHERE id = ${sfidaId}
    `;
  }

  return {
    success: true,
    both_finished: bothFinished,
    winner_id: bothFinished
      ? updatedA > updatedB
        ? sfida.player_a_id
        : updatedB > updatedA
          ? sfida.player_b_id
          : null
      : null,
    player_a_correct: updatedA,
    player_b_correct: updatedB,
    promosso,
  };
}

// ============================================================
// abortSfidaForPlayer
// ============================================================

/**
 * Segna la sfida come abortita per un player specifico.
 * Il quiz del player viene abbandonato, ma l'avversario puo proseguire.
 */
export async function abortSfidaForPlayer(
  sfidaId: number,
  playerId: string,
): Promise<{ success: boolean }> {
  const sfidaResult = await sql`
    SELECT player_a_id, player_b_id, quiz_id_a, quiz_id_b, status
    FROM sfide
    WHERE id = ${sfidaId}
  `;

  if (!sfidaResult || sfidaResult.length === 0) {
    throw new Error('Sfida non trovata');
  }

  const sfida = sfidaResult[0] as {
    player_a_id: string;
    player_b_id: string;
    quiz_id_a: number;
    quiz_id_b: number;
    status: string;
  };

  const isPlayerA = playerId === sfida.player_a_id;
  const isPlayerB = playerId === sfida.player_b_id;
  if (!isPlayerA && !isPlayerB) {
    throw new Error('Utente non partecipante alla sfida');
  }

  // Segna il quiz del player come abbandonato
  const quizId = isPlayerA ? sfida.quiz_id_a : sfida.quiz_id_b;
  await sql`
    UPDATE quiz SET status = 'abandoned', completed_at = NOW()
    WHERE id = ${quizId} AND user_id = ${playerId}
  `;

  // Elimina i tentativi non risposti
  await sql`
    DELETE FROM user_domanda_attempt
    WHERE quiz_id = ${quizId} AND user_id = ${playerId} AND answered_at IS NULL
  `;

  // Se la sfida era in_progress, aggiorna lo status
  if (sfida.status === 'in_progress') {
    await sql`
      UPDATE sfide SET status = 'aborted'
      WHERE id = ${sfidaId}
    `;
  }

  return { success: true };
}

// ============================================================
// getSfideHistory
// ============================================================

/**
 * Ritorna le ultime N sfide dell'utente con i dettagli dell'avversario.
 */
export async function getSfideHistory(
  userId: string,
  limit: number = 5,
): Promise<{ sfide: SfidaHistoryRow[] }> {
  const result = await sql`
    SELECT
      s.id as sfida_id,
      s.created_at::text,
      s.winner_id,
      s.status,
      CASE
        WHEN s.player_a_id = ${userId} THEN s.player_b_id
        ELSE s.player_a_id
      END as opponent_id,
      CASE
        WHEN s.player_a_id = ${userId} THEN ob.name
        ELSE oa.name
      END as opponent_name,
      CASE
        WHEN s.player_a_id = ${userId} THEN ob.username
        ELSE oa.username
      END as opponent_username,
      CASE
        WHEN s.player_a_id = ${userId} THEN ob.image_url
        ELSE oa.image_url
      END as opponent_image_url,
      CASE
        WHEN s.player_a_id = ${userId} THEN s.player_a_correct
        ELSE s.player_b_correct
      END as my_correct,
      CASE
        WHEN s.player_a_id = ${userId} THEN s.player_b_correct
        ELSE s.player_a_correct
      END as opponent_correct
    FROM sfide s
    LEFT JOIN utente oa ON oa.id = s.player_a_id
    LEFT JOIN utente ob ON ob.id = s.player_b_id
    WHERE s.player_a_id = ${userId} OR s.player_b_id = ${userId}
    ORDER BY s.created_at DESC
    LIMIT ${limit}
  `;

  return {
    sfide: (result as SfidaHistoryRow[]).map((row) => ({
      sfida_id: Number(row.sfida_id),
      created_at: row.created_at,
      opponent_id: row.opponent_id,
      opponent_name: row.opponent_name,
      opponent_username: row.opponent_username,
      opponent_image_url: row.opponent_image_url,
      winner_id: row.winner_id,
      status: row.status as SfidaStatus,
      my_correct: Number(row.my_correct),
      opponent_correct: Number(row.opponent_correct),
    })),
  };
}

// ============================================================
// getOnlineUsersDetails
// ============================================================

/**
 * Dato un array di userId (dalla presence Ably), ritorna i dettagli
 * degli utenti con il flag is_following.
 */
export async function getOnlineUsersDetails(
  currentUserId: string,
  userIds: string[],
): Promise<{ users: OnlineUserDetail[] }> {
  if (userIds.length === 0) return { users: [] };

  const result = await sql`
    SELECT
      u.id,
      u.name,
      u.username,
      u.image_url,
      EXISTS(
        SELECT 1 FROM amici a
        WHERE a.user_id = ${currentUserId} AND a.friend_id = u.id
      ) as is_following
    FROM utente u
    WHERE u.id = ANY(${userIds})
    ORDER BY u.name ASC
  `;

  return {
    users: (result as OnlineUserDetail[]).map((row) => ({
      id: row.id,
      name: row.name,
      username: row.username,
      image_url: row.image_url,
      is_following: Boolean(row.is_following),
    })),
  };
}
