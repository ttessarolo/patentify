/**
 * Utility server-side per Ably.
 *
 * - Inizializza il client REST Ably con ABLY_API_KEY
 * - Espone `generateAblyToken(userId)` per token auth (usato dal client)
 */

import 'dotenv/config';
import Ably from 'ably';

const apiKey: string = process.env.ABLY_API_KEY || '';

if (!apiKey) {
  throw new Error('ABLY_API_KEY environment variable is not set');
}

/** Client REST Ably per operazioni server-side */
export const ablyRest = new Ably.Rest({ key: apiKey });

/**
 * Genera un token Ably per un utente autenticato.
 * Il `clientId` nel token corrisponde all'ID Clerk dell'utente,
 * cosi che la presence sia automaticamente associata all'utente.
 */
export async function generateAblyToken(
  userId: string,
): Promise<Ably.TokenRequest> {
  const tokenRequest = await ablyRest.auth.createTokenRequest({
    clientId: userId,
    capability: {
      'sfide:lobby': ['presence', 'subscribe'],
      'sfide:user:*': ['publish', 'subscribe'],
      'sfide:game:*': ['presence', 'publish', 'subscribe'],
    },
  });
  return tokenRequest;
}
