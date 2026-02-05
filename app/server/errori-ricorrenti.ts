import { createServerFn } from '@tanstack/react-start';
import { auth } from '@clerk/tanstack-react-start/server';
import { z } from 'zod';
import { sql } from '~/lib/db';
import type {
  TimePeriod,
  ErroriStatsResult,
  TopCategorieErroriResult,
  DomandeErroriResult,
  DomandeEsatteResult,
  DomandeSkullResult,
  AllCategorieErroriResult,
  CategoriaErrori,
  DomandaConErrori,
  DomandaConEsatte,
  DomandaSkull,
  Domanda,
} from '~/types/db';

// ============================================================
// Schema di validazione
// ============================================================

const periodSchema = z.enum(['oggi', 'settimana', 'mese', 'tutti']);

const erroriParamsSchema = z.object({
  period: periodSchema,
  limit: z.coerce.number().int().positive().optional().default(10),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

const topCategorieSchema = z.object({
  period: periodSchema,
  limit: z.coerce.number().int().positive().optional().default(5),
});

// ============================================================
// Helper per filtro periodo temporale
// ============================================================

/**
 * Genera la condizione SQL per filtrare per periodo temporale.
 * @param period - Il periodo selezionato
 * @param column - Nome della colonna da filtrare (default: 'uda.answered_at')
 */
function getPeriodFilter(
  period: TimePeriod,
  column: string = 'uda.answered_at'
): ReturnType<typeof sql> {
  switch (period) {
    case 'oggi':
      return sql`AND ${sql.unsafe(column)} >= CURRENT_DATE`;
    case 'settimana':
      return sql`AND ${sql.unsafe(column)} >= CURRENT_DATE - INTERVAL '7 days'`;
    case 'mese':
      return sql`AND ${sql.unsafe(column)} >= CURRENT_DATE - INTERVAL '30 days'`;
    case 'tutti':
    default:
      return sql``;
  }
}

// ============================================================
// getErroriStats - Statistiche generali
// ============================================================

/**
 * Server function per ottenere le statistiche generali degli errori.
 */
export const getErroriStats = createServerFn({ method: 'GET' }).handler(
  async ({ data }): Promise<ErroriStatsResult> => {
    const { userId } = await auth();
    if (!userId) {
      throw new Error('Autenticazione richiesta');
    }

    const parsed = z.object({ period: periodSchema }).safeParse(data);
    if (!parsed.success) {
      throw new Error('Parametro period richiesto');
    }

    const { period } = parsed.data;
    const periodFilter = getPeriodFilter(period);

    // Query per statistiche risposte nel periodo
    const statsResult = await sql`
      SELECT 
        COUNT(*) as totale_risposte,
        COUNT(*) FILTER (WHERE uda.is_correct = true) as risposte_corrette,
        COUNT(*) FILTER (WHERE uda.is_correct = false) as risposte_errate,
        COUNT(DISTINCT uda.domanda_id) as domande_uniche_risposte
      FROM user_domanda_attempt uda
      WHERE uda.user_id = ${userId}
        AND uda.answered_at IS NOT NULL
        ${periodFilter}
    `;

    const stats = statsResult[0] as {
      totale_risposte: string;
      risposte_corrette: string;
      risposte_errate: string;
      domande_uniche_risposte: string;
    };

    // Query per totale domande nel DB
    const totaleDomandeResult = await sql`
      SELECT COUNT(*) as count FROM domande
    `;
    const totale_domande_db = parseInt(
      (totaleDomandeResult[0] as { count: string }).count,
      10
    );

    // Query per skull count filtrato per periodo
    const skullPeriodFilter = getPeriodFilter(period, 'inserted_at');
    const skullResult = await sql`
      SELECT COUNT(*) as count
      FROM user_domanda_skull
      WHERE user_id = ${userId}
        ${skullPeriodFilter}
    `;
    const skull_count = parseInt(
      (skullResult[0] as { count: string }).count,
      10
    );

    const totale_risposte = parseInt(stats.totale_risposte, 10) || 0;
    const risposte_corrette = parseInt(stats.risposte_corrette, 10) || 0;
    const risposte_errate = parseInt(stats.risposte_errate, 10) || 0;
    const domande_uniche_risposte =
      parseInt(stats.domande_uniche_risposte, 10) || 0;

    // Calcola copertura
    const copertura =
      totale_domande_db > 0
        ? Math.round((domande_uniche_risposte / totale_domande_db) * 100)
        : 0;

    return {
      copertura,
      totale_risposte,
      risposte_corrette,
      risposte_errate,
      skull_count,
      domande_uniche_risposte,
      totale_domande_db,
    };
  }
);

// ============================================================
// getTopCategorieErrori - Top N categorie con più errori
// ============================================================

/**
 * Server function per ottenere le top N categorie con più errori.
 */
export const getTopCategorieErrori = createServerFn({ method: 'GET' }).handler(
  async ({ data }): Promise<TopCategorieErroriResult> => {
    const { userId } = await auth();
    if (!userId) {
      throw new Error('Autenticazione richiesta');
    }

    const parsed = topCategorieSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error('Parametri non validi');
    }

    const { period, limit } = parsed.data;
    const periodFilter = getPeriodFilter(period);

    // Conta totale risposte per calcolare percentuale
    const totaleResult = await sql`
      SELECT COUNT(*) as count
      FROM user_domanda_attempt uda
      WHERE uda.user_id = ${userId}
        AND uda.answered_at IS NOT NULL
        AND uda.is_correct = false
        ${periodFilter}
    `;
    const totaleErrori = parseInt(
      (totaleResult[0] as { count: string }).count,
      10
    );

    // Query per categorie con più errori
    const categorieResult = await sql`
      SELECT 
        d.titolo_quesito,
        COUNT(*) as errori_count
      FROM user_domanda_attempt uda
      JOIN domande d ON d.id = uda.domanda_id
      WHERE uda.user_id = ${userId}
        AND uda.answered_at IS NOT NULL
        AND uda.is_correct = false
        AND d.titolo_quesito IS NOT NULL
        ${periodFilter}
      GROUP BY d.titolo_quesito
      ORDER BY errori_count DESC
      LIMIT ${limit}
    `;

    const categorie: CategoriaErrori[] = (
      categorieResult as { titolo_quesito: string; errori_count: string }[]
    ).map((row) => ({
      titolo_quesito: row.titolo_quesito,
      errori_count: parseInt(row.errori_count, 10),
      percentuale:
        totaleErrori > 0
          ? Math.round((parseInt(row.errori_count, 10) / totaleErrori) * 100)
          : 0,
    }));

    return { categorie };
  }
);

// ============================================================
// getAllCategorieErrori - Tutte le categorie con errori
// ============================================================

/**
 * Server function per ottenere tutte le categorie con errori.
 */
export const getAllCategorieErrori = createServerFn({ method: 'GET' }).handler(
  async ({ data }): Promise<AllCategorieErroriResult> => {
    const { userId } = await auth();
    if (!userId) {
      throw new Error('Autenticazione richiesta');
    }

    const parsed = z.object({ period: periodSchema }).safeParse(data);
    if (!parsed.success) {
      throw new Error('Parametro period richiesto');
    }

    const { period } = parsed.data;
    const periodFilter = getPeriodFilter(period);

    // Conta totale risposte per calcolare percentuale
    const totaleResult = await sql`
      SELECT COUNT(*) as count
      FROM user_domanda_attempt uda
      WHERE uda.user_id = ${userId}
        AND uda.answered_at IS NOT NULL
        AND uda.is_correct = false
        ${periodFilter}
    `;
    const totaleErrori = parseInt(
      (totaleResult[0] as { count: string }).count,
      10
    );

    // Query per tutte le categorie con errori
    const categorieResult = await sql`
      SELECT 
        d.titolo_quesito,
        COUNT(*) as errori_count
      FROM user_domanda_attempt uda
      JOIN domande d ON d.id = uda.domanda_id
      WHERE uda.user_id = ${userId}
        AND uda.answered_at IS NOT NULL
        AND uda.is_correct = false
        AND d.titolo_quesito IS NOT NULL
        ${periodFilter}
      GROUP BY d.titolo_quesito
      ORDER BY errori_count DESC
    `;

    const categorie: CategoriaErrori[] = (
      categorieResult as { titolo_quesito: string; errori_count: string }[]
    ).map((row) => ({
      titolo_quesito: row.titolo_quesito,
      errori_count: parseInt(row.errori_count, 10),
      percentuale:
        totaleErrori > 0
          ? Math.round((parseInt(row.errori_count, 10) / totaleErrori) * 100)
          : 0,
    }));

    return { categorie };
  }
);

// ============================================================
// getDomandeMaggioriErrori - Domande con più errori
// ============================================================

/**
 * Server function per ottenere le domande con più errori.
 */
export const getDomandeMaggioriErrori = createServerFn({
  method: 'GET',
}).handler(async ({ data }): Promise<DomandeErroriResult> => {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Autenticazione richiesta');
  }

  const parsed = erroriParamsSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error('Parametri non validi');
  }

  const { period, limit, offset } = parsed.data;
  const periodFilter = getPeriodFilter(period);

  // Query per domande con più errori
  const domandeResult = await sql`
    SELECT 
      d.*,
      COUNT(*) as errori_count,
      (
        SELECT uda2.answer_given 
        FROM user_domanda_attempt uda2 
        WHERE uda2.domanda_id = d.id 
          AND uda2.user_id = ${userId}
          AND uda2.answered_at IS NOT NULL
        ORDER BY uda2.answered_at DESC 
        LIMIT 1
      ) as ultima_risposta,
      (uds.domanda_id IS NOT NULL) as skull
    FROM user_domanda_attempt uda
    JOIN domande d ON d.id = uda.domanda_id
    LEFT JOIN user_domanda_skull uds ON d.id = uds.domanda_id AND uds.user_id = ${userId}
    WHERE uda.user_id = ${userId}
      AND uda.answered_at IS NOT NULL
      AND uda.is_correct = false
      ${periodFilter}
    GROUP BY d.id, uds.domanda_id
    ORDER BY errori_count DESC, d.id
    LIMIT ${limit + 1}
    OFFSET ${offset}
  `;

  const rows = domandeResult as (Domanda & {
    errori_count: string;
    ultima_risposta: string | null;
    skull: boolean;
  })[];

  const hasMore = rows.length > limit;
  const domande: DomandaConErrori[] = rows.slice(0, limit).map((row) => ({
    ...row,
    errori_count: parseInt(row.errori_count, 10),
  }));

  return { domande, hasMore };
});

