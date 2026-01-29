import React from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Button } from '~/components/ui/button';

export const Route = createFileRoute('/main/')({
  component: MainIndex,
});

function MainIndex(): React.JSX.Element {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Benvenuto in Patentify</CardTitle>
          <CardDescription>
            La tua dashboard per i Quiz sulla Patente di Guida
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Questa è la pagina principale. Qui potrai fare gli esercizi e le
            simulazioni del quiz.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button asChild variant="default">
              <Link to="/main/esercitazione">Esercitazione Libera</Link>
            </Button>
            <Button asChild variant="default">
              <Link to="/main/simulazione-quiz">Simulazione Quiz</Link>
            </Button>
            <Button asChild variant="default">
              <Link to="/main/errori-ricorrenti">Errori Ricorrenti</Link>
            </Button>
            <Button asChild variant="default">
              <Link to="/main/statistiche">Statistiche</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
