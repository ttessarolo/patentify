import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { AuthView } from '@neondatabase/neon-js/auth/react/ui';

export const Route = createFileRoute('/auth/$pathname')({
  component: Auth,
});

function Auth(): React.JSX.Element {
  const { pathname } = Route.useParams();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <AuthView pathname={pathname} />
      </div>
    </div>
  );
}
