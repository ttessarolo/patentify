/**
 * Service per statistiche quiz (aggregati e timeline).
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

interface QuizTableRow {
  quiz_id: number;
  completed_at: string;
  errori: number;
  promosso: boolean;
  ire: number | null;
  difficolta: number | null;
  ambiguita: number | null;
}

interface QuizTimelineDataPoint {
  label: string;
  timestamp: string;
  totale: number;
  promossi: number;
  bocciati: number;
}

// ============================================================
// getQuizStats
// ============================================================

export async function getQuizStats(
  userId: string,
  period: TimePeriod,
): Promise<{ quiz_svolti: number; quiz_promossi: number; quiz_bocciati: number }> {
  const periodFilter = getPeriodFilter(period, 'q.completed_at');

  const statsResult = await sql`
    SELECT 
      COUNT(*) as quiz_svolti,
      COUNT(*) FILTER (WHERE q.promosso = true) as quiz_promossi,
      COUNT(*) FILTER (WHERE q.promosso = false) as quiz_bocciati
    FROM quiz q
    WHERE q.user_id = ${userId}
      AND q.status = 'completed'
      AND q.completed_at IS NOT NULL
      ${periodFilter}
  `;

  const stats = statsResult[0] as {
    quiz_svolti: string;
    quiz_promossi: string;
    quiz_bocciati: string;
  };

  return {
    quiz_svolti: parseInt(stats.quiz_svolti, 10) || 0,
    quiz_promossi: parseInt(stats.quiz_promossi, 10) || 0,
    quiz_bocciati: parseInt(stats.quiz_bocciati, 10) || 0,
  };
}

// ============================================================
// getQuizList
// ============================================================

export async function getQuizList(
  userId: string,
  period: TimePeriod,
  limit: number,
  offset: number,
): Promise<{ quiz: QuizTableRow[]; hasMore: boolean }> {
  const periodFilter = getPeriodFilter(period, 'q.completed_at');

  const quizResult = await sql`
    SELECT 
      q.id as quiz_id,
      q.completed_at,
      q.promosso,
      q.ire,
      q.difficolta,
      q.ambiguita,
      (
        SELECT COUNT(*)
        FROM user_domanda_attempt uda
        WHERE uda.quiz_id = q.id
          AND uda.is_correct = false
      ) as errori
    FROM quiz q
    WHERE q.user_id = ${userId}
      AND q.status = 'completed'
      AND q.completed_at IS NOT NULL
      ${periodFilter}
    ORDER BY q.completed_at DESC
    LIMIT ${limit + 1}
    OFFSET ${offset}
  `;

  const rows = quizResult as {
    quiz_id: number | string;
    completed_at: string | Date;
    promosso: boolean;
    errori: string;
    ire: number | null;
    difficolta: number | null;
    ambiguita: number | null;
  }[];

  const hasMore = rows.length > limit;
  const quiz: QuizTableRow[] = rows.slice(0, limit).map((row) => ({
    quiz_id: Number(row.quiz_id),
    completed_at:
      row.completed_at instanceof Date
        ? row.completed_at.toISOString()
        : String(row.completed_at),
    promosso: row.promosso,
    errori: parseInt(row.errori, 10) || 0,
    ire: row.ire,
    difficolta: row.difficolta,
    ambiguita: row.ambiguita,
  }));

  return { quiz, hasMore };
}

// ============================================================
// getQuizTimeline
// ============================================================

export async function getQuizTimeline(
  userId: string,
  period: TimePeriod,
): Promise<{
  granularity: 'hour' | 'day' | 'week' | 'month';
  data: QuizTimelineDataPoint[];
}> {
  const granularity = getGranularityForPeriod(period);
  const periodFilter = getPeriodFilter(period, 'q.completed_at');

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
      DATE_TRUNC(${dateTrunc}, q.completed_at) as time_bucket,
      COUNT(*) as totale,
      COUNT(*) FILTER (WHERE q.promosso = true) as promossi,
      COUNT(*) FILTER (WHERE q.promosso = false) as bocciati
    FROM quiz q
    WHERE q.user_id = ${userId}
      AND q.status = 'completed'
      AND q.completed_at IS NOT NULL
      ${periodFilter}
    GROUP BY time_bucket
    ORDER BY time_bucket ASC
  `;

  const rows = timelineResult as {
    time_bucket: string | Date;
    totale: string;
    promossi: string;
    bocciati: string;
  }[];

  const dataPoints: QuizTimelineDataPoint[] = rows.map((row) => {
    const ts =
      row.time_bucket instanceof Date
        ? row.time_bucket.toISOString()
        : String(row.time_bucket);
    return {
      label: formatTimelineLabel(ts, granularity),
      timestamp: ts,
      totale: parseInt(row.totale, 10) || 0,
      promossi: parseInt(row.promossi, 10) || 0,
      bocciati: parseInt(row.bocciati, 10) || 0,
    };
  });

  return {
    granularity,
    data: dataPoints,
  };
}
