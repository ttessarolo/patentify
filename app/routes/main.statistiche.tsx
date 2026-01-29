import React from 'react';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/main/statistiche')({
  component: StatistichePage,
});

function StatistichePage(): React.JSX.Element {
  return <h1 className="text-2xl font-bold">Statistiche</h1>;
}
