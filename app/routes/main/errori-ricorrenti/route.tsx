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
      {/* Toolbar sticky: attaccata alla navbar (nessuno spazio sopra) */}
      <TimePeriodToolbar currentPeriod={currentPeriod} />
      {/* Contenuto sotto-rotte: titolo sticky attaccato alla toolbar (space-y solo dopo) */}
      <div className="space-y-4 sm:space-y-6">
        <Outlet />
      </div>
    </div>
  );
}
