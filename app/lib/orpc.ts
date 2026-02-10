/**
 * Client isomorfico oRPC.
 *
 * - SSR (server): usa `createRouterClient` per chiamata diretta (zero HTTP overhead)
 * - Client (browser): usa `RPCLink` verso `/api/rpc`
 *
 * Esporta:
 *   - `client`  — RouterClient type-safe
 *   - `orpc`    — TanStack Query utils (queryOptions, mutationOptions, ecc.)
 */

import { createIsomorphicFn } from '@tanstack/react-start';
import { createRouterClient } from '@orpc/server';
import type { RouterClient } from '@orpc/server';
import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import { createTanstackQueryUtils } from '@orpc/tanstack-query';
import { appRouter } from '~/server/router';

const getORPCClient = createIsomorphicFn()
  .server(
    (): RouterClient<typeof appRouter> =>
      createRouterClient(appRouter, {
        context: async () => ({}),
      }),
  )
  .client((): RouterClient<typeof appRouter> => {
    const link = new RPCLink({
      url: `${window.location.origin}/api/rpc`,
    });
    return createORPCClient(link);
  });

export const client: RouterClient<typeof appRouter> = getORPCClient();

export const orpc = createTanstackQueryUtils(client);
