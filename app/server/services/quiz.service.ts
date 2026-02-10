/**
 * Service per la gestione dei quiz (simulazione patente).
 */

import { sql } from '~/lib/db';
import { QUIZ_SIZE, MIN_SEGNALI, MIN_PRECEDENZE, MAX_ERRORS } from '~/commons';

// Pattern per identificare ambiti obbligatori
const SEGNALI_PATTERN = '%segnali%';
const SEGNALETICA_PATTERN = '%segnaletica%';
const PANNELLI_PATTERN = '%pannelli%';
const PRECEDENZE_PATTERN = '%precedenza%';

// ============================================================
// Types (interno al service, non esportato)
// ============================================================

interface DomandaRow {
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

type QuizType = 'standard' | 'difficile' | 'ambiguo';
type QuizStatus = 'in_progress' | 'completed' | 'abandoned';

// ============================================================
// generateQuiz
// ============================================================

export async function generateQuiz(
  userId: string,
  quizType: QuizType,
  boostErrors: boolean,
  boostSkull: boolean,
): Promise<{ quiz_id: number }> {
  // 1. Crea entry nella tabella quiz
  const quizResult = await sql`
    INSERT INTO quiz (user_id, status, quiz_type, boost_errors, boost_skull)
    VALUES (${userId}, 'in_progress', ${quizType}, ${boostErrors}, ${boostSkull})
    RETURNING id
  `;
  const quizId = Number((quizResult[0] as { id: number | string }).id);

  // 2. Seleziona le 40 domande secondo i criteri
  const selectedDomande = await selectQuizDomande(
    userId,
    quizType,
    boostErrors,
    boostSkull,
  );

  // 3. Inserisci le domande nella tabella user_domanda_attempt
  for (let i = 0; i < selectedDomande.length; i++) {
    const domandaId = selectedDomande[i];
    const pos = i + 1;

    await sql`
      INSERT INTO user_domanda_attempt (
        user_id, domanda_id, quiz_id, quiz_pos,
        answered_at, answer_given, is_correct
      ) VALUES (
        ${userId}, ${domandaId}, ${quizId}, ${pos},
        ${null}, ${null}, ${null}
      )
    `;
  }

  // Fire-and-forget: calcola medie indicatori per il quiz
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
      WHERE d.id = ANY(${selectedDomande})
    ) sub
    WHERE quiz.id = ${quizId}
  `;

  return { quiz_id: quizId };
}

// ============================================================
// selectQuizDomande (internal helper)
// ============================================================

async function selectQuizDomande(
  userId: string,
  quizType: QuizType,
  boostErrors: boolean,
  boostSkull: boolean,
): Promise<number[]> {
  const selectedIds = new Set<number>();

  const addIds = (rows: { id?: number; domanda_id?: number }[], max: number): void => {
    for (const row of rows) {
      if (selectedIds.size >= max) break;
      const id = row.id ?? row.domanda_id;
      if (id !== undefined && !selectedIds.has(id)) {
        selectedIds.add(id);
      }
    }
  };

  // 1. FASE BOOST
  if (boostErrors) {
    const errorDomande = await sql`
      SELECT domanda_id FROM (
        SELECT DISTINCT uda.domanda_id
        FROM user_domanda_attempt uda
        WHERE uda.user_id = ${userId}
          AND uda.is_correct = false
      ) AS distinct_errors
      ORDER BY RANDOM()
      LIMIT 15
    `;
    addIds(errorDomande as { domanda_id: number }[], QUIZ_SIZE);
  }

  if (boostSkull) {
    const skullDomande = await sql`
      SELECT uds.domanda_id
      FROM user_domanda_skull uds
      WHERE uds.user_id = ${userId}
      ORDER BY RANDOM()
      LIMIT 15
    `;
    addIds(skullDomande as { domanda_id: number }[], QUIZ_SIZE);
  }

  // 2. FASE OBBLIGATORIA: Segnali Stradali
  const segnaliDomande = await sql`
    SELECT d.id
    FROM domande d
    WHERE (
      LOWER(d.titolo_quesito) LIKE ${SEGNALI_PATTERN}
      OR LOWER(d.titolo_quesito) LIKE ${SEGNALETICA_PATTERN}
      OR LOWER(d.titolo_quesito) LIKE ${PANNELLI_PATTERN}
    )
    ORDER BY ${quizType === 'difficile' ? sql`CASE WHEN d.ire > 3 THEN 0 ELSE 1 END,` : sql``} 
             ${quizType === 'ambiguo' ? sql`CASE WHEN d.ambiguita > 3 THEN 0 ELSE 1 END,` : sql``}
             RANDOM()
    LIMIT ${MIN_SEGNALI + 10}
  `;
  let segnaliCount = 0;
  for (const row of segnaliDomande as { id: number }[]) {
    if (segnaliCount >= MIN_SEGNALI) break;
    if (!selectedIds.has(row.id)) {
      selectedIds.add(row.id);
      segnaliCount++;
    }
  }

  // 3. FASE OBBLIGATORIA: Precedenze
  const precedenzeDomande = await sql`
    SELECT d.id
    FROM domande d
    WHERE LOWER(d.titolo_quesito) LIKE ${PRECEDENZE_PATTERN}
    ORDER BY ${quizType === 'difficile' ? sql`CASE WHEN d.ire > 3 THEN 0 ELSE 1 END,` : sql``}
             ${quizType === 'ambiguo' ? sql`CASE WHEN d.ambiguita > 3 THEN 0 ELSE 1 END,` : sql``}
             RANDOM()
    LIMIT ${MIN_PRECEDENZE + 5}
  `;
  let precedenzeCount = 0;
  for (const row of precedenzeDomande as { id: number }[]) {
    if (precedenzeCount >= MIN_PRECEDENZE) break;
    if (!selectedIds.has(row.id)) {
      selectedIds.add(row.id);
      precedenzeCount++;
    }
  }

  // 4. FASE DISTRIBUZIONE
  if (selectedIds.size < QUIZ_SIZE) {
    const ambitiResult = await sql`
      SELECT DISTINCT titolo_quesito
      FROM domande
      WHERE titolo_quesito IS NOT NULL
      ORDER BY titolo_quesito
    `;
    const ambiti = (ambitiResult as { titolo_quesito: string }[]).map(
      (r) => r.titolo_quesito,
    );

    const remaining = QUIZ_SIZE - selectedIds.size;
    const perAmbito = Math.max(1, Math.ceil(remaining / ambiti.length));

    for (const ambito of ambiti) {
      if (selectedIds.size >= QUIZ_SIZE) break;

      const ambitoDomande = await sql`
        SELECT d.id
        FROM domande d
        WHERE d.titolo_quesito = ${ambito}
        ORDER BY ${quizType === 'difficile' ? sql`CASE WHEN d.ire > 3 THEN 0 ELSE 1 END,` : sql``}
                 ${quizType === 'ambiguo' ? sql`CASE WHEN d.ambiguita > 3 THEN 0 ELSE 1 END,` : sql``}
                 RANDOM()
        LIMIT ${perAmbito + 5}
      `;

      let ambitoCount = 0;
      for (const row of ambitoDomande as { id: number }[]) {
        if (ambitoCount >= perAmbito || selectedIds.size >= QUIZ_SIZE) break;
        if (!selectedIds.has(row.id)) {
          selectedIds.add(row.id);
          ambitoCount++;
        }
      }
    }
  }

  // 5. FASE FINALE: random fill
  if (selectedIds.size < QUIZ_SIZE) {
    const randomDomande = await sql`
      SELECT d.id
      FROM domande d
      ORDER BY ${quizType === 'difficile' ? sql`CASE WHEN d.ire > 3 THEN 0 ELSE 1 END,` : sql``}
               ${quizType === 'ambiguo' ? sql`CASE WHEN d.ambiguita > 3 THEN 0 ELSE 1 END,` : sql``}
               RANDOM()
      LIMIT ${QUIZ_SIZE + 20}
    `;
    for (const row of randomDomande as { id: number }[]) {
      if (selectedIds.size >= QUIZ_SIZE) break;
      if (!selectedIds.has(row.id)) {
        selectedIds.add(row.id);
      }
    }
  }

  const result = Array.from(selectedIds);
  shuffleArray(result);
  return result.slice(0, QUIZ_SIZE);
}

/** Mescola un array in-place (Fisher-Yates) */
function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// ============================================================
// getQuizDomanda
// ============================================================

export async function getQuizDomanda(
  userId: string,
  quizId: number,
  quizPos: number,
): Promise<{ domanda: DomandaRow; domanda_id: number }> {
  // Verifica che il quiz appartenga all'utente e sia in_progress
  const quizCheck = await sql`
    SELECT id FROM quiz
    WHERE id = ${quizId}
      AND user_id = ${userId}
      AND status = 'in_progress'
  `;
  if (!quizCheck || quizCheck.length === 0) {
    throw new Error('Quiz non trovato o non in corso');
  }

  const result = await sql`
    SELECT 
      uda.domanda_id,
      d.id, d.ire_plus, d.domanda, d.risposta,
      d.ambiguita, d.ambiguita_triggers,
      d.difficolta, d.difficolta_fattori,
      d.titolo_quesito, d.id_quesito, d.ire, d.immagine_path
    FROM user_domanda_attempt uda
    JOIN domande d ON d.id = uda.domanda_id
    WHERE uda.quiz_id = ${quizId}
      AND uda.quiz_pos = ${quizPos}
      AND uda.user_id = ${userId}
  `;

  if (!result || result.length === 0) {
    throw new Error(`Domanda non trovata per quiz ${quizId} pos ${quizPos}`);
  }

  const row = result[0] as DomandaRow & { domanda_id: number };

  return {
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
    domanda_id: row.domanda_id,
  };
}

// ============================================================
// abortQuiz
// ============================================================

export async function abortQuiz(
  userId: string,
  quizId: number,
): Promise<{ success: boolean }> {
  const quizCheck = await sql`
    SELECT id, status FROM quiz
    WHERE id = ${quizId} AND user_id = ${userId}
  `;
  if (!quizCheck || quizCheck.length === 0) {
    throw new Error('Quiz non trovato');
  }

  const quiz = quizCheck[0] as { id: number; status: string };
  if (quiz.status !== 'in_progress') {
    return { success: true };
  }

  await sql`
    UPDATE quiz
    SET status = 'abandoned', completed_at = NOW()
    WHERE id = ${quizId} AND user_id = ${userId}
  `;

  await sql`
    DELETE FROM user_domanda_attempt
    WHERE quiz_id = ${quizId} AND user_id = ${userId} AND answered_at IS NULL
  `;

  return { success: true };
}

// ============================================================
// completeQuiz
// ============================================================

export async function completeQuiz(
  userId: string,
  quizId: number,
): Promise<{ success: boolean; promosso: boolean; errors: number; correct: number }> {
  const quizCheck = await sql`
    SELECT id FROM quiz
    WHERE id = ${quizId} AND user_id = ${userId} AND status = 'in_progress'
  `;
  if (!quizCheck || quizCheck.length === 0) {
    throw new Error('Quiz non trovato o non in corso');
  }

  const statsResult = await sql`
    SELECT 
      COUNT(*) FILTER (WHERE is_correct = true) as correct_count,
      COUNT(*) FILTER (WHERE is_correct = false) as errors_count
    FROM user_domanda_attempt
    WHERE quiz_id = ${quizId} AND user_id = ${userId} AND answered_at IS NOT NULL
  `;

  const stats = statsResult[0] as { correct_count: string; errors_count: string };
  const correct = parseInt(stats.correct_count, 10) || 0;
  const errors = parseInt(stats.errors_count, 10) || 0;
  const promosso = errors <= MAX_ERRORS;

  await sql`
    UPDATE quiz
    SET status = 'completed', completed_at = NOW(), promosso = ${promosso}
    WHERE id = ${quizId} AND user_id = ${userId}
  `;

  // Calcola e persiste le medie degli indicatori sulle domande risposte
  await sql`
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
      FROM user_domanda_attempt uda
      JOIN domande d ON d.id = uda.domanda_id
      WHERE uda.quiz_id = ${quizId} AND uda.user_id = ${userId}
        AND uda.answered_at IS NOT NULL
    ) sub
    WHERE quiz.id = ${quizId}
  `;

  return { success: true, promosso, errors, correct };
}

// ============================================================
// getQuizBoostCounts
// ============================================================

export async function getQuizBoostCounts(
  userId: string,
): Promise<{ errors_count: number; skull_count: number }> {
  const errorsResult = await sql`
    SELECT COUNT(DISTINCT domanda_id) as count
    FROM user_domanda_attempt
    WHERE user_id = ${userId} AND is_correct = false
  `;
  const errors_count =
    parseInt((errorsResult[0] as { count: string }).count, 10) || 0;

  const skullResult = await sql`
    SELECT COUNT(*) as count
    FROM user_domanda_skull
    WHERE user_id = ${userId}
  `;
  const skull_count =
    parseInt((skullResult[0] as { count: string }).count, 10) || 0;

  return { errors_count, skull_count };
}

// ============================================================
// getFullQuiz
// ============================================================

interface QuizDomandaWithAnswer {
  quiz_pos: number;
  domanda: DomandaRow;
  answer_given: string | null;
  is_correct: boolean | null;
}

interface FullQuizResult {
  quiz_id: number;
  quiz_type: QuizType;
  status: QuizStatus;
  promosso: boolean | null;
  created_at: string;
  completed_at: string | null;
  domande: QuizDomandaWithAnswer[];
}

export async function getFullQuiz(quizId: number): Promise<FullQuizResult> {
  const quizResult = await sql`
    SELECT id::int, quiz_type, status, promosso,
           created_at::text, completed_at::text
    FROM quiz
    WHERE id = ${quizId}
  `;

  if (!quizResult || quizResult.length === 0) {
    throw new Error('Quiz non trovato');
  }

  const quiz = quizResult[0] as {
    id: number;
    quiz_type: QuizType;
    status: QuizStatus;
    promosso: boolean | null;
    created_at: string;
    completed_at: string | null;
  };

  const domandeResult = await sql`
    SELECT 
      uda.quiz_pos, uda.answer_given, uda.is_correct,
      d.id, d.ire_plus, d.domanda, d.risposta,
      d.ambiguita, d.ambiguita_triggers,
      d.difficolta, d.difficolta_fattori,
      d.titolo_quesito, d.id_quesito, d.ire, d.immagine_path
    FROM user_domanda_attempt uda
    JOIN domande d ON d.id = uda.domanda_id
    WHERE uda.quiz_id = ${quizId}
    ORDER BY uda.quiz_pos ASC
  `;

  const domande: QuizDomandaWithAnswer[] = (
    domandeResult as Array<
      DomandaRow & {
        quiz_pos: number;
        answer_given: string | null;
        is_correct: boolean | null;
      }
    >
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
    quiz_id: quiz.id,
    quiz_type: quiz.quiz_type,
    status: quiz.status,
    promosso: quiz.promosso,
    created_at: quiz.created_at,
    completed_at: quiz.completed_at,
    domande,
  };
}
