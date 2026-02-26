/**
 * Costanti business condivise web/native.
 * Questo file non deve contenere dettagli di rendering (Tailwind o React Native styles).
 */

/** Abilita/disabilita il reveal box "Spiegazione" nelle domande */
export const SHOW_SPIEGAZIONE = false;

/** Numero di domande per quiz */
export const QUIZ_SIZE = 40;

/** Durata del quiz in secondi (30 minuti) */
export const QUIZ_DURATION_SECONDS = 30 * 60;

/** Minimo domande sui segnali stradali */
export const MIN_SEGNALI = 5;

/** Minimo domande sulle precedenze */
export const MIN_PRECEDENZE = 3;

/** Numero massimo di errori ammessi per superare il quiz */
export const MAX_ERRORS = 4;

/** Configurazione dei tier per le sfide multiplayer */
export const SFIDA_TIERS = {
  seed: { label: 'Speed', questions: 5, durationSeconds: 60 },
  medium: { label: 'Medium', questions: 10, durationSeconds: 300 },
  half_quiz: { label: 'Half Quiz', questions: 20, durationSeconds: 900 },
  full: { label: 'Full Quiz', questions: 40, durationSeconds: 1800 },
} as const;

/** Tipo di sfida (tier) */
export type SfidaTier = keyof typeof SFIDA_TIERS;

/** Token colore platform-agnostic per metriche 1-5 */
export type MetricColorToken =
  | 'green'
  | 'cyan'
  | 'yellow'
  | 'orange'
  | 'red'
  | 'muted';

/**
 * Restituisce un token colore in base al valore metrica 1-5.
 * L'app web mapperà il token a classi Tailwind; native a palette RN.
 */
export function getValueColorToken(value: number | null): MetricColorToken {
  const rounded = value !== null ? Math.round(value) : null;

  switch (rounded) {
    case 1:
      return 'green';
    case 2:
      return 'cyan';
    case 3:
      return 'yellow';
    case 4:
      return 'orange';
    case 5:
      return 'red';
    default:
      return 'muted';
  }
}
