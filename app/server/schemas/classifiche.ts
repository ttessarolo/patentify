import * as z from 'zod';
import { timePeriodSchema, sortDirectionSchema, classificaScopeSchema } from './common';

// ============================================================
// Shared sub-schemas
// ============================================================

const classificaQuizRowSchema = z.object({
  user_id: z.string(),
  name: z.string(),
  username: z.string().nullable(),
  image_url: z.string().nullable(),
  bocciato: z.number().int(),
  promosso: z.number().int(),
  totale_quiz: z.number().int(),
  is_friend: z.boolean(),
});

const classificaRisposteRowSchema = z.object({
  user_id: z.string(),
  name: z.string(),
  username: z.string().nullable(),
  image_url: z.string().nullable(),
  totale_risposte: z.number().int(),
  risposte_corrette: z.number().int(),
  risposte_errate: z.number().int(),
  totale_domande_db: z.number().int(),
  domande_uniche: z.number().int(),
  is_friend: z.boolean(),
});

// ============================================================
// getClassificaQuiz
// ============================================================

export const classificaQuizInputSchema = z.object({
  period: timePeriodSchema,
  scope: classificaScopeSchema,
  sortField: z.enum(['promosso', 'bocciato']),
  sortDir: sortDirectionSchema,
  limit: z.number().int().positive().optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
});

export const classificaQuizOutputSchema = z.object({
  rows: z.array(classificaQuizRowSchema),
  hasMore: z.boolean(),
});

// ============================================================
// getClassificaRisposte
// ============================================================

export const classificaRisposteInputSchema = z.object({
  period: timePeriodSchema,
  scope: classificaScopeSchema,
  sortField: z.enum(['copertura', 'sbagliate', 'corrette']),
  sortDir: sortDirectionSchema,
  limit: z.number().int().positive().optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
});

export const classificaRisposteOutputSchema = z.object({
  rows: z.array(classificaRisposteRowSchema),
  hasMore: z.boolean(),
});

// ============================================================
// addFriend / removeFriend
// ============================================================

export const friendActionInputSchema = z.object({
  friendId: z.string(),
});

export const friendActionOutputSchema = z.object({
  success: z.boolean(),
});
