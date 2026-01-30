import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { verifyAnswer } from './verifyAnswer';
import type { CheckResponseResult } from '~/types/db';

const checkResponseInputSchema = z.object({
  domanda_id: z.number().int().positive(),
  answer_given: z.string(),
});

/**
 * Server function per verificare se una risposta è corretta.
 * Confronta la risposta data con quella corretta nel database.
 */
export const checkResponse = createServerFn({ method: 'POST' }).handler(
  async ({ data }): Promise<CheckResponseResult> => {
    const parsed = checkResponseInputSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error('Parametri domanda_id e answer_given richiesti e validi');
    }
    const { domanda_id, answer_given } = parsed.data;
    const is_correct = await verifyAnswer(domanda_id, answer_given);
    return { is_correct };
  }
);
