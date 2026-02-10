// Sentry server-side init — DEVE essere importato prima di tutto
import './sentry.server';

import { wrapFetchWithSentry } from '@sentry/tanstackstart-react';
import handler, {
  createServerEntry,
} from '@tanstack/react-start/server-entry';

export default createServerEntry(
  wrapFetchWithSentry({
    fetch(request: Request): Response | Promise<Response> {
      return handler.fetch(request);
    },
  })
);
