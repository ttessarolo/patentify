import { createServerFn } from '@tanstack/react-start';
import { TTLMap } from '@ttessarolo/ttl-map-array';
import { sql } from '~/lib/db';
import type { Domanda } from '~/types/db';

// Cache per gli ambiti (TTL parametrico, default 5 minuti)
const cache = new TTLMap<string, string[]>();

/**
 * Server function per ottenere le domande filtrate per l'esercitazione.
 * Se nessun parametro è valorizzato, restituisce domande random.
 */
export const getDomandeEsercitazione = createServerFn({
  method: 'GET',
}).handler(async ({ data }) => {
  const params = (data ?? {}) as {
    search?: string;
    ire_plus?: number;
    ambiguita?: number;
    difficolta?: number;
    titolo_quesito?: string;
    limit?: number;
    offset?: number;
  };

  const {
    search,
    ire_plus,
    ambiguita,
    difficolta,
    titolo_quesito,
    limit = 10,
    offset = 0,
  } = params;

  // Verifica se ci sono filtri significativi
  const hasFilters =
    search || ire_plus || ambiguita || difficolta || titolo_quesito;

  if (!hasFilters) {
    // Nessun filtro: restituisce domande random (ignora offset)
    const result = await sql`
        SELECT * FROM domande
        ORDER BY RANDOM()
        LIMIT ${limit}
      `;
    return result as Domanda[];
  }

  // Per query con filtri dinamici, costruiamo le condizioni
  // Ordinamento deterministico (ORDER BY id) per supportare paginazione
  const searchPattern = search ? `%${search}%` : null;

  const result = await sql`
      SELECT * FROM domande
      WHERE 1=1
        ${searchPattern ? sql`AND domanda ILIKE ${searchPattern}` : sql``}
        ${ire_plus !== undefined ? sql`AND ire_plus = ${ire_plus}` : sql``}
        ${ambiguita !== undefined ? sql`AND ambiguita = ${ambiguita}` : sql``}
        ${difficolta !== undefined ? sql`AND difficolta = ${difficolta}` : sql``}
        ${titolo_quesito ? sql`AND titolo_quesito = ${titolo_quesito}` : sql``}
      ORDER BY id
      LIMIT ${limit}
      OFFSET ${offset}
    `;

  return result as Domanda[];
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
