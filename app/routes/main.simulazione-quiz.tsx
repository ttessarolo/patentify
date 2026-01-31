import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Timer } from '~/components/timer';

export const Route = createFileRoute('/main/simulazione-quiz')({
  component: SimulazioneQuizPage,
});

function SimulazioneQuizPage(): React.JSX.Element {
  return (
    <>
      <h1 className="text-2xl font-bold">Simulazione Quiz!</h1>
      <Timer seconds={60 * 30} startMode="countdown" />
    </>
  );
}
