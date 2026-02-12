/**
 * Procedure oRPC per il dominio "sfide" (multiplayer challenges).
 *
 * Ogni procedura collega schema + middleware + service.
 */

import { authProcedure } from '../middleware/auth';
import {
  getAblyTokenOutputSchema,
  createSfidaInputSchema,
  createSfidaOutputSchema,
  completeSfidaInputSchema,
  completeSfidaOutputSchema,
  getSfidaResultInputSchema,
  getSfidaResultOutputSchema,
  abortSfidaInputSchema,
  abortSfidaOutputSchema,
  sfidaHistoryOutputSchema,
  getSfideHistoryAllInputSchema,
  getSfideHistoryAllOutputSchema,
  getOnlineUsersDetailsInputSchema,
  getOnlineUsersDetailsOutputSchema,
  getSfidaDomandaInputSchema,
} from '../schemas/sfide';
import { getQuizDomandaOutputSchema } from '../schemas/quiz';
import * as sfideService from '../services/sfide.service';
import { getSfidaDomanda } from '../services/quiz.service';
import { generateAblyToken } from '~/lib/ably';
import type * as z from 'zod';

// ============================================================
// getAblyToken
// ============================================================

export const getAblyToken = authProcedure
  .route({
    method: 'POST',
    path: '/sfide/ably-token',
    summary: 'Genera un token Ably per il client autenticato',
  })
  .output(getAblyTokenOutputSchema)
  .handler(
    async ({
      context,
    }): Promise<z.infer<typeof getAblyTokenOutputSchema>> => {
      const tokenRequest = await generateAblyToken(context.userId);
      return tokenRequest as z.infer<typeof getAblyTokenOutputSchema>;
    },
  );

// ============================================================
// createSfida
// ============================================================

export const createSfida = authProcedure
  .route({
    method: 'POST',
    path: '/sfide/create',
    summary: 'Crea una nuova sfida multiplayer',
  })
  .input(createSfidaInputSchema)
  .output(createSfidaOutputSchema)
  .handler(
    async ({
      input,
      context,
    }): Promise<z.infer<typeof createSfidaOutputSchema>> => {
      return sfideService.createSfida(context.userId, input.opponentId, input.tier);
    },
  );

// ============================================================
// completeSfida
// ============================================================

export const completeSfida = authProcedure
  .route({
    method: 'POST',
    path: '/sfide/complete',
    summary: 'Segna il completamento della sfida per un giocatore',
  })
  .input(completeSfidaInputSchema)
  .output(completeSfidaOutputSchema)
  .handler(
    async ({
      input,
      context,
    }): Promise<z.infer<typeof completeSfidaOutputSchema>> => {
      return sfideService.completeSfida(
        input.sfida_id,
        context.userId,
        input.correct_count,
      );
    },
  );

// ============================================================
// getSfidaResult
// ============================================================

export const getSfidaResult = authProcedure
  .route({
    method: 'GET',
    path: '/sfide/result',
    summary: 'Recupera il risultato di una sfida completata',
  })
  .input(getSfidaResultInputSchema)
  .output(getSfidaResultOutputSchema)
  .handler(
    async ({
      input,
      context,
    }): Promise<z.infer<typeof getSfidaResultOutputSchema>> => {
      return sfideService.getSfidaResult(input.sfida_id, context.userId);
    },
  );

// ============================================================
// abortSfida
// ============================================================

export const abortSfida = authProcedure
  .route({
    method: 'POST',
    path: '/sfide/abort',
    summary: 'Abort della sfida per il giocatore corrente',
  })
  .input(abortSfidaInputSchema)
  .output(abortSfidaOutputSchema)
  .handler(
    async ({
      input,
      context,
    }): Promise<z.infer<typeof abortSfidaOutputSchema>> => {
      return sfideService.abortSfidaForPlayer(input.sfida_id, context.userId);
    },
  );

// ============================================================
// getSfideHistory
// ============================================================

export const getSfideHistory = authProcedure
  .route({
    method: 'GET',
    path: '/sfide/history',
    summary: 'Ultime sfide dell\'utente',
  })
  .output(sfidaHistoryOutputSchema)
  .handler(
    async ({
      context,
    }): Promise<z.infer<typeof sfidaHistoryOutputSchema>> => {
      return sfideService.getSfideHistory(context.userId, 5);
    },
  );

// ============================================================
// getSfideHistoryAll
// ============================================================

export const getSfideHistoryAll = authProcedure
  .route({
    method: 'GET',
    path: '/sfide/history-all',
    summary: 'Storico completo sfide dell\'utente con filtro',
  })
  .input(getSfideHistoryAllInputSchema)
  .output(getSfideHistoryAllOutputSchema)
  .handler(
    async ({
      input,
      context,
    }): Promise<z.infer<typeof getSfideHistoryAllOutputSchema>> => {
      return sfideService.getSfideHistoryAll(context.userId, input.filter);
    },
  );

// ============================================================
// getOnlineUsersDetails
// ============================================================

export const getOnlineUsersDetails = authProcedure
  .route({
    method: 'POST',
    path: '/sfide/online-users-details',
    summary: 'Dettagli utenti online (da userId presence)',
  })
  .input(getOnlineUsersDetailsInputSchema)
  .output(getOnlineUsersDetailsOutputSchema)
  .handler(
    async ({
      input,
      context,
    }): Promise<z.infer<typeof getOnlineUsersDetailsOutputSchema>> => {
      return sfideService.getOnlineUsersDetails(
        context.userId,
        input.userIds,
      );
    },
  );

// ============================================================
// getSfidaDomanda
// ============================================================

export const getSfidaDomandaProcedure = authProcedure
  .route({
    method: 'GET',
    path: '/sfide/domanda',
    summary: 'Recupera una domanda di una sfida non-full (per sfida_id)',
  })
  .input(getSfidaDomandaInputSchema)
  .output(getQuizDomandaOutputSchema)
  .handler(
    async ({
      input,
      context,
    }): Promise<z.infer<typeof getQuizDomandaOutputSchema>> => {
      return getSfidaDomanda(context.userId, input.sfida_id, input.quiz_pos);
    },
  );
