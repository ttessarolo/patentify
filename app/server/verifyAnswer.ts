import { sql } from '~/lib/db';

/**
 * Verifica se la risposta data è corretta per la domanda.
 * Usata da checkResponse e trackAttempt.
 */
export async function verifyAnswer(
  domanda_id: number,
  answer_given: string
): Promise<boolean> {
  const result = await sql`
    SELECT risposta FROM domande WHERE id = ${domanda_id}
  `;

  if (!result || result.length === 0) {
    throw new Error(`Domanda con id ${domanda_id} non trovata`);
  }

  const risposta = (result[0] as { risposta: string | null }).risposta;

  if (!risposta) {
    throw new Error(`Risposta non definita per domanda ${domanda_id}`);
  }

  const normalizedRisposta = risposta.trim().toLowerCase();
  const normalizedAnswer = answer_given.trim().toLowerCase();

  return normalizedRisposta === normalizedAnswer;
}
