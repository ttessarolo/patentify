import { authProcedure } from '../middleware/auth';
import {
  trackAttemptInputSchema,
  trackAttemptOutputSchema,
  checkResponseInputSchema,
  checkResponseOutputSchema,
  domandaUserStatsInputSchema,
  domandaUserStatsOutputSchema,
} from '../schemas/attempt';
import * as attemptService from '../services/attempt.service';

export const track = authProcedure
  .route({
    method: 'POST',
    path: '/attempt/track',
    summary: 'Registra un tentativo di risposta',
  })
  .input(trackAttemptInputSchema)
  .output(trackAttemptOutputSchema)
  .handler(
    async ({
      input,
      context,
    }): Promise<{
      success: boolean;
      is_correct: boolean;
      attempt_id?: number;
    }> => {
      return attemptService.trackAttempt(context.userId, input);
    },
  );

export const check = authProcedure
  .route({
    method: 'POST',
    path: '/attempt/check',
    summary: 'Verifica se una risposta è corretta',
  })
  .input(checkResponseInputSchema)
  .output(checkResponseOutputSchema)
  .handler(async ({ input }): Promise<{ is_correct: boolean }> => {
    return attemptService.checkResponse(input.domanda_id, input.answer_given);
  });

export const getDomandaUserStats = authProcedure
  .route({
    method: 'POST',
    path: '/attempt/domanda-stats',
    summary: 'Statistiche utente per una domanda specifica',
  })
  .input(domandaUserStatsInputSchema)
  .output(domandaUserStatsOutputSchema)
  .handler(
    async ({
      input,
      context,
    }): Promise<{ total: number; correct: number; wrong: number }> => {
      return attemptService.domandaUserStats(
        context.userId,
        input.domanda_id,
      );
    },
  );
