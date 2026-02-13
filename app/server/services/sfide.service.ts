/**
 * Service per la gestione delle sfide multiplayer.
 *
 * Funzioni pure: ricevono userId e input espliciti.
 * Nessuna gestione auth o validazione (delegata alle procedures).
 */

import { sql } from '~/lib/db';
import { generateQuiz } from './quiz.service';
import { MAX_ERRORS, SFIDA_TIERS } from '~/commons';
import type { SfidaTier } from '~/commons';
import type { SfidaStatus } from '~/types/db';

// ============================================================
// Types (interni al service)
// ============================================================

interface CreateSfidaResult {
  sfida_id: number;
  quiz_id_a: number | null;
  quiz_id_b: number | null;
  game_started_at: string;
  sfida_type: SfidaTier;
  question_count: number;
  duration_seconds: number;
}

interface CompleteSfidaResult {
  success: boolean;
  both_finished: boolean;
  winner_id: string | null;
  my_correct: number;
  opponent_correct: number;
  /** Promosso/bocciato — solo per sfide full. null per altri tier. */
  promosso: boolean | null;
  /** Tempo impiegato dall'avversario in secondi (null se non ha ancora finito) */
  opponent_elapsed_seconds: number | null;
}

interface SfidaHistoryRow {
  sfida_id: number;
  sfida_type: SfidaTier;
  created_at: string;
  opponent_id: string;
  opponent_name: string;
  opponent_username: string | null;
  opponent_image_url: string | null;
  winner_id: string | null;
  status: SfidaStatus;
  my_correct: number;
  opponent_correct: number;
  my_quiz_id: number | null;
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
 *
 * - **full**: crea 2 quiz nel DB (40 domande, 30 minuti) — stesse domande per entrambi.
 * - **seed / medium / half_quiz**: genera N domande random senza creare entry in `quiz`.
 *   Le domande sono collegate direttamente alla sfida tramite `sfida_id`.
 */
export async function createSfida(
  playerAId: string,
  playerBId: string,
  tier: SfidaTier = 'full',
): Promise<CreateSfidaResult> {
  if (tier === 'full') {
    return createSfidaFull(playerAId, playerBId, SFIDA_TIERS.full);
  }

  const tierConfig = SFIDA_TIERS[tier];
  return createSfidaNonFull(playerAId, playerBId, tier, tierConfig);
}

/**
 * Crea una sfida Full (40 domande) — crea quiz nel DB per entrambi i player.
 */
async function createSfidaFull(
  playerAId: string,
  playerBId: string,
  tierConfig: (typeof SFIDA_TIERS)['full'],
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
    INSERT INTO sfide (
      player_a_id, player_b_id, quiz_id_a, quiz_id_b,
      sfida_type, question_count, duration_seconds
    )
    VALUES (
      ${playerAId}, ${playerBId}, ${quizA.quiz_id}, ${quizBId},
      ${'full'}, ${tierConfig.questions}, ${tierConfig.durationSeconds}
    )
    RETURNING id, game_started_at::text
  `;

  const sfida = sfidaResult[0] as { id: number | string; game_started_at: string };
  const sfidaId = Number(sfida.id);

  // Collega anche gli attempt alla sfida (per coerenza)
  void sql`
    UPDATE user_domanda_attempt SET sfida_id = ${sfidaId}
    WHERE quiz_id IN (${quizA.quiz_id}, ${quizBId})
  `;

  return {
    sfida_id: sfidaId,
    quiz_id_a: quizA.quiz_id,
    quiz_id_b: quizBId,
    game_started_at: sfida.game_started_at,
    sfida_type: 'full',
    question_count: tierConfig.questions,
    duration_seconds: tierConfig.durationSeconds,
  };
}

/**
 * Crea una sfida non-Full (seed/medium/half_quiz).
 * NON crea entry nella tabella `quiz`. Le domande vengono associate
 * direttamente alla sfida tramite `sfida_id` in `user_domanda_attempt`.
 */
async function createSfidaNonFull(
  playerAId: string,
  playerBId: string,
  tier: SfidaTier,
  tierConfig: { label: string; questions: number; durationSeconds: number },
): Promise<CreateSfidaResult> {
  const questionCount = tierConfig.questions;

  // 1. Seleziona N domande random
  const domande = await selectRandomDomande(questionCount);

  // 2. Crea record sfida (senza quiz_id)
  const sfidaResult = await sql`
    INSERT INTO sfide (
      player_a_id, player_b_id, quiz_id_a, quiz_id_b,
      sfida_type, question_count, duration_seconds
    )
    VALUES (
      ${playerAId}, ${playerBId}, ${null}, ${null},
      ${tier}, ${questionCount}, ${tierConfig.durationSeconds}
    )
    RETURNING id, game_started_at::text
  `;

  const sfida = sfidaResult[0] as { id: number | string; game_started_at: string };
  const sfidaId = Number(sfida.id);

  // 3. Inserisci le stesse domande per entrambi i player (collegate alla sfida)
  for (let i = 0; i < domande.length; i++) {
    const domandaId = domande[i];
    const pos = i + 1;

    // Player A
    await sql`
      INSERT INTO user_domanda_attempt (
        user_id, domanda_id, quiz_id, quiz_pos, sfida_id,
        answered_at, answer_given, is_correct
      ) VALUES (
        ${playerAId}, ${domandaId}, ${null}, ${pos}, ${sfidaId},
        ${null}, ${null}, ${null}
      )
    `;

    // Player B
    await sql`
      INSERT INTO user_domanda_attempt (
        user_id, domanda_id, quiz_id, quiz_pos, sfida_id,
        answered_at, answer_given, is_correct
      ) VALUES (
        ${playerBId}, ${domandaId}, ${null}, ${pos}, ${sfidaId},
        ${null}, ${null}, ${null}
      )
    `;
  }

  return {
    sfida_id: sfidaId,
    quiz_id_a: null,
    quiz_id_b: null,
    game_started_at: sfida.game_started_at,
    sfida_type: tier,
    question_count: questionCount,
    duration_seconds: tierConfig.durationSeconds,
  };
}

/**
 * Seleziona N domande random dal pool totale.
 * Usato per sfide non-full (nessun vincolo obbligatorio su segnali/precedenze).
 */
async function selectRandomDomande(count: number): Promise<number[]> {
  const result = await sql`
    SELECT id FROM domande
    ORDER BY RANDOM()
    LIMIT ${count}
  `;
  return (result as { id: number }[]).map((r) => r.id);
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
  elapsedSeconds: number,
): Promise<CompleteSfidaResult> {
  // Identifica se il player è A o B
  const sfidaResult = await sql`
    SELECT player_a_id, player_b_id, player_a_finished, player_b_finished,
           player_a_correct, player_b_correct, status,
           sfida_type, question_count
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
    sfida_type: string;
    question_count: number;
  };

