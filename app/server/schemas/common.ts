/**
 * Zod schemas condivisi tra più domini.
 * Questi schemas definiscono il contratto API e generano automaticamente
 * i tipi TypeScript (via z.infer) e la spec OpenAPI.
 */

import * as z from 'zod';

// ============================================================
// Enums e tipi base
// ============================================================

export const timePeriodSchema = z.enum(['oggi', 'settimana', 'mese', 'tutti']);

export const quizTypeSchema = z.enum(['standard', 'difficile', 'ambiguo']);

export const quizStatusSchema = z.enum(['in_progress', 'completed', 'abandoned']);

export const timeGranularitySchema = z.enum(['hour', 'day', 'week', 'month']);

export const sortDirectionSchema = z.enum(['asc', 'desc']);

export const classificaScopeSchema = z.enum(['generale', 'amici']);

// ============================================================
// Paginazione
// ============================================================

export const paginationInputSchema = z.object({
  limit: z.number().int().positive().optional().default(10),
  offset: z.number().int().min(0).optional().default(0),
});

// ============================================================
// Schema entità DB (output condivisi)
// ============================================================

/** Schema della domanda — corrisponde alla tabella public.domande */
export const domandaSchema = z.object({
  id: z.number().int(),
  ire_plus: z.number().nullable(),
  domanda: z.string().nullable(),
  risposta: z.string().nullable(),
  ambiguita: z.number().nullable(),
  ambiguita_triggers: z.string().nullable(),
  difficolta: z.number().nullable(),
  difficolta_fattori: z.string().nullable(),
  titolo_quesito: z.string().nullable(),
  id_quesito: z.string().nullable(),
  ire: z.number().nullable(),
  immagine_path: z.string().nullable(),
});

/** Domanda con flag skull (JOIN con user_domanda_skull) */
export const domandaWithSkullSchema = domandaSchema.extend({
  skull: z.boolean(),
});

// ============================================================
// Output paginato generico
// ============================================================

export const successOutputSchema = z.object({
  success: z.boolean(),
});
