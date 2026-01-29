import React from 'react';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/main/errori-ricorrenti')({
  component: ErroriRicorrentiPage,
});

function ErroriRicorrentiPage(): React.JSX.Element {
  return <h1 className="text-2xl font-bold">Errori Ricorrenti</h1>;
}
