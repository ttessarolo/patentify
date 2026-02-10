import { authProcedure } from '../middleware/auth';
import { skullInputSchema, skullOutputSchema } from '../schemas/skull';
import * as skullService from '../services/skull.service';

export const addSkull = authProcedure
  .route({
    method: 'POST',
    path: '/skull',
    summary: 'Aggiungi skull a domanda',
  })
  .input(skullInputSchema)
  .output(skullOutputSchema)
  .handler(
    async ({ input, context }): Promise<{ success: boolean }> => {
      return skullService.addSkull(context.userId, input.domanda_id);
    },
  );

export const removeSkull = authProcedure
  .route({
    method: 'DELETE',
    path: '/skull/{domanda_id}',
    summary: 'Rimuovi skull da domanda',
  })
  .input(skullInputSchema)
  .output(skullOutputSchema)
  .handler(
    async ({ input, context }): Promise<{ success: boolean }> => {
      return skullService.removeSkull(context.userId, input.domanda_id);
    },
  );
