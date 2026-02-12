/**
 * Dialog globale per sfide in arrivo.
 *
 * Si mostra quando un altro utente invia una richiesta di sfida.
 * Include un countdown di 30 secondi per rispondere.
 * Auto-rifiuta allo scadere del timeout.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import type { JSX } from 'react';
import { useAuth } from '@clerk/tanstack-react-start';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '~/components/ui/alert-dialog';
import { useAppStore } from '~/store';
import { useChallengeFlow } from '~/hooks/useChallengeFlow';
import { SFIDA_TIERS } from '~/commons';

/** Timeout sfida: 30 secondi */
const CHALLENGE_TIMEOUT_S = 30;

export function IncomingChallengeDialog(): JSX.Element | null {
  const { userId } = useAuth();
  const incomingChallenge = useAppStore((s) => s.incomingChallenge);
  const setIncomingChallenge = useAppStore((s) => s.setIncomingChallenge);

  const { respondToChallenge } = useChallengeFlow({
    userId,
    enabled: Boolean(userId),
  });

  const [countdown, setCountdown] = useState<number>(CHALLENGE_TIMEOUT_S);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isOpen = Boolean(incomingChallenge);

  // Cleanup timer
  const clearTimer = useCallback((): void => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Countdown e auto-rifiuto
  useEffect(() => {
    if (!incomingChallenge) {
      clearTimer();
      return;
    }

    // Calcola countdown iniziale (nel caso ci sia un ritardo nell'apertura)
    const elapsedMs = Date.now() - incomingChallenge.receivedAt;
    const remainingS = Math.max(
      0,
      CHALLENGE_TIMEOUT_S - Math.floor(elapsedMs / 1000),
    );
    setCountdown(remainingS);

    if (remainingS <= 0) {
      // Già scaduta
      respondToChallenge(false);
      return;
    }

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearTimer();
          // Auto-rifiuto
          respondToChallenge(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return clearTimer;
  }, [incomingChallenge, respondToChallenge, clearTimer]);

  const setWaitingForGameStart = useAppStore((s) => s.setWaitingForGameStart);

  const handleAccept = useCallback((): void => {
    clearTimer();
    setWaitingForGameStart(true);
    respondToChallenge(true);
  }, [respondToChallenge, clearTimer, setWaitingForGameStart]);

  const handleReject = useCallback((): void => {
    clearTimer();
    respondToChallenge(false);
  }, [respondToChallenge, clearTimer]);

  if (!incomingChallenge) return null;

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          clearTimer();
          setIncomingChallenge(null);
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sfida Ricevuta!</AlertDialogTitle>
          <AlertDialogDescription>
            L&apos;utente{' '}
            <span className="font-semibold text-foreground">
              {incomingChallenge.challengerName}
            </span>{' '}
            ti vuole sfidare:{' '}
            <span className="font-semibold text-primary">
              {SFIDA_TIERS[incomingChallenge.tier]?.label ?? 'Full Quiz'}
            </span>{' '}
            ({SFIDA_TIERS[incomingChallenge.tier]?.questions ?? 40} domande,{' '}
            {((SFIDA_TIERS[incomingChallenge.tier]?.durationSeconds ?? 1800) < 60)
              ? `${SFIDA_TIERS[incomingChallenge.tier]?.durationSeconds ?? 1800}s`
              : `${Math.floor((SFIDA_TIERS[incomingChallenge.tier]?.durationSeconds ?? 1800) / 60)} min`}
            ). Accetti?
          </AlertDialogDescription>
          <div className="mt-2 text-center">
            <span className="text-2xl font-bold tabular-nums text-primary">
              {countdown}s
            </span>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleReject}>
            Rifiuta
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleAccept}>
            Accetta
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
