import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { SignIn } from '@clerk/tanstack-react-start';

export const Route = createFileRoute('/sign-in/$')({
  component: SignInPage,
});

function SignInPage(): React.JSX.Element {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/main"
      />
    </div>
  );
}
