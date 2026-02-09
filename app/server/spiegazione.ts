import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { sql } from '~/lib/db';
import type { GetSpiegazioneResult } from '~/types/db';

const getSpiegazioneInputSchema = z.object({
  domanda_id: z.number().int().positive(),
});

/**
 * Server function per ottenere la spiegazione di una domanda.
 * La spiegazione è pubblica: non richiede autenticazione.
 * Fa match sulla tabella spiegazioni_risposte tramite l'id della domanda.
 */
export const getSpiegazione = createServerFn({ method: 'POST' }).handler(
  async ({ data }): Promise<GetSpiegazioneResult> => {
    const parsed = getSpiegazioneInputSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error('Parametro domanda_id richiesto e valido');
    }
    const { domanda_id } = parsed.data;

    const result = await sql`
      SELECT spiegazione
      FROM spiegazioni_risposte
      WHERE id = ${domanda_id}
    `;

    const row = result[0] as { spiegazione: string | null } | undefined;

    return {
      spiegazione: row?.spiegazione ?? null,
    };
  }
);
