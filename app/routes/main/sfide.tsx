import type { JSX } from 'react';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/main/sfide')({
  component: SfidePage,
});

function SfidePage(): JSX.Element {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <h1 className="text-2xl font-bold text-white">Sfide</h1>
    </div>
  );
}
