import React, { useEffect } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { SignedIn, SignedOut } from '@neondatabase/neon-js/auth/react/ui';
import { authClient } from '~/lib/auth';
import { Button } from '~/components/ui/button';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index(): React.JSX.Element {
  const navigate = useNavigate();
  const session = authClient.useSession();

  useEffect(() => {
    if (session.data) {
      navigate({ to: '/main' });
    }
  }, [session.data, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="flex flex-col items-center space-y-8">
        <img
          src="/hero_patentify.png"
          alt="Patentify - Scopri i trucchi per superare l'esame"
          className="w-full max-w-xs sm:max-w-md md:max-w-xl lg:max-w-2xl object-contain"
        />

        <SignedIn>
          <p className="text-muted-foreground">Reindirizzamento...</p>
        </SignedIn>

        <SignedOut>
          <Link to="/auth/$pathname" params={{ pathname: 'login' }}>
            <Button size="lg">Accedi</Button>
          </Link>
        </SignedOut>
      </div>
    </div>
  );
}
