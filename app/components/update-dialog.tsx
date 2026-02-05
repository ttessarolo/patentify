'use client';

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog';
import { useAppStore } from '~/store';

/**
 * Dialog che notifica l'utente della disponibilità di una nuova versione.
 * L'aggiornamento è obbligatorio - non c'è modo di chiudere il dialog senza aggiornare.
 */
export function UpdateDialog(): React.JSX.Element {
  const updateAvailable = useAppStore((s) => s.updateAvailable);

  /**
   * Ricarica la pagina per ottenere l'ultima versione.
   * Lo stato Zustand viene preservato grazie al persist middleware.
   */
  const handleUpdate = (): void => {
    // Force reload per bypassare la cache del service worker/browser
    window.location.reload();
  };

  return (
    <AlertDialog open={updateAvailable}>
      <AlertDialogContent
        className="max-w-sm"
        // Previene la chiusura con Escape o click esterno
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Aggiornamento disponibile</AlertDialogTitle>
          <AlertDialogDescription>
            Una nuova versione di Patentify è disponibile. Aggiorna per
            continuare a utilizzare l&apos;app con le ultime funzionalità e
            correzioni.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleUpdate}>Aggiorna</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
