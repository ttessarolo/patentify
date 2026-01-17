import React, { useEffect } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
  SignedIn,
  RedirectToSignIn,
} from '@neondatabase/neon-js/auth/react/ui';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index(): React.JSX.Element {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect automatico a /main se già autenticato
    // Il componente SignedIn gestisce già questo, ma aggiungiamo un fallback
  }, [navigate]);

  return (
    <>
      <SignedIn>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-foreground">Patentify</h1>
            <p className="text-muted-foreground">
              Reindirizzamento alla dashboard...
            </p>
          </div>
        </div>
        <RedirectComponent />
      </SignedIn>
      <RedirectToSignIn />
    </>
  );
}

function RedirectComponent(): null {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: '/main' });
  }, [navigate]);

  return null;
}
