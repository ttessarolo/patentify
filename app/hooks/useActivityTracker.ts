/**
 * Hook per tracciare l'attività dell'utente.
 *
 * Monitora mouse move, click, keypress, touch e scroll.
 * Dopo `idleTimeoutMs` senza attività segnala l'utente come idle.
 * Al ritorno dell'attività segnala l'utente come attivo.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

/** Timeout di inattività di default: 5 minuti */
const DEFAULT_IDLE_TIMEOUT_MS = 5 * 60 * 1000;

interface UseActivityTrackerOptions {
  /** Timeout di inattività in millisecondi (default: 5 minuti) */
  idleTimeoutMs?: number;
  /** Callback quando l'utente diventa idle */
  onIdle?: () => void;
  /** Callback quando l'utente torna attivo */
  onActive?: () => void;
  /** Se il tracker è abilitato (default: true) */
  enabled?: boolean;
}

interface UseActivityTrackerReturn {
  /** Se l'utente è attualmente attivo */
  isActive: boolean;
}

const TRACKED_EVENTS: string[] = [
  'mousemove',
  'mousedown',
  'keydown',
  'touchstart',
  'scroll',
  'click',
];

export function useActivityTracker(
  options: UseActivityTrackerOptions = {},
): UseActivityTrackerReturn {
  const {
    idleTimeoutMs = DEFAULT_IDLE_TIMEOUT_MS,
    onIdle,
    onActive,
    enabled = true,
  } = options;

  const [isActive, setIsActive] = useState<boolean>(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isActiveRef = useRef<boolean>(true);

  const handleActivity = useCallback((): void => {
    // Resetta il timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Se era idle, segnala ritorno attivo
    if (!isActiveRef.current) {
      isActiveRef.current = true;
      setIsActive(true);
      onActive?.();
    }

    // Imposta nuovo timer per idle
    timerRef.current = setTimeout(() => {
      isActiveRef.current = false;
      setIsActive(false);
      onIdle?.();
    }, idleTimeoutMs);
  }, [idleTimeoutMs, onIdle, onActive]);

  useEffect(() => {
    if (!enabled) return;

    // Inizializza il timer
    handleActivity();

    // Registra event listeners
    for (const event of TRACKED_EVENTS) {
      window.addEventListener(event, handleActivity, { passive: true });
    }

    return (): void => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      for (const event of TRACKED_EVENTS) {
        window.removeEventListener(event, handleActivity);
      }
    };
  }, [enabled, handleActivity]);

  return { isActive };
}
