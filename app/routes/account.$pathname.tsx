import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { AccountView } from '@neondatabase/neon-js/auth/react/ui';

export const Route = createFileRoute('/account/$pathname')({
  component: Account,
});

function Account(): React.JSX.Element {
  const { pathname } = Route.useParams();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <AccountView pathname={pathname} />
      </div>
    </div>
  );
}