  if (sfida.status !== 'in_progress') {
    throw new Error('Sfida non in corso');
  }

  const isPlayerA = playerId === sfida.player_a_id;
  const isPlayerB = playerId === sfida.player_b_id;
  if (!isPlayerA && !isPlayerB) {
    throw new Error('Utente non partecipante alla sfida');
  }

  // Aggiorna il conteggio, il flag finished e il tempo impiegato per il player
  if (isPlayerA) {
    await sql`
      UPDATE sfide
      SET player_a_correct = ${correctCount}, player_a_finished = true,
          player_a_elapsed_seconds = ${elapsedSeconds}
      WHERE id = ${sfidaId}
    `;
  } else {
    await sql`
      UPDATE sfide
      SET player_b_correct = ${correctCount}, player_b_finished = true,
          player_b_elapsed_seconds = ${elapsedSeconds}
      WHERE id = ${sfidaId}
    `;
  }

  // Re-SELECT dopo l'UPDATE per catturare aggiornamenti concorrenti dell'altro player
  const freshResult = await sql`
    SELECT player_a_finished, player_b_finished,
           player_a_correct, player_b_correct,
           player_a_id, player_b_id,
           player_a_elapsed_seconds, player_b_elapsed_seconds
    FROM sfide WHERE id = ${sfidaId}
  `;
  const fresh = freshResult[0] as {
    player_a_finished: boolean;
    player_b_finished: boolean;
    player_a_correct: number;
    player_b_correct: number;
    player_a_id: string;
    player_b_id: string;
    player_a_elapsed_seconds: number | null;
    player_b_elapsed_seconds: number | null;
  };

