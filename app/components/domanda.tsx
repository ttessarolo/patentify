import React, { useCallback, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { Card, CardContent } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Pill } from '~/components/ui/pill';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '~/components/ui/dropdown-menu';
import {
  OverallIcon,
  AmbiguitaIcon,
  DifficoltaIcon,
  QuizIcon,
  CorrectIcon,
  WrongIcon,
} from '~/icons';
import { domandaUserStats } from '~/server/domandaUserStats';
import type { Domanda, DomandaUserStatsResult } from '~/types/db';

/** Payload per domandaUserStats */
type DomandaUserStatsPayload = {
  data: { user_id: string; domanda_id: number };
};

export interface DomandaCardProps {
  domanda: Domanda;
  onAnswer: (domandaId: number, value: string) => void;
  /** Se true, dopo la risposta viene verificata la correttezza */
  showAnswerAfterResponse?: boolean;
  /** Callback per verificare la risposta - restituisce true se corretta */
  onCheckResponse?: (
    domandaId: number,
    answerGiven: string
  ) => Promise<boolean>;
  /** ID dell'utente loggato (se presente, mostra icona statistiche) */
  userId?: string | null;
}

const IMAGE_PREFIX_PATH = import.meta.env.VITE_IMAGE_PREFIX_PATH ?? '';

/**
 * Restituisce la classe Tailwind per il colore in base al valore 1-5.
 */
function getValueColorClass(value: number | null): string {
  switch (value) {
    case 1:
      return 'text-green-500';
    case 2:
      return 'text-cyan-500';
    case 3:
      return 'text-yellow-500';
    case 4:
      return 'text-orange-500';
    case 5:
      return 'text-red-500';
    default:
      return 'text-muted-foreground';
  }
}

/**
 * Effettua il parsing di una stringa separata da ";" restituendo un array di fattori.
 */
function parseFactors(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(';')
    .map((f) => f.trim())
    .filter((f) => f.length > 0);
}

/**
 * Componente per visualizzare una domanda e permettere la risposta.
 */
