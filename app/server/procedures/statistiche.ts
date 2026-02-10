import { authProcedure } from '../middleware/auth';
import {
  quizStatsInputSchema,
  quizStatsOutputSchema,
  quizListInputSchema,
  quizListOutputSchema,
  quizTimelineInputSchema,
  quizTimelineOutputSchema,
} from '../schemas/statistiche';
import * as statisticheService from '../services/statistiche.service';
import type * as z from 'zod';

export const getQuizStats = authProcedure
  .route({
    method: 'GET',
    path: '/statistiche/quiz-stats',
    summary: 'Statistiche aggregate quiz nel periodo',
  })
  .input(quizStatsInputSchema)
  .output(quizStatsOutputSchema)
  .handler(
    async ({
      input,
      context,
    }): Promise<z.infer<typeof quizStatsOutputSchema>> => {
      return statisticheService.getQuizStats(context.userId, input.period);
    },
  );

export const getQuizList = authProcedure
  .route({
    method: 'GET',
    path: '/statistiche/quiz-list',
    summary: 'Lista quiz completati paginata',
  })
  .input(quizListInputSchema)
  .output(quizListOutputSchema)
  .handler(
    async ({
      input,
      context,
    }): Promise<z.infer<typeof quizListOutputSchema>> => {
      return statisticheService.getQuizList(
        context.userId,
        input.period,
        input.limit ?? 10,
        input.offset ?? 0,
      );
    },
  );

export const getQuizTimeline = authProcedure
  .route({
    method: 'GET',
    path: '/statistiche/quiz-timeline',
    summary: 'Timeline quiz aggregata per periodo',
  })
  .input(quizTimelineInputSchema)
  .output(quizTimelineOutputSchema)
  .handler(
    async ({
      input,
      context,
    }): Promise<z.infer<typeof quizTimelineOutputSchema>> => {
      return statisticheService.getQuizTimeline(context.userId, input.period);
    },
  );