  const updatedA = Number(fresh.player_a_correct);
  const updatedB = Number(fresh.player_b_correct);
  const bothFinished = fresh.player_a_finished && fresh.player_b_finished;

  // Promosso/bocciato solo per sfide full
  let promosso: boolean | null = null;
  if (sfida.sfida_type === 'full') {
    const wrongCount = sfida.question_count - correctCount;
    promosso = wrongCount <= MAX_ERRORS;
  }

  if (bothFinished) {
    // Determina il vincitore
    let winnerId: string | null = null;
    if (updatedA > updatedB) winnerId = fresh.player_a_id;
    else if (updatedB > updatedA) winnerId = fresh.player_b_id;
    // Pareggio: winnerId resta null

    // UPDATE condizionale: setta winner_id solo se non già impostato (evita doppia scrittura)
    await sql`
      UPDATE sfide
      SET status = 'completed',
          winner_id = CASE WHEN winner_id IS NULL THEN ${winnerId} ELSE winner_id END
      WHERE id = ${sfidaId} AND status = 'in_progress'
    `;
  }

  const winnerId = bothFinished
    ? updatedA > updatedB
      ? fresh.player_a_id
      : updatedB > updatedA
        ? fresh.player_b_id
        : null
    : null;

  // Tempo impiegato dall'avversario (null se non ha ancora finito)
  const opponentElapsedSeconds = isPlayerA
    ? fresh.player_b_elapsed_seconds != null ? Number(fresh.player_b_elapsed_seconds) : null
    : fresh.player_a_elapsed_seconds != null ? Number(fresh.player_a_elapsed_seconds) : null;

  return {
    success: true,
    both_finished: bothFinished,
    winner_id: winnerId,
    my_correct: isPlayerA ? updatedA : updatedB,
    opponent_correct: isPlayerA ? updatedB : updatedA,
    promosso,
    opponent_elapsed_seconds: opponentElapsedSeconds,
  };
}

// ============================================================
// getSfidaResult
// ============================================================

interface SfidaResultData {
  winner_id: string | null;
  my_correct: number;
  opponent_correct: number;
  both_finished: boolean;
  status: string;
  sfida_type: SfidaTier;
  question_count: number;
  duration_seconds: number;
  my_elapsed_seconds: number | null;
  opponent_elapsed_seconds: number | null;
}

/**
 * Ritorna il risultato di una sfida dal punto di vista del player richiedente.
 * Usato dal primo giocatore per recuperare i dati reali quando l'avversario finisce.
 */
export async function getSfidaResult(
  sfidaId: number,
  playerId: string,
): Promise<SfidaResultData> {
  const sfidaResult = await sql`
    SELECT player_a_id, player_b_id,
           player_a_correct, player_b_correct,
           player_a_finished, player_b_finished,
           player_a_elapsed_seconds, player_b_elapsed_seconds,
           winner_id, status,
           sfida_type, question_count, duration_seconds
    FROM sfide
    WHERE id = ${sfidaId}
  `;

  if (!sfidaResult || sfidaResult.length === 0) {
    throw new Error('Sfida non trovata');
  }

  const sfida = sfidaResult[0] as {
    player_a_id: string;
    player_b_id: string;
    player_a_correct: number;
    player_b_correct: number;
    player_a_finished: boolean;
    player_b_finished: boolean;
    player_a_elapsed_seconds: number | null;
    player_b_elapsed_seconds: number | null;
    winner_id: string | null;
    status: string;
    sfida_type: string;
    question_count: number;
    duration_seconds: number;
  };

  const isPlayerA = playerId === sfida.player_a_id;
  const isPlayerB = playerId === sfida.player_b_id;
  if (!isPlayerA && !isPlayerB) {
    throw new Error('Utente non partecipante alla sfida');
  }

  const bothFinished = sfida.player_a_finished && sfida.player_b_finished;

  // Se entrambi hanno finito ma winner_id è NULL (race condition residua),
  // calcola il vincitore on-the-fly confrontando i punteggi
  let winnerId: string | null = sfida.winner_id;
  if (bothFinished && winnerId === null) {
    const aCorrect = Number(sfida.player_a_correct);
    const bCorrect = Number(sfida.player_b_correct);
    if (aCorrect > bCorrect) winnerId = sfida.player_a_id;
    else if (bCorrect > aCorrect) winnerId = sfida.player_b_id;
    // Pareggio reale: winnerId resta null
  }

  return {
    winner_id: winnerId,
    my_correct: isPlayerA ? sfida.player_a_correct : sfida.player_b_correct,
    opponent_correct: isPlayerA ? sfida.player_b_correct : sfida.player_a_correct,
    both_finished: bothFinished,
    status: sfida.status,
    sfida_type: sfida.sfida_type as SfidaTier,
    question_count: Number(sfida.question_count),
    duration_seconds: Number(sfida.duration_seconds),
    my_elapsed_seconds: isPlayerA
      ? sfida.player_a_elapsed_seconds != null ? Number(sfida.player_a_elapsed_seconds) : null
      : sfida.player_b_elapsed_seconds != null ? Number(sfida.player_b_elapsed_seconds) : null,
    opponent_elapsed_seconds: isPlayerA
      ? sfida.player_b_elapsed_seconds != null ? Number(sfida.player_b_elapsed_seconds) : null
      : sfida.player_a_elapsed_seconds != null ? Number(sfida.player_a_elapsed_seconds) : null,
  };
}

