import { OpenAPIHandler } from '@orpc/openapi/fetch';
import { OpenAPIGenerator } from '@orpc/openapi';
import { ZodToJsonSchemaConverter } from '@orpc/zod/zod4';
import { CORSPlugin } from '@orpc/server/plugins';
import { createFileRoute } from '@tanstack/react-router';
import { auth } from '@clerk/tanstack-react-start/server';
import { appRouter } from '~/server/router';
import { isAdmin } from '~/lib/auth';

const handler = new OpenAPIHandler(appRouter, {
  plugins: [new CORSPlugin()],
});

/** Cache per la spec OpenAPI generata (lazy, una sola volta) */
let cachedSpec: Record<string, unknown> | null = null;

async function getOpenAPISpec(): Promise<Record<string, unknown>> {
  if (cachedSpec) return cachedSpec;

  const generator = new OpenAPIGenerator({
    schemaConverters: [new ZodToJsonSchemaConverter()],
  });

  cachedSpec = await generator.generate(appRouter, {
    info: {
      title: 'Patentify API',
      version: '1.0.0',
      description:
        'API REST per Patentify — quiz patente, errori ricorrenti, classifiche, esercitazione.',
    },
    servers: [{ url: '/api/v1' }],
  });

  return cachedSpec;
}

export const Route = createFileRoute('/api/v1/$')({
  server: {
    handlers: {
      ANY: async ({ request }): Promise<Response> => {
        const url = new URL(request.url);

        // Endpoint /api/v1/spec → restituisce la spec OpenAPI in JSON (solo admin)
        if (url.pathname === '/api/v1/spec') {
          const { userId } = await auth();
          if (!userId) {
            return new Response('Unauthorized', { status: 401 });
          }
          const admin = await isAdmin(userId);
          if (!admin) {
            return new Response('Forbidden', { status: 403 });
          }

          const spec = await getOpenAPISpec();
          return new Response(JSON.stringify(spec, null, 2), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
          });
        }

        const { response } = await handler.handle(request, {
          prefix: '/api/v1',
          context: {},
        });
        return response ?? new Response('Not Found', { status: 404 });
      },
    },
  },
});
