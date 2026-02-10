/**
 * Helper condivisi tra i services.
 * - getPeriodFilter: genera condizione SQL per filtro periodo
 * - getGranularityForPeriod: mappa periodo → granularità timeline
 * - formatTimelineLabel: formatta label asse X timeline
 */

import { sql } from '~/lib/db';

type TimePeriod = 'oggi' | 'settimana' | 'mese' | 'tutti';
type TimeGranularity = 'hour' | 'day' | 'week' | 'month';

/** Giorni della settimana in italiano */
const GIORNI_SETTIMANA = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

/** Mesi in italiano (abbreviati) */
const MESI = [
  'Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu',
  'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic',
];

/**
 * Genera la condizione SQL per filtrare per periodo temporale.
 */
export function getPeriodFilter(
  period: TimePeriod,
  column: string = 'uda.answered_at',
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

/**
 * Determina la granularità temporale in base al periodo selezionato.
 */
export function getGranularityForPeriod(period: TimePeriod): TimeGranularity {
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
export function formatTimelineLabel(
  timestamp: string,
  granularity: TimeGranularity,
): string {
  const date = new Date(timestamp);

  switch (granularity) {
    case 'hour':
      return `${date.getHours().toString().padStart(2, '0')}:00`;
    case 'day':
      return GIORNI_SETTIMANA[date.getDay()];
    case 'week': {
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
