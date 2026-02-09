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
