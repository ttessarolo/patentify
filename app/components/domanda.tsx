import React, { useCallback, useState } from 'react';
import { Card, CardContent } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
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
