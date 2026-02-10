/**
 * Service per la modalità esercitazione.
 */

import { sql } from '~/lib/db';
import { TTLMap } from '@ttessarolo/ttl-map-array';

// Cache per gli ambiti (TTL parametrico, default 5 minuti)
const cache = new TTLMap<string, string[]>();

// ============================================================
// getDomandeEsercitazione
// ============================================================

export interface GetDomandeInput {
  search?: string;
  ire_plus?: number;
  ambiguita?: number;
  difficolta?: number;
  titolo_quesito?: string;
  limit: number;
  offset: number;
  ordinamento_casuale?: boolean;
}

interface DomandaWithSkullRow {
  id: number;
  ire_plus: number | null;
  domanda: string | null;
  risposta: string | null;
  ambiguita: number | null;
  ambiguita_triggers: string | null;
  difficolta: number | null;
  difficolta_fattori: string | null;
  titolo_quesito: string | null;
  id_quesito: string | null;
  ire: number | null;
  immagine_path: string | null;
  skull: boolean;
}

export async function getDomandeEsercitazione(
  userId: string | null,
  input: GetDomandeInput,
): Promise<DomandaWithSkullRow[]> {
  const userIdForQuery = userId ?? '';
  const {
    search,
    ire_plus,
    ambiguita,
    difficolta,
    titolo_quesito,
    limit = 10,
    offset = 0,
    ordinamento_casuale = true,
  } = input;

  const hasFilters =
    search || ire_plus || ambiguita || difficolta || titolo_quesito;

  if (!hasFilters) {
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
    return result as DomandaWithSkullRow[];
  }

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

  return result as DomandaWithSkullRow[];
}

// ============================================================
// getAmbitiDistinct
// ============================================================

export async function getAmbitiDistinct(ttlMs?: number): Promise<string[]> {
  const ttl = ttlMs ?? 5 * 60 * 1000; // Default 5 minuti
  const cacheKey = 'ambiti';

  const cached = cache.get(cacheKey);
  if (cached && cached.length > 0) {
    return cached;
  }

  const result = await sql`
    SELECT DISTINCT titolo_quesito
    FROM domande
    WHERE titolo_quesito IS NOT NULL
    ORDER BY titolo_quesito
  `;

  const ambiti = (result as { titolo_quesito: string | null }[])
    .map((row) => row.titolo_quesito)
    .filter((v): v is string => v !== null);

  cache.set(cacheKey, ambiti, { ttl });

  return ambiti;
}
