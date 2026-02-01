import React, { useState, useCallback } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useMutation } from '@tanstack/react-query';

import { Button } from '~/components/ui/button';
import { Switch } from '~/components/ui/switch';
import { Label } from '~/components/ui/label';
import { generateQuiz } from '~/server/quiz';
import { Quiz } from '~/components/quiz-component';
import type { QuizType, GenerateQuizResult } from '~/types/db';

/** Payload per generateQuiz */
type GenerateQuizPayload = {
  data: {
    quiz_type: QuizType;
    boost_errors: boolean;
    boost_skull: boolean;
  };
};

export const Route = createFileRoute('/main/simulazione-quiz')({
  component: SimulazioneQuizPage,
});

function SimulazioneQuizPage(): React.JSX.Element {
  // Stato form
  const [quizType, setQuizType] = useState<QuizType>('standard');
  const [boostErrors, setBoostErrors] = useState(false);
  const [boostSkull, setBoostSkull] = useState(false);

  // Stato quiz attivo
  const [quizId, setQuizId] = useState<number | null>(null);

  const generateQuizFn = useServerFn(generateQuiz);

  // Mutation per generare il quiz
  const generateMutation = useMutation({
    mutationFn: async (params: {
      quiz_type: QuizType;
      boost_errors: boolean;
      boost_skull: boolean;
    }) =>
      (
        generateQuizFn as unknown as (
          opts: GenerateQuizPayload
        ) => Promise<GenerateQuizResult>
      )({ data: params }),
    onSuccess: (result) => {
      setQuizId(result.quiz_id);
    },
    onError: (error) => {
      console.error('Errore generazione quiz:', error);
    },
  });

  // Handler per iniziare il quiz
  const handleStartQuiz = useCallback((): void => {
    generateMutation.mutate({
      quiz_type: quizType,
      boost_errors: boostErrors,
      boost_skull: boostSkull,
    });
  }, [generateMutation, quizType, boostErrors, boostSkull]);

  // Handler per tornare al form (quando il quiz è finito)
  const handleQuizEnd = useCallback((): void => {
    setQuizId(null);
  }, []);

  // Se il quiz è attivo, mostra la componente Quiz
  if (quizId !== null) {
    return <Quiz quizId={quizId} onEnd={handleQuizEnd} />;
  }

  // Altrimenti mostra il form di configurazione
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-6 px-4 py-2 md:gap-8 md:py-8">
      {/* Titolo */}
      <h1 className="text-2xl font-bold">Simulazione Quiz</h1>

      {/* Selezione tipo quiz */}
      <div className="flex w-full flex-col items-center gap-4">
        {/* Quiz Standard - centrato in alto */}
        <button
          type="button"
          onClick={(): void => setQuizType('standard')}
          className={`w-full max-w-xs cursor-pointer rounded-xl px-6 py-4 text-center transition-all ${
            quizType === 'standard'
              ? 'bg-card text-card-foreground ring-2 ring-primary'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          }`}
        >
          <div className="text-lg font-bold">Standard</div>
          <div className="mt-1 text-sm opacity-80">domande scelte a caso</div>
        </button>

        {/* Quiz Difficile e Ambiguo - affiancati */}
        <div className="flex w-full gap-4">
          <button
            type="button"
            onClick={(): void => setQuizType('difficile')}
            className={`flex-1 cursor-pointer rounded-xl px-4 py-4 text-center transition-all ${
              quizType === 'difficile'
                ? 'bg-card text-card-foreground ring-2 ring-primary'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            }`}
          >
            <div className="text-lg font-bold">Difficile</div>
            <div className="mt-1 text-sm opacity-80">
              preferenza domande difficili
            </div>
          </button>

          <button
            type="button"
            onClick={(): void => setQuizType('ambiguo')}
            className={`flex-1 cursor-pointer rounded-xl px-4 py-4 text-center transition-all ${
              quizType === 'ambiguo'
                ? 'bg-card text-card-foreground ring-2 ring-primary'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            }`}
          >
            <div className="text-lg font-bold">Ambiguo</div>
            <div className="mt-1 text-sm opacity-80">
              preferenza domande ambigue
            </div>
          </button>
        </div>
      </div>

      {/* Toggle Boost */}
      <div className="flex w-full max-w-xs flex-col gap-4">
        {/* Boost Errori */}
        <div className="flex items-center gap-3">
          <Switch
            id="boost-errors"
            checked={boostErrors}
            onCheckedChange={setBoostErrors}
          />
          <Label htmlFor="boost-errors" className="cursor-pointer">
            Boost Errori
          </Label>
        </div>

        {/* Boost Skull */}
        <div className="flex items-center gap-3">
          <Switch
            id="boost-skull"
            checked={boostSkull}
            onCheckedChange={setBoostSkull}
          />
          <Label htmlFor="boost-skull" className="cursor-pointer">
            Boost Skull
          </Label>
        </div>
      </div>

      {/* Pulsante Inizia */}
      <Button
        size="lg"
        onClick={handleStartQuiz}
        disabled={generateMutation.isPending}
        className="mt-4 bg-transparent border-2 border-green-600 px-12 text-lg font-bold text-green-600 hover:bg-green-600 hover:text-white transition-colors"
      >
        {generateMutation.isPending ? 'Generazione...' : 'Inizia'}
      </Button>

      {/* Errore */}
      {generateMutation.isError && (
        <p className="text-center text-sm text-red-600">
          {generateMutation.error instanceof Error
            ? generateMutation.error.message
            : 'Errore nella generazione del quiz'}
        </p>
      )}
    </div>
  );
}
