import type { JSX } from 'react';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/main/help/')({
  component: HelpIndex,
});

function HelpIndex(): JSX.Element {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Help</h1>
      <p className="text-muted-foreground">Contenuto in arrivo.</p>
    </div>
  );
}
