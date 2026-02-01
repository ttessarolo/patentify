import { createServerFn } from '@tanstack/react-start';
import { auth } from '@clerk/tanstack-react-start/server';
import { z } from 'zod';
import { sql } from '~/lib/db';
import type { TrackAttemptResult } from '~/types/db';

import { verifyAnswer } from './verifyAnswer';

const trackAttemptInputSchema = z.object({
  domanda_id: z.coerce.number().int().positive(),
  answer_given: z.string(),
  quiz_id: z.coerce.number().int().positive().optional(),
  quiz_pos: z.coerce.number().int().min(1).max(40).optional(),
});

/**
 * Server function per tracciare un tentativo di risposta.
 * Lo user_id viene ottenuto server-side tramite Clerk auth().
 *
 * Se quiz_id e quiz_pos sono forniti, fa UPDATE della riga esistente
 * (creata da generateQuiz). Altrimenti fa INSERT (esercitazione libera).
 */
export const trackAttempt = createServerFn({ method: 'POST' }).handler(
  async ({ data }): Promise<TrackAttemptResult> => {
    // Get userId from Clerk server-side auth
    const { userId } = await auth();
    if (!userId) {
      throw new Error('Autenticazione richiesta per tracciare i tentativi');
    }

    const parsed = trackAttemptInputSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error('Parametri domanda_id e answer_given richiesti e validi');
    }
    const { domanda_id, answer_given, quiz_id, quiz_pos } = parsed.data;

    // Validazione: quiz_id e quiz_pos devono essere entrambi presenti o entrambi assenti
    if ((quiz_id !== undefined) !== (quiz_pos !== undefined)) {
      throw new Error('quiz_id e quiz_pos devono essere entrambi presenti o entrambi assenti');
    }

    const is_correct = await verifyAnswer(domanda_id, answer_given);
    const now = new Date().toISOString();

    // Se quiz_id e quiz_pos sono forniti, fa UPDATE della riga esistente
    if (quiz_id !== undefined && quiz_pos !== undefined) {
      // Verifica che la riga esista e appartenga all'utente
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

      const attempt_id = (existingRow[0] as { id: number }).id;

      // UPDATE della riga esistente
      await sql`
        UPDATE user_domanda_attempt
        SET 
          answered_at = ${now},
          answer_given = ${answer_given},
          is_correct = ${is_correct}
        WHERE id = ${attempt_id}
      `;

      return {
        success: true,
        is_correct,
        attempt_id,
      };
    }

    // Altrimenti fa INSERT (comportamento originale per esercitazione libera)
    const result = await sql`
      INSERT INTO user_domanda_attempt (
        user_id,
        domanda_id,
        quiz_id,
        quiz_pos,
        asked_at,
        answered_at,
        answer_given,
        is_correct
      ) VALUES (
        ${userId},
        ${domanda_id},
        ${null},
        ${null},
        ${now},
        ${now},
        ${answer_given},
        ${is_correct}
      )
      RETURNING id
    `;

    const attempt_id = (result[0] as { id: number }).id;

    return {
      success: true,
      is_correct,
      attempt_id,
    };
  }
);
