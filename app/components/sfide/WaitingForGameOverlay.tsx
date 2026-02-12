/**
 * Overlay globale "Generazione del Quiz in corso..."
 *
 * Mostrato al player che accetta una sfida, nel tempo tra l'accettazione
 * e l'arrivo dell'evento `game-start` via Ably.
 */

import { useEffect, useRef, useCallback } from 'react';
import type { JSX } from 'react';
import { useAppStore } from '~/store';
import { Loader2 } from 'lucide-react';

/** Timeout di sicurezza: se dopo 20s non arriva game-start, resetta */
const SAFETY_TIMEOUT_MS = 20_000;

export function WaitingForGameOverlay(): JSX.Element | null {
  const waiting = useAppStore((s) => s.waitingForGameStart);
  const setWaiting = useAppStore((s) => s.setWaitingForGameStart);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback((): void => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (waiting) {
      timerRef.current = setTimeout(() => {
        console.warn('[WaitingForGameOverlay] Timeout — resetting');
        setWaiting(false);
      }, SAFETY_TIMEOUT_MS);
    } else {
      clearTimer();
    }

    return clearTimer;
  }, [waiting, setWaiting, clearTimer]);

  if (!waiting) return null;

  return (
    <div className="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm">
      <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
      <h2 className="text-xl font-bold text-foreground">
        Generazione del Quiz in corso...
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Attendi qualche secondo
      </p>
    </div>
  );
}
