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
      <Card className="border-0">
        <CardHeader>
          <CardTitle>Benvenuto in Patentify</CardTitle>
          <CardDescription>
            La guida Smart per i Quiz sulla Patente di Guida
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button
              asChild
              className="border-2 border-white bg-transparent text-white transition-colors hover:bg-white hover:text-gray-900"
            >
              <Link to="/main/esercitazione">Esercitazione Libera</Link>
            </Button>
            <Button
              asChild
              className="border-2 border-white bg-transparent text-white transition-colors hover:bg-white hover:text-gray-900"
            >
              <Link to="/main/simulazione-quiz">Simulazione Quiz</Link>
            </Button>
            <Button
              asChild
              className="border-2 border-white bg-transparent text-white transition-colors hover:bg-white hover:text-gray-900"
            >
              <Link to="/main/errori-ricorrenti">Errori Ricorrenti</Link>
            </Button>
            <Button
              asChild
              className="border-2 border-white bg-transparent text-white transition-colors hover:bg-white hover:text-gray-900"
            >
              <Link to="/main/statistiche">Statistiche Quiz</Link>
            </Button>
            <Button
              asChild
              className="border-2 border-white bg-transparent text-white transition-colors hover:bg-white hover:text-gray-900"
            >
              <Link to="/main/consigli-e-trucchi">Consigli e Trucchi</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
