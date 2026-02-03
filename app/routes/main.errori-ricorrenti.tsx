import React from 'react';
import { createFileRoute, Outlet } from '@tanstack/react-router';
import { z } from 'zod';
import {
  TimePeriodToolbar,
  useTimePeriod,
} from '~/components/errori-ricorrenti';

// Schema per i search params
const searchSchema = z.object({
  period: z
    .enum(['oggi', 'settimana', 'mese', 'tutti'])
    .optional()
    .default('tutti'),
});

export const Route = createFileRoute('/main/errori-ricorrenti')({
  validateSearch: searchSchema,
  component: ErroriRicorrentiLayout,
});

/**
 * Layout per la sezione Errori Ricorrenti.
 * Contiene la toolbar sticky per la selezione del periodo
 * e l'Outlet per le sotto-rotte.
 */
function ErroriRicorrentiLayout(): React.JSX.Element {
  const currentPeriod = useTimePeriod();

  return (
    <div className="mx-auto max-w-4xl space-y-4 px-2 pb-4 sm:space-y-6 sm:px-4">
      {/* Toolbar sticky per selezione periodo */}
      <TimePeriodToolbar currentPeriod={currentPeriod} />

      {/* Contenuto delle sotto-rotte */}
      <Outlet />
    </div>
  );
}
