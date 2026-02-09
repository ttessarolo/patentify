import type { JSX, ComponentType, SVGProps } from 'react';
import { getValueColorClass } from '~/commons';

interface MetricIndicatorProps {
  /** Icona SVG da mostrare */
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** Valore numerico (può essere decimale per medie) */
  value: number | null;
  /** Label accessibilità */
  ariaLabel?: string;
}

/**
 * Indicatore metrica compatto: [Icona][valore] con colorazione 1-5.
 * Usato sia nell'header domanda che nella tabella quiz.
 */
export function MetricIndicator({
  icon: Icon,
  value,
  ariaLabel,
}: MetricIndicatorProps): JSX.Element {
  const colorClass = getValueColorClass(value);
  const displayValue =
    value !== null ? (Number.isInteger(value) ? value : value.toFixed(1)) : '—';

  return (
    <span
      className={`inline-flex items-center gap-1 ${colorClass}`}
      aria-label={ariaLabel}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="text-sm font-medium">{displayValue}</span>
    </span>
  );
}
