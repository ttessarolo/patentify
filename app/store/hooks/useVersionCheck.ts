/**
 * Hook per il version check dell'applicazione.
 *
 * Verifica periodicamente se è disponibile una nuova versione:
 * - Al primo caricamento dell'app
 * - Quando l'app torna in primo piano (visibilitychange)
 * - Ogni 10 minuti se l'app è attiva
 */

import { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../index';
import { client } from '~/lib/orpc';

/** Intervallo di check in millisecondi (10 minuti) */
const CHECK_INTERVAL_MS = 10 * 60 * 1000;

/**
 * Hook che gestisce il version check automatico.
 * Chiamare una sola volta nel root component.
 */
export function useVersionCheck(): void {
  const checkForUpdate = useAppStore((s) => s.checkForUpdate);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /**
   * Esegue il check della versione dal server.
   */
  const performVersionCheck = useCallback(async (): Promise<void> => {
    try {
      const { version } = await client.version.get();
      checkForUpdate(version);
    } catch (error) {
      // Ignora errori di rete - riproveremo al prossimo check
      console.warn('[VersionCheck] Errore nel recupero versione:', error);
    }
  }, [checkForUpdate]);

  /**
   * Gestisce l'evento visibilitychange.
   * Esegue il check quando l'app torna visibile.
   */
  const handleVisibilityChange = useCallback((): void => {
    if (document.visibilityState === 'visible') {
      void performVersionCheck();
    }
  }, [performVersionCheck]);

  useEffect(() => {
    // Skip lato server
    if (typeof window === 'undefined') return;

    // Check iniziale al mount
    void performVersionCheck();

    // Listener per visibilitychange (focus/unfocus)
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Intervallo periodico ogni 10 minuti (solo quando l'app è visibile)
    intervalRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') {
        void performVersionCheck();
      }
    }, CHECK_INTERVAL_MS);

    // Cleanup
    return (): void => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [performVersionCheck, handleVisibilityChange]);
}
