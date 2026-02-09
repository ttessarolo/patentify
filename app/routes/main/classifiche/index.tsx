import { useEffect, useRef } from 'react';
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
 *
 * Il ref `hasNavigated` previene un loop infinito: useNavigate() restituisce
 * una nuova referenza ad ogni render, facendo ri-scattare l'effect.
 * Il guard assicura che la navigazione venga eseguita una sola volta.
 */
function ClassificheRedirect(): null {
  const navigate = useNavigate();
  const hydrated = useHydration();
  const view = useAppStore((s) => s.classifiche.view);
  const hasNavigated = useRef(false);

  // Reset se la view target cambia prima che la navigazione completi
  useEffect(() => {
    hasNavigated.current = false;
  }, [view]);

  useEffect(() => {
    if (!hydrated || hasNavigated.current) return;
    hasNavigated.current = true;
    void navigate({
      to: `/main/classifiche/${view}`,
      replace: true,
    });
  }, [navigate, view, hydrated]);

  return null;
}
