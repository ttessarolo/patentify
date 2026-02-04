import React, { useState, useCallback } from 'react';
import { Card, CardContent } from '~/components/ui/card';
import { useAppStore } from '~/store';
import { SectionSkeleton } from './LazySection';

/** Colori disponibili per le sezioni */
export type SectionColor = 'blue' | 'red' | 'orange' | 'green';

/** Mapping colori per il bordo della Card */
const borderColorClasses: Record<SectionColor, string> = {
  blue: 'border-blue-500!',
  red: 'border-red-500!',
  orange: 'border-orange-500!',
  green: 'border-green-500!',
};

/** Mapping colori per il titolo */
const titleColorClasses: Record<SectionColor, string> = {
  blue: 'text-blue-500',
  red: 'text-red-500',
  orange: 'text-orange-500',
  green: 'text-green-500',
};

/** Mapping colori per il chevron */
const chevronColorClasses: Record<SectionColor, string> = {
  blue: 'text-blue-500',
  red: 'text-red-500',
  orange: 'text-orange-500',
  green: 'text-green-500',
};

export interface SectionRevealProps {
  /** Chiave univoca per identificare la sezione nello store (es. 'errori-categorie') */
  sectionKey: string;
  /** Titolo della sezione */
  title: string;
  /** Colore del bordo e del titolo */
  color: SectionColor;
  /** Contenuto della sezione (renderizzato solo quando aperto) */
  children: React.ReactNode;
  /** Stato di caricamento del contenuto */
  isLoading?: boolean;
  /** Callback chiamato alla prima apertura (per lazy loading) */
  onFirstOpen?: () => void;
  /** Classe CSS aggiuntiva per il container */
  className?: string;
}

/**
 * Componente collapsible per le sezioni di Errori Ricorrenti.
 * Parte chiuso di default e carica i dati alla prima apertura.
 * Mantiene i colori distintivi anche quando chiuso.
 */
export function SectionReveal({
  sectionKey,
  title,
  color,
  children,
  isLoading = false,
  onFirstOpen,
  className = '',
}: SectionRevealProps): React.JSX.Element {
  // Stato persistente dallo store Zustand
  const isOpen = useAppStore((s) => s.collapsedSections[sectionKey] ?? false);
  const toggleSection = useAppStore((s) => s.toggleSection);

  // Stato locale per lazy loading (non necessario persistere)
  const [hasBeenOpened, setHasBeenOpened] = useState(false);

  const handleToggle = useCallback((): void => {
    const willOpen = !isOpen;
    toggleSection(sectionKey);

    // Trigger lazy load solo alla prima apertura
    if (willOpen && !hasBeenOpened) {
      setHasBeenOpened(true);
      onFirstOpen?.();
    }
  }, [isOpen, hasBeenOpened, onFirstOpen, toggleSection, sectionKey]);

  return (
    <Card
      className={`w-full overflow-hidden ${borderColorClasses[color]} ${className}`}
    >
      {/* Header cliccabile */}
      <button
        type="button"
        onClick={handleToggle}
        className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
        aria-expanded={isOpen}
        aria-controls={`section-content-${title.replace(/\s+/g, '-').toLowerCase()}`}
      >
        {/* Chevron con rotazione */}
        <svg
          className={`h-4 w-4 shrink-0 transition-transform duration-200 ${chevronColorClasses[color]} ${
            isOpen ? 'rotate-90' : ''
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

        {/* Titolo colorato */}
        <span className={`text-base font-semibold ${titleColorClasses[color]}`}>
          {title}
        </span>
      </button>

      {/* Contenuto espandibile */}
      {isOpen && (
        <CardContent
          id={`section-content-${title.replace(/\s+/g, '-').toLowerCase()}`}
          className="space-y-3 pt-0 px-4 pb-4"
        >
          {isLoading ? <SectionSkeleton /> : children}
        </CardContent>
      )}
    </Card>
  );
}
