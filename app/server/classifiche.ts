/**
 * Server functions per la sezione Classifiche (Leaderboard).
 * - getClassificaQuiz: classifica utenti per quiz promossi/bocciati
 * - getClassificaRisposte: classifica utenti per risposte date
 * - addFriend: aggiungi amicizia
 * - removeFriend: rimuovi amicizia
 */

import { createServerFn } from '@tanstack/react-start';
import { auth } from '@clerk/tanstack-react-start/server';
import { z } from 'zod';
import { sql } from '~/lib/db';
import type {
  TimePeriod,
  ClassificaQuizResult,
  ClassificaQuizRow,
  ClassificaRisposteResult,
  ClassificaRisposteRow,
  FriendActionResult,
} from '~/types/db';

// ============================================================
// Schema di validazione
// ============================================================

const periodSchema = z.enum(['oggi', 'settimana', 'mese', 'tutti']);

const classificaQuizSchema = z.object({
  period: periodSchema,
  scope: z.enum(['generale', 'amici']),
  sortField: z.enum(['promosso', 'bocciato']),
  sortDir: z.enum(['asc', 'desc']),
  limit: z.coerce.number().int().positive().optional().default(10),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

const classificaRisposteSchema = z.object({
  period: periodSchema,
  scope: z.enum(['generale', 'amici']),
  sortField: z.enum(['copertura', 'sbagliate', 'corrette']),
  sortDir: z.enum(['asc', 'desc']),
  limit: z.coerce.number().int().positive().optional().default(10),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

const friendSchema = z.object({
  friendId: z.string().min(1),
});

// ============================================================
// Helper per filtro periodo temporale
// ============================================================

/**
 * Genera la condizione SQL per filtrare per periodo temporale.
 */
function getPeriodFilter(
  period: TimePeriod,
  column: string
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
// getClassificaQuiz - Classifica utenti per quiz
// ============================================================

/**
 * Server function per la classifica quiz (promossi/bocciati).
 * Raggruppa per utente, conta quiz promossi e bocciati,
 * con supporto per scope amici e ordinamento personalizzato.
 */
export const getClassificaQuiz = createServerFn({ method: 'GET' }).handler(
  async ({ data }): Promise<ClassificaQuizResult> => {
    const { userId } = await auth();
    if (!userId) {
      throw new Error('Autenticazione richiesta');
    }

    const parsed = classificaQuizSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error('Parametri non validi');
    }

    const { period, scope, sortField, sortDir, limit, offset } = parsed.data;
    const periodFilter = getPeriodFilter(period, 'q.completed_at');

    // Costruisci ORDER BY in modo sicuro
    const sortColumn =
      sortField === 'promosso' ? 'promosso_count' : 'bocciato_count';
    const sortDirection = sortDir === 'asc' ? 'ASC' : 'DESC';

    // Filtro scope: se 'amici' filtra solo gli amici dell'utente
    const scopeFilter =
      scope === 'amici'
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
        CASE WHEN EXISTS (
          SELECT 1 FROM amici a WHERE a.user_id = ${userId} AND a.friend_id = u.id
        ) THEN true ELSE false END AS is_friend
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
      is_friend: boolean;
    }[];

    const hasMore = rawRows.length > limit;
    const rows: ClassificaQuizRow[] = rawRows.slice(0, limit).map((row) => ({
      user_id: row.user_id,
      name: row.name,
      username: row.username,
      image_url: row.image_url,
      bocciato: parseInt(row.bocciato_count, 10) || 0,
      promosso: parseInt(row.promosso_count, 10) || 0,
      is_friend: row.is_friend,
    }));

    return { rows, hasMore };
  }
);

// ============================================================
// getClassificaRisposte - Classifica utenti per risposte
// ============================================================

/**
 * Server function per la classifica risposte.
 * Calcola copertura, % corrette e % sbagliate per ogni utente.
 */
export const getClassificaRisposte = createServerFn({ method: 'GET' }).handler(
  async ({ data }): Promise<ClassificaRisposteResult> => {
    const { userId } = await auth();
    if (!userId) {
      throw new Error('Autenticazione richiesta');
    }

    const parsed = classificaRisposteSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error('Parametri non validi');
    }

    const { period, scope, sortField, sortDir, limit, offset } = parsed.data;
    const periodFilter = getPeriodFilter(period, 'uda.answered_at');

    // Mappatura campo di ordinamento
    let sortColumn: string;
    switch (sortField) {
      case 'copertura':
        sortColumn = 'domande_uniche';
        break;
      case 'sbagliate':
        sortColumn = 'risposte_errate';
        break;
      case 'corrette':
      default:
        sortColumn = 'risposte_corrette';
        break;
    }
    const sortDirection = sortDir === 'asc' ? 'ASC' : 'DESC';

    // Filtro scope
    const scopeFilter =
      scope === 'amici'
        ? sql`AND uda.user_id IN (SELECT a.friend_id FROM amici a WHERE a.user_id = ${userId})`
        : sql``;

    // Ottieni totale domande DB per calcolo copertura
    const totaleDomandeResult = await sql`
      SELECT COUNT(*) AS totale FROM domande
    `;
    const totaleDomandeDb =
      parseInt(
        (totaleDomandeResult[0] as { totale: string }).totale,
        10
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
        CASE WHEN EXISTS (
          SELECT 1 FROM amici a WHERE a.user_id = ${userId} AND a.friend_id = u.id
        ) THEN true ELSE false END AS is_friend
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
      is_friend: boolean;
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
        is_friend: row.is_friend,
      }));

    return { rows, hasMore };
  }
);

// ============================================================
// addFriend - Aggiungi amicizia
// ============================================================

/**
 * Server function per aggiungere un amico.
 * Inserisce una riga nella tabella amici.
 */
export const addFriend = createServerFn({ method: 'POST' }).handler(
  async ({ data }): Promise<FriendActionResult> => {
    const { userId } = await auth();
    if (!userId) {
      throw new Error('Autenticazione richiesta');
    }

    const parsed = friendSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error('Parametro friendId richiesto');
    }

    const { friendId } = parsed.data;

    // Non puoi aggiungere te stesso come amico
    if (friendId === userId) {
      throw new Error('Non puoi aggiungere te stesso come amico');
    }

    await sql`
      INSERT INTO amici (user_id, friend_id)
      VALUES (${userId}, ${friendId})
      ON CONFLICT (user_id, friend_id) DO NOTHING
    `;

    return { success: true };
  }
);

// ============================================================
// removeFriend - Rimuovi amicizia
// ============================================================

/**
 * Server function per rimuovere un amico.
 * Elimina la riga dalla tabella amici.
 */
export const removeFriend = createServerFn({ method: 'POST' }).handler(
  async ({ data }): Promise<FriendActionResult> => {
    const { userId } = await auth();
    if (!userId) {
      throw new Error('Autenticazione richiesta');
    }

    const parsed = friendSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error('Parametro friendId richiesto');
    }

    const { friendId } = parsed.data;

    await sql`
      DELETE FROM amici
      WHERE user_id = ${userId}
        AND friend_id = ${friendId}
    `;

    return { success: true };
  }
);
