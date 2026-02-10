/**
 * Service per classifiche (leaderboard) e gestione follower.
 */

import { sql } from '~/lib/db';
import { getPeriodFilter } from './helpers';

type TimePeriod = 'oggi' | 'settimana' | 'mese' | 'tutti';
type ClassificaScope = 'generale' | 'seguiti';

// ============================================================
// Tipi interni
// ============================================================

interface ClassificaQuizRow {
  user_id: string;
  name: string;
  username: string | null;
  image_url: string | null;
  bocciato: number;
  promosso: number;
  totale_quiz: number;
  is_following: boolean;
}

interface ClassificaRisposteRow {
  user_id: string;
  name: string;
  username: string | null;
  image_url: string | null;
  totale_risposte: number;
  risposte_corrette: number;
  risposte_errate: number;
  totale_domande_db: number;
  domande_uniche: number;
  is_following: boolean;
}

// ============================================================
// getClassificaQuiz
// ============================================================

export async function getClassificaQuiz(
  userId: string,
  period: TimePeriod,
  scope: ClassificaScope,
  sortField: 'promosso' | 'bocciato',
  sortDir: 'asc' | 'desc',
  limit: number,
  offset: number,
): Promise<{ rows: ClassificaQuizRow[]; hasMore: boolean }> {
  const periodFilter = getPeriodFilter(period, 'q.completed_at');

  const sortColumn =
    sortField === 'promosso' ? 'pct_promosso' : 'pct_bocciato';
  const sortDirection = sortDir === 'asc' ? 'ASC' : 'DESC';

  const scopeFilter =
    scope === 'seguiti'
      ? sql`AND q.user_id IN (SELECT a.friend_id FROM amici a WHERE a.user_id = ${userId})`
      : sql``;

  const result = await sql`
    SELECT
      u.id AS user_id,
      u.name,
      u.username,
      u.image_url,
      COUNT(*) FILTER (WHERE q.promosso = false) AS bocciato_count,
      COUNT(*) FILTER (WHERE q.promosso = true) AS promosso_count,
      COUNT(*) AS totale_quiz,
      CASE WHEN COUNT(*) = 0 THEN 0
           ELSE COUNT(*) FILTER (WHERE q.promosso = false) * 100.0 / COUNT(*)
      END AS pct_bocciato,
      CASE WHEN COUNT(*) = 0 THEN 0
           ELSE COUNT(*) FILTER (WHERE q.promosso = true) * 100.0 / COUNT(*)
      END AS pct_promosso,
      CASE WHEN EXISTS (
        SELECT 1 FROM amici a WHERE a.user_id = ${userId} AND a.friend_id = u.id
      ) THEN true ELSE false END AS is_following
    FROM quiz q
    JOIN utente u ON u.id = q.user_id
    WHERE q.status = 'completed'
      AND q.completed_at IS NOT NULL
      ${periodFilter}
      ${scopeFilter}
    GROUP BY u.id, u.name, u.username, u.image_url
    ORDER BY ${sql.unsafe(sortColumn)} ${sql.unsafe(sortDirection)}, u.name ASC
    LIMIT ${limit + 1}
    OFFSET ${offset}
  `;

  const rawRows = result as {
    user_id: string;
    name: string;
    username: string | null;
    image_url: string | null;
    bocciato_count: string;
    promosso_count: string;
    totale_quiz: string;
    is_following: boolean;
  }[];

  const hasMore = rawRows.length > limit;
  const rows: ClassificaQuizRow[] = rawRows.slice(0, limit).map((row) => ({
    user_id: row.user_id,
    name: row.name,
    username: row.username,
    image_url: row.image_url,
    bocciato: parseInt(row.bocciato_count, 10) || 0,
    promosso: parseInt(row.promosso_count, 10) || 0,
    totale_quiz: parseInt(row.totale_quiz, 10) || 0,
    is_following: row.is_following,
  }));

  return { rows, hasMore };
}

// ============================================================
// getClassificaRisposte
// ============================================================

