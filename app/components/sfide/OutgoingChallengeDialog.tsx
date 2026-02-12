/**
 * Dialog per l'invio di una sfida a un utente.
 *
 * Fasi:
 * 1. Conferma: "Vuoi sfidare [nickname] in un Quiz?"
 * 2. Attesa risposta con countdown 30s
 * 3. Feedback: accettata / rifiutata / scaduta / errore
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import type { JSX } from 'react';
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
import { Button } from '~/components/ui/button';
import type { ChallengePhase } from '~/hooks/useChallengeFlow';
import {
  SFIDA_TIERS,
  getSfidaTierPillClasses,
  getSfidaTierBoxClasses,
} from '~/commons';
import type { SfidaTier } from '~/commons';

/** Timeout attesa risposta: 30 secondi */
const WAIT_TIMEOUT_S = 30;

interface OutgoingChallengeDialogProps {
  /** Se il dialog è aperto */
  open: boolean;
  /** Callback per chiudere il dialog */
  onClose: () => void;
  /** Nome/nickname dell'utente target */
  targetName: string;
  /** Fase corrente della sfida */
  phase: ChallengePhase;
  /** Callback per inviare la sfida con il tier selezionato */
  onConfirmSend: (tier: SfidaTier) => void;
}

/** Formatta la durata in minuti o secondi per la UI */
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)} min`;
}

export function OutgoingChallengeDialog({
  open,
  onClose,
  targetName,
  phase,
  onConfirmSend,
}: OutgoingChallengeDialogProps): JSX.Element {
  const [countdown, setCountdown] = useState<number>(WAIT_TIMEOUT_S);
  const [selectedTier, setSelectedTier] = useState<SfidaTier>('full');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback((): void => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Countdown durante attesa risposta
  useEffect(() => {
    if (phase !== 'waiting_response') {
      clearTimer();
      return;
    }

    setCountdown(WAIT_TIMEOUT_S);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return clearTimer;
  }, [phase, clearTimer]);

  const renderContent = (): JSX.Element => {
    switch (phase) {
      case 'idle':
      case 'sending':
        return (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Sfida</AlertDialogTitle>
              <AlertDialogDescription>
                Scegli il tipo di sfida con{' '}
                <span className="font-semibold text-foreground">
                  {targetName}
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            {/* Selezione tier */}
            <div className="grid grid-cols-2 gap-2 py-2">
              {(Object.entries(SFIDA_TIERS) as [SfidaTier, (typeof SFIDA_TIERS)[SfidaTier]][]).map(
                ([key, config]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={(): void => setSelectedTier(key)}
                    className={`rounded-lg border-2 p-3 text-left transition-colors ${
                      selectedTier === key
                        ? `ring-2 ring-foreground/20 ${getSfidaTierPillClasses(key)} border-transparent`
                        : `bg-card ${getSfidaTierBoxClasses(key)}`
                    }`}
                  >
                    <div
                      className={`text-sm font-semibold ${
                        selectedTier === key ? '' : 'text-foreground'
                      }`}
                    >
                      {config.label}
                    </div>
                    <div className="mt-0.5 text-xs opacity-90">
                      {config.questions} domande ·{' '}
                      {formatDuration(config.durationSeconds)}
                    </div>
                  </button>
                ),
              )}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={onClose}>Annulla</AlertDialogCancel>
              <Button
                onClick={(): void => onConfirmSend(selectedTier)}
                disabled={phase === 'sending'}
              >
                {phase === 'sending' ? 'Invio...' : 'Sfida!'}
              </Button>
            </AlertDialogFooter>
          </>
        );

      case 'waiting_response':
        return (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>In attesa di risposta...</AlertDialogTitle>
              <AlertDialogDescription>
                Sfida inviata a{' '}
                <span className="font-semibold text-foreground">
                  {targetName}
                </span>
                . In attesa della risposta.
              </AlertDialogDescription>
              <div className="mt-3 text-center">
                <span className="text-3xl font-bold tabular-nums text-primary">
                  {countdown}s
                </span>
              </div>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={onClose}>Annulla</AlertDialogCancel>
            </AlertDialogFooter>
          </>
        );

      case 'accepted':
        return (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Sfida Accettata!</AlertDialogTitle>
              <AlertDialogDescription>
                <span className="font-semibold text-foreground">
                  {targetName}
                </span>{' '}
                ha accettato la sfida. Preparazione del quiz in corso...
              </AlertDialogDescription>
            </AlertDialogHeader>
          </>
        );

      case 'rejected':
        return (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Sfida Rifiutata</AlertDialogTitle>
              <AlertDialogDescription>
                <span className="font-semibold text-foreground">
                  {targetName}
                </span>{' '}
                ha rifiutato la sfida.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={onClose}>OK</AlertDialogAction>
            </AlertDialogFooter>
          </>
        );

      case 'expired':
        return (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Tempo Scaduto</AlertDialogTitle>
              <AlertDialogDescription>
                <span className="font-semibold text-foreground">
                  {targetName}
                </span>{' '}
                non ha risposto in tempo.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={onClose}>OK</AlertDialogAction>
            </AlertDialogFooter>
          </>
        );

      case 'error':
        return (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Errore</AlertDialogTitle>
              <AlertDialogDescription>
                Si è verificato un errore durante l&apos;invio della sfida.
                Riprova.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={onClose}>OK</AlertDialogAction>
            </AlertDialogFooter>
          </>
        );
    }
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          // Blocca la chiusura via Escape / click-outside durante fasi attive
          // — solo i bottoni espliciti (Annulla, OK) devono chiudere il dialog.
          if (
            phase === 'sending' ||
            phase === 'waiting_response' ||
            phase === 'accepted'
          ) {
            return;
          }
          onClose();
        }
      }}
    >
      <AlertDialogContent>{renderContent()}</AlertDialogContent>
    </AlertDialog>
  );
}
