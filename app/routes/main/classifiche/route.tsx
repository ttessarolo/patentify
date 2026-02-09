import type { JSX } from 'react';
import { useEffect } from 'react';
import { createFileRoute, Outlet, useNavigate, useLocation } from '@tanstack/react-router';
import { z } from 'zod';
import {
  TimePeriodToolbar,
  useTimePeriodFor,
} from '~/components/errori-ricorrenti';
import { ClassificheSwitch } from '~/components/classifiche';
import { useAppStore } from '~/store';
import { QuizIcon, WrongIcon, AllPeopleIcon, FriendsIcon } from '~/icons';

// Schema per i search params
const searchSchema = z.object({
  period: z.enum(['oggi', 'settimana', 'mese', 'tutti']).optional(),
});

export const Route = createFileRoute('/main/classifiche')({
  validateSearch: searchSchema,
  component: ClassificheLayout,
});

/**
 * Layout per la sezione Classifiche.
 * Contiene la toolbar periodo, i due switch e l'Outlet per le sotto-rotte.
 *
 * La view attiva (quiz/risposte) è derivata dall'URL (source of truth),
 * non dallo store. Lo store viene tenuto in sync per il redirect iniziale.
 */
function ClassificheLayout(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPeriod = useTimePeriodFor('classifiche');

  // Deriva la view corrente dall'URL (source of truth)
  const view: 'quiz' | 'risposte' = location.pathname.includes('/risposte')
    ? 'risposte'
    : 'quiz';

  // Store: scope + setter per persistenza
  const scope = useAppStore((s) => s.classifiche.scope);
  const setView = useAppStore((s) => s.setClassificheView);
  const setScope = useAppStore((s) => s.setClassificheScope);

  // Sincronizza lo store con l'URL corrente (per il redirect futuro).
  // NON sovrascrivere quando siamo sulla rotta index (/main/classifiche)
  // perché lì il view è derivato come 'quiz' di default e cancellerebbe
  // il valore persistito (es. 'risposte') prima che il redirect lo legga.
  const isOnSubRoute =
    location.pathname.includes('/quiz') ||
    location.pathname.includes('/risposte');

  useEffect(() => {
    if (isOnSubRoute) {
      setView(view);
    }
  }, [view, setView, isOnSubRoute]);

  // Derive title
  const title = view === 'quiz' ? 'Classifica Quiz' : 'Classifica Risposte';

  // Switch Quiz/Risposte: naviga tra sotto-rotte
  const handleViewChange = (newView: 'quiz' | 'risposte'): void => {
    const basePath = '/main/classifiche';
    const targetPath = `${basePath}/${newView}`;
    const currentSearch = location.search as Record<string, unknown>;
    void navigate({ to: targetPath, search: currentSearch });
  };

  return (
    <div className="mx-auto max-w-4xl px-2 pb-4 sm:px-4">
      {/* Blocco sticky unico: toolbar + titolo + switch */}
      <div className="sticky top-[var(--header-height,3.5rem)] z-20 -mx-2 bg-background px-2 pb-3 sm:-mx-4 sm:px-4">
        {/* Toolbar periodo temporale (sticky disabilitato, gestito dal container) */}
        <TimePeriodToolbar
          currentPeriod={currentPeriod}
          section="classifiche"
          disableSticky
        />

        {/* Titolo */}
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{title}</h1>

        {/* Switch row */}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          {/* Switch Quiz / Risposte */}
          <ClassificheSwitch
            options={[
              { value: 'quiz' as const, label: 'Quiz', Icon: QuizIcon },
              { value: 'risposte' as const, label: 'Risposte', Icon: WrongIcon },
            ]}
            value={view}
            onChange={handleViewChange}
            activeColor="teal"
          />

          {/* Switch Generale / Amici */}
          <ClassificheSwitch
            options={[
              { value: 'generale' as const, label: 'Generale', Icon: AllPeopleIcon },
              { value: 'amici' as const, label: 'Amici', Icon: FriendsIcon },
            ]}
            value={scope}
            onChange={setScope}
            activeColor="pink"
          />
        </div>
      </div>

      {/* Contenuto sotto-rotte */}
      <div className="space-y-4 sm:space-y-6">
        <Outlet />
      </div>
    </div>
  );
}
