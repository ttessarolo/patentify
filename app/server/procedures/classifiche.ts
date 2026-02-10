import { authProcedure } from '../middleware/auth';
import {
  classificaQuizInputSchema,
  classificaQuizOutputSchema,
  classificaRisposteInputSchema,
  classificaRisposteOutputSchema,
  friendActionInputSchema,
  friendActionOutputSchema,
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

export const addFriend = authProcedure
  .route({
    method: 'POST',
    path: '/classifiche/friend',
    summary: 'Aggiungi un amico',
  })
  .input(friendActionInputSchema)
  .output(friendActionOutputSchema)
  .handler(
    async ({ input, context }): Promise<{ success: boolean }> => {
      return classificheService.addFriend(context.userId, input.friendId);
    },
  );

export const removeFriend = authProcedure
  .route({
    method: 'DELETE',
    path: '/classifiche/friend/{friendId}',
    summary: 'Rimuovi un amico',
  })
  .input(friendActionInputSchema)
  .output(friendActionOutputSchema)
  .handler(
    async ({ input, context }): Promise<{ success: boolean }> => {
      return classificheService.removeFriend(context.userId, input.friendId);
    },
  );
