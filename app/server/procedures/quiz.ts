import { authProcedure } from '../middleware/auth';
import {
  generateQuizInputSchema,
  generateQuizOutputSchema,
  getQuizDomandaInputSchema,
  getQuizDomandaOutputSchema,
  abortQuizInputSchema,
  abortQuizOutputSchema,
  completeQuizInputSchema,
  completeQuizOutputSchema,
  getQuizBoostCountsOutputSchema,
  getFullQuizInputSchema,
  getFullQuizOutputSchema,
} from '../schemas/quiz';
import * as quizService from '../services/quiz.service';
import type * as z from 'zod';

// ============================================================
// generateQuiz
// ============================================================

export const generate = authProcedure
  .route({
    method: 'POST',
    path: '/quiz/generate',
    summary: 'Genera un nuovo quiz con 40 domande',
  })
  .input(generateQuizInputSchema)
  .output(generateQuizOutputSchema)
  .handler(
    async ({ input, context }): Promise<{ quiz_id: number }> => {
      return quizService.generateQuiz(
        context.userId,
        input.quiz_type,
        input.boost_errors,
        input.boost_skull,
      );
    },
  );

// ============================================================
// getQuizDomanda
// ============================================================

export const getDomanda = authProcedure
  .route({
    method: 'POST',
    path: '/quiz/domanda',
    summary: 'Ottieni una domanda del quiz in base alla posizione',
  })
  .input(getQuizDomandaInputSchema)
  .output(getQuizDomandaOutputSchema)
  .handler(
    async ({
      input,
      context,
    }): Promise<z.infer<typeof getQuizDomandaOutputSchema>> => {
      return quizService.getQuizDomanda(
        context.userId,
        input.quiz_id,
        input.quiz_pos,
      );
    },
  );

// ============================================================
// abortQuiz
// ============================================================

export const abort = authProcedure
  .route({
    method: 'POST',
    path: '/quiz/abort',
    summary: 'Abbandona un quiz in corso',
  })
  .input(abortQuizInputSchema)
  .output(abortQuizOutputSchema)
  .handler(
    async ({ input, context }): Promise<{ success: boolean }> => {
      return quizService.abortQuiz(context.userId, input.quiz_id);
    },
  );

// ============================================================
// completeQuiz
// ============================================================

export const complete = authProcedure
  .route({
    method: 'POST',
    path: '/quiz/complete',
    summary: 'Completa un quiz e calcola il risultato',
  })
  .input(completeQuizInputSchema)
  .output(completeQuizOutputSchema)
  .handler(
    async ({
      input,
      context,
    }): Promise<{
      success: boolean;
      promosso: boolean;
      errors: number;
      correct: number;
    }> => {
      return quizService.completeQuiz(context.userId, input.quiz_id);
    },
  );

// ============================================================
// getQuizBoostCounts
// ============================================================

export const getBoostCounts = authProcedure
  .route({
    method: 'GET',
    path: '/quiz/boost-counts',
    summary: 'Conteggio errori e skull per abilitare boost quiz',
  })
  .output(getQuizBoostCountsOutputSchema)
  .handler(
    async ({
      context,
    }): Promise<{ errors_count: number; skull_count: number }> => {
      return quizService.getQuizBoostCounts(context.userId);
    },
  );

// ============================================================
// getFullQuiz
// ============================================================

export const getFull = authProcedure
  .route({
    method: 'GET',
    path: '/quiz/{quiz_id}',
    summary: 'Ottieni tutte le domande e risposte di un quiz (per condivisione)',
  })
  .input(getFullQuizInputSchema)
  .output(getFullQuizOutputSchema)
  .handler(
    async ({ input }): Promise<z.infer<typeof getFullQuizOutputSchema>> => {
      return quizService.getFullQuiz(input.quiz_id);
    },
  );
