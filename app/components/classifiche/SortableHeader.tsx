import type { JSX } from 'react';

interface SortableHeaderProps {
  /** Label dell'header */
  label: string;
  /** Se questa colonna è quella attualmente ordinata */
  isActive: boolean;
  /** Direzione di ordinamento corrente */
  direction: 'asc' | 'desc';
  /** Callback al click sull'header */
  onClick: () => void;
}

/**
 * Header colonna cliccabile con indicatore di ordinamento (triangolo).
 * Mostra il triangolo solo sulla colonna attiva.
 */
export function SortableHeader({
  label,
  isActive,
  direction,
  onClick,
}: SortableHeaderProps): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-1 text-xs font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
    >
      <span>{label}</span>
      {isActive && (
        <span className="text-muted-foreground" aria-label={direction === 'desc' ? 'Ordine decrescente' : 'Ordine crescente'}>
          {direction === 'desc' ? '▼' : '▲'}
        </span>
      )}
    </button>
  );
}
