import * as Sentry from '@sentry/tanstackstart-react';
import { createRouter as createTanStackRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
  });

  // Inizializza Sentry solo lato client
  if (!router.isServer) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      sendDefaultPii: true,
      integrations: [Sentry.tanstackRouterBrowserTracingIntegration(router)],
    });
  }

  return router;
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
