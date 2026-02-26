import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import { createTanstackQueryUtils } from '@orpc/tanstack-query';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://patentify.netlify.app';

export function createNativeORPCClient(
  getToken: () => Promise<string | null>
): ReturnType<typeof createORPCClient> {
  const link = new RPCLink({
    url: `${API_BASE_URL}/api/rpc`,
    headers: async (): Promise<Record<string, string>> => {
      const token = await getToken();

      if (!token) {
        return {};
      }

      return {
        Authorization: `Bearer ${token}`,
      };
    },
  });

  return createORPCClient(link);
}

export function createNativeORPCUtils(
  getToken: () => Promise<string | null>
): ReturnType<typeof createTanstackQueryUtils> {
  return createTanstackQueryUtils(createNativeORPCClient(getToken));
}
