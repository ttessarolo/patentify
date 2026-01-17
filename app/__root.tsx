import React from 'react';
import { Outlet, createRootRoute } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NeonAuthUIProvider } from '@neondatabase/neon-js/auth/react';
import { authClient } from '~/lib/auth';
import '~/styles/globals.css';

const queryClient = new QueryClient();

export const Route = createRootRoute({
  component: Root,
});

function Root(): React.JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <NeonAuthUIProvider authClient={authClient}>
        <Outlet />
      </NeonAuthUIProvider>
    </QueryClientProvider>
  );
}