export async function getClassificaRisposte(
  userId: string,
  period: TimePeriod,
  scope: ClassificaScope,
  sortField: 'copertura' | 'sbagliate' | 'corrette',
  sortDir: 'asc' | 'desc',
  limit: number,
  offset: number,
): Promise<{ rows: ClassificaRisposteRow[]; hasMore: boolean }> {
  const periodFilter = getPeriodFilter(period, 'uda.answered_at');

  let sortColumn: string;
  switch (sortField) {
    case 'copertura':
      sortColumn = 'pct_copertura';
      break;
    case 'sbagliate':
      sortColumn = 'pct_sbagliate';
      break;
    case 'corrette':
    default:
      sortColumn = 'pct_corrette';
      break;
  }
  const sortDirection = sortDir === 'asc' ? 'ASC' : 'DESC';

  const scopeFilter =
    scope === 'seguiti'
      ? sql`AND uda.user_id IN (SELECT a.friend_id FROM amici a WHERE a.user_id = ${userId})`
      : sql``;

  const totaleDomandeResult = await sql`
    SELECT COUNT(*) AS totale FROM domande
  `;
  const totaleDomandeDb =
    parseInt(
      (totaleDomandeResult[0] as { totale: string }).totale,
      10,
    ) || 0;

  const result = await sql`
    SELECT
      u.id AS user_id,
      u.name,
      u.username,
      u.image_url,
      COUNT(*) AS totale_risposte,
      COUNT(*) FILTER (WHERE uda.is_correct = true) AS risposte_corrette,
      COUNT(*) FILTER (WHERE uda.is_correct = false) AS risposte_errate,
      COUNT(DISTINCT uda.domanda_id) AS domande_uniche,
      CASE WHEN ${totaleDomandeDb} = 0 THEN 0
           ELSE COUNT(DISTINCT uda.domanda_id) * 100.0 / ${totaleDomandeDb}
      END AS pct_copertura,
      CASE WHEN COUNT(*) = 0 THEN 0
           ELSE COUNT(*) FILTER (WHERE uda.is_correct = false) * 100.0 / COUNT(*)
      END AS pct_sbagliate,
      CASE WHEN COUNT(*) = 0 THEN 0
           ELSE COUNT(*) FILTER (WHERE uda.is_correct = true) * 100.0 / COUNT(*)
      END AS pct_corrette,
      CASE WHEN EXISTS (
        SELECT 1 FROM amici a WHERE a.user_id = ${userId} AND a.friend_id = u.id
      ) THEN true ELSE false END AS is_following
    FROM user_domanda_attempt uda
    JOIN utente u ON u.id = uda.user_id
    WHERE uda.answered_at IS NOT NULL
      AND uda.is_correct IS NOT NULL
      ${periodFilter}
      ${scopeFilter}
    GROUP BY u.id, u.name, u.username, u.image_url
    ORDER BY ${sql.unsafe(sortColumn)} ${sql.unsafe(sortDirection)}, u.name ASC
    LIMIT ${limit + 1}
    OFFSET ${offset}
  `;

  const rawRows = result as {
    user_id: string;
    name: string;
    username: string | null;
    image_url: string | null;
    totale_risposte: string;
    risposte_corrette: string;
    risposte_errate: string;
    domande_uniche: string;
    is_following: boolean;
  }[];

  const hasMore = rawRows.length > limit;
  const rows: ClassificaRisposteRow[] = rawRows
    .slice(0, limit)
    .map((row) => ({
      user_id: row.user_id,
      name: row.name,
      username: row.username,
      image_url: row.image_url,
      totale_risposte: parseInt(row.totale_risposte, 10) || 0,
      risposte_corrette: parseInt(row.risposte_corrette, 10) || 0,
      risposte_errate: parseInt(row.risposte_errate, 10) || 0,
      totale_domande_db: totaleDomandeDb,
      domande_uniche: parseInt(row.domande_uniche, 10) || 0,
      is_following: row.is_following,
    }));

  return { rows, hasMore };
}

// ============================================================
// addFollower
// ============================================================

export async function addFollower(
  userId: string,
  targetUserId: string,
): Promise<{ success: boolean }> {
  if (targetUserId === userId) {
    throw new Error('Non puoi seguire te stesso');
  }

  await sql`
    INSERT INTO amici (user_id, friend_id)
    VALUES (${userId}, ${targetUserId})
    ON CONFLICT (user_id, friend_id) DO NOTHING
  `;

  return { success: true };
}

// ============================================================
// removeFollower
// ============================================================

export async function removeFollower(
  userId: string,
  targetUserId: string,
): Promise<{ success: boolean }> {
  await sql`
    DELETE FROM amici
    WHERE user_id = ${userId} AND friend_id = ${targetUserId}
  `;

  return { success: true };
}
