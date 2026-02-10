import { authProcedure } from '../middleware/auth';
import {
  classificaQuizInputSchema,
  classificaQuizOutputSchema,
  classificaRisposteInputSchema,
  classificaRisposteOutputSchema,
  followActionInputSchema,
  followActionOutputSchema,
} from '../schemas/classifiche';
import * as classificheService from '../services/classifiche.service';
import type * as z from 'zod';

export const getClassificaQuiz = authProcedure
  .route({
    method: 'GET',
    path: '/classifiche/quiz',
    summary: 'Classifica utenti per quiz promossi/bocciati',
  })
  .input(classificaQuizInputSchema)
  .output(classificaQuizOutputSchema)
  .handler(
    async ({
      input,
      context,
    }): Promise<z.infer<typeof classificaQuizOutputSchema>> => {
      return classificheService.getClassificaQuiz(
        context.userId,
        input.period,
        input.scope,
        input.sortField,
        input.sortDir,
        input.limit ?? 20,
        input.offset ?? 0,
      );
    },
  );

export const getClassificaRisposte = authProcedure
  .route({
    method: 'GET',
    path: '/classifiche/risposte',
    summary: 'Classifica utenti per risposte date',
  })
  .input(classificaRisposteInputSchema)
  .output(classificaRisposteOutputSchema)
  .handler(
    async ({
      input,
      context,
    }): Promise<z.infer<typeof classificaRisposteOutputSchema>> => {
      return classificheService.getClassificaRisposte(
        context.userId,
        input.period,
        input.scope,
        input.sortField,
        input.sortDir,
        input.limit ?? 20,
        input.offset ?? 0,
      );
    },
  );

export const addFollower = authProcedure
  .route({
    method: 'POST',
    path: '/classifiche/follow',
    summary: 'Segui un utente',
  })
  .input(followActionInputSchema)
  .output(followActionOutputSchema)
  .handler(
    async ({ input, context }): Promise<{ success: boolean }> => {
      return classificheService.addFollower(context.userId, input.targetUserId);
    },
  );

export const removeFollower = authProcedure
  .route({
    method: 'DELETE',
    path: '/classifiche/follow/{targetUserId}',
    summary: 'Smetti di seguire un utente',
  })
  .input(followActionInputSchema)
  .output(followActionOutputSchema)
  .handler(
    async ({ input, context }): Promise<{ success: boolean }> => {
      return classificheService.removeFollower(context.userId, input.targetUserId);
    },
  );
