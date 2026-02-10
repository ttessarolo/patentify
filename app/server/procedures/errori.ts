import { authProcedure } from '../middleware/auth';
import {
  erroriStatsInputSchema,
  erroriStatsOutputSchema,
  topCategorieInputSchema,
  topCategorieOutputSchema,
  allCategorieInputSchema,
  allCategorieOutputSchema,
  domandeErroriInputSchema,
  domandeErroriOutputSchema,
  domandeEsatteInputSchema,
  domandeEsatteOutputSchema,
  domandeSkullInputSchema,
  domandeSkullOutputSchema,
  timelineStatsInputSchema,
  timelineStatsOutputSchema,
} from '../schemas/errori';
import * as erroriService from '../services/errori.service';
import type * as z from 'zod';

// ============================================================
// getErroriStats
// ============================================================

export const getStats = authProcedure
  .route({
    method: 'GET',
    path: '/errori/stats',
    summary: 'Statistiche generali errori ricorrenti',
  })
  .input(erroriStatsInputSchema)
  .output(erroriStatsOutputSchema)
  .handler(
    async ({
      input,
      context,
    }): Promise<z.infer<typeof erroriStatsOutputSchema>> => {
      return erroriService.getErroriStats(context.userId, input.period);
    },
  );

// ============================================================
// getTopCategorieErrori
// ============================================================

export const getTopCategorie = authProcedure
  .route({
    method: 'GET',
    path: '/errori/top-categorie',
    summary: 'Top N categorie con più errori',
  })
  .input(topCategorieInputSchema)
  .output(topCategorieOutputSchema)
  .handler(
    async ({
      input,
      context,
    }): Promise<z.infer<typeof topCategorieOutputSchema>> => {
      return erroriService.getTopCategorieErrori(
        context.userId,
        input.period,
        input.limit ?? 5,
      );
    },
  );

// ============================================================
// getAllCategorieErrori
// ============================================================

export const getAllCategorie = authProcedure
  .route({
    method: 'GET',
    path: '/errori/categorie',
    summary: 'Tutte le categorie con conteggio errori',
  })
  .input(allCategorieInputSchema)
  .output(allCategorieOutputSchema)
  .handler(
    async ({
      input,
      context,
    }): Promise<z.infer<typeof allCategorieOutputSchema>> => {
      return erroriService.getAllCategorieErrori(context.userId, input.period);
    },
  );

// ============================================================
// getDomandeMaggioriErrori
// ============================================================

export const getMaggioriErrori = authProcedure
  .route({
    method: 'GET',
    path: '/errori/domande-errori',
    summary: 'Domande con più errori',
  })
  .input(domandeErroriInputSchema)
  .output(domandeErroriOutputSchema)
  .handler(
    async ({
      input,
      context,
    }): Promise<z.infer<typeof domandeErroriOutputSchema>> => {
      return erroriService.getDomandeMaggioriErrori(
        context.userId,
        input.period,
        input.limit ?? 10,
        input.offset ?? 0,
      );
    },
  );

// ============================================================
// getDomandeMaggioriEsatte
// ============================================================

export const getMaggioriEsatte = authProcedure
  .route({
    method: 'GET',
    path: '/errori/domande-esatte',
    summary: 'Domande con più risposte corrette',
  })
  .input(domandeEsatteInputSchema)
  .output(domandeEsatteOutputSchema)
  .handler(
    async ({
      input,
      context,
    }): Promise<z.infer<typeof domandeEsatteOutputSchema>> => {
      return erroriService.getDomandeMaggioriEsatte(
        context.userId,
        input.period,
        input.limit ?? 10,
        input.offset ?? 0,
      );
    },
  );

// ============================================================
// getDomandeSkull
// ============================================================

export const getSkull = authProcedure
  .route({
    method: 'GET',
    path: '/errori/domande-skull',
    summary: 'Domande marcate come skull',
  })
  .input(domandeSkullInputSchema)
  .output(domandeSkullOutputSchema)
  .handler(
    async ({
      input,
      context,
    }): Promise<z.infer<typeof domandeSkullOutputSchema>> => {
      return erroriService.getDomandeSkull(
        context.userId,
        input.period,
        input.limit ?? 10,
        input.offset ?? 0,
      );
    },
  );

// ============================================================
// getDomandeSbagliate
// ============================================================

export const getSbagliate = authProcedure
  .route({
    method: 'GET',
    path: '/errori/domande-sbagliate',
    summary: 'Domande sbagliate per esercitazione',
  })
  .input(domandeErroriInputSchema)
  .output(domandeErroriOutputSchema)
  .handler(
    async ({
      input,
      context,
    }): Promise<z.infer<typeof domandeErroriOutputSchema>> => {
      return erroriService.getDomandeSbagliate(
        context.userId,
        input.period,
        input.limit ?? 10,
        input.offset ?? 0,
      );
    },
  );

// ============================================================
// getDomandeCategorieCritiche
// ============================================================

export const getCategorieCritiche = authProcedure
  .route({
    method: 'GET',
    path: '/errori/domande-categorie-critiche',
    summary: 'Domande delle top 5 categorie critiche',
  })
  .input(domandeErroriInputSchema)
  .output(domandeErroriOutputSchema)
  .handler(
    async ({
      input,
      context,
    }): Promise<z.infer<typeof domandeErroriOutputSchema>> => {
      return erroriService.getDomandeCategorieCritiche(
        context.userId,
        input.period,
        input.limit ?? 10,
        input.offset ?? 0,
      );
    },
  );

// ============================================================
// getTimelineStats
// ============================================================

export const getTimeline = authProcedure
  .route({
    method: 'GET',
    path: '/errori/timeline',
    summary: 'Statistiche risposte aggregate per timeline',
  })
  .input(timelineStatsInputSchema)
  .output(timelineStatsOutputSchema)
  .handler(
    async ({
      input,
      context,
    }): Promise<z.infer<typeof timelineStatsOutputSchema>> => {
      return erroriService.getTimelineStats(context.userId, input.period);
    },
  );
