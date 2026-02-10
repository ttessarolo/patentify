/**
 * Schermata risultati sfida multiplayer.
 *
 * Mostra il confronto tra i due giocatori, chi ha vinto,
 * se promosso o bocciato, e le risposte corrette/errate.
 */

import type { JSX } from 'react';
import { Button } from '~/components/ui/button';
import { CorrectIcon, WrongIcon, TimelapseIcon } from '~/icons';
import { formatSecondsToHHMMSS } from '~/components/timer';
import { QUIZ_SIZE } from '~/commons';
import type { MultiplayerQuizResult } from './MultiplayerQuiz';

interface ChallengeResultsProps {
  /** Risultati del player corrente */
  myResult: MultiplayerQuizResult;
  /** Nome del player corrente */
  myName: string;
  /** Nome dell'avversario */
  opponentName: string;
  /** Risposte corrette dell'avversario (dal server) */
  opponentCorrect: number;
  /** ID del vincitore (null se pareggio) */
  winnerId: string | null;
  /** ID del player corrente */
  myUserId: string;
  /** Callback per tornare alle sfide */
  onBack: () => void;
  /** Callback per rivedere il quiz */
  onReviewQuiz: () => void;
  /** Callback per sfidare di nuovo lo stesso avversario */
  onRematch: () => void;
}

export function ChallengeResults({
  myResult,
  myName,
  opponentName,
  opponentCorrect,
  winnerId,
  myUserId,
  onBack,
  onReviewQuiz,
  onRematch,
}: ChallengeResultsProps): JSX.Element {
  const isWinner = winnerId === myUserId;
  const isDraw = winnerId === null;
  const opponentWrong = QUIZ_SIZE - opponentCorrect;

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-4 py-4 md:py-16">
      {/* Risultato principale */}
      <div className="text-center">
        {isDraw ? (
          <h1 className="text-4xl font-bold text-yellow-400">Pareggio!</h1>
        ) : isWinner ? (
          <h1 className="text-4xl font-bold text-green-500">Hai Vinto!</h1>
        ) : (
          <h1 className="text-4xl font-bold text-red-500">Hai Perso</h1>
        )}
      </div>

      {/* Stato promosso/bocciato */}
      <div className="text-center">
        {myResult.promosso ? (
          <span className="rounded-full bg-green-500/20 px-4 py-1 text-sm font-semibold text-green-500">
            Promosso
          </span>
        ) : (
          <span className="rounded-full bg-red-500/20 px-4 py-1 text-sm font-semibold text-red-500">
            Bocciato
          </span>
        )}
      </div>

      {/* Confronto */}
      <div className="w-full rounded-xl border border-border bg-card p-4">
        {/* Header */}
        <div className="mb-4 grid grid-cols-3 text-center text-xs font-medium text-muted-foreground">
          <span className="truncate">{myName}</span>
          <span>VS</span>
          <span className="truncate">{opponentName}</span>
        </div>

        {/* Corrette */}
        <div className="mb-2 grid grid-cols-3 items-center text-center">
          <span className="text-lg font-bold text-green-500">
            {myResult.correctCount}
          </span>
          <div className="flex items-center justify-center gap-1">
            <CorrectIcon className="h-4 w-4 text-green-500" />
            <span className="text-xs text-muted-foreground">Corrette</span>
          </div>
          <span className="text-lg font-bold text-green-500">
            {opponentCorrect}
          </span>
        </div>

        {/* Sbagliate */}
        <div className="mb-2 grid grid-cols-3 items-center text-center">
          <span className="text-lg font-bold text-red-500">
            {myResult.wrongCount}
          </span>
          <div className="flex items-center justify-center gap-1">
            <WrongIcon className="h-4 w-4 text-red-500" />
            <span className="text-xs text-muted-foreground">Sbagliate</span>
          </div>
          <span className="text-lg font-bold text-red-500">
            {opponentWrong}
          </span>
        </div>

        {/* Tempo */}
        <div className="grid grid-cols-3 items-center text-center">
          <span className="text-sm font-medium">
            {formatSecondsToHHMMSS(myResult.finalTotalSeconds)}
          </span>
          <div className="flex items-center justify-center gap-1">
            <TimelapseIcon className="h-4 w-4 text-blue-500" />
            <span className="text-xs text-muted-foreground">Tempo</span>
          </div>
          <span className="text-sm font-medium text-muted-foreground">-</span>
        </div>
      </div>

      {/* Azioni */}
      <div className="mt-4 flex w-full flex-col gap-3">
        <Button onClick={onRematch} className="w-full">
          Sfida di Nuovo
        </Button>
        <Button
          variant="outline"
          onClick={onReviewQuiz}
          className="w-full"
        >
          Rivedi Quiz
        </Button>
        <Button
          variant="ghost"
          onClick={onBack}
          className="w-full"
        >
          Torna alle Sfide
        </Button>
      </div>
    </div>
  );
}
