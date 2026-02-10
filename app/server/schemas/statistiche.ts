import * as z from 'zod';
import { timePeriodSchema, timeGranularitySchema } from './common';

// ============================================================
// getQuizStats
// ============================================================

export const quizStatsInputSchema = z.object({
  period: timePeriodSchema,
});

export const quizStatsOutputSchema = z.object({
  quiz_svolti: z.number().int(),
  quiz_promossi: z.number().int(),
  quiz_bocciati: z.number().int(),
});

// ============================================================
// getQuizList
// ============================================================

export const quizListInputSchema = z.object({
  period: timePeriodSchema,
  limit: z.number().int().positive().optional().default(10),
  offset: z.number().int().min(0).optional().default(0),
});

const quizTableRowSchema = z.object({
  quiz_id: z.number().int(),
  completed_at: z.string(),
  errori: z.number().int(),
  promosso: z.boolean(),
  ire: z.number().nullable(),
  difficolta: z.number().nullable(),
  ambiguita: z.number().nullable(),
});

export const quizListOutputSchema = z.object({
  quiz: z.array(quizTableRowSchema),
  hasMore: z.boolean(),
});

// ============================================================
// getQuizTimeline
// ============================================================

export const quizTimelineInputSchema = z.object({
  period: timePeriodSchema,
});

const quizTimelineDataPointSchema = z.object({
  label: z.string(),
  timestamp: z.string(),
  totale: z.number().int(),
  promossi: z.number().int(),
  bocciati: z.number().int(),
});

export const quizTimelineOutputSchema = z.object({
  granularity: timeGranularitySchema,
  data: z.array(quizTimelineDataPointSchema),
});
