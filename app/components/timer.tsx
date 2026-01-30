import * as React from 'react';
import { cn } from '~/lib/utils';
import type { TimerMode, TimerProps, TimerTickPayload } from '~/types/components';

/**
 * Ordine di ciclo delle modalità Timer
 */
const MODE_CYCLE: TimerMode[] = [
  'countdown',
  'countdownWithSeconds',
  'countup',
  'countupWithSeconds',
];

/**
 * Formatta i secondi in stringa HH:MM:SS con doppia cifra
 */
function formatSecondsToHHMMSS(totalSeconds: number): string {
  const absSeconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(absSeconds / 3600);
  const m = Math.floor((absSeconds % 3600) / 60);
  const s = absSeconds % 60;

  const hh = String(h).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');

  return `${hh}:${mm}:${ss}`;
}

/**
 * Determina se la modalità è di tipo countdown
 */
function isCountdownMode(mode: TimerMode): boolean {
  return mode === 'countdown' || mode === 'countdownWithSeconds';
}

/**
 * Timer component con visualizzazione HH:MM:SS, font Press Start 2P,
 * supporto countdown/countup e ciclo modi al click.
 */
const Timer = React.forwardRef<HTMLDivElement, TimerProps>(
  (
    {
      seconds,
      tickInterval = 1,
      onTick,
      onEnd,
      startMode,
      cycleMode = true,
      className,
      style,
    },
    ref
  ) => {
    const [elapsed, setElapsed] = React.useState<number>(0);
    const [mode, setMode] = React.useState<TimerMode>(startMode);
    const [ended, setEnded] = React.useState<boolean>(false);

    // Ref per evitare chiamate multiple di onEnd
    const onEndCalledRef = React.useRef<boolean>(false);

    // Reset quando seconds o startMode cambiano
    React.useEffect(() => {
      setElapsed(0);
      setEnded(false);
      onEndCalledRef.current = false;
      setMode(startMode);
    }, [seconds, startMode]);

    // Timer tick effect
    React.useEffect(() => {
      if (ended) return;

      const intervalMs = tickInterval * 1000;

      const intervalId = setInterval(() => {
        setElapsed((prev) => {
          const next = prev + tickInterval;
          const remaining = Math.max(0, seconds - next);
          const isEnded = remaining === 0;

          // Crea payload per onTick
          const payload: TimerTickPayload = {
            elapsed: next,
            remaining,
            total: seconds,
            ended: isEnded,
          };

          // Chiama onTick se fornito
          if (onTick) {
            onTick(payload);
          }

          // Gestisce fine timer (solo countdown)
          if (isEnded && isCountdownMode(mode) && !onEndCalledRef.current) {
            onEndCalledRef.current = true;
            setEnded(true);
            if (onEnd) {
              onEnd();
            }
          }

          return next;
        });
      }, intervalMs);

      return (): void => {
        clearInterval(intervalId);
      };
    }, [seconds, tickInterval, onTick, onEnd, mode, ended]);

    // Calcola il valore da mostrare in base alla modalità
    const displayValue = React.useMemo((): number => {
      if (isCountdownMode(mode)) {
        return Math.max(0, seconds - elapsed);
      }
      return elapsed;
    }, [mode, seconds, elapsed]);

    // Formatta il tempo per la visualizzazione
    const formattedTime = formatSecondsToHHMMSS(displayValue);

    // Genera aria-label per accessibilità
    const ariaLabel = React.useMemo((): string => {
      const h = Math.floor(displayValue / 3600);
      const m = Math.floor((displayValue % 3600) / 60);
      const s = displayValue % 60;

      const parts: string[] = [];
      if (h > 0) parts.push(`${h} ${h === 1 ? 'ora' : 'ore'}`);
      if (m > 0) parts.push(`${m} ${m === 1 ? 'minuto' : 'minuti'}`);
      if (s > 0 || parts.length === 0)
        parts.push(`${s} ${s === 1 ? 'secondo' : 'secondi'}`);

      const timeStr = parts.join(' e ');
      const direction = isCountdownMode(mode) ? 'rimanenti' : 'trascorsi';

      return `${timeStr} ${direction}`;
    }, [displayValue, mode]);

    // Handler per ciclo modi
    const handleClick = React.useCallback((): void => {
      if (!cycleMode) return;

      setMode((current) => {
        const currentIndex = MODE_CYCLE.indexOf(current);
        const nextIndex = (currentIndex + 1) % MODE_CYCLE.length;
        return MODE_CYCLE[nextIndex];
      });
    }, [cycleMode]);

    return (
      <div
        ref={ref}
        role="timer"
        aria-label={ariaLabel}
        onClick={handleClick}
        className={cn(
          "font-['Press_Start_2P'] bg-transparent text-white select-none",
          cycleMode && 'cursor-pointer',
          className
        )}
        style={style}
      >
        {formattedTime}
      </div>
    );
  }
);

Timer.displayName = 'Timer';

export { Timer, formatSecondsToHHMMSS };
