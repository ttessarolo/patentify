import { publicProcedure } from '../middleware/auth';
import {
  getSpiegazioneInputSchema,
  getSpiegazioneOutputSchema,
} from '../schemas/spiegazione';
import * as spiegazioneService from '../services/spiegazione.service';

export const getSpiegazione = publicProcedure
  .route({
    method: 'POST',
    path: '/spiegazione',
    summary: 'Ottieni spiegazione per una domanda',
  })
  .input(getSpiegazioneInputSchema)
  .output(getSpiegazioneOutputSchema)
  .handler(
    async ({ input }): Promise<{ spiegazione: string | null }> => {
      return spiegazioneService.getSpiegazione(input.domanda_id);
    },
  );
