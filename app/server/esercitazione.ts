import { createServerFn } from '@tanstack/react-start';
import { auth } from '@clerk/tanstack-react-start/server';
import { TTLMap } from '@ttessarolo/ttl-map-array';
import { sql } from '~/lib/db';
import type { DomandaWithSkull } from '~/types/db';

// Cache per gli ambiti (TTL parametrico, default 5 minuti)
const cache = new TTLMap<string, string[]>();

/**
 * Server function per ottenere le domande filtrate per l'esercitazione.
 * Se nessun parametro è valorizzato, restituisce domande random.
 * Include il flag skull per ogni domanda (true se l'utente l'ha segnata).
 */
export const getDomandeEsercitazione = createServerFn({
  method: 'GET',
}).handler(async ({ data }): Promise<DomandaWithSkull[]> => {
  // Get userId from Clerk server-side auth (può essere null se non loggato)
  const { userId } = await auth();
  const userIdForQuery = userId ?? '';

  const params = (data ?? {}) as {
    search?: string;
    ire_plus?: number;
    ambiguita?: number;
    difficolta?: number;
    titolo_quesito?: string;
    limit?: number;
    offset?: number;
    /** Se true, ordina con ORDER BY RANDOM(); se false, ordine naturale DB (d.id) */
    ordinamento_casuale?: boolean;
  };

  const {
    search,
    ire_plus,
    ambiguita,
    difficolta,
    titolo_quesito,
    limit = 10,
    offset = 0,
    ordinamento_casuale = true,
  } = params;

  // Verifica se ci sono filtri significativi
  const hasFilters =
    search || ire_plus || ambiguita || difficolta || titolo_quesito;

  if (!hasFilters) {
    // Nessun filtro: ordinamento in base a ordinamento_casuale (se random, ignora offset)
    const result = await sql`
      SELECT 
        d.*,
        (uds.domanda_id IS NOT NULL) AS skull
      FROM domande d
      LEFT JOIN user_domanda_skull uds 
        ON d.id = uds.domanda_id AND uds.user_id = ${userIdForQuery}
      ${ordinamento_casuale ? sql`ORDER BY RANDOM()` : sql`ORDER BY d.id`}
      LIMIT ${limit}
      ${ordinamento_casuale ? sql`` : sql`OFFSET ${offset}`}
    `;
    return result as DomandaWithSkull[];
  }

  // Per query con filtri dinamici, costruiamo le condizioni
  const searchPattern = search ? `%${search}%` : null;

  const result = await sql`
    SELECT 
      d.*,
      (uds.domanda_id IS NOT NULL) AS skull
    FROM domande d
    LEFT JOIN user_domanda_skull uds 
      ON d.id = uds.domanda_id AND uds.user_id = ${userIdForQuery}
    WHERE 1=1
      ${searchPattern ? sql`AND d.domanda ILIKE ${searchPattern}` : sql``}
      ${ire_plus !== undefined ? sql`AND d.ire_plus = ${ire_plus}` : sql``}
      ${ambiguita !== undefined ? sql`AND d.ambiguita = ${ambiguita}` : sql``}
      ${difficolta !== undefined ? sql`AND d.difficolta = ${difficolta}` : sql``}
      ${titolo_quesito ? sql`AND d.titolo_quesito = ${titolo_quesito}` : sql``}
    ${ordinamento_casuale ? sql`ORDER BY RANDOM()` : sql`ORDER BY d.id`}
    LIMIT ${limit}
    ${ordinamento_casuale ? sql`` : sql`OFFSET ${offset}`}
  `;

  return result as DomandaWithSkull[];
});

/**
 * Server function per ottenere la lista distinta degli ambiti (titolo_quesito).
 * Utilizza cache con TTL parametrico (default 5 minuti).
 */
export const getAmbitiDistinct = createServerFn({ method: 'GET' }).handler(
  async ({ data }) => {
    const params = (data ?? {}) as { ttlMs?: number };
    const ttlMs = params?.ttlMs ?? 5 * 60 * 1000; // Default 5 minuti
    const cacheKey = 'ambiti';

    // Verifica cache
    const cached = cache.get(cacheKey);
    if (cached && cached.length > 0) {
      return cached;
    }

    // Query al database
    const result = await sql`
      SELECT DISTINCT titolo_quesito
      FROM domande
      WHERE titolo_quesito IS NOT NULL
      ORDER BY titolo_quesito
    `;

    // Filtra null e converti in array di stringhe
    const ambiti = (result as { titolo_quesito: string | null }[])
      .map((row) => row.titolo_quesito)
      .filter((v): v is string => v !== null);

    // Salva in cache con TTL
    cache.set(cacheKey, ambiti, { ttl: ttlMs });

    return ambiti;
  }
);
