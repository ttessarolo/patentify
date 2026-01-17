import React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
  SignedIn,
  RedirectToSignIn,
  UserButton,
} from '@neondatabase/neon-js/auth/react/ui';
import { authClient } from '~/lib/auth';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { LogoutIcon } from '~/icons';

export const Route = createFileRoute('/main')({
  component: Main,
});

function Main(): React.JSX.Element {
  const navigate = useNavigate();
  const { data } = authClient.useSession();

  const handleLogout = async (): Promise<void> => {
    await authClient.signOut();
    navigate({ to: '/' });
  };

  return (
    <>
      <SignedIn>
        <div className="min-h-screen bg-background">
          <header className="border-b bg-card">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
              <h1 className="text-2xl font-bold">Patentify</h1>
              <div className="flex items-center gap-4">
                <UserButton />
                <Button variant="outline" onClick={handleLogout}>
                  <LogoutIcon className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </header>

          <main className="container mx-auto px-4 py-8">
            <Card>
              <CardHeader>
                <CardTitle>Benvenuto in Patentify</CardTitle>
                <CardDescription>
                  La tua dashboard per la gestione dei brevetti
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Questa è la pagina principale. Qui potrai gestire i tuoi
                  brevetti.
                </p>
                {data?.user && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Dati Sessione:
                    </p>
                    <pre className="text-xs bg-background p-3 rounded overflow-x-auto">
                      {JSON.stringify(
                        { session: data.session, user: data.user },
                        null,
                        2
                      )}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </SignedIn>
      <RedirectToSignIn />
    </>
  );
}
