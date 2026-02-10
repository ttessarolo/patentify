/**
 * Service per errori ricorrenti e statistiche risposte.
 */

import { sql } from '~/lib/db';
import {
  getPeriodFilter,
  getGranularityForPeriod,
  formatTimelineLabel,
} from './helpers';

type TimePeriod = 'oggi' | 'settimana' | 'mese' | 'tutti';

// ============================================================
// Tipi interni
// ============================================================

interface DomandaRow {
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
}

interface CategoriaErrori {
  titolo_quesito: string;
  errori_count: number;
  percentuale: number;
}

interface DomandaConErrori extends DomandaRow {
  errori_count: number;
  ultima_risposta: string | null;
  skull: boolean;
}

interface DomandaConEsatte extends DomandaRow {
  esatte_count: number;
  ultima_risposta: string | null;
  skull: boolean;
}

interface DomandaSkull extends DomandaRow {
  inserted_at: string;
  ultima_risposta: string | null;
  skull: boolean;
}

interface TimelineDataPoint {
  label: string;
  timestamp: string;
  totale: number;
  corrette: number;
  errate: number;
}

// ============================================================
// getErroriStats
// ============================================================

export interface ErroriStatsOutput {
  copertura: number;
  totale_risposte: number;
  risposte_corrette: number;
  risposte_errate: number;
  skull_count: number;
  domande_uniche_risposte: number;
  totale_domande_db: number;
}

export async function getErroriStats(
  userId: string,
  period: TimePeriod,
): Promise<ErroriStatsOutput> {
  const periodFilter = getPeriodFilter(period);

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

  const totaleDomandeResult = await sql`
    SELECT COUNT(*) as count FROM domande
  `;
  const totale_domande_db = parseInt(
    (totaleDomandeResult[0] as { count: string }).count,
    10,
  );

  const skullPeriodFilter = getPeriodFilter(period, 'inserted_at');
  const skullResult = await sql`
    SELECT COUNT(*) as count
    FROM user_domanda_skull
    WHERE user_id = ${userId}
      ${skullPeriodFilter}
  `;
  const skull_count = parseInt(
    (skullResult[0] as { count: string }).count,
    10,
  );

  const totale_risposte = parseInt(stats.totale_risposte, 10) || 0;
  const risposte_corrette = parseInt(stats.risposte_corrette, 10) || 0;
  const risposte_errate = parseInt(stats.risposte_errate, 10) || 0;
  const domande_uniche_risposte =
    parseInt(stats.domande_uniche_risposte, 10) || 0;

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

// ============================================================
// getTopCategorieErrori
// ============================================================

export async function getTopCategorieErrori(
  userId: string,
  period: TimePeriod,
  limit: number,
): Promise<{ categorie: CategoriaErrori[] }> {
  const periodFilter = getPeriodFilter(period);

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
    10,
  );

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

// ============================================================
// getAllCategorieErrori
// ============================================================

export async function getAllCategorieErrori(
  userId: string,
  period: TimePeriod,
): Promise<{ categorie: CategoriaErrori[] }> {
  const periodFilter = getPeriodFilter(period);

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
    10,
  );

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

// ============================================================
// getDomandeMaggioriErrori
// ============================================================

export async function getDomandeMaggioriErrori(
  userId: string,
  period: TimePeriod,
  limit: number,
  offset: number,
): Promise<{ domande: DomandaConErrori[]; hasMore: boolean }> {
  const periodFilter = getPeriodFilter(period);

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

  const rows = domandeResult as (DomandaRow & {
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

// ============================================================
// getDomandeMaggioriEsatte
// ============================================================

export async function getDomandeMaggioriEsatte(
  userId: string,
  period: TimePeriod,
  limit: number,
  offset: number,
): Promise<{ domande: DomandaConEsatte[]; hasMore: boolean }> {
  const periodFilter = getPeriodFilter(period);

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

  const rows = domandeResult as (DomandaRow & {
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
}

// ============================================================
// getDomandeSkull
// ============================================================

export async function getDomandeSkull(
  userId: string,
  period: TimePeriod,
  limit: number,
  offset: number,
): Promise<{ domande: DomandaSkull[]; hasMore: boolean }> {
  const skullPeriodFilter = getPeriodFilter(period, 'uds.inserted_at');

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

  const rows = domandeResult as (DomandaRow & {
    inserted_at: string | Date;
    ultima_risposta: string | null;
    skull: boolean;
  })[];

  const hasMore = rows.length > limit;
  const domande: DomandaSkull[] = rows.slice(0, limit).map((row) => ({
    ...row,
    inserted_at:
      row.inserted_at instanceof Date
        ? row.inserted_at.toISOString()
        : String(row.inserted_at),
  }));

  return { domande, hasMore };
}

// ============================================================
// getDomandeSbagliate
// ============================================================

export async function getDomandeSbagliate(
  userId: string,
  period: TimePeriod,
  limit: number,
  offset: number,
): Promise<{ domande: DomandaConErrori[]; hasMore: boolean }> {
  const periodFilter = getPeriodFilter(period);

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

  const rows = domandeResult as (DomandaRow & {
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

// ============================================================
// getDomandeCategorieCritiche
// ============================================================

export async function getDomandeCategorieCritiche(
  userId: string,
  period: TimePeriod,
  limit: number,
  offset: number,
): Promise<{ domande: DomandaConErrori[]; hasMore: boolean }> {
  const periodFilter = getPeriodFilter(period);

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
    (r) => r.titolo_quesito,
  );

  if (topCategorie.length === 0) {
    return { domande: [], hasMore: false };
  }

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

  const rows = domandeResult as (DomandaRow & {
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
}

// ============================================================
// getTimelineStats
// ============================================================

export interface TimelineStatsOutput {
  granularity: 'hour' | 'day' | 'week' | 'month';
  data: TimelineDataPoint[];
}

export async function getTimelineStats(
  userId: string,
  period: TimePeriod,
): Promise<TimelineStatsOutput> {
  const granularity = getGranularityForPeriod(period);
  const periodFilter = getPeriodFilter(period);

  let dateTrunc: string;
  switch (granularity) {
    case 'hour':
      dateTrunc = 'hour';
      break;
    case 'day':
      dateTrunc = 'day';
      break;
    case 'week':
      dateTrunc = 'week';
      break;
    case 'month':
    default:
      dateTrunc = 'month';
      break;
  }

  const timelineResult = await sql`
    SELECT 
      DATE_TRUNC(${dateTrunc}, uda.answered_at) as time_bucket,
      COUNT(*) as totale,
      COUNT(*) FILTER (WHERE uda.is_correct = true) as corrette,
      COUNT(*) FILTER (WHERE uda.is_correct = false) as errate
    FROM user_domanda_attempt uda
    WHERE uda.user_id = ${userId}
      AND uda.answered_at IS NOT NULL
      ${periodFilter}
    GROUP BY time_bucket
    ORDER BY time_bucket ASC
  `;

  const rows = timelineResult as {
    time_bucket: string | Date;
    totale: string;
    corrette: string;
    errate: string;
  }[];

  const dataPoints: TimelineDataPoint[] = rows.map((row) => {
    const ts =
      row.time_bucket instanceof Date
        ? row.time_bucket.toISOString()
        : String(row.time_bucket);
    return {
      label: formatTimelineLabel(ts, granularity),
      timestamp: ts,
      totale: parseInt(row.totale, 10) || 0,
      corrette: parseInt(row.corrette, 10) || 0,
      errate: parseInt(row.errate, 10) || 0,
    };
  });

  return {
    granularity,
    data: dataPoints,
  };
}