export function DomandaCard({
  domanda,
  onAnswer,
  showAnswerAfterResponse = false,
  onCheckResponse,
  userId,
}: DomandaCardProps): React.JSX.Element {
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showAmbiguitaFactors, setShowAmbiguitaFactors] = useState(false);
  const [showDifficoltaFactors, setShowDifficoltaFactors] = useState(false);

  // Stati per le statistiche utente
  const [statsOpen, setStatsOpen] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState(false);
  const [stats, setStats] = useState<DomandaUserStatsResult | null>(null);
  const [statsFetched, setStatsFetched] = useState(false);

  // Server function per statistiche
  const domandaUserStatsFn = useServerFn(domandaUserStats);

  // Parse dei fattori
  const ambiguitaFactors = parseFactors(domanda.ambiguita_triggers);
  const difficoltaFactors = parseFactors(domanda.difficolta_fattori);

  // Fetch statistiche quando il dropdown viene aperto (lazy loading)
  const handleStatsOpenChange = useCallback(
    async (open: boolean): Promise<void> => {
      setStatsOpen(open);
      if (open && !statsFetched && userId) {
        setStatsLoading(true);
        setStatsError(false);
        try {
          const result = await (
            domandaUserStatsFn as unknown as (
              opts: DomandaUserStatsPayload
            ) => Promise<DomandaUserStatsResult>
          )({ data: { user_id: userId, domanda_id: domanda.id } });
          setStats(result);
          setStatsFetched(true);
        } catch (error) {
          console.error('Errore nel caricamento statistiche:', error);
          setStatsError(true);
        } finally {
          setStatsLoading(false);
        }
      }
    },
    [statsFetched, userId, domandaUserStatsFn, domanda.id]
  );

  const handleAnswer = useCallback(
    async (value: string): Promise<void> => {
      if (answered) return;

      setAnswered(true);
      setSelectedAnswer(value);
      onAnswer(domanda.id, value);

      // Invalida le statistiche così verranno ricaricate alla prossima apertura del dropdown
      setStatsFetched(false);

      // Verifica la risposta se richiesto
      if (showAnswerAfterResponse && onCheckResponse) {
        setIsChecking(true);
        try {
          const correct = await onCheckResponse(domanda.id, value);
          setIsCorrect(correct);
        } catch (error) {
          console.error('Errore verifica risposta:', error);
        } finally {
          setIsChecking(false);
        }
      }
    },
    [answered, domanda.id, onAnswer, showAnswerAfterResponse, onCheckResponse]
  );

  const handleImageError = useCallback((): void => {
    setImageError(true);
  }, []);

  const imageUrl =
    domanda.immagine_path && !imageError
      ? `${IMAGE_PREFIX_PATH}${domanda.immagine_path}`
      : null;

  // Determina il variant del bottone in base alla risposta
  const getButtonVariant = (
    buttonValue: string
  ): 'default' | 'destructive' | 'outline' => {
    if (!answered || selectedAnswer !== buttonValue) {
      return 'outline';
    }
    if (isCorrect === null) {
      return 'default'; // Ancora in verifica o verifica non richiesta
    }
    return isCorrect ? 'default' : 'destructive';
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        {/* Header con icone e valori */}
        <div className="mb-4 border-b border-border pb-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Difficoltà generale (ire_plus) */}
            <div
              className={`flex items-center gap-1 ${getValueColorClass(domanda.ire_plus)}`}
            >
              <OverallIcon className="h-5 w-5" />
              <span className="text-sm font-medium">
                {domanda.ire_plus ?? '—'}
              </span>
            </div>

            {/* Ambiguità - cliccabile */}
            <button
              type="button"
              onClick={(): void => setShowAmbiguitaFactors((prev) => !prev)}
              className={`flex items-center gap-1 transition-opacity hover:opacity-80 ${getValueColorClass(domanda.ambiguita)} ${ambiguitaFactors.length > 0 ? 'cursor-pointer' : 'cursor-default'}`}
              disabled={ambiguitaFactors.length === 0}
              aria-expanded={showAmbiguitaFactors}
              aria-label="Mostra fattori di ambiguità"
            >
              <AmbiguitaIcon className="h-5 w-5" />
              <span className="text-sm font-medium">
                {domanda.ambiguita ?? '—'}
              </span>
            </button>

            {/* Difficoltà - cliccabile */}
            <button
              type="button"
              onClick={(): void => setShowDifficoltaFactors((prev) => !prev)}
              className={`flex items-center gap-1 transition-opacity hover:opacity-80 ${getValueColorClass(domanda.difficolta)} ${difficoltaFactors.length > 0 ? 'cursor-pointer' : 'cursor-default'}`}
              disabled={difficoltaFactors.length === 0}
              aria-expanded={showDifficoltaFactors}
              aria-label="Mostra fattori di difficoltà"
            >
              <DifficoltaIcon className="h-5 w-5" />
              <span className="text-sm font-medium">
                {domanda.difficolta ?? '—'}
              </span>
            </button>

            {/* Icona statistiche utente - solo se userId presente */}
            {userId && (
              <DropdownMenu
                open={statsOpen}
                onOpenChange={handleStatsOpenChange}
              >
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="ml-auto flex items-center justify-center p-2 text-teal-500 transition-opacity hover:opacity-80"
                    aria-label="Statistiche tentativi su questa domanda"
                  >
                    <OverallIcon className="h-5 w-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[180px] p-3">
                  {statsLoading && (
                    <p className="text-center text-sm text-muted-foreground">
                      Caricamento...
                    </p>
                  )}
                  {statsError && (
                    <p className="text-center text-sm text-red-500">
                      Errore nel caricamento
                    </p>
                  )}
                  {!statsLoading && !statsError && stats && (
                    <>
                      {stats.total === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Non hai mai risposto a questa domanda
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {/* Tentativi totali */}
                          <div className="flex items-center gap-2">
                            <QuizIcon className="h-5 w-5 shrink-0 text-pink-500" />
                            <span className="text-sm">
                              <span className="font-medium">{stats.total}</span>{' '}
                              hai risposto alla domanda
                            </span>
                          </div>
                          {/* Risposte corrette */}
                          <div className="flex items-center gap-2">
                            <CorrectIcon className="h-5 w-5 shrink-0 text-green-500" />
                            <span className="text-sm">
                              <span className="font-medium">
                                {stats.correct}
                              </span>{' '}
                              hai indovinato
                            </span>
                          </div>
                          {/* Risposte sbagliate */}
                          <div className="flex items-center gap-2">
                            <WrongIcon className="h-5 w-5 shrink-0 text-red-500" />
                            <span className="text-sm">
                              <span className="font-medium">{stats.wrong}</span>{' '}
                              hai sbagliato
                            </span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Ambito della domanda */}
          <div className="mt-2 text-xs text-muted-foreground">
            {domanda.titolo_quesito ?? '—'}
          </div>
        </div>

        {/* Blocco Fattori di Ambiguità */}
        {showAmbiguitaFactors && ambiguitaFactors.length > 0 && (
          <div className="mb-4 rounded-md bg-muted/50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-sm font-semibold">Fattori di Ambiguità</h4>
              <button
                type="button"
                onClick={(): void => setShowAmbiguitaFactors(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
                aria-label="Chiudi fattori di ambiguità"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {ambiguitaFactors.map((factor, idx) => (
                <Pill key={idx}>{factor}</Pill>
              ))}
            </div>
          </div>
        )}

        {/* Blocco Fattori di Difficoltà */}
        {showDifficoltaFactors && difficoltaFactors.length > 0 && (
          <div className="mb-4 rounded-md bg-muted/50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-sm font-semibold">Fattori di Difficoltà</h4>
              <button
                type="button"
                onClick={(): void => setShowDifficoltaFactors(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
                aria-label="Chiudi fattori di difficoltà"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {difficoltaFactors.map((factor, idx) => (
                <Pill key={idx}>{factor}</Pill>
              ))}
            </div>
          </div>
        )}

        {/* Riga superiore: immagine + testo */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          {/* Immagine (solo se presente) */}
          {imageUrl && (
            <div className="flex w-full shrink-0 justify-center sm:w-auto sm:justify-start">
              <img
                src={imageUrl}
                alt="Immagine domanda"
                onError={handleImageError}
                className="h-auto max-w-[200px] rounded-md object-contain sm:w-32 md:w-40"
              />
            </div>
          )}

          {/* Testo della domanda */}
          <div className="flex-1">
            <p className="text-base leading-relaxed sm:text-lg">
              {domanda.domanda ?? 'Domanda non disponibile'}
            </p>
          </div>
        </div>

        {/* Riga inferiore: bottoni VERO / FALSO */}
        <div className="mt-4 flex justify-between gap-4">
          <Button
            variant={getButtonVariant('Vero')}
            className="flex-1"
            disabled={answered}
            onClick={(): void => {
              void handleAnswer('Vero');
            }}
          >
            VERO
          </Button>
          <Button
            variant={getButtonVariant('Falso')}
            className="flex-1"
            disabled={answered}
            onClick={(): void => {
              void handleAnswer('Falso');
            }}
          >
            FALSO
          </Button>
        </div>

        {/* Feedback risposta */}
        {showAnswerAfterResponse && answered && (
          <div className="mt-4">
            {isChecking && (
              <p className="text-center text-sm text-muted-foreground">
                Verifica in corso...
              </p>
            )}
            {!isChecking && isCorrect !== null && (
              <p
                className={`text-center text-sm font-semibold ${
                  isCorrect ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {isCorrect ? '✓ Corretto!' : '✗ Sbagliato!'}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
