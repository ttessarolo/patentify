/**
 * Sentry server-side initialization.
 * Questo modulo DEVE essere importato prima di qualsiasi altro codice server
 * (es. in app/server.ts) per garantire che il tracing sia attivo.
 */
import * as Sentry from '@sentry/tanstackstart-react';
import { ORPCInstrumentation } from '@orpc/otel';

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  sendDefaultPii: true,
  tracesSampleRate: 1.0,
  openTelemetryInstrumentations: [new ORPCInstrumentation()],
});
