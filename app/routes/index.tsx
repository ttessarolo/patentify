import React, { useEffect } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { SignedIn, SignedOut, useAuth } from '@clerk/tanstack-react-start';
import { Button } from '~/components/ui/button';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index(): React.JSX.Element {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate({ to: '/main' });
    }
  }, [isSignedIn, isLoaded, navigate]);

  return (
    <div className="h-screen w-full overflow-hidden flex items-center justify-center p-4 bg-background">
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
          <Link to="/sign-in">
            <Button size="lg">Accedi</Button>
          </Link>
        </SignedOut>
      </div>
    </div>
  );
}
