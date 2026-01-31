import { createServerFn } from '@tanstack/react-start';
import { auth } from '@clerk/tanstack-react-start/server';
import { z } from 'zod';
import { sql } from '~/lib/db';
import type { SkullResult } from '~/types/db';

const skullInputSchema = z.object({
  domanda_id: z.number().int().positive(),
});

/**
 * Server function per aggiungere una domanda agli skull dell'utente.
 * Lo user_id viene ottenuto server-side tramite Clerk auth().
 */
export const addSkull = createServerFn({ method: 'POST' }).handler(
  async ({ data }): Promise<SkullResult> => {
    // Get userId from Clerk server-side auth
    const { userId } = await auth();
    if (!userId) {
      throw new Error('Autenticazione richiesta per aggiungere uno skull');
    }

    const parsed = skullInputSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error('Parametro domanda_id richiesto e valido');
    }
    const { domanda_id } = parsed.data;

    // Insert con ON CONFLICT DO NOTHING per evitare duplicati
    await sql`
      INSERT INTO user_domanda_skull (user_id, domanda_id)
      VALUES (${userId}, ${domanda_id})
      ON CONFLICT (user_id, domanda_id) DO NOTHING
    `;

    return { success: true };
  }
);

/**
 * Server function per rimuovere una domanda dagli skull dell'utente.
 * Lo user_id viene ottenuto server-side tramite Clerk auth().
 */
export const removeSkull = createServerFn({ method: 'POST' }).handler(
  async ({ data }): Promise<SkullResult> => {
    // Get userId from Clerk server-side auth
    const { userId } = await auth();
    if (!userId) {
      throw new Error('Autenticazione richiesta per rimuovere uno skull');
    }

    const parsed = skullInputSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error('Parametro domanda_id richiesto e valido');
    }
    const { domanda_id } = parsed.data;

    await sql`
      DELETE FROM user_domanda_skull
      WHERE user_id = ${userId} AND domanda_id = ${domanda_id}
    `;

    return { success: true };
  }
);
