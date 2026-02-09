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

      // Ignora errori noti da terze parti, bot e browser extension
      ignoreErrors: [
        // Errori da bot/tracker esterni (es. OpenReplay iniettato da crawler)
        'TrackerStorageType is not defined',
        // Errore benigno dei browser, non azionabile
        'ResizeObserver loop',
        // Rumore generico da promise rejection senza Error object
        'Non-Error promise rejection captured',
        // Errori di rete generici (non azionabili lato app)
        'Failed to fetch',
        'NetworkError',
        'Load failed',
      ],

      // Cattura solo errori da script del proprio dominio
      allowUrls: [
        /patentify\.it/,
        /patentify\.netlify\.app/,
        /localhost/,
      ],

      // Escludi esplicitamente sorgenti note di rumore
      denyUrls: [
        /extensions\//i,
        /^chrome-extension:\/\//,
        /^moz-extension:\/\//,
        /^safari-extension:\/\//,
        /translate\.google/,
        /connect\.facebook\.net/,
      ],
    });
  }

  return router;
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
