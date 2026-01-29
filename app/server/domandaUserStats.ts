import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { sql } from '~/lib/db';
import type { DomandaUserStatsResult } from '~/types/db';

const domandaUserStatsInputSchema = z.object({
  user_id: z.string().min(1, 'user_id obbligatorio'),
  domanda_id: z.number().int().positive(),
});

/**
 * Server function per ottenere le statistiche di un utente su una specifica domanda.
 * Restituisce il numero totale di tentativi, quelli corretti e quelli sbagliati.
 */
export const domandaUserStats = createServerFn({ method: 'POST' }).handler(
  async ({ data }): Promise<DomandaUserStatsResult> => {
    const parsed = domandaUserStatsInputSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error('Parametri user_id e domanda_id richiesti e validi');
    }
    const { user_id, domanda_id } = parsed.data;

    const result = await sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE is_correct = true)::int AS correct,
        COUNT(*) FILTER (WHERE is_correct = false)::int AS wrong
      FROM user_domanda_attempt
      WHERE user_id = ${user_id} AND domanda_id = ${domanda_id}
    `;

    // Se nessuna riga, i contatori saranno 0
    const row = result[0] as
      | { total: number; correct: number; wrong: number }
      | undefined;

    return {
      total: row?.total ?? 0,
      correct: row?.correct ?? 0,
      wrong: row?.wrong ?? 0,
    };
  }
);
