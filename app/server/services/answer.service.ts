/**
 * Service per la verifica delle risposte.
 * Helper condiviso usato da attempt.service (checkResponse e trackAttempt).
 */

import { sql } from '~/lib/db';

/**
 * Verifica se la risposta data è corretta per la domanda.
 */
export async function verifyAnswer(
  domandaId: number,
  answerGiven: string,
): Promise<boolean> {
  const result = await sql`
    SELECT risposta FROM domande WHERE id = ${domandaId}
  `;

  if (!result || result.length === 0) {
    throw new Error(`Domanda con id ${domandaId} non trovata`);
  }

  const risposta = (result[0] as { risposta: string | null }).risposta;

  if (!risposta) {
    throw new Error(`Risposta non definita per domanda ${domandaId}`);
  }

  const normalizedRisposta = risposta.trim().toLowerCase();
  const normalizedAnswer = answerGiven.trim().toLowerCase();

  return normalizedRisposta === normalizedAnswer;
}
