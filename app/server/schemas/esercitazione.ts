import * as z from 'zod';
import { domandaWithSkullSchema } from './common';

// ============================================================
// getDomandeEsercitazione
// ============================================================

export const getDomandeInputSchema = z.object({
  search: z.string().optional(),
  ire_plus: z.number().optional(),
  ambiguita: z.number().optional(),
  difficolta: z.number().optional(),
  titolo_quesito: z.string().optional(),
  limit: z.number().int().positive().optional().default(10),
  offset: z.number().int().min(0).optional().default(0),
  ordinamento_casuale: z.boolean().optional(),
});

export const getDomandeOutputSchema = z.array(domandaWithSkullSchema);

// ============================================================
// getAmbitiDistinct
// ============================================================

export const getAmbitiInputSchema = z.object({
  ttlMs: z.number().int().positive().optional(),
});

export const getAmbitiOutputSchema = z.array(z.string());
