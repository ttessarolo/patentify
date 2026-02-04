/**
 * Tipi per i componenti UI React.
 */

// ============================================================
// Timer
// ============================================================

/** Modalità di visualizzazione del Timer */
export type TimerMode = 'countdown' | 'countup';

/** Payload passato alla callback onTick */
export interface TimerTickPayload {
  /** Secondi trascorsi dall'inizio */
  elapsed: number;
  /** Secondi rimanenti (seconds - elapsed) */
  remaining: number;
  /** Secondi totali (prop seconds) */
  total: number;
  /** true se il timer è terminato */
  ended: boolean;
}

/** Props del componente Timer */
export interface TimerProps {
  /** Durata totale in secondi */
  seconds: number;
  /** Secondi già trascorsi (per ripresa sessione, default: 0) */
  initialElapsed?: number;
  /** Intervallo in secondi per chiamare onTick (default: 1) */
  tickInterval?: number;
  /** Callback chiamata ogni tickInterval secondi */
  onTick?: (payload: TimerTickPayload) => void;
  /** Callback chiamata quando il timer termina (solo countdown) */
  onEnd?: () => void;
  /** Modalità iniziale di visualizzazione */
  startMode: TimerMode;
  /** Se true, click sul timer cicla tra i modi (default: true) */
  cycleMode?: boolean;
  /** Classe CSS opzionale */
  className?: string;
  /** Stile inline opzionale */
  style?: React.CSSProperties;
}
