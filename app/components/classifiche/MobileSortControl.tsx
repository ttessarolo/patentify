import type { JSX } from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '~/components/ui/dropdown-menu';

interface SortOption<T extends string> {
  value: T;
  label: string;
}

interface MobileSortControlProps<T extends string> {
  /** Opzioni disponibili per l'ordinamento */
  sortOptions: SortOption<T>[];
  /** Campo di ordinamento corrente */
  currentField: T;
  /** Direzione di ordinamento corrente */
  currentDir: 'asc' | 'desc';
  /** Callback cambio campo di ordinamento */
  onFieldChange: (field: T) => void;
  /** Callback toggle direzione */
  onDirToggle: () => void;
}

/**
 * Barra di ordinamento per mobile.
 * Mostra il campo corrente in un DropdownMenu + triangolino per la direzione.
 * Visibile solo su mobile (sm:hidden).
 */
export function MobileSortControl<T extends string>({
  sortOptions,
  currentField,
  currentDir,
  onFieldChange,
  onDirToggle,
}: MobileSortControlProps<T>): JSX.Element {
  const currentLabel =
    sortOptions.find((o) => o.value === currentField)?.label ?? currentField;

  return (
    <div className="flex items-center justify-between rounded-lg bg-card px-3 py-2 sm:hidden">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="text-[10px] uppercase tracking-wider">
              Ordina per:
            </span>
            <span className="font-semibold text-foreground">
              {currentLabel}
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {sortOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={(): void => onFieldChange(option.value)}
              className={
                option.value === currentField ? 'font-semibold text-foreground' : ''
              }
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <button
        type="button"
        onClick={onDirToggle}
        className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
        aria-label={
          currentDir === 'desc' ? 'Ordine decrescente' : 'Ordine crescente'
        }
      >
        <span className="text-sm">{currentDir === 'desc' ? '▼' : '▲'}</span>
      </button>
    </div>
  );
}
