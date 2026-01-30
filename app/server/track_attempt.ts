import { createServerFn } from '@tanstack/react-start';
import { auth } from '@clerk/tanstack-react-start/server';
import { z } from 'zod';
import { sql } from '~/lib/db';
import type { TrackAttemptResult } from '~/types/db';

import { verifyAnswer } from './verifyAnswer';

const trackAttemptInputSchema = z.object({
  domanda_id: z.number().int().positive(),
  answer_given: z.string(),
});

/**
 * Server function per tracciare un tentativo di risposta.
 * Lo user_id viene ottenuto server-side tramite Clerk auth().
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
    const { domanda_id, answer_given } = parsed.data;

    const is_correct = await verifyAnswer(domanda_id, answer_given);

    const now = new Date().toISOString();
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
