/**
 * Pagina principale Sfide — mostra utenti online e storico sfide.
 */

import type { JSX } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { OnlineUsersList } from '~/components/sfide/OnlineUsersList';
import { ChallengeHistory } from '~/components/sfide/ChallengeHistory';

export const Route = createFileRoute('/main/sfide/')({
  component: SfideIndex,
});

function SfideIndex(): JSX.Element {
  return (
    <>
      {/* Titolo sezione */}
      <h1 className="text-xl font-bold">Sfide</h1>

      {/* Box utenti online */}
      <OnlineUsersList />

      {/* Box storico sfide */}
      <ChallengeHistory />
    </>
  );
}