// ============================================================
// getDomandeMaggioriEsatte - Domande con più risposte corrette
// ============================================================

/**
 * Server function per ottenere le domande con più risposte corrette.
 */
export const getDomandeMaggioriEsatte = createServerFn({
  method: 'GET',
}).handler(async ({ data }): Promise<DomandeEsatteResult> => {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Autenticazione richiesta');
  }

  const parsed = erroriParamsSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error('Parametri non validi');
  }

  const { period, limit, offset } = parsed.data;
  const periodFilter = getPeriodFilter(period);

  // Query per domande con più risposte corrette
  const domandeResult = await sql`
    SELECT 
      d.*,
      COUNT(*) as esatte_count,
      (
        SELECT uda2.answer_given 
        FROM user_domanda_attempt uda2 
        WHERE uda2.domanda_id = d.id 
          AND uda2.user_id = ${userId}
          AND uda2.answered_at IS NOT NULL
        ORDER BY uda2.answered_at DESC 
        LIMIT 1
      ) as ultima_risposta,
      (uds.domanda_id IS NOT NULL) as skull
    FROM user_domanda_attempt uda
    JOIN domande d ON d.id = uda.domanda_id
    LEFT JOIN user_domanda_skull uds ON d.id = uds.domanda_id AND uds.user_id = ${userId}
    WHERE uda.user_id = ${userId}
      AND uda.answered_at IS NOT NULL
      AND uda.is_correct = true
      ${periodFilter}
    GROUP BY d.id, uds.domanda_id
    ORDER BY esatte_count DESC, d.id
    LIMIT ${limit + 1}
    OFFSET ${offset}
  `;

  const rows = domandeResult as (Domanda & {
    esatte_count: string;
    ultima_risposta: string | null;
    skull: boolean;
  })[];

  const hasMore = rows.length > limit;
  const domande: DomandaConEsatte[] = rows.slice(0, limit).map((row) => ({
    ...row,
    esatte_count: parseInt(row.esatte_count, 10),
  }));

  return { domande, hasMore };
});

