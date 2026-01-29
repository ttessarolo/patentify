import React, { useCallback, useState } from 'react';
import { Card, CardContent } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Pill } from '~/components/ui/pill';
import { OverallIcon, AmbiguitaIcon, DifficoltaIcon } from '~/icons';
import type { Domanda } from '~/types/db';

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
}: DomandaCardProps): React.JSX.Element {
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showAmbiguitaFactors, setShowAmbiguitaFactors] = useState(false);
  const [showDifficoltaFactors, setShowDifficoltaFactors] = useState(false);

  // Parse dei fattori
  const ambiguitaFactors = parseFactors(domanda.ambiguita_triggers);
  const difficoltaFactors = parseFactors(domanda.difficolta_fattori);

  const handleAnswer = useCallback(
    async (value: string): Promise<void> => {
      if (answered) return;

      setAnswered(true);
      setSelectedAnswer(value);
      onAnswer(domanda.id, value);

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
