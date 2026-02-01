import { createServerFn } from '@tanstack/react-start';
import { auth } from '@clerk/tanstack-react-start/server';
import { z } from 'zod';
import { sql } from '~/lib/db';
import type {
  GenerateQuizResult,
  GetQuizDomandaResult,
  AbortQuizResult,
  CompleteQuizResult,
  GetQuizBoostCountsResult,
  GetFullQuizResult,
  QuizDomandaWithAnswer,
  Domanda,
  QuizType,
  QuizStatus,
} from '~/types/db';

// ============================================================
// Schema di validazione
// ============================================================

const generateQuizInputSchema = z.object({
  quiz_type: z.enum(['standard', 'difficile', 'ambiguo']),
  boost_errors: z.boolean(),
  boost_skull: z.boolean(),
});

const getQuizDomandaInputSchema = z.object({
  quiz_id: z.coerce.number().int().positive(),
  quiz_pos: z.coerce.number().int().min(1).max(40),
});

const abortQuizInputSchema = z.object({
  quiz_id: z.coerce.number().int().positive(),
});

const completeQuizInputSchema = z.object({
  quiz_id: z.coerce.number().int().positive(),
});

const getFullQuizInputSchema = z.object({
  quiz_id: z.coerce.number().int().positive(),
});

import { QUIZ_SIZE, MIN_SEGNALI, MIN_PRECEDENZE, MAX_ERRORS } from '~/commons';

// Pattern per identificare ambiti obbligatori
const SEGNALI_PATTERN = '%segnali%';
const SEGNALETICA_PATTERN = '%segnaletica%';
const PANNELLI_PATTERN = '%pannelli%';
const PRECEDENZE_PATTERN = '%precedenza%';

// ============================================================
// generateQuiz
// ============================================================

/**
 * Server function per generare un nuovo quiz.
 * Seleziona 40 domande secondo i criteri specificati e le scrive nel DB.
 */
export const generateQuiz = createServerFn({ method: 'POST' }).handler(
  async ({ data }): Promise<GenerateQuizResult> => {
    const { userId } = await auth();
    if (!userId) {
      throw new Error('Autenticazione richiesta per generare un quiz');
    }

    const parsed = generateQuizInputSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error('Parametri quiz_type, boost_errors, boost_skull richiesti');
    }

    const { quiz_type, boost_errors, boost_skull } = parsed.data;

    // 1. Crea entry nella tabella quiz
    const quizResult = await sql`
      INSERT INTO quiz (user_id, status, quiz_type, boost_errors, boost_skull)
      VALUES (${userId}, 'in_progress', ${quiz_type}, ${boost_errors}, ${boost_skull})
      RETURNING id
    `;
    const quizId = (quizResult[0] as { id: number }).id;

    // 2. Seleziona le 40 domande secondo i criteri
    const selectedDomande = await selectQuizDomande(
      userId,
      quiz_type,
      boost_errors,
      boost_skull
    );

    // 3. Inserisci le domande nella tabella user_domanda_attempt
    for (let i = 0; i < selectedDomande.length; i++) {
      const domandaId = selectedDomande[i];
      const pos = i + 1;

      await sql`
        INSERT INTO user_domanda_attempt (
          user_id,
          domanda_id,
          quiz_id,
          quiz_pos,
          answered_at,
          answer_given,
          is_correct
        ) VALUES (
          ${userId},
          ${domandaId},
          ${quizId},
          ${pos},
          ${null},
          ${null},
          ${null}
        )
      `;
    }

    return { quiz_id: quizId };
  }
);

/**
 * Seleziona 40 domande per il quiz secondo i criteri specificati.
 * Garantisce domande su Segnali Stradali e Precedenze.
 */
