/**
 * Service per le spiegazioni delle domande.
 */

import { sql } from '~/lib/db';

export async function getSpiegazione(
  domandaId: number,
): Promise<{ spiegazione: string | null }> {
  const result = await sql`
    SELECT spiegazione
    FROM spiegazioni_risposte
    WHERE id = ${domandaId}
  `;

  const row = result[0] as { spiegazione: string | null } | undefined;

  return {
    spiegazione: row?.spiegazione ?? null,
  };
}
