import * as z from 'zod';
import { timePeriodSchema, domandaSchema, timeGranularitySchema } from './common';

// ============================================================
// Shared sub-schemas per errori
// ============================================================

const categoriaErroriSchema = z.object({
  titolo_quesito: z.string(),
  errori_count: z.number().int(),
  percentuale: z.number(),
});

const domandaConErroriSchema = domandaSchema.extend({
  errori_count: z.number().int(),
  ultima_risposta: z.string().nullable(),
  skull: z.boolean(),
});

const domandaConEsatteSchema = domandaSchema.extend({
  esatte_count: z.number().int(),
  ultima_risposta: z.string().nullable(),
  skull: z.boolean(),
});

const domandaSkullSchema = domandaSchema.extend({
  inserted_at: z.string(),
  ultima_risposta: z.string().nullable(),
  skull: z.boolean(),
});

const timelineDataPointSchema = z.object({
  label: z.string(),
  timestamp: z.string(),
  totale: z.number().int(),
  corrette: z.number().int(),
  errate: z.number().int(),
});

// ============================================================
// getErroriStats
// ============================================================

export const erroriStatsInputSchema = z.object({
  period: timePeriodSchema,
});

export const erroriStatsOutputSchema = z.object({
  copertura: z.number(),
  totale_risposte: z.number().int(),
  risposte_corrette: z.number().int(),
  risposte_errate: z.number().int(),
  skull_count: z.number().int(),
  domande_uniche_risposte: z.number().int(),
  totale_domande_db: z.number().int(),
});

// ============================================================
// getTopCategorieErrori
// ============================================================

export const topCategorieInputSchema = z.object({
  period: timePeriodSchema,
  limit: z.number().int().positive().optional().default(5),
});

export const topCategorieOutputSchema = z.object({
  categorie: z.array(categoriaErroriSchema),
});

// ============================================================
// getAllCategorieErrori
// ============================================================

export const allCategorieInputSchema = z.object({
  period: timePeriodSchema,
});

export const allCategorieOutputSchema = z.object({
  categorie: z.array(categoriaErroriSchema),
});

// ============================================================
// getDomandeMaggioriErrori / getDomandeSbagliate / getDomandeCategorieCritiche
// ============================================================

export const domandeErroriInputSchema = z.object({
  period: timePeriodSchema,
  limit: z.number().int().positive().optional().default(10),
  offset: z.number().int().min(0).optional().default(0),
});

export const domandeErroriOutputSchema = z.object({
  domande: z.array(domandaConErroriSchema),
  hasMore: z.boolean(),
});

// ============================================================
// getDomandeMaggioriEsatte
// ============================================================

export const domandeEsatteInputSchema = z.object({
  period: timePeriodSchema,
  limit: z.number().int().positive().optional().default(10),
  offset: z.number().int().min(0).optional().default(0),
});

export const domandeEsatteOutputSchema = z.object({
  domande: z.array(domandaConEsatteSchema),
  hasMore: z.boolean(),
});

// ============================================================
// getDomandeSkull
// ============================================================

export const domandeSkullInputSchema = z.object({
  period: timePeriodSchema,
  limit: z.number().int().positive().optional().default(10),
  offset: z.number().int().min(0).optional().default(0),
});

export const domandeSkullOutputSchema = z.object({
  domande: z.array(domandaSkullSchema),
  hasMore: z.boolean(),
});

// ============================================================
// getTimelineStats
// ============================================================

export const timelineStatsInputSchema = z.object({
  period: timePeriodSchema,
});

export const timelineStatsOutputSchema = z.object({
  granularity: timeGranularitySchema,
  data: z.array(timelineDataPointSchema),
});
