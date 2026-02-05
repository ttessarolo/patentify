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
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-1 items-center justify-center md:items-start md:justify-center md:pt-8 lg:pt-30 p-4">
        <div className="flex flex-col items-center space-y-8 w-full">
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
              <Button
                size="lg"
                className="border-2 border-white bg-transparent text-white transition-colors hover:bg-white hover:text-gray-900"
              >
                Accedi
              </Button>
            </Link>
          </SignedOut>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center">
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <Link
            to="/privacy-policy"
            className="hover:text-foreground transition-colors"
          >
            Privacy Policy
          </Link>
          <span>•</span>
          <Link
            to="/terms-of-service"
            className="hover:text-foreground transition-colors"
          >
            Termini di Servizio
          </Link>
        </div>
      </footer>
    </div>
  );
}
