import type { JSX } from 'react';
import { Card, CardContent } from '~/components/ui/card';
import { Switch } from '~/components/ui/switch';
import { Pill } from '~/components/ui/pill';
import { RandomIcon } from '~/icons';
import { useAppStore } from '~/store';
import { SearchField } from './SearchField';
import { FiltersBox } from './FiltersBox';

/** Chiave per identificare la sezione nello store */
const SECTION_KEY = 'esercitazione-filters';

export interface FiltersRevealProps {
  /** Valore corrente della ricerca */
  search: string;
  /** Handler per il cambio di ricerca */
  onSearchChange: (value: string) => void;
  /** Valore IRE+ selezionato */
  irePlus: string;
  /** Valore ambiguità selezionato */
  ambiguita: string;
  /** Valore difficoltà selezionato */
  difficolta: string;
  /** Valore titolo quesito selezionato */
  titoloQuesito: string;
  /** Opzioni disponibili per ambiti */
  ambitiOptions: string[];
  /** Handler per cambio IRE+ */
  onIrePlusChange: (value: string) => void;
  /** Handler per cambio ambiguità */
  onAmbiguitaChange: (value: string) => void;
  /** Handler per cambio difficoltà */
  onDifficoltaChange: (value: string) => void;
  /** Handler per cambio titolo quesito */
  onTitoloQuesitoChange: (value: string) => void;
  /** Numero di filtri attivi */
  activeFiltersCount: number;
  /** Se true, risultati con ORDER BY RANDOM(); se false, ordine naturale DB */
  ordinamentoCasuale: boolean;
  /** Handler per cambio ordinamento casuale */
  onOrdinamentoCasualeChange: (value: boolean) => void;
}

/**
 * Componente collapsible per i filtri dell'esercitazione.
 * Parte chiuso e si espande al click per mostrare i filtri.
 */
export function FiltersReveal({
  search,
  onSearchChange,
  irePlus,
  ambiguita,
  difficolta,
  titoloQuesito,
  ambitiOptions,
  onIrePlusChange,
  onAmbiguitaChange,
  onDifficoltaChange,
  onTitoloQuesitoChange,
  activeFiltersCount,
  ordinamentoCasuale,
  onOrdinamentoCasualeChange,
}: FiltersRevealProps): JSX.Element {
  // Stato persistente dallo store Zustand
  const isOpen = useAppStore((s) => s.collapsedSections[SECTION_KEY] ?? false);
  const toggleSection = useAppStore((s) => s.toggleSection);

  const handleToggle = (): void => {
    toggleSection(SECTION_KEY);
  };

  return (
    <Card className="w-full overflow-hidden">
      {/* Header: sinistra cliccabile (Filtra Domande), destra switch Esercitazione Casuale */}
      <div className="flex w-full items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={handleToggle}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded text-left transition-colors hover:bg-muted/50 -m-1 p-1"
          aria-expanded={isOpen}
          aria-controls="filters-content"
        >
          {/* Chevron con rotazione */}
          <svg
            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
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

          {/* Testo */}
          <span className="text-base font-semibold">Filtra Domande</span>

          {/* Pill con numero filtri attivi */}
          {activeFiltersCount > 0 && (
            <Pill className="bg-orange-500/20 text-orange-500">
              {activeFiltersCount}
            </Pill>
          )}
        </button>

        {/* Switch Esercitazione Casuale in alto a destra: su mobile solo icona, da sm in su label */}
        <div className="flex shrink-0 items-center gap-2">
          <RandomIcon
            className="h-5 w-5 shrink-0 text-muted-foreground sm:hidden"
            aria-hidden
          />
          <span className="hidden text-sm font-medium whitespace-nowrap sm:inline">
            Esercitazione Casuale
          </span>
          <Switch
            checked={ordinamentoCasuale}
            onCheckedChange={onOrdinamentoCasualeChange}
            aria-label="Esercitazione Casuale"
            className="data-[state=checked]:bg-green-500"
          />
        </div>
      </div>

      {/* Contenuto espandibile */}
      {isOpen && (
        <CardContent id="filters-content" className="space-y-4 pt-0 pb-4">
          {/* Campo di ricerca */}
          <SearchField
            value={search}
            onChange={onSearchChange}
            placeholder="Cerca nella domanda..."
          />

          {/* Box filtri */}
          <FiltersBox
            irePlus={irePlus}
            ambiguita={ambiguita}
            difficolta={difficolta}
            titoloQuesito={titoloQuesito}
            ambitiOptions={ambitiOptions}
            onIrePlusChange={onIrePlusChange}
            onAmbiguitaChange={onAmbiguitaChange}
            onDifficoltaChange={onDifficoltaChange}
            onTitoloQuesitoChange={onTitoloQuesitoChange}
          />
        </CardContent>
      )}
    </Card>
  );
}
