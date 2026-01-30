import { clerkMiddleware } from '@clerk/tanstack-react-start/server';
import { createStart } from '@tanstack/react-start';

/**
 * TanStack Start configuration with Clerk middleware.
 * This enables Clerk authentication across all server functions and routes.
 */
export const startInstance = createStart(() => {
  return {
    requestMiddleware: [clerkMiddleware()],
  };
});
