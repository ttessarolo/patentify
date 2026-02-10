/**
 * Service per gestione skull (domande da ripassare).
 */

import { sql } from '~/lib/db';

export async function addSkull(
  userId: string,
  domandaId: number,
): Promise<{ success: boolean }> {
  await sql`
    INSERT INTO user_domanda_skull (user_id, domanda_id)
    VALUES (${userId}, ${domandaId})
    ON CONFLICT (user_id, domanda_id) DO NOTHING
  `;
  return { success: true };
}

export async function removeSkull(
  userId: string,
  domandaId: number,
): Promise<{ success: boolean }> {
  await sql`
    DELETE FROM user_domanda_skull
    WHERE user_id = ${userId} AND domanda_id = ${domandaId}
  `;
  return { success: true };
}
