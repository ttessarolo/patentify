import type { JSX } from 'react';
import { useCallback, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
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
  IreIcon,
  AmbiguitaIcon,
  DifficoltaIcon,
  QuizIcon,
  CorrectIcon,
  WrongIcon,
  SkullIcon,
} from '~/icons';
import { orpc, client } from '~/lib/orpc';
import { getValueColorClass, SHOW_SPIEGAZIONE } from '~/commons';
import type { Domanda } from '~/types/db';

type DomandaUserStatsResult = Awaited<
  ReturnType<typeof client.attempt.getDomandaUserStats>
>;

export interface DomandaCardProps {
  domanda: Domanda & { skull?: boolean };
  onAnswer: (domandaId: number, value: string) => void;
  /** Se true, dopo la risposta viene verificata la correttezza */
  showAnswerAfterResponse?: boolean;
  /** Callback per verificare la risposta - restituisce true se corretta */
  onCheckResponse?: (
    domandaId: number,
    answerGiven: string
  ) => Promise<boolean>;
  /** ID dell'utente loggato (se presente, mostra icona statistiche e skull) */
  userId?: string | null;
  /**
   * Modalità apprendimento (default: true).
   * Se true: mostra header (difficoltà, ambiguità, statistiche, titolo), bottone skull e feedback visivo (colori verde/rosso).
   * Se false: modalità quiz, mostra solo immagine (opzionale), testo domanda e bottoni Vero/Falso.
   */
  learning?: boolean;
  /**
   * Se true, la card è in sola lettura e l'utente non può rispondere.
   * Utile per mostrare domande già risposte nella schermata finale.
   */
  readOnly?: boolean;
  /**
   * Risposta iniziale già data (usata con readOnly=true).
   * Se fornita, la card mostra subito il feedback visivo verde/rosso.
   */
  initialAnswer?: string;
}

const IMAGE_PREFIX_PATH = import.meta.env.VITE_IMAGE_PREFIX_PATH ?? '';

