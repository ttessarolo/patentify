/// <reference types="vite/client" />
import type { JSX, ReactNode } from 'react';
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
} from '@tanstack/react-router';
import {
  QueryClient,
  QueryClientProvider,
  QueryCache,
  MutationCache,
} from '@tanstack/react-query';
import * as Sentry from '@sentry/tanstackstart-react';
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { TanStackDevtools } from '@tanstack/react-devtools';
import { ClerkProvider } from '@clerk/tanstack-react-start';
import { itIT } from '@clerk/localizations';
import { useStoreRehydration } from '~/store/hooks/useHydration';
import { useVersionCheck } from '~/store/hooks/useVersionCheck';
import { PWAInstallPrompt } from '~/components/pwa-install-prompt';
import { UpdateDialog } from '~/components/update-dialog';
import { AblyPresenceManager } from '~/components/sfide/AblyPresenceManager';
import { IncomingChallengeDialog } from '~/components/sfide/IncomingChallengeDialog';
import { ChallengeGameStartHandler } from '~/components/sfide/ChallengeGameStartHandler';
import '~/styles/globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      throwOnError: false,
    },
  },
  queryCache: new QueryCache({
    onError: (error, query) => {
      Sentry.captureException(error, {
        tags: { type: 'query' },
        extra: { queryKey: query.queryKey },
      });
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      Sentry.captureException(error, {
        tags: { type: 'mutation' },
        extra: { mutationKey: mutation.options.mutationKey },
      });
    },
  }),
});

function NotFoundComponent(): JSX.Element {
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
      {
        name: 'apple-mobile-web-app-title',
        content: 'Patentify',
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
      {
        rel: 'icon',
        type: 'image/png',
        href: '/favicon-96x96.png',
        sizes: '96x96',
      },
      {
        rel: 'icon',
        type: 'image/svg+xml',
        href: '/favicon.svg',
      },
      {
        rel: 'shortcut icon',
        href: '/favicon.ico',
      },
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/apple-touch-icon.png',
      },
      {
        rel: 'manifest',
        href: '/site.webmanifest',
      },
    ],
  }),
  component: RootComponent,
});

function RootComponent(): JSX.Element {
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
}: Readonly<{ children: ReactNode }>): JSX.Element {
  // Trigger hydration dello store Zustand dal localStorage
  useStoreRehydration();

  // Avvia il version check per rilevare aggiornamenti disponibili
  useVersionCheck();

  return (
    <ClerkProvider
      publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
      localization={itIT}
      appearance={{
        variables: {
          colorBackground: 'oklch(0.22 0.02 250.01)',
          colorForeground: 'var(--color-foreground)',
          colorPrimary: 'var(--color-primary)',
          colorPrimaryForeground: 'var(--color-primary-foreground)',
          colorMuted: 'var(--color-muted)',
          colorMutedForeground: 'var(--color-muted-foreground)',
          colorInput: 'var(--color-input)',
          colorInputForeground: 'var(--color-foreground)',
          colorBorder: 'var(--color-border)',
          colorRing: 'var(--color-ring)',
          colorShadow: 'transparent',
        },
        elements: {
          card: {
            borderWidth: '2px',
          },
          socialButtonsBlockButton: {
            borderColor: 'oklch(0.55 0.02 250)',
          },
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        {children}
        <PWAInstallPrompt />
        <UpdateDialog />
        <AblyPresenceManager />
        <IncomingChallengeDialog />
        <ChallengeGameStartHandler />
        {import.meta.env.DEV && (
          <>
            <TanStackDevtools
              plugins={[
                {
                  name: 'TanStack Query',
                  render: <ReactQueryDevtoolsPanel />,
                  defaultOpen: true,
                },
                {
                  name: 'TanStack Router',
                  render: <TanStackRouterDevtoolsPanel />,
                  defaultOpen: false,
                },
              ]}
            />
            {/* <ReactQueryDevtools
              initialIsOpen={false}
              buttonPosition="bottom-right"
            />
            <TanStackRouterDevtools
              initialIsOpen={false}
              position="bottom-left"
            /> */}
          </>
        )}
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function RootDocument({
  children,
}: Readonly<{ children: ReactNode }>): JSX.Element {
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
