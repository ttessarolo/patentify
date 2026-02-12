/**
 * Parametri comuni condivisi tra server e client.
 * Modificare qui per aggiornare ovunque.
 */

// ============================================================
// Feature flags
// ============================================================

/** Abilita/disabilita il reveal box "Spiegazione" nelle domande */
export const SHOW_SPIEGAZIONE = false;

// ============================================================
// Quiz - Simulazione
// ============================================================

/** Numero di domande per quiz */
export const QUIZ_SIZE = 40; // TODO: rimettere a 40 per produzione

/** Durata del quiz in secondi (30 minuti) */
export const QUIZ_DURATION_SECONDS = 30 * 60;

/** Minimo domande sui segnali stradali */
export const MIN_SEGNALI = 5; // TODO: rimettere a 5 per produzione

/** Minimo domande sulle precedenze */
export const MIN_PRECEDENZE = 3; // TODO: rimettere a 3 per produzione

/** Numero massimo di errori ammessi per superare il quiz */
export const MAX_ERRORS = 4;

// ============================================================
// Sfide - Tier configurazione
// ============================================================

/** Configurazione dei tier per le sfide multiplayer */
export const SFIDA_TIERS = {
  seed: { label: 'Speed', questions: 5, durationSeconds: 60 },
  medium: { label: 'Medium', questions: 10, durationSeconds: 300 },
  half_quiz: { label: 'Half Quiz', questions: 20, durationSeconds: 900 },
  full: { label: 'Full Quiz', questions: 40, durationSeconds: 1800 },
} as const;

/** Tipo di sfida (tier) */
export type SfidaTier = keyof typeof SFIDA_TIERS;

/**
 * Classi Tailwind per la pill colorata del tipo di sfida.
 * Verde (Speed), giallo (Medium), arancione (Half), rosso (Full).
 * Usate in ChallengeHistory, OutgoingChallengeDialog, IncomingChallengeDialog.
 */
export const SFIDA_TIER_PILL_CLASSES: Record<SfidaTier, string> = {
  seed: 'bg-green-500/20 text-green-600 dark:bg-green-500/25 dark:text-green-400',
  medium:
    'bg-yellow-500/20 text-yellow-600 dark:bg-yellow-500/25 dark:text-yellow-400',
  half_quiz:
    'bg-orange-500/20 text-orange-600 dark:bg-orange-500/25 dark:text-orange-400',
  full: 'bg-red-500/20 text-red-600 dark:bg-red-500/25 dark:text-red-400',
} as const;

/** Classi bordo + testo per box tier non selezionato */
export const SFIDA_TIER_BOX_CLASSES: Record<SfidaTier, string> = {
  seed: 'border-green-500/40 hover:border-green-500/60 text-green-600 dark:text-green-400',
  medium:
    'border-yellow-500/40 hover:border-yellow-500/60 text-yellow-600 dark:text-yellow-400',
  half_quiz:
    'border-orange-500/40 hover:border-orange-500/60 text-orange-600 dark:text-orange-400',
  full: 'border-red-500/40 hover:border-red-500/60 text-red-600 dark:text-red-400',
} as const;

/** Restituisce le classi pill per un tier (fallback per valori sconosciuti) */
export function getSfidaTierPillClasses(tier: string): string {
  return (
    SFIDA_TIER_PILL_CLASSES[tier as SfidaTier] ??
    'bg-muted text-muted-foreground'
  );
}

/** Restituisce le classi per il box tier (bordo + testo) quando non selezionato */
export function getSfidaTierBoxClasses(tier: string): string {
  return (
    SFIDA_TIER_BOX_CLASSES[tier as SfidaTier] ??
    'border-border text-foreground hover:border-primary/50'
  );
}

// ============================================================
// Utility per indicatori metriche (ire, difficolta, ambiguita)
// ============================================================

/**
 * Restituisce la classe Tailwind per il colore in base al valore 1-5.
 * Per valori decimali (es. medie) arrotonda al più vicino intero.
 */
export function getValueColorClass(value: number | null): string {
  const rounded = value !== null ? Math.round(value) : null;
  switch (rounded) {
    case 1:
      return 'text-green-500';
    case 2:
      return 'text-cyan-500';
    case 3:
      return 'text-yellow-500';
    case 4:
      return 'text-orange-500';
    case 5:
      return 'text-red-500';
    default:
      return 'text-muted-foreground';
  }
}