// ============================================================
// getDomandeSkull - Domande marcate come skull
// ============================================================

/**
 * Server function per ottenere le domande marcate come skull.
 */
export const getDomandeSkull = createServerFn({ method: 'GET' }).handler(
  async ({ data }): Promise<DomandeSkullResult> => {
    const { userId } = await auth();
    if (!userId) {
      throw new Error('Autenticazione richiesta');
    }

    const parsed = erroriParamsSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error('Parametri non validi');
    }

    const { period, limit, offset } = parsed.data;
    // Filtro per periodo sulla data di inserimento skull
    const skullPeriodFilter = getPeriodFilter(period, 'uds.inserted_at');

    // Query per domande skull
    const domandeResult = await sql`
      SELECT 
        d.*,
        uds.inserted_at,
        (
          SELECT uda2.answer_given 
          FROM user_domanda_attempt uda2 
          WHERE uda2.domanda_id = d.id 
            AND uda2.user_id = ${userId}
            AND uda2.answered_at IS NOT NULL
          ORDER BY uda2.answered_at DESC 
          LIMIT 1
        ) as ultima_risposta,
        true as skull
      FROM user_domanda_skull uds
      JOIN domande d ON d.id = uds.domanda_id
      WHERE uds.user_id = ${userId}
        ${skullPeriodFilter}
      ORDER BY uds.inserted_at DESC
      LIMIT ${limit + 1}
      OFFSET ${offset}
    `;

    const rows = domandeResult as (Domanda & {
      inserted_at: string;
      ultima_risposta: string | null;
      skull: boolean;
    })[];

    const hasMore = rows.length > limit;
    const domande: DomandaSkull[] = rows.slice(0, limit);

    return { domande, hasMore };
  }
);

