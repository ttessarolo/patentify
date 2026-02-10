import * as z from 'zod';
import { publicProcedure } from '../middleware/auth';

const versionOutputSchema = z.object({
  version: z.string(),
});

export const getVersion = publicProcedure
  .route({
    method: 'GET',
    path: '/version',
    summary: 'Ottieni la versione corrente dell\'app',
  })
  .output(versionOutputSchema)
  .handler(async (): Promise<{ version: string }> => {
    return { version: import.meta.env.VITE_APP_VERSION ?? '0.0.0' };
  });
