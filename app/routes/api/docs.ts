import { createFileRoute, redirect } from '@tanstack/react-router';
import { auth } from '@clerk/tanstack-react-start/server';
import { isAdmin } from '~/lib/auth';

/**
 * API Documentation — Scalar UI
 *
 * Serve una pagina Scalar API Reference interattiva a /api/docs.
 * Protetta da autenticazione Clerk: solo utenti loggati possono accedervi.
 * La spec viene caricata da /api/v1/spec.
 */
export const Route = createFileRoute('/api/docs')({
  server: {
    handlers: {
      GET: async ({ request }): Promise<Response> => {
        // Verifica autenticazione + ruolo admin
        const { userId } = await auth();
        if (!userId) {
          throw redirect({ to: '/' });
        }
        const admin = await isAdmin(userId);
        if (!admin) {
          throw redirect({ to: '/' });
        }

        const url = new URL(request.url);
        const specUrl = `${url.origin}/api/v1/spec`;

        const html = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Patentify — API Reference</title>
  <meta name="robots" content="noindex, nofollow" />
  <style>
    /* Override per allineare Scalar al design system Patentify */
    :root {
      --scalar-font: 'Noto Sans', system-ui, -apple-system, sans-serif;
    }
    body {
      margin: 0;
      font-family: var(--scalar-font);
    }
    .patentify-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 24px;
      border-bottom: 1px solid rgba(128, 128, 128, 0.15);
      background: var(--scalar-background-1, #fff);
    }
    .patentify-header img {
      height: 36px;
      width: auto;
    }
    .patentify-header span {
      font-size: 14px;
      font-weight: 500;
      color: var(--scalar-color-2, #666);
      letter-spacing: 0.02em;
    }
  </style>
</head>
<body>
  <div class="patentify-header">
    <img src="/patentify_logotype.png" alt="Patentify" />
    <span>API Reference</span>
  </div>
  <script
    id="api-reference"
    data-url="${specUrl}"
    data-configuration="${escapeAttr(
      JSON.stringify({
        theme: 'kepler',
        hideClientButton: false,
        hiddenClients: [],
        defaultHttpClient: {
          targetKey: 'javascript',
          clientKey: 'fetch',
        },
        metaData: {
          title: 'Patentify API Reference',
          description: 'Documentazione interattiva delle API REST di Patentify.',
        },
      }),
    )}"
  ></script>
  <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
</body>
</html>`;

        return new Response(html, {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-store',
            'X-Robots-Tag': 'noindex, nofollow',
          },
        });
      },
    },
  },
});

/** Escapa attributi HTML per evitare injection */
function escapeAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