// ============================================================
// getDomandeSbagliate - Domande sbagliate per esercitazione
// ============================================================

/**
 * Server function per ottenere le domande sbagliate (per esercitazione).
 * Restituisce domande uniche che l'utente ha sbagliato almeno una volta.
 */
export const getDomandeSbagliate = createServerFn({ method: 'GET' }).handler(
  async ({ data }): Promise<DomandeErroriResult> => {
    const { userId } = await auth();
    if (!userId) {
      throw new Error('Autenticazione richiesta');
    }

    const parsed = erroriParamsSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error('Parametri non validi');
    }

    const { period, limit, offset } = parsed.data;
    const periodFilter = getPeriodFilter(period);

    // Query per domande sbagliate uniche
    const domandeResult = await sql`
      SELECT 
        d.*,
        COUNT(*) as errori_count,
        (
          SELECT uda2.answer_given 
          FROM user_domanda_attempt uda2 
          WHERE uda2.domanda_id = d.id 
            AND uda2.user_id = ${userId}
            AND uda2.answered_at IS NOT NULL
          ORDER BY uda2.answered_at DESC 
          LIMIT 1
        ) as ultima_risposta,
        (uds.domanda_id IS NOT NULL) as skull
      FROM user_domanda_attempt uda
      JOIN domande d ON d.id = uda.domanda_id
      LEFT JOIN user_domanda_skull uds ON d.id = uds.domanda_id AND uds.user_id = ${userId}
      WHERE uda.user_id = ${userId}
        AND uda.answered_at IS NOT NULL
        AND uda.is_correct = false
        ${periodFilter}
      GROUP BY d.id, uds.domanda_id
      ORDER BY errori_count DESC, d.id
      LIMIT ${limit + 1}
      OFFSET ${offset}
    `;

    const rows = domandeResult as (Domanda & {
      errori_count: string;
      ultima_risposta: string | null;
      skull: boolean;
    })[];

    const hasMore = rows.length > limit;
    const domande: DomandaConErrori[] = rows.slice(0, limit).map((row) => ({
      ...row,
      errori_count: parseInt(row.errori_count, 10),
    }));

    return { domande, hasMore };
  }
);

