import { useEffect } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useAppStore } from '~/store';
import { useHydration } from '~/store/hooks/useHydration';

export const Route = createFileRoute('/main/classifiche/')({
  component: ClassificheRedirect,
});

/**
 * Redirect alla sotto-rotta corretta in base alla view persistita nello store.
 * Usa un componente client perché beforeLoad gira anche server-side
 * dove lo store Zustand non è disponibile.
 *
 * IMPORTANTE: Attende l'hydration dello store prima di leggere la view,
 * altrimenti leggerebbe il valore default ('quiz') ignorando la persistenza.
 */
function ClassificheRedirect(): null {
  const navigate = useNavigate();
  const hydrated = useHydration();
  const view = useAppStore((s) => s.classifiche.view);

  useEffect(() => {
    if (!hydrated) return;
    void navigate({
      to: `/main/classifiche/${view}`,
      replace: true,
    });
  }, [navigate, view, hydrated]);

  return null;
}
