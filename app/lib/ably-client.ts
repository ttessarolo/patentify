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

/** Flag per indicare che la connessione è in fase di chiusura intenzionale */
let isClosing = false;

/**
 * Ritorna (o crea) il singleton del client Ably Realtime.
 * Il client si autentica via token auth chiamando l'endpoint oRPC.
 */
export function getAblyRealtime(): Ably.Realtime {
  if (realtimeInstance) return realtimeInstance;

  realtimeInstance = new Ably.Realtime({
    authCallback: async (_params, callback) => {
      // Non tentare auth se la connessione sta chiudendo
      if (isClosing) {
        callback(
          new Ably.ErrorInfo('Connection closing', 80017, 400),
          null,
        );
        return;
      }

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
 * Indica se il client Ably è in fase di chiusura intenzionale.
 * Utile per sopprimere errori attesi durante il close.
 */
export function isAblyClosing(): boolean {
  return isClosing;
}

/**
 * Disconnette e resetta il client Ably.
 * Da chiamare al logout dell'utente o prima di un page reload.
 *
 * Gestisce gracefully le rejection interne di Ably durante
 * il close evitando unhandled promise rejection.
 */
export function disconnectAbly(): void {
  if (realtimeInstance) {
    isClosing = true;
    const instance = realtimeInstance;
    realtimeInstance = null;

    try {
      instance.close();
    } catch {
      // Ignora errori sincroni dal close
    }

    // Reset del flag dopo un tick per permettere a eventuali
    // promise pendenti di leggere isClosing = true
    setTimeout(() => {
      isClosing = false;
    }, 0);
  }
}

// ---------------------------------------------------------------------------
// Cleanup automatici per evitare "Connection closed" unhandled rejection
// ---------------------------------------------------------------------------

if (typeof window !== 'undefined') {
  // beforeunload: page close/reload (affidabile su desktop)
  window.addEventListener('beforeunload', () => {
    disconnectAbly();
  });

  // pagehide: il più affidabile su mobile e PWA (iOS Safari, Android Chrome).
  // Fires anche quando beforeunload non scatta (es. swipe-close della PWA).
  window.addEventListener('pagehide', () => {
    disconnectAbly();
  });
}

// Vite HMR: disconnetti quando il modulo viene rimpiazzato
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    disconnectAbly();
  });
}
