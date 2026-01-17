import { createAuthClient } from '@neondatabase/neon-js/auth';
import { BetterAuthReactAdapter } from '@neondatabase/neon-js/auth/react';

const authUrl = import.meta.env.VITE_NEON_AUTH_URL;

if (!authUrl) {
  throw new Error(
    'VITE_NEON_AUTH_URL is not defined. Please set it in your .env file.'
  );
}

export const authClient = createAuthClient(authUrl, {
  adapter: BetterAuthReactAdapter(),
});
