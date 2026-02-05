import { createServerFn } from '@tanstack/react-start';
import { auth } from '@clerk/tanstack-react-start/server';
import { z } from 'zod';
import { sql } from '~/lib/db';
import type {
  TimePeriod,
  QuizStatsResult,
  QuizListResult,
  QuizTableRow,
  TimeGranularity,
  QuizTimelineDataPoint,
  QuizTimelineStatsResult,
} from '~/types/db';

// ============================================================
// Schema di validazione
// ============================================================

const periodSchema = z.enum(['oggi', 'settimana', 'mese', 'tutti']);

const quizListSchema = z.object({
  period: periodSchema,
  limit: z.coerce.number().int().positive().optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

// ============================================================
// Helper per filtro periodo temporale
// ============================================================

/**
 * Genera la condizione SQL per filtrare per periodo temporale.
 * @param period - Il periodo selezionato
 * @param column - Nome della colonna da filtrare (default: 'q.completed_at')
 */
function getPeriodFilter(
  period: TimePeriod,
  column: string = 'q.completed_at'
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
// getQuizStats - Statistiche aggregate quiz
// ============================================================

/**
 * Server function per ottenere le statistiche aggregate dei quiz.
 */
export const getQuizStats = createServerFn({ method: 'GET' }).handler(
  async ({ data }): Promise<QuizStatsResult> => {
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

    // Query per statistiche quiz nel periodo
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
);

// ============================================================
// getQuizList - Lista quiz paginata per tabella
// ============================================================

/**
 * Server function per ottenere la lista dei quiz completati (paginata).
 */
export const getQuizList = createServerFn({ method: 'GET' }).handler(
  async ({ data }): Promise<QuizListResult> => {
    const { userId } = await auth();
    if (!userId) {
      throw new Error('Autenticazione richiesta');
    }

    const parsed = quizListSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error('Parametri non validi');
    }

    const { period, limit, offset } = parsed.data;
    const periodFilter = getPeriodFilter(period);

    // Query per lista quiz con conteggio errori
    const quizResult = await sql`
      SELECT 
        q.id as quiz_id,
        q.completed_at,
        q.promosso,
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
      quiz_id: number;
      completed_at: string;
      promosso: boolean;
      errori: string;
    }[];

    const hasMore = rows.length > limit;
    const quiz: QuizTableRow[] = rows.slice(0, limit).map((row) => ({
      quiz_id: row.quiz_id,
      completed_at: row.completed_at,
      promosso: row.promosso,
      errori: parseInt(row.errori, 10) || 0,
    }));

    return { quiz, hasMore };
  }
);

// ============================================================
// getQuizTimeline - Statistiche aggregate per timeline
// ============================================================

/** Giorni della settimana in italiano */
const GIORNI_SETTIMANA = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

/** Mesi in italiano (abbreviati) */
const MESI = [
  'Gen',
  'Feb',
  'Mar',
  'Apr',
  'Mag',
  'Giu',
  'Lug',
  'Ago',
  'Set',
  'Ott',
  'Nov',
  'Dic',
];

/**
 * Determina la granularità temporale in base al periodo selezionato.
 */
function getGranularityForPeriod(period: TimePeriod): TimeGranularity {
  switch (period) {
    case 'oggi':
      return 'hour';
    case 'settimana':
      return 'day';
    case 'mese':
      return 'week';
    case 'tutti':
    default:
      return 'month';
  }
}

/**
 * Genera la label appropriata per un punto dati in base alla granularità.
 */
function formatTimelineLabel(
  timestamp: string,
  granularity: TimeGranularity
): string {
  const date = new Date(timestamp);

  switch (granularity) {
    case 'hour':
      return `${date.getHours().toString().padStart(2, '0')}:00`;
    case 'day':
      return GIORNI_SETTIMANA[date.getDay()];
    case 'week': {
      // Calcola numero settimana del mese
      const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const weekNum =
        Math.ceil((date.getDate() + firstDayOfMonth.getDay()) / 7);
      return `Sett ${weekNum}`;
    }
    case 'month':
      return `${MESI[date.getMonth()]} ${date.getFullYear().toString().slice(-2)}`;
    default:
      return timestamp;
  }
}

/**
 * Server function per ottenere le statistiche quiz aggregate per timeline.
 * Raggruppa i dati in base al periodo selezionato:
 * - oggi: per ora
 * - settimana: per giorno
 * - mese: per settimana
 * - tutti: per mese
 */
export const getQuizTimeline = createServerFn({ method: 'GET' }).handler(
  async ({ data }): Promise<QuizTimelineStatsResult> => {
    const { userId } = await auth();
    if (!userId) {
      throw new Error('Autenticazione richiesta');
    }

    const parsed = z.object({ period: periodSchema }).safeParse(data);
    if (!parsed.success) {
      throw new Error('Parametro period richiesto');
    }

    const { period } = parsed.data;
    const granularity = getGranularityForPeriod(period);
    const periodFilter = getPeriodFilter(period);

    // Determina il DATE_TRUNC appropriato
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

    // Query per aggregare i dati per intervallo temporale
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
      time_bucket: string;
      totale: string;
      promossi: string;
      bocciati: string;
    }[];

    const dataPoints: QuizTimelineDataPoint[] = rows.map((row) => ({
      label: formatTimelineLabel(row.time_bucket, granularity),
      timestamp: row.time_bucket,
      totale: parseInt(row.totale, 10) || 0,
      promossi: parseInt(row.promossi, 10) || 0,
      bocciati: parseInt(row.bocciati, 10) || 0,
    }));

    return {
      granularity,
      data: dataPoints,
    };
  }
);
