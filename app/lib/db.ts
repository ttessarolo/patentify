import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import * as Sentry from '@sentry/tanstackstart-react';

const connectionString: string = process.env.DATABASE_URL || '';

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const neonClient = neon(connectionString);

// Esporta il client originale per mantenere compatibilità con .unsafe() e altri metodi
export const sql = neonClient;

/**
 * Helper per catturare errori database e inviarli a Sentry.
 * Usa questo wrapper in contesti critici dove vuoi tracciare errori specifici.
 */
export function captureDatabaseError(error: unknown, query?: string): void {
  Sentry.captureException(error, {
    tags: { type: 'database' },
    extra: {
      query: query ?? 'unknown',
    },
  });
}
