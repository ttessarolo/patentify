/**
 * Client Ably Realtime per il browser.
 *
 * Usa token auth: il client richiede un token al server oRPC
 * tramite `orpc.sfide.getAblyToken`, cosi non serve esporre
 * la chiave API lato client.
 *
 * Espone un singleton lazy-initialized del client Realtime.
 */

import * as Ably from 'ably';
import { client } from '~/lib/orpc';

let realtimeInstance: Ably.Realtime | null = null;

/**
 * Ritorna (o crea) il singleton del client Ably Realtime.
 * Il client si autentica via token auth chiamando l'endpoint oRPC.
 */
export function getAblyRealtime(): Ably.Realtime {
  if (realtimeInstance) return realtimeInstance;

  realtimeInstance = new Ably.Realtime({
    authCallback: async (_params, callback) => {
      try {
        const tokenRequest = await client.sfide.getAblyToken();
        callback(null, tokenRequest as Ably.TokenRequest);
      } catch (error) {
        callback(error as Ably.ErrorInfo, null);
      }
    },
    autoConnect: false,
  });

  return realtimeInstance;
}

/**
 * Disconnette e resetta il client Ably.
 * Da chiamare al logout dell'utente.
 */
export function disconnectAbly(): void {
  if (realtimeInstance) {
    realtimeInstance.close();
    realtimeInstance = null;
  }
}
