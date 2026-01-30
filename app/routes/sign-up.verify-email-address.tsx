import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { SignUp } from '@clerk/tanstack-react-start';

export const Route = createFileRoute('/sign-up/verify-email-address')({
  component: SignUpVerifyEmailPage,
});

function SignUpVerifyEmailPage(): React.JSX.Element {
  return (
    <SignUp
      routing="path"
      path="/sign-up"
      signInUrl="/sign-in"
      fallbackRedirectUrl="/main"
    />
  );
}