// getValueColorClass importata da ~/commons

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
  learning = true,
  readOnly = false,
  initialAnswer,
}: DomandaCardProps): JSX.Element {
  // Calcola se iniziare in stato "già risposta" (per modalità readOnly con initialAnswer)
  const isPreAnswered = readOnly && initialAnswer != null;
  const preComputedIsCorrect =
    isPreAnswered && domanda.risposta != null
      ? initialAnswer.trim().toLowerCase() ===
        domanda.risposta.trim().toLowerCase()
      : null;

  const [answered, setAnswered] = useState(isPreAnswered);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(
    isPreAnswered ? initialAnswer : null
  );
  const [isCorrect, setIsCorrect] = useState<boolean | null>(
    preComputedIsCorrect
  );
  const [isChecking, setIsChecking] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showIreBox, setShowIreBox] = useState(false);
  const [showAmbiguitaFactors, setShowAmbiguitaFactors] = useState(false);
  const [showDifficoltaFactors, setShowDifficoltaFactors] = useState(false);

  // Stati per le statistiche utente
  const [statsOpen, setStatsOpen] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState(false);
  const [stats, setStats] = useState<DomandaUserStatsResult | null>(null);
  const [statsFetched, setStatsFetched] = useState(false);

  // Stato per il reveal box spiegazione
  const [showSpiegazione, setShowSpiegazione] = useState(false);

  // Query per spiegazione (lazy loading)
  const spiegazioneQuery = useQuery({
    ...orpc.spiegazione.get.queryOptions({
      input: { domanda_id: domanda.id },
    }),
    enabled: showSpiegazione,
    staleTime: Infinity,
  });

  // Stato locale per skull (persistito sul DB ma gestito localmente per evitare reload)
  const [isSkull, setIsSkull] = useState(domanda.skull ?? false);

  // Mutation per aggiungere skull
  const addSkullMutation = useMutation({
    ...orpc.skull.add.mutationOptions(),
    onMutate: (): void => {
      setIsSkull(true);
    },
    onError: (): void => {
      setIsSkull(false);
      console.error('Errore aggiungendo skull');
    },
  });

  // Mutation per rimuovere skull
  const removeSkullMutation = useMutation({
    ...orpc.skull.remove.mutationOptions(),
    onMutate: (): void => {
      setIsSkull(false);
    },
    onError: (): void => {
      setIsSkull(true);
      console.error('Errore rimuovendo skull');
    },
  });

  // Handler per toggle skull
  const handleSkullToggle = useCallback((): void => {
    if (isSkull) {
      removeSkullMutation.mutate({ domanda_id: domanda.id });
    } else {
      addSkullMutation.mutate({ domanda_id: domanda.id });
    }
  }, [isSkull, domanda.id, addSkullMutation, removeSkullMutation]);

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
          const result = await client.attempt.getDomandaUserStats({
            domanda_id: domanda.id,
          });
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
    [statsFetched, userId, domanda.id]
  );

  const handleAnswer = useCallback(
    async (value: string): Promise<void> => {
      if (answered || readOnly) return;

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
    [
      answered,
      readOnly,
      domanda.id,
      onAnswer,
      showAnswerAfterResponse,
      onCheckResponse,
    ]
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- parametro richiesto dalla firma, valore non usato
    _buttonValue: string
  ): 'default' | 'destructive' | 'outline' => {
    // Sempre outline - il colore viene gestito dalle classi CSS
    return 'outline';
  };

  // Determina le classi di stile del bottone dopo la risposta
  const getButtonClasses = (buttonValue: string): string => {
    // In modalità quiz (learning === false), non mostrare colori verde/rosso
    // ECCEZIONE: se siamo in readOnly con initialAnswer, mostra sempre i colori
    const isReviewMode = readOnly && initialAnswer != null;
    if (!learning && !isReviewMode) {
      return '';
    }
    if (!answered || isCorrect === null) {
      return '';
    }
    // Determina se questo bottone rappresenta la risposta corretta
    const isThisButtonCorrect =
      (isCorrect && selectedAnswer === buttonValue) ||
      (!isCorrect && selectedAnswer !== buttonValue);

    // Aggiungi ring per evidenziare il bottone cliccato dall'utente
    const isSelected = selectedAnswer === buttonValue;
    const selectedRing = isSelected
      ? 'ring-2 ring-white dark:ring-gray-300 ring-offset-1'
      : '';

    if (isThisButtonCorrect) {
      return `border-2 border-green-500 bg-green-500/20 text-green-700 dark:text-green-400 ${selectedRing}`;
    } else {
      return `border-2 border-red-500 bg-red-500/20 text-red-700 dark:text-red-400 ${selectedRing}`;
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        {/* Header con icone e valori - solo in modalità learning */}
        {learning && (
          <div className="mb-4 border-b border-border pb-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Difficoltà generale (ire_plus) - cliccabile per mostrare ire */}
              <button
                type="button"
                onClick={(): void => setShowIreBox((prev) => !prev)}
                className={`flex cursor-pointer items-center gap-1 transition-opacity hover:opacity-80 ${getValueColorClass(domanda.ire_plus)}`}
                aria-expanded={showIreBox}
                aria-label="Mostra indice di difficoltà"
              >
                <IreIcon className="h-5 w-5" />
                <span className="text-sm font-medium">
                  {domanda.ire_plus ?? '—'}
                </span>
              </button>

              {/* Ambiguità - cliccabile */}
              <button
                type="button"
                onClick={(): void => setShowAmbiguitaFactors((prev) => !prev)}
                className={`flex cursor-pointer items-center gap-1 transition-opacity hover:opacity-80 ${getValueColorClass(domanda.ambiguita)}`}
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
                className={`flex cursor-pointer items-center gap-1 transition-opacity hover:opacity-80 ${getValueColorClass(domanda.difficolta)}`}
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
                  <DropdownMenuContent
                    align="end"
                    className="min-w-[180px] p-3"
                  >
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
                                <span className="font-medium">
                                  {stats.total}
                                </span>{' '}
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
                                <span className="font-medium">
                                  {stats.wrong}
                                </span>{' '}
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
        )}

        {/* Blocco Indice di Difficoltà (ire) - solo in modalità learning */}
        {learning && showIreBox && (
          <div className="mb-4 rounded-md bg-muted/50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-sm font-semibold">Indice di difficoltà</h4>
              <button
                type="button"
                onClick={(): void => setShowIreBox(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
                aria-label="Chiudi indice di difficoltà"
              >
                ✕
              </button>
            </div>
            <p
              className={`text-lg font-medium ${getValueColorClass(domanda.ire)}`}
            >
              {domanda.ire ?? '—'}
            </p>
          </div>
        )}

        {/* Blocco Fattori di Ambiguità - solo in modalità learning */}
        {learning && showAmbiguitaFactors && (
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
            {ambiguitaFactors.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {ambiguitaFactors.map((factor, idx) => (
                  <Pill key={idx}>{factor}</Pill>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nessun elemento particolare di ambiguità
              </p>
            )}
          </div>
        )}

        {/* Blocco Fattori di Difficoltà - solo in modalità learning */}
        {learning && showDifficoltaFactors && (
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
            {difficoltaFactors.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {difficoltaFactors.map((factor, idx) => (
                  <Pill key={idx}>{factor}</Pill>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nessun fattore particolare di difficoltà
              </p>
            )}
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

        {/* Riga inferiore: bottoni VERO / SKULL / FALSO */}
        <div className="mt-4 flex items-center justify-between gap-4">
          <Button
            variant={getButtonVariant('Vero')}
            className={`flex-1 ${getButtonClasses('Vero')}`}
            disabled={answered || readOnly}
            onClick={(): void => {
              void handleAnswer('Vero');
            }}
          >
            VERO
          </Button>

          {/* Bottone Skull - solo in modalità learning e se utente loggato */}
          {learning && userId && (
            <button
              type="button"
              onClick={handleSkullToggle}
              disabled={
                addSkullMutation.isPending || removeSkullMutation.isPending
              }
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md transition-colors ${
                isSkull
                  ? 'bg-amber-500 text-black'
                  : 'bg-transparent text-gray-400 hover:text-amber-600 hover:bg-amber-600/20'
              } disabled:cursor-not-allowed disabled:opacity-50`}
              aria-label={isSkull ? 'Rimuovi skull' : 'Aggiungi skull'}
              aria-pressed={isSkull}
            >
              <SkullIcon className="h-5 w-5" />
            </button>
          )}

          <Button
            variant={getButtonVariant('Falso')}
            className={`flex-1 ${getButtonClasses('Falso')}`}
            disabled={answered || readOnly}
            onClick={(): void => {
              void handleAnswer('Falso');
            }}
          >
            FALSO
          </Button>
        </div>

        {/* Feedback risposta - solo in modalità learning */}
        {learning && showAnswerAfterResponse && answered && (
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

        {/* Reveal box Spiegazione - condizionato a SHOW_SPIEGAZIONE, in modalità learning dopo la risposta o in review mode */}
        {SHOW_SPIEGAZIONE &&
          answered &&
          !isChecking &&
          (learning || (readOnly && initialAnswer != null)) && (
          <div className="mt-4 overflow-hidden rounded-md border border-muted-foreground/30">
            {/* Header cliccabile */}
            <button
              type="button"
              onClick={(): void => setShowSpiegazione((prev) => !prev)}
              className="flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left transition-colors hover:bg-muted/50"
              aria-expanded={showSpiegazione}
              aria-controls="spiegazione-content"
            >
              {/* Chevron con rotazione */}
              <svg
                className={`h-3 w-3 shrink-0 text-muted-foreground transition-transform duration-200 ${
                  showSpiegazione ? 'rotate-90' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>

              {/* Titolo */}
              <span className="text-xs font-medium text-muted-foreground">
                Spiegazione
              </span>
            </button>

            {/* Contenuto espandibile */}
            {showSpiegazione && (
              <div id="spiegazione-content" className="px-4 pb-4">
                {spiegazioneQuery.isLoading && (
                  <p className="text-sm text-muted-foreground">
                    Caricamento...
                  </p>
                )}
                {spiegazioneQuery.isError && (
                  <p className="text-sm text-red-500">
                    Errore nel caricamento della spiegazione
                  </p>
                )}
                {spiegazioneQuery.isSuccess && (
                  <p className="text-sm leading-relaxed">
                    {spiegazioneQuery.data.spiegazione ??
                      'Nessuna spiegazione disponibile per questa domanda.'}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
