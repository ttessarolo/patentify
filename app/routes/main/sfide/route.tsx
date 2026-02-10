/**
 * Layout Sfide — sezione multiplayer online.
 *
 * Wrapper di layout per le pagine sfide.
 * La gestione del messaggio `game-start` e la navigazione al quiz
 * sono ora centralizzate nel componente globale ChallengeGameStartHandler
 * (montato in __root.tsx) così da funzionare da qualsiasi pagina.
 */

import type { JSX } from 'react';
import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/main/sfide')({
  component: SfideLayout,
});

function SfideLayout(): JSX.Element {
  return (
    <div className="flex flex-col gap-4 p-4">
      <Outlet />
    </div>
  );
}