// ============================================================
// getDomandeCategorieCritiche - Domande delle top 5 categorie
// ============================================================

/**
 * Server function per ottenere le domande delle categorie con più errori.
 */
export const getDomandeCategorieCritiche = createServerFn({
  method: 'GET',
}).handler(async ({ data }): Promise<DomandeErroriResult> => {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Autenticazione richiesta');
  }

  const parsed = erroriParamsSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error('Parametri non validi');
  }

  const { period, limit, offset } = parsed.data;
  const periodFilter = getPeriodFilter(period);

  // Prima otteniamo le top 5 categorie con più errori
  const topCategorieResult = await sql`
    SELECT d.titolo_quesito
    FROM user_domanda_attempt uda
    JOIN domande d ON d.id = uda.domanda_id
    WHERE uda.user_id = ${userId}
      AND uda.answered_at IS NOT NULL
      AND uda.is_correct = false
      AND d.titolo_quesito IS NOT NULL
      ${periodFilter}
    GROUP BY d.titolo_quesito
    ORDER BY COUNT(*) DESC
    LIMIT 5
  `;

  const topCategorie = (topCategorieResult as { titolo_quesito: string }[]).map(
    (r) => r.titolo_quesito
  );

  if (topCategorie.length === 0) {
    return { domande: [], hasMore: false };
  }

  // Query per domande delle categorie critiche
  const domandeResult = await sql`
    SELECT 
      d.*,
      COUNT(*) FILTER (WHERE uda.is_correct = false) as errori_count,
      (
        SELECT uda2.answer_given 
        FROM user_domanda_attempt uda2 
        WHERE uda2.domanda_id = d.id 
          AND uda2.user_id = ${userId}
          AND uda2.answered_at IS NOT NULL
        ORDER BY uda2.answered_at DESC 
        LIMIT 1
      ) as ultima_risposta,
      (uds.domanda_id IS NOT NULL) as skull
    FROM domande d
    LEFT JOIN user_domanda_attempt uda ON d.id = uda.domanda_id 
      AND uda.user_id = ${userId}
      AND uda.answered_at IS NOT NULL
    LEFT JOIN user_domanda_skull uds ON d.id = uds.domanda_id AND uds.user_id = ${userId}
    WHERE d.titolo_quesito = ANY(${topCategorie})
    GROUP BY d.id, uds.domanda_id
    ORDER BY errori_count DESC NULLS LAST, RANDOM()
    LIMIT ${limit + 1}
    OFFSET ${offset}
  `;

  const rows = domandeResult as (Domanda & {
    errori_count: string | null;
    ultima_risposta: string | null;
    skull: boolean;
  })[];

  const hasMore = rows.length > limit;
  const domande: DomandaConErrori[] = rows.slice(0, limit).map((row) => ({
    ...row,
    errori_count: parseInt(row.errori_count ?? '0', 10),
  }));

  return { domande, hasMore };
});
