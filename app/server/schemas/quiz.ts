import * as z from 'zod';
import { quizTypeSchema, quizStatusSchema, domandaSchema } from './common';

// ============================================================
// generateQuiz
// ============================================================

export const generateQuizInputSchema = z.object({
  quiz_type: quizTypeSchema,
  boost_errors: z.boolean(),
  boost_skull: z.boolean(),
});

export const generateQuizOutputSchema = z.object({
  quiz_id: z.number().int(),
});

// ============================================================
// getQuizDomanda
// ============================================================

export const getQuizDomandaInputSchema = z.object({
  quiz_id: z.number().int().positive(),
  quiz_pos: z.number().int().min(1).max(40),
});

export const getQuizDomandaOutputSchema = z.object({
  domanda: domandaSchema,
  domanda_id: z.number().int(),
});

// ============================================================
// abortQuiz
// ============================================================

export const abortQuizInputSchema = z.object({
  quiz_id: z.number().int().positive(),
});

export const abortQuizOutputSchema = z.object({
  success: z.boolean(),
});

// ============================================================
// completeQuiz
// ============================================================

export const completeQuizInputSchema = z.object({
  quiz_id: z.number().int().positive(),
});

export const completeQuizOutputSchema = z.object({
  success: z.boolean(),
  promosso: z.boolean(),
  errors: z.number().int(),
  correct: z.number().int(),
});

// ============================================================
// getQuizBoostCounts
// ============================================================

export const getQuizBoostCountsOutputSchema = z.object({
  errors_count: z.number().int(),
  skull_count: z.number().int(),
});

// ============================================================
// getFullQuiz
// ============================================================

export const getFullQuizInputSchema = z.object({
  quiz_id: z.number().int().positive(),
});

const quizDomandaWithAnswerSchema = z.object({
  quiz_pos: z.number().int(),
  domanda: domandaSchema,
  answer_given: z.string().nullable(),
  is_correct: z.boolean().nullable(),
});

export const getFullQuizOutputSchema = z.object({
  quiz_id: z.number().int(),
  quiz_type: quizTypeSchema,
  status: quizStatusSchema,
  promosso: z.boolean().nullable(),
  created_at: z.string(),
  completed_at: z.string().nullable(),
  domande: z.array(quizDomandaWithAnswerSchema),
});
