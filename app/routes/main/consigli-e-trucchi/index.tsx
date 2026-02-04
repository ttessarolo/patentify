import React from 'react';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/main/consigli-e-trucchi/')({
  component: ConsigliETrucchiIndex,
});

function ConsigliETrucchiIndex(): React.JSX.Element {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Consigli e Trucchi</h1>
      <p className="text-muted-foreground">
        Contenuto in arrivo.
      </p>
    </div>
  );
}
