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
import type { MultiplayerQuizResult } from './MultiplayerQuiz';
import type { SfidaTier } from '~/commons';

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
  /** Tipo di sfida (determina se mostrare promosso/bocciato) */
  sfidaType?: SfidaTier;
  /** Se true, la sfida è ancora in corso (l'avversario non ha finito) */
  challengeStillInProgress?: boolean;
  /** Numero totale di domande nella sfida */
  questionCount?: number;
  /** Tempo impiegato dall'avversario in secondi (dal server, null se non disponibile) */
  opponentTotalSeconds?: number | null;
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
  sfidaType = 'full',
  challengeStillInProgress = false,
  questionCount = 40,
  opponentTotalSeconds = null,
}: ChallengeResultsProps): JSX.Element {
  // Safeguard: se winnerId è null ma i punteggi sono diversi,
  // determina il vincitore dai punteggi (fallback per race condition server)
  const computedWinnerId: string | null =
    challengeStillInProgress
      ? null
      : winnerId === null && myResult.correctCount !== opponentCorrect
        ? myResult.correctCount > opponentCorrect
          ? myUserId
          : 'opponent'
        : winnerId;
  const isWinner = computedWinnerId === myUserId;
  const isDraw = computedWinnerId === null && !challengeStillInProgress;
  const opponentWrong = questionCount - opponentCorrect;
  const showPromosso = sfidaType === 'full' && !challengeStillInProgress;

  // ---- Risultati parziali (sfida ancora in corso) ----
  if (challengeStillInProgress) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-4 py-4 md:py-16">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">I tuoi risultati</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            La sfida è ancora in corso — l&apos;avversario non ha ancora finito.
          </p>
        </div>

        {/* Stats personali */}
        <div className="w-full rounded-xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <CorrectIcon className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Corrette</span>
            </div>
            <span className="text-lg font-bold text-green-500">
              {myResult.correctCount}
            </span>
          </div>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <WrongIcon className="h-4 w-4 text-red-500" />
              <span className="text-sm text-muted-foreground">Sbagliate</span>
            </div>
            <span className="text-lg font-bold text-red-500">
              {myResult.wrongCount}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <TimelapseIcon className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Tempo</span>
            </div>
            <span className="text-sm font-medium">
              {formatSecondsToHHMMSS(myResult.finalTotalSeconds)}
            </span>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Riceverai una notifica quando l&apos;avversario avrà completato la sfida.
        </p>

        <div className="mt-4 flex w-full flex-col gap-3">
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

  // ---- Risultati completi ----
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

      {/* Stato promosso/bocciato — solo per Full Quiz */}
      {showPromosso && (
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
      )}

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
          <span className="text-sm font-medium">
            {opponentTotalSeconds != null
              ? formatSecondsToHHMMSS(opponentTotalSeconds)
              : '-'}
          </span>
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
