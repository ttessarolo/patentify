import { authProcedure, publicProcedure } from '../middleware/auth';
import {
  getDomandeInputSchema,
  getDomandeOutputSchema,
  getAmbitiInputSchema,
  getAmbitiOutputSchema,
} from '../schemas/esercitazione';
import * as esercitazioneService from '../services/esercitazione.service';
import type * as z from 'zod';

export const getDomande = authProcedure
  .route({
    method: 'GET',
    path: '/esercitazione/domande',
    summary: 'Ottieni domande per esercitazione con filtri',
  })
  .input(getDomandeInputSchema)
  .output(getDomandeOutputSchema)
  .handler(
    async ({
      input,
      context,
    }): Promise<z.infer<typeof getDomandeOutputSchema>> => {
      return esercitazioneService.getDomandeEsercitazione(context.userId, {
        search: input.search,
        ire_plus: input.ire_plus,
        ambiguita: input.ambiguita,
        difficolta: input.difficolta,
        titolo_quesito: input.titolo_quesito,
        limit: input.limit ?? 10,
        offset: input.offset ?? 0,
        ordinamento_casuale: input.ordinamento_casuale,
      });
    },
  );

export const getAmbiti = publicProcedure
  .route({
    method: 'GET',
    path: '/esercitazione/ambiti',
    summary: 'Lista distinta degli ambiti delle domande',
  })
  .input(getAmbitiInputSchema)
  .output(getAmbitiOutputSchema)
  .handler(async ({ input }): Promise<string[]> => {
    return esercitazioneService.getAmbitiDistinct(input.ttlMs);
  });
