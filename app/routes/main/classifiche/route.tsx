import type { JSX } from 'react';
import { useEffect, useCallback, useMemo } from 'react';
import {
  createFileRoute,
  Outlet,
  useNavigate,
  useLocation,
} from '@tanstack/react-router';
import { z } from 'zod';
import {
  TimePeriodToolbar,
  useTimePeriodFor,
} from '~/components/errori-ricorrenti';
import { ClassificheSwitch, MobileSortControl } from '~/components/classifiche';
import { useAppStore } from '~/store';
import { QuizIcon, WrongIcon, AllPeopleIcon, StarOnIcon } from '~/icons';

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
 * La view attiva (quiz/risposte) è derivata dall'URL quando siamo su una
 * sotto-rotta (/quiz o /risposte). Sulla rotta index viene usato il valore
 * persistito nello store per evitare flickering del toggle prima del redirect.
 */
function ClassificheLayout(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPeriod = useTimePeriodFor('classifiche');

  // Store: view persistita + scope + setter
  const storeView = useAppStore((s) => s.classifiche.view);
  const scope = useAppStore((s) => s.classifiche.scope);
  const setView = useAppStore((s) => s.setClassificheView);
  const setScope = useAppStore((s) => s.setClassificheScope);

  // Store: sort per mobile sort control
  const quizSortField = useAppStore((s) => s.classifiche.quizSortField);
  const quizSortDir = useAppStore((s) => s.classifiche.quizSortDir);
  const setQuizSort = useAppStore((s) => s.setClassificheQuizSort);
  const risposteSortField = useAppStore((s) => s.classifiche.risposteSortField);
  const risposteSortDir = useAppStore((s) => s.classifiche.risposteSortDir);
  const setRisposteSort = useAppStore((s) => s.setClassificheRisposteSort);

  // Siamo su una sotto-rotta (/quiz o /risposte) o sulla rotta index?
  const isOnSubRoute =
    location.pathname.includes('/quiz') ||
    location.pathname.includes('/risposte');

  // Deriva la view corrente: su sotto-rotta usa l'URL (source of truth),
  // sulla rotta index usa lo store per evitare flickering del toggle
  // (altrimenti mostrerebbe sempre 'quiz' prima del redirect).
  const view: 'quiz' | 'risposte' = isOnSubRoute
    ? location.pathname.includes('/risposte')
      ? 'risposte'
      : 'quiz'
    : storeView;

  useEffect(() => {
    if (isOnSubRoute) {
      setView(view);
    }
  }, [view, setView, isOnSubRoute]);

  // Derive title
  const title = view === 'quiz' ? 'Classifica Quiz' : 'Classifica Risposte';

  // ---- Mobile sort control (view-aware) ----
  const quizSortOptions = useMemo(
    () => [
      { value: 'promosso', label: '% Promosso' },
      { value: 'bocciato', label: '% Bocciato' },
    ],
    []
  );

  const risposteSortOptions = useMemo(
    () => [
      { value: 'copertura', label: '% Copertura' },
      { value: 'sbagliate', label: '% Sbagliate' },
      { value: 'corrette', label: '% Giuste' },
    ],
    []
  );

  const handleQuizSortField = useCallback(
    (field: string): void => {
      const f = field as 'promosso' | 'bocciato';
      if (f !== quizSortField) setQuizSort(f, 'desc');
    },
    [quizSortField, setQuizSort]
  );

  const handleQuizDirToggle = useCallback((): void => {
    setQuizSort(quizSortField, quizSortDir === 'desc' ? 'asc' : 'desc');
  }, [quizSortField, quizSortDir, setQuizSort]);

  const handleRisposteSortField = useCallback(
    (field: string): void => {
      const f = field as 'copertura' | 'sbagliate' | 'corrette';
      if (f !== risposteSortField) setRisposteSort(f, 'desc');
    },
    [risposteSortField, setRisposteSort]
  );

  const handleRisposteDirToggle = useCallback((): void => {
    setRisposteSort(
      risposteSortField,
      risposteSortDir === 'desc' ? 'asc' : 'desc'
    );
  }, [risposteSortField, risposteSortDir, setRisposteSort]);

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
      <div className="sticky top-(--header-height,3.5rem) z-20 -mx-2 bg-background px-2 pb-3 sm:-mx-4 sm:px-4">
        {/* Toolbar periodo temporale (sticky disabilitato, gestito dal container) */}
        <TimePeriodToolbar
          currentPeriod={currentPeriod}
          section="classifiche"
          disableSticky
        />

        {/* Titolo */}
        <h1 className="mt-2 mb-4 text-center text-2xl font-bold sm:my-2 sm:text-left sm:text-3xl">
          {title}
        </h1>

        {/* Switch row */}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          {/* Switch Quiz / Risposte */}
          <ClassificheSwitch
            options={[
              { value: 'quiz' as const, label: 'Quiz', Icon: QuizIcon },
              {
                value: 'risposte' as const,
                label: 'Risposte',
                Icon: WrongIcon,
              },
            ]}
            value={view}
            onChange={handleViewChange}
            activeColor="teal"
          />

          {/* Switch Generale / Seguiti */}
          <ClassificheSwitch
            options={[
              {
                value: 'generale' as const,
                label: 'Generale',
                Icon: AllPeopleIcon,
              },
              { value: 'seguiti' as const, label: 'Seguiti', Icon: StarOnIcon },
            ]}
            value={scope}
            onChange={setScope}
            activeColor="pink"
          />
        </div>

        {/* Controllo ordinamento mobile (dentro sticky) */}
        {view === 'quiz' ? (
          <div className="mt-2 sm:hidden">
            <MobileSortControl
              sortOptions={quizSortOptions}
              currentField={quizSortField}
              currentDir={quizSortDir}
              onFieldChange={handleQuizSortField}
              onDirToggle={handleQuizDirToggle}
            />
          </div>
        ) : (
          <div className="mt-2 sm:hidden">
            <MobileSortControl
              sortOptions={risposteSortOptions}
              currentField={risposteSortField}
              currentDir={risposteSortDir}
              onFieldChange={handleRisposteSortField}
              onDirToggle={handleRisposteDirToggle}
            />
          </div>
        )}
      </div>

      {/* Contenuto sotto-rotte */}
      <div className="space-y-4 sm:space-y-6">
        <Outlet />
      </div>
    </div>
  );
}
