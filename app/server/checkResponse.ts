import { createServerFn } from '@tanstack/react-start';
import { verifyAnswer } from './verifyAnswer';

/** Tipo di ritorno per checkResponse */
export interface CheckResponseResult {
  is_correct: boolean;
}

/**
 * Server function per verificare se una risposta è corretta.
 * Confronta la risposta data con quella corretta nel database.
 */
export const checkResponse = createServerFn({ method: 'POST' }).handler(
  async ({ data }) => {
    const params = data as { domanda_id: number; answer_given: string };
    const { domanda_id, answer_given } = params;
    const is_correct = await verifyAnswer(domanda_id, answer_given);
    return { is_correct } as CheckResponseResult;
  }
);
