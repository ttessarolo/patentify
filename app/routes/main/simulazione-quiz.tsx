import type { JSX } from 'react';
import { useCallback } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQuery } from '@tanstack/react-query';

import { Button } from '~/components/ui/button';
import { Switch } from '~/components/ui/switch';
import { Label } from '~/components/ui/label';
import { useAppStore } from '~/store';
import { orpc } from '~/lib/orpc';
import { Quiz } from '~/components/quiz-component';

export const Route = createFileRoute('/main/simulazione-quiz')({
  component: SimulazioneQuizPage,
});

function SimulazioneQuizPage(): JSX.Element {
  // Preferenze persistenti dallo store Zustand
  const preferences = useAppStore((s) => s.preferences);
  const setPreference = useAppStore((s) => s.setQuizPreference);

  // Stato quiz attivo dallo store (per ripresa sessione)
  const activeQuiz = useAppStore((s) => s.activeQuiz);
  const startQuizStore = useAppStore((s) => s.startQuiz);
  const endQuizStore = useAppStore((s) => s.endQuiz);

  // Deriva i valori dalle preferenze
  const { quizType, boostErrors, boostSkull } = preferences;

  // Query per ottenere i conteggi boost (errori e skull)
  const boostCountsQuery = useQuery({
    ...orpc.quiz.getBoostCounts.queryOptions({}),
    staleTime: 2 * 60 * 1000, // 2 minuti
  });

  // Determina se i boost sono disponibili
  const canBoostErrors = (boostCountsQuery.data?.errors_count ?? 0) > 0;
  const canBoostSkull = (boostCountsQuery.data?.skull_count ?? 0) > 0;

  // Mutation per generare il quiz
  const generateMutation = useMutation({
    ...orpc.quiz.generate.mutationOptions(),
    onSuccess: (result) => {
      // Salva il quiz attivo nello store (con timestamp per calcolo tempo)
      startQuizStore(result.quiz_id);
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
    endQuizStore();
  }, [endQuizStore]);

  // Se il quiz è attivo (anche da sessione precedente), mostra la componente Quiz
  if (activeQuiz !== null) {
    return <Quiz quizId={activeQuiz.quizId} onEnd={handleQuizEnd} />;
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
          onClick={(): void => setPreference('quizType', 'standard')}
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
            onClick={(): void => setPreference('quizType', 'difficile')}
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
            onClick={(): void => setPreference('quizType', 'ambiguo')}
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
            onCheckedChange={(checked): void => setPreference('boostErrors', checked)}
            disabled={!canBoostErrors}
            className="data-[state=checked]:bg-green-500"
          />
          <Label
            htmlFor="boost-errors"
            className={canBoostErrors ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}
          >
            Boost Errori
          </Label>
        </div>

        {/* Boost Skull */}
        <div className="flex items-center gap-3">
          <Switch
            id="boost-skull"
            checked={boostSkull}
            onCheckedChange={(checked): void => setPreference('boostSkull', checked)}
            disabled={!canBoostSkull}
            className="data-[state=checked]:bg-green-500"
          />
          <Label
            htmlFor="boost-skull"
            className={canBoostSkull ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}
          >
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
