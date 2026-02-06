import type { JSX } from 'react';
import { useState, useCallback } from 'react';
import { Button } from '~/components/ui/button';
import { ShareIcon } from '~/icons';

export interface ShareQuizButtonProps {
  /** ID del quiz da condividere */
  quizId: number;
  /** Classe CSS aggiuntiva */
  className?: string;
}

/**
 * Bottone per condividere un quiz copiando il link negli appunti.
 * Mostra feedback visivo quando il link viene copiato.
 */
export function ShareQuizButton({
  quizId,
  className = '',
}: ShareQuizButtonProps): JSX.Element {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async (): Promise<void> => {
    try {
      // Costruisce l'URL del quiz
      const url = `${window.location.origin}/main/rivedi-quiz?quizId=${quizId}`;

      // Copia negli appunti
      await navigator.clipboard.writeText(url);

      // Mostra feedback
      setCopied(true);

      // Reset dopo 3 secondi
      setTimeout(() => {
        setCopied(false);
      }, 3000);
    } catch (error) {
      console.error('Errore nella copia del link:', error);
    }
  }, [quizId]);

  return (
    <Button
      onClick={(): void => {
        void handleShare();
      }}
      disabled={copied}
      className={`border border-white bg-transparent text-white hover:bg-white/10 ${className}`}
    >
      <ShareIcon className="mr-2 h-5 w-5" />
      {copied ? 'Link del Quiz copiato negli appunti...' : 'Condividi Quiz'}
    </Button>
  );
}
