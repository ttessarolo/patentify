import React from 'react';
import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/sign-up')({
  component: SignUpLayout,
});

function SignUpLayout(): React.JSX.Element {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Outlet />
    </div>
  );
}
