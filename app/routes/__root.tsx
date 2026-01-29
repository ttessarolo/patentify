/// <reference types="vite/client" />
import React from 'react';
import type { ReactNode } from 'react';
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
} from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { NeonAuthUIProvider } from '@neondatabase/neon-js/auth/react';
import { authClient } from '~/lib/auth';
import '~/styles/globals.css';

const queryClient = new QueryClient();

function NotFoundComponent(): React.JSX.Element {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <h1 className="text-2xl font-semibold">Pagina non trovata</h1>
      <p className="text-muted-foreground text-center">
        L&apos;URL richiesto non esiste o non è più disponibile.
      </p>
      <a
        href="/"
        className="text-primary underline underline-offset-4 hover:no-underline"
      >
        Torna alla home
      </a>
    </div>
  );
}

export const Route = createRootRoute({
  notFoundComponent: NotFoundComponent,
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Patentify',
      },
    ],
    links: [
      {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,100..900;1,100..900&display=swap',
      },
    ],
  }),
  component: RootComponent,
});

function RootComponent(): React.JSX.Element {
  return (
    <RootDocument>
      <Providers>
        <Outlet />
      </Providers>
    </RootDocument>
  );
}

function Providers({
  children,
}: Readonly<{ children: ReactNode }>): React.JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <NeonAuthUIProvider authClient={authClient}>
        {children}
        {import.meta.env.DEV && (
          <>
            <ReactQueryDevtools
              initialIsOpen={false}
              buttonPosition="bottom-right"
            />
            <TanStackRouterDevtools
              initialIsOpen={false}
              position="bottom-left"
            />
          </>
        )}
      </NeonAuthUIProvider>
    </QueryClientProvider>
  );
}

function RootDocument({
  children,
}: Readonly<{ children: ReactNode }>): React.JSX.Element {
  return (
    <html lang="it" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body
        className="min-h-screen bg-background font-sans antialiased"
        suppressHydrationWarning
      >
        {children}
        <Scripts />
      </body>
    </html>
  );
}
