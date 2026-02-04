/**
 * Hook per gestire l'hydration dello store Zustand in SSR.
 *
 * Uso:
 * ```tsx
 * const hydrated = useHydration();
 * if (!hydrated) return <Loading />;
 * return <App />;
 * ```
 */

import { useState, useEffect } from 'react';
import { useAppStore } from '../index';

/**
 * Hook che ritorna true quando lo store è stato idratato dal localStorage.
 *
 * IMPORTANTE: In SSR, lo store parte con i valori default.
 * L'hydration avviene solo sul client dopo il mount.
 * Usare questo hook per evitare flash di contenuto non coerente.
 */
export function useHydration(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Listener per quando l'hydration finisce
    const unsubFinishHydration = useAppStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    // Se già idratato (hot reload), setta subito
    if (useAppStore.persist.hasHydrated()) {
      setHydrated(true);
    }

    // Cleanup
    return (): void => {
      unsubFinishHydration();
    };
  }, []);

  return hydrated;
}

/**
 * Hook per triggerare l'hydration manualmente.
 * Chiamare una sola volta nel root component.
 */
export function useStoreRehydration(): void {
  useEffect(() => {
    useAppStore.persist.rehydrate();
  }, []);
}
