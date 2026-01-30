import React, { useRef, useEffect } from 'react';
import {
  createFileRoute,
  Link,
  Outlet,
  useNavigate,
} from '@tanstack/react-router';
import {
  SignedIn,
  SignedOut,
  UserButton,
  useAuth,
} from '@clerk/tanstack-react-start';

export const Route = createFileRoute('/main')({
  component: MainLayout,
});

function MainLayout(): React.JSX.Element {
  const headerRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useAuth();

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate({ to: '/sign-in' });
    }
  }, [isLoaded, isSignedIn, navigate]);

  // Imposta --header-height su document.documentElement per posizionamento relativo
  useEffect(() => {
    const updateHeaderHeight = (): void => {
      if (headerRef.current) {
        const height = headerRef.current.offsetHeight;
        document.documentElement.style.setProperty(
          '--header-height',
          `${height}px`
        );
      }
    };

    // Imposta l'altezza iniziale
    updateHeaderHeight();

    // Aggiorna su resize e orientationchange
    window.addEventListener('resize', updateHeaderHeight);
    window.addEventListener('orientationchange', updateHeaderHeight);

    // ResizeObserver per cambiamenti del contenuto dell'header
    const resizeObserver = new ResizeObserver(updateHeaderHeight);
    if (headerRef.current) {
      resizeObserver.observe(headerRef.current);
    }

    return (): void => {
      window.removeEventListener('resize', updateHeaderHeight);
      window.removeEventListener('orientationchange', updateHeaderHeight);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <>
      <SignedOut>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-muted-foreground">Reindirizzamento al login...</p>
        </div>
      </SignedOut>
      <SignedIn>
        <div className="min-h-screen bg-background">
          <header
            ref={headerRef}
            className="sticky top-0 z-10 border-b bg-card"
          >
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link
                  to="/main"
                  className="hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-ring rounded"
                >
                  <img
                    src="/patentify_logotype.png"
                    alt="Patentify"
                    className="h-7 sm:h-8 md:h-9 w-auto"
                  />
                </Link>
              </div>
              <div className="flex items-center">
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: 'h-8 w-8',
                      userButtonPopoverActionButton: 'text-white',
                    },
                  }}
                />
              </div>
            </div>
          </header>

          <main className="container mx-auto px-4 py-8">
            <Outlet />
          </main>
        </div>
      </SignedIn>
    </>
  );
}
