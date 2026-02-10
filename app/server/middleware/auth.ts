import { os, ORPCError } from '@orpc/server';
import { auth } from '@clerk/tanstack-react-start/server';
import * as Sentry from '@sentry/tanstackstart-react';

// ============================================================
// Context types
// ============================================================

/** Contesto base per tutte le procedure (vuoto, estendibile) */
export interface BaseContext {}

/** Contesto dopo auth middleware — aggiunge userId */
export interface AuthContext extends BaseContext {
  userId: string;
}

// ============================================================
// Sentry middleware
// ============================================================

/**
 * Middleware Sentry globale — cattura eccezioni a livello di procedura
 * e le invia a Sentry prima di ri-lanciare l'errore.
 * Ref: https://orpc.dev/docs/integrations/sentry
 */
const sentryMiddleware = os.middleware(
  async ({ next }): Promise<Awaited<ReturnType<typeof next>>> => {
    try {
      return await next();
    } catch (error: unknown) {
      Sentry.captureException(error);
      throw error;
    }
  },
);

// ============================================================
// Base procedures
// ============================================================

/** Procedure base con Sentry error capturing */
export const baseProcedure = os.$context<BaseContext>().use(sentryMiddleware);

/** Procedure pubblica — alias di baseProcedure per chiarezza semantica */
export const publicProcedure = baseProcedure;

/**
 * Procedure autenticata — richiede un utente Clerk valido.
 * Funziona sia con session cookies (web) che Bearer tokens (mobile Expo).
 * Aggiunge `userId` al context.
 */
export const authProcedure = baseProcedure.use(
  async ({ next }): Promise<ReturnType<typeof next>> => {
    const { userId } = await auth();

    if (!userId) {
      throw new ORPCError('UNAUTHORIZED', {
        message: 'Autenticazione richiesta',
      });
    }

    return next({ context: { userId } });
  },
);
