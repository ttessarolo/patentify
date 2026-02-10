/**
 * Auth helpers — funzioni per verifiche autorizzazione basate su ruoli.
 */
import { sql } from '~/lib/db';
import type { UserRole } from '~/types/db';

/**
 * Verifica se un utente ha un determinato ruolo.
 * Esegue una query diretta sulla tabella utente per controllare il campo `roles`.
 */
export async function hasRole(
  userId: string,
  role: UserRole,
): Promise<boolean> {
  const result = await sql`
    SELECT 1 FROM utente
    WHERE id = ${userId}
      AND ${role} = ANY(roles)
    LIMIT 1
  `;
  return result.length > 0;
}

/**
 * Verifica se un utente è admin.
 * Shortcut per `hasRole(userId, 'admin')`.
 */
export async function isAdmin(userId: string): Promise<boolean> {
  return hasRole(userId, 'admin');
}