// ============================================================
// getFullSfida
// ============================================================

interface SfidaDomandaWithAnswer {
  quiz_pos: number;
  domanda: {
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
  };
  answer_given: string | null;
  is_correct: boolean | null;
}

interface FullSfidaResult {
  sfida_id: number;
  sfida_type: SfidaTier;
  question_count: number;
  domande: SfidaDomandaWithAnswer[];
}

/**
 * Ritorna le domande con risposte per una sfida completata (non-full).
 * Le sfide full hanno quiz_id e usano quiz.getFull; le sfide non-full
 * usano questa funzione.
 */
export async function getFullSfida(
  sfidaId: number,
  userId: string,
): Promise<FullSfidaResult> {
  const sfidaResult = await sql`
    SELECT sfida_type, question_count, player_a_id, player_b_id
    FROM sfide
    WHERE id = ${sfidaId}
  `;

  if (!sfidaResult || sfidaResult.length === 0) {
    throw new Error('Sfida non trovata');
  }

  const sfida = sfidaResult[0] as {
    sfida_type: string;
    question_count: number;
    player_a_id: string;
    player_b_id: string;
  };

  const isParticipant =
    userId === sfida.player_a_id || userId === sfida.player_b_id;
  if (!isParticipant) {
    throw new Error('Utente non partecipante alla sfida');
  }

  const domandeResult = await sql`
    SELECT
      uda.quiz_pos, uda.answer_given, uda.is_correct,
      d.id, d.ire_plus, d.domanda, d.risposta,
      d.ambiguita, d.ambiguita_triggers,
      d.difficolta, d.difficolta_fattori,
      d.titolo_quesito, d.id_quesito, d.ire, d.immagine_path
    FROM user_domanda_attempt uda
    JOIN domande d ON d.id = uda.domanda_id
    WHERE uda.sfida_id = ${sfidaId} AND uda.user_id = ${userId}
      AND uda.answered_at IS NOT NULL
    ORDER BY uda.quiz_pos ASC
  `;

  const domande: SfidaDomandaWithAnswer[] = (
    domandeResult as Array<{
      quiz_pos: number;
      answer_given: string | null;
      is_correct: boolean | null;
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
    }>
  ).map((row) => ({
    quiz_pos: row.quiz_pos,
    answer_given: row.answer_given,
    is_correct: row.is_correct,
    domanda: {
      id: row.id,
      ire_plus: row.ire_plus,
      domanda: row.domanda,
      risposta: row.risposta,
      ambiguita: row.ambiguita,
      ambiguita_triggers: row.ambiguita_triggers,
      difficolta: row.difficolta,
      difficolta_fattori: row.difficolta_fattori,
      titolo_quesito: row.titolo_quesito,
      id_quesito: row.id_quesito,
      ire: row.ire,
      immagine_path: row.immagine_path,
    },
  }));

  return {
    sfida_id: sfidaId,
    sfida_type: sfida.sfida_type as SfidaTier,
    question_count: Number(sfida.question_count),
    domande,
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
// forfeitSfida
// ============================================================

interface ForfeitSfidaResult {
  success: boolean;
  both_finished: boolean;
  winner_id: string | null;
  my_correct: number;
  opponent_correct: number;
  promosso: boolean | null;
  opponent_elapsed_seconds: number | null;
}

/**
 * Gestisce il forfeit (timeout o inattività) di un player nella sfida.
 *
 * Il player che ha forfettato perde automaticamente. L'avversario vince.
 * Se l'avversario non ha ancora finito, il suo punteggio corrente viene
 * calcolato dalle risposte registrate in user_domanda_attempt.
 *
 * Marca la sfida come completed con winner_id = opponentId.
 */
export async function forfeitSfida(
  sfidaId: number,
  playerId: string,
  correctCount: number,
  elapsedSeconds: number,
): Promise<ForfeitSfidaResult> {
  const sfidaResult = await sql`
    SELECT player_a_id, player_b_id,
           player_a_finished, player_b_finished,
           player_a_correct, player_b_correct,
           player_a_elapsed_seconds, player_b_elapsed_seconds,
           quiz_id_a, quiz_id_b,
           status, sfida_type, question_count
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
    player_a_elapsed_seconds: number | null;
    player_b_elapsed_seconds: number | null;
    quiz_id_a: number | null;
    quiz_id_b: number | null;
    status: string;
    sfida_type: string;
    question_count: number;
  };

  const isPlayerA = playerId === sfida.player_a_id;
  const isPlayerB = playerId === sfida.player_b_id;
  if (!isPlayerA && !isPlayerB) {
    throw new Error('Utente non partecipante alla sfida');
  }

  if (sfida.status !== 'in_progress') {
    throw new Error('Sfida non in corso');
  }

  const opponentId = isPlayerA ? sfida.player_b_id : sfida.player_a_id;

  // 1. Marca il player come finished con il suo correctCount e tempo
  if (isPlayerA) {
    await sql`
      UPDATE sfide
      SET player_a_correct = ${correctCount}, player_a_finished = true,
          player_a_elapsed_seconds = ${elapsedSeconds}
      WHERE id = ${sfidaId}
    `;
  } else {
    await sql`
      UPDATE sfide
      SET player_b_correct = ${correctCount}, player_b_finished = true,
          player_b_elapsed_seconds = ${elapsedSeconds}
      WHERE id = ${sfidaId}
    `;
  }

  // 2. Se l'avversario non ha ancora finito, calcola il suo score corrente
  //    dalle risposte registrate e marcalo come finished
  const opponentAlreadyFinished = isPlayerA
    ? sfida.player_b_finished
    : sfida.player_a_finished;

  let opponentCorrect: number;

  if (opponentAlreadyFinished) {
    opponentCorrect = Number(
      isPlayerA ? sfida.player_b_correct : sfida.player_a_correct,
    );
  } else {
    // Calcola il punteggio dell'avversario da user_domanda_attempt
    const opponentScoreResult = await sql`
      SELECT COUNT(*) as correct_count
      FROM user_domanda_attempt
      WHERE sfida_id = ${sfidaId}
        AND user_id = ${opponentId}
        AND is_correct = true
        AND answered_at IS NOT NULL
    `;
    opponentCorrect = Number(opponentScoreResult[0]?.correct_count ?? 0);

    // Marca l'avversario come finished con il punteggio calcolato
    if (isPlayerA) {
      await sql`
        UPDATE sfide
        SET player_b_correct = ${opponentCorrect}, player_b_finished = true
        WHERE id = ${sfidaId}
      `;
    } else {
      await sql`
        UPDATE sfide
        SET player_a_correct = ${opponentCorrect}, player_a_finished = true
        WHERE id = ${sfidaId}
      `;
    }
  }

  // 3. L'avversario vince: imposta winner_id e status = completed
  await sql`
    UPDATE sfide
    SET status = 'completed',
        winner_id = ${opponentId}
    WHERE id = ${sfidaId} AND status = 'in_progress'
  `;

  // 4. Segna il quiz del player come abandoned (solo per full quiz)
  const myQuizId = isPlayerA ? sfida.quiz_id_a : sfida.quiz_id_b;
  if (myQuizId) {
    await sql`
      UPDATE quiz SET status = 'abandoned', completed_at = NOW()
      WHERE id = ${myQuizId} AND user_id = ${playerId}
    `;
  }

  // 5. Elimina tentativi non risposti del player
  if (myQuizId) {
    await sql`
      DELETE FROM user_domanda_attempt
      WHERE quiz_id = ${myQuizId} AND user_id = ${playerId} AND answered_at IS NULL
    `;
  }

  // Promosso/bocciato solo per sfide full
  let promosso: boolean | null = null;
  if (sfida.sfida_type === 'full') {
    const wrongCount = Number(sfida.question_count) - correctCount;
    promosso = wrongCount <= MAX_ERRORS;
  }

  // Tempo dell'avversario (se aveva già finito prima del forfeit)
  const opponentElapsedSeconds = isPlayerA
    ? sfida.player_b_elapsed_seconds != null ? Number(sfida.player_b_elapsed_seconds) : null
    : sfida.player_a_elapsed_seconds != null ? Number(sfida.player_a_elapsed_seconds) : null;

  return {
    success: true,
    both_finished: true,
    winner_id: opponentId,
    my_correct: correctCount,
    opponent_correct: opponentCorrect,
    promosso,
    opponent_elapsed_seconds: opponentElapsedSeconds,
  };
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
      s.sfida_type,
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
      END as opponent_correct,
      CASE
        WHEN s.player_a_id = ${userId} THEN s.quiz_id_a
        ELSE s.quiz_id_b
      END as my_quiz_id
    FROM sfide s
    LEFT JOIN utente oa ON oa.id = s.player_a_id
    LEFT JOIN utente ob ON ob.id = s.player_b_id
    WHERE s.player_a_id = ${userId} OR s.player_b_id = ${userId}
    ORDER BY s.created_at DESC
    LIMIT ${limit}
  `;

  return {
    sfide: (result as (SfidaHistoryRow & { sfida_type: string })[]).map(
      (row) => ({
        sfida_id: Number(row.sfida_id),
        sfida_type: row.sfida_type as SfidaTier,
        created_at: row.created_at,
        opponent_id: row.opponent_id,
        opponent_name: row.opponent_name,
        opponent_username: row.opponent_username,
        opponent_image_url: row.opponent_image_url,
        winner_id: row.winner_id,
        status: row.status as SfidaStatus,
        my_correct: Number(row.my_correct),
        opponent_correct: Number(row.opponent_correct),
        my_quiz_id: row.my_quiz_id != null ? Number(row.my_quiz_id) : null,
      }),
    ),
  };
}

// ============================================================
// getSfideHistoryAll
// ============================================================

type SfideHistoryFilter = 'all' | 'won' | 'lost';

/**
 * Ritorna tutte le sfide dell'utente con filtro opzionale (all/won/lost).
 */
export async function getSfideHistoryAll(
  userId: string,
  filter: SfideHistoryFilter = 'all',
): Promise<{ sfide: SfidaHistoryRow[] }> {
  let filterClause = sql``;
  if (filter === 'won') {
    filterClause = sql`AND s.status = 'completed' AND s.winner_id = ${userId}`;
  } else if (filter === 'lost') {
    filterClause = sql`AND s.status = 'completed' AND s.winner_id IS NOT NULL AND s.winner_id != ${userId}`;
  }

  const result = await sql`
    SELECT
      s.id as sfida_id,
      s.sfida_type,
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
      END as opponent_correct,
      CASE
        WHEN s.player_a_id = ${userId} THEN s.quiz_id_a
        ELSE s.quiz_id_b
      END as my_quiz_id
    FROM sfide s
    LEFT JOIN utente oa ON oa.id = s.player_a_id
    LEFT JOIN utente ob ON ob.id = s.player_b_id
    WHERE (s.player_a_id = ${userId} OR s.player_b_id = ${userId})
      ${filterClause}
    ORDER BY s.created_at DESC
  `;

  return {
    sfide: (result as (SfidaHistoryRow & { sfida_type: string })[]).map(
      (row) => ({
        sfida_id: Number(row.sfida_id),
        sfida_type: row.sfida_type as SfidaTier,
        created_at: row.created_at,
        opponent_id: row.opponent_id,
        opponent_name: row.opponent_name,
        opponent_username: row.opponent_username,
        opponent_image_url: row.opponent_image_url,
        winner_id: row.winner_id,
        status: row.status as SfidaStatus,
        my_correct: Number(row.my_correct),
        opponent_correct: Number(row.opponent_correct),
        my_quiz_id: row.my_quiz_id != null ? Number(row.my_quiz_id) : null,
      }),
    ),
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
