import * as z from 'zod';

// ============================================================
// trackAttempt
// ============================================================

export const trackAttemptInputSchema = z.object({
  domanda_id: z.number().int().positive(),
  answer_given: z.string(),
  quiz_id: z.number().int().positive().optional(),
  quiz_pos: z.number().int().min(1).max(40).optional(),
});

export const trackAttemptOutputSchema = z.object({
  success: z.boolean(),
  is_correct: z.boolean(),
  attempt_id: z.number().int().optional(),
});

// ============================================================
// checkResponse
// ============================================================

export const checkResponseInputSchema = z.object({
  domanda_id: z.number().int().positive(),
  answer_given: z.string(),
});

export const checkResponseOutputSchema = z.object({
  is_correct: z.boolean(),
});

// ============================================================
// domandaUserStats
// ============================================================

export const domandaUserStatsInputSchema = z.object({
  domanda_id: z.number().int().positive(),
});

export const domandaUserStatsOutputSchema = z.object({
  total: z.number().int(),
  correct: z.number().int(),
  wrong: z.number().int(),
});
