/**
 * Parametri comuni condivisi tra server e client.
 * Modificare qui per aggiornare ovunque.
 */

// ============================================================
// Quiz - Simulazione
// ============================================================

/** Numero di domande per quiz */
export const QUIZ_SIZE = 5; // TODO: rimettere a 40 per produzione

/** Durata del quiz in secondi (30 minuti) */
export const QUIZ_DURATION_SECONDS = 30 * 60;

/** Minimo domande sui segnali stradali */
export const MIN_SEGNALI = 1; // TODO: rimettere a 5 per produzione

/** Minimo domande sulle precedenze */
export const MIN_PRECEDENZE = 1; // TODO: rimettere a 3 per produzione

/** Numero massimo di errori ammessi per superare il quiz */
export const MAX_ERRORS = 4;
