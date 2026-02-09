import type { JSX } from 'react';
import { createFileRoute, Outlet } from '@tanstack/react-router';
import { z } from 'zod';
import {
  TimePeriodToolbar,
  useTimePeriod,
} from '~/components/errori-ricorrenti';

// Schema per i search params
// NON usare .default() qui, altrimenti sovrascrive sempre il valore dello store
const searchSchema = z.object({
  period: z.enum(['oggi', 'settimana', 'mese', 'tutti']).optional(),
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
function ErroriRicorrentiLayout(): JSX.Element {
  const currentPeriod = useTimePeriod();

  return (
    <div className="mx-auto max-w-4xl px-2 pb-4 sm:px-4">
      {/* Blocco sticky: toolbar + titolo */}
      <div className="sticky top-[var(--header-height,3.5rem)] z-20 -mx-2 bg-background px-2 pb-0 sm:-mx-4 sm:px-4">
        <TimePeriodToolbar currentPeriod={currentPeriod} disableSticky />
        <h1 className="my-2 text-center text-2xl font-bold sm:text-left sm:text-3xl">
          Errori Ricorrenti
        </h1>
      </div>
      {/* Contenuto sotto-rotte */}
      <div className="space-y-4 sm:space-y-6">
        <Outlet />
      </div>
    </div>
  );
}
