import { createServerFn } from '@tanstack/react-start';
import { auth } from '@clerk/tanstack-react-start/server';
import { z } from 'zod';
import { sql } from '~/lib/db';
import type { DomandaUserStatsResult } from '~/types/db';

const domandaUserStatsInputSchema = z.object({
  domanda_id: z.number().int().positive(),
});

/**
 * Server function per ottenere le statistiche di un utente su una specifica domanda.
 * Lo user_id viene ottenuto server-side tramite Clerk auth().
 * Restituisce il numero totale di tentativi, quelli corretti e quelli sbagliati.
 */
export const domandaUserStats = createServerFn({ method: 'POST' }).handler(
  async ({ data }): Promise<DomandaUserStatsResult> => {
    // Get userId from Clerk server-side auth
    const { userId } = await auth();
    if (!userId) {
      // Return empty stats if not authenticated
      return { total: 0, correct: 0, wrong: 0 };
    }

    const parsed = domandaUserStatsInputSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error('Parametro domanda_id richiesto e valido');
    }
    const { domanda_id } = parsed.data;

    const result = await sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE is_correct = true)::int AS correct,
        COUNT(*) FILTER (WHERE is_correct = false)::int AS wrong
      FROM user_domanda_attempt
      WHERE user_id = ${userId} AND domanda_id = ${domanda_id}
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
