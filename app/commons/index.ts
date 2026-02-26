import { getValueColorToken, type SfidaTier } from '@commons/constants';

export * from '@commons/constants';

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

export function getValueColorClass(value: number | null): string {
  const token = getValueColorToken(value);
  switch (token) {
    case 'green':
      return 'text-green-500';
    case 'cyan':
      return 'text-cyan-500';
    case 'yellow':
      return 'text-yellow-500';
    case 'orange':
      return 'text-orange-500';
    case 'red':
      return 'text-red-500';
    default:
      return 'text-muted-foreground';
  }
}
