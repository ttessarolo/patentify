import React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { LogoutIcon, UserIcon } from '~/icons';

export const Route = createFileRoute('/main')({
  component: Main,
});

function Main(): React.JSX.Element {
  const navigate = useNavigate();

  const handleLogout = (): void => {
    // TODO: Implementare logout con Neon Auth
    navigate({ to: '/' });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Patentify</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <UserIcon className="w-5 h-5" />
              <span>Utente</span>
            </div>
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
          <CardContent>
            <p className="text-muted-foreground">
              Questa è la pagina principale. Qui potrai gestire i tuoi brevetti.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