async function selectQuizDomande(
  userId: string,
  quizType: QuizType,
  boostErrors: boolean,
  boostSkull: boolean
): Promise<number[]> {
  const selectedIds = new Set<number>();

  // Helper per aggiungere ID filtrandoli
  const addIds = (rows: { id?: number; domanda_id?: number }[], max: number): void => {
    for (const row of rows) {
      if (selectedIds.size >= max) break;
      const id = row.id ?? row.domanda_id;
      if (id !== undefined && !selectedIds.has(id)) {
        selectedIds.add(id);
      }
    }
  };

  // 1. FASE BOOST: Se attivo, raccoglie domande prioritarie
  if (boostErrors) {
    // Domande già sbagliate dall'utente (usa subquery per DISTINCT + ORDER BY RANDOM)
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
    // Domande marcate come skull dall'utente (fetch più domande, filtriamo in JS)
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
  // Fetch più domande di quelle necessarie, filtriamo in JS
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
  // Aggiungi fino a MIN_SEGNALI domande sui segnali
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

  // 4. FASE DISTRIBUZIONE: Riempie il resto cercando di distribuire tra gli ambiti
  if (selectedIds.size < QUIZ_SIZE) {
    // Ottiene tutti gli ambiti distinti
    const ambitiResult = await sql`
      SELECT DISTINCT titolo_quesito
      FROM domande
      WHERE titolo_quesito IS NOT NULL
      ORDER BY titolo_quesito
    `;
    const ambiti = (ambitiResult as { titolo_quesito: string }[]).map(
      (r) => r.titolo_quesito
    );

    // Calcola quante domande per ambito (distribuzione equa)
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

  // 5. FASE FINALE: Se ancora mancano domande, prende random
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

  // Converte il Set in array e mescola per ordine casuale nel quiz
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

/**
 * Server function per ottenere una domanda del quiz in base alla posizione.
 */
export const getQuizDomanda = createServerFn({ method: 'POST' }).handler(
  async ({ data }): Promise<GetQuizDomandaResult> => {
    const { userId } = await auth();
    if (!userId) {
      throw new Error('Autenticazione richiesta');
    }

    const parsed = getQuizDomandaInputSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error('Parametri quiz_id e quiz_pos richiesti');
    }

    const { quiz_id, quiz_pos } = parsed.data;

    // Verifica che il quiz appartenga all'utente e sia in_progress
    const quizCheck = await sql`
      SELECT id FROM quiz
      WHERE id = ${quiz_id}
        AND user_id = ${userId}
        AND status = 'in_progress'
    `;
    if (!quizCheck || quizCheck.length === 0) {
      throw new Error('Quiz non trovato o non in corso');
    }

    // Ottiene la domanda dalla tabella user_domanda_attempt con JOIN su domande
    const result = await sql`
      SELECT 
        uda.domanda_id,
        d.id,
        d.ire_plus,
        d.domanda,
        d.risposta,
        d.ambiguita,
        d.ambiguita_triggers,
        d.difficolta,
        d.difficolta_fattori,
        d.titolo_quesito,
        d.id_quesito,
        d.ire,
        d.immagine_path
      FROM user_domanda_attempt uda
      JOIN domande d ON d.id = uda.domanda_id
      WHERE uda.quiz_id = ${quiz_id}
        AND uda.quiz_pos = ${quiz_pos}
        AND uda.user_id = ${userId}
    `;

    if (!result || result.length === 0) {
      throw new Error(`Domanda non trovata per quiz ${quiz_id} pos ${quiz_pos}`);
    }

    const row = result[0] as Domanda & { domanda_id: number };

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
);

// ============================================================
// abortQuiz
// ============================================================

/**
 * Server function per abortire un quiz in corso.
 * Imposta status = 'abandoned' e cancella le domande non risposte.
 */
export const abortQuiz = createServerFn({ method: 'POST' }).handler(
  async ({ data }): Promise<AbortQuizResult> => {
    const { userId } = await auth();
    if (!userId) {
      throw new Error('Autenticazione richiesta');
    }

    const parsed = abortQuizInputSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error('Parametro quiz_id richiesto');
    }

    const { quiz_id } = parsed.data;

    // Verifica che il quiz appartenga all'utente
    const quizCheck = await sql`
      SELECT id, status FROM quiz
      WHERE id = ${quiz_id}
        AND user_id = ${userId}
    `;
    if (!quizCheck || quizCheck.length === 0) {
      throw new Error('Quiz non trovato');
    }

    const quiz = quizCheck[0] as { id: number; status: string };
    if (quiz.status !== 'in_progress') {
      // Quiz già terminato, non fare nulla
      return { success: true };
    }

    // Aggiorna lo status del quiz
    await sql`
      UPDATE quiz
      SET status = 'abandoned', completed_at = NOW()
      WHERE id = ${quiz_id}
        AND user_id = ${userId}
    `;

    // Cancella le domande non ancora risposte (answered_at IS NULL)
    await sql`
      DELETE FROM user_domanda_attempt
      WHERE quiz_id = ${quiz_id}
        AND user_id = ${userId}
        AND answered_at IS NULL
    `;

    return { success: true };
  }
);

// ============================================================
// completeQuiz
// ============================================================

/**
 * Server function per completare un quiz (tutte 40 domande risposte).
 * Calcola il risultato, imposta promosso e status = 'completed'.
 */
export const completeQuiz = createServerFn({ method: 'POST' }).handler(
  async ({ data }): Promise<CompleteQuizResult> => {
    const { userId } = await auth();
    if (!userId) {
      throw new Error('Autenticazione richiesta');
    }

    const parsed = completeQuizInputSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error('Parametro quiz_id richiesto');
    }

    const { quiz_id } = parsed.data;

    // Verifica che il quiz appartenga all'utente e sia in_progress
    const quizCheck = await sql`
      SELECT id FROM quiz
      WHERE id = ${quiz_id}
        AND user_id = ${userId}
        AND status = 'in_progress'
    `;
    if (!quizCheck || quizCheck.length === 0) {
      throw new Error('Quiz non trovato o non in corso');
    }

    // Calcola il numero di risposte corrette e sbagliate
    const statsResult = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE is_correct = true) as correct_count,
        COUNT(*) FILTER (WHERE is_correct = false) as errors_count
      FROM user_domanda_attempt
      WHERE quiz_id = ${quiz_id}
        AND user_id = ${userId}
        AND answered_at IS NOT NULL
    `;

    const stats = statsResult[0] as { correct_count: string; errors_count: string };
    const correct = parseInt(stats.correct_count, 10) || 0;
    const errors = parseInt(stats.errors_count, 10) || 0;
    const promosso = errors <= MAX_ERRORS;

    // Aggiorna lo status del quiz con l'esito
    await sql`
      UPDATE quiz
      SET status = 'completed', completed_at = NOW(), promosso = ${promosso}
      WHERE id = ${quiz_id}
        AND user_id = ${userId}
    `;

    return { success: true, promosso, errors, correct };
  }
);

// ============================================================
// getQuizBoostCounts
// ============================================================

/**
 * Server function per ottenere il numero di risposte errate e domande skull dell'utente.
 * Usata per determinare se abilitare i boost nella pagina di configurazione quiz.
 */
export const getQuizBoostCounts = createServerFn({ method: 'GET' }).handler(
  async (): Promise<GetQuizBoostCountsResult> => {
    const { userId } = await auth();
    if (!userId) {
      throw new Error('Autenticazione richiesta');
    }

    // Conta le domande distinte che l'utente ha sbagliato almeno una volta
    const errorsResult = await sql`
      SELECT COUNT(DISTINCT domanda_id) as count
      FROM user_domanda_attempt
      WHERE user_id = ${userId}
        AND is_correct = false
    `;
    const errors_count = parseInt((errorsResult[0] as { count: string }).count, 10) || 0;

    // Conta le domande marcate come skull
    const skullResult = await sql`
      SELECT COUNT(*) as count
      FROM user_domanda_skull
      WHERE user_id = ${userId}
    `;
    const skull_count = parseInt((skullResult[0] as { count: string }).count, 10) || 0;

    return { errors_count, skull_count };
  }
);

// ============================================================
// getFullQuiz
// ============================================================

/**
 * Server function per ottenere tutte le domande di un quiz con le risposte date.
 * NON verifica user_id per permettere la condivisione del quiz con altri utenti.
 * Richiede comunque autenticazione per evitare accessi anonimi.
 */
export const getFullQuiz = createServerFn({ method: 'GET' }).handler(
  async ({ data }): Promise<GetFullQuizResult> => {
    // Verifica autenticazione (ma non controlla che sia il proprietario del quiz)
    const { userId } = await auth();
    if (!userId) {
      throw new Error('Autenticazione richiesta per visualizzare il quiz');
    }

    const parsed = getFullQuizInputSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error('Parametro quiz_id richiesto');
    }

    const { quiz_id } = parsed.data;

    // Ottiene i dati del quiz (senza verificare user_id per permettere condivisione)
    const quizResult = await sql`
      SELECT id, quiz_type, status, promosso, created_at, completed_at
      FROM quiz
      WHERE id = ${quiz_id}
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

    // Ottiene tutte le domande del quiz con le risposte
    const domandeResult = await sql`
      SELECT 
        uda.quiz_pos,
        uda.answer_given,
        uda.is_correct,
        d.id,
        d.ire_plus,
        d.domanda,
        d.risposta,
        d.ambiguita,
        d.ambiguita_triggers,
        d.difficolta,
        d.difficolta_fattori,
        d.titolo_quesito,
        d.id_quesito,
        d.ire,
        d.immagine_path
      FROM user_domanda_attempt uda
      JOIN domande d ON d.id = uda.domanda_id
      WHERE uda.quiz_id = ${quiz_id}
      ORDER BY uda.quiz_pos ASC
    `;

    const domande: QuizDomandaWithAnswer[] = (
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
      quiz_id: quiz.id,
      quiz_type: quiz.quiz_type,
      status: quiz.status,
      promosso: quiz.promosso,
      created_at: quiz.created_at,
      completed_at: quiz.completed_at,
      domande,
    };
  }
);
