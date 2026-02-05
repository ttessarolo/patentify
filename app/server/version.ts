import { createServerFn } from '@tanstack/react-start';

/**
 * Server function per ottenere la versione corrente dell'applicazione.
 * Usata dal client per verificare se è disponibile un aggiornamento.
 */
export const getAppVersion = createServerFn({ method: 'GET' }).handler(
  async (): Promise<{ version: string }> => {
    return { version: import.meta.env.VITE_APP_VERSION ?? '0.0.0' };
  }
);
