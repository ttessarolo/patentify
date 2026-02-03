import React from 'react';
import { useNavigate, useSearch, useLocation } from '@tanstack/react-router';
import { OggiIcon, SettimanaIcon, MeseIcon, AllIcon } from '~/icons';
import type { TimePeriod } from '~/types/db';

interface TimePeriodOption {
  value: TimePeriod;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}

const TIME_PERIOD_OPTIONS: TimePeriodOption[] = [
  { value: 'oggi', label: 'Oggi', Icon: OggiIcon },
  { value: 'settimana', label: 'Settimana', Icon: SettimanaIcon },
  { value: 'mese', label: 'Mese', Icon: MeseIcon },
  { value: 'tutti', label: 'Tutti', Icon: AllIcon },
];

interface TimePeriodToolbarProps {
  /** Periodo corrente selezionato */
  currentPeriod: TimePeriod;
}

/**
 * Toolbar sticky per la selezione del periodo temporale.
 * Mobile-first: icone più piccole su mobile, più grandi su desktop.
 */
export function TimePeriodToolbar({
  currentPeriod,
}: TimePeriodToolbarProps): React.JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();

  const handlePeriodChange = (period: TimePeriod): void => {
    void navigate({
      to: location.pathname,
      search: { period },
    });
  };

  return (
    <div className="sticky top-(--header-height,3.5rem) z-10 -mx-4 bg-background/95 px-4 py-2 backdrop-blur-sm sm:mx-0 sm:px-0">
      <div className="flex items-center justify-center gap-2 sm:gap-2">
        {TIME_PERIOD_OPTIONS.map(({ value, label, Icon }) => {
          const isActive = currentPeriod === value;
          return (
            <button
              key={value}
              type="button"
              onClick={(): void => handlePeriodChange(value)}
              className={`flex flex-col items-center gap-1 text-xs font-medium transition-all sm:flex-row sm:gap-2 sm:rounded-full sm:px-4 sm:py-2 sm:text-sm ${
                isActive
                  ? 'sm:bg-teal-500 sm:text-white sm:shadow-md'
                  : 'sm:bg-card sm:text-muted-foreground sm:hover:bg-muted'
              }`}
              aria-pressed={isActive}
              aria-label={`Filtra per ${label}`}
            >
              {/* Icona con sfondo colorato su mobile */}
              <span
                className={`flex items-center justify-center rounded-lg p-2 transition-all sm:rounded-none sm:bg-transparent sm:p-0 ${
                  isActive
                    ? 'bg-teal-500 text-white shadow-md sm:bg-transparent sm:shadow-none'
                    : 'bg-card text-muted-foreground sm:bg-transparent'
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              {/* Label sempre visibile, non colorata su mobile */}
              <span
                className={`text-[10px] sm:text-sm ${
                  isActive
                    ? 'text-teal-500 sm:text-white'
                    : 'text-muted-foreground'
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Hook per ottenere il periodo corrente dai search params.
 * Default: 'tutti'
 */
export function useTimePeriod(): TimePeriod {
  const search = useSearch({ strict: false }) as { period?: TimePeriod };
  const period = search?.period;

  // Valida che sia un periodo valido
  if (
    period === 'oggi' ||
    period === 'settimana' ||
    period === 'mese' ||
    period === 'tutti'
  ) {
    return period;
  }

  return 'tutti';
}
