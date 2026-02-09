import type { ComponentType, JSX } from 'react';

interface SwitchOption<T extends string> {
  value: T;
  label: string;
  Icon: ComponentType<{ className?: string }>;
}

interface ClassificheSwitchProps<T extends string> {
  /** Opzioni dello switch */
  options: [SwitchOption<T>, SwitchOption<T>];
  /** Valore corrente */
  value: T;
  /** Callback quando il valore cambia */
  onChange: (value: T) => void;
  /** Colore dell'opzione attiva (default: teal) */
  activeColor?: 'teal' | 'pink';
}

/**
 * Switch pill-style (segmented control) con due opzioni e icone.
 * Usato per Quiz/Risposte e Generale/Amici.
 */
export function ClassificheSwitch<T extends string>({
  options,
  value,
  onChange,
  activeColor = 'teal',
}: ClassificheSwitchProps<T>): JSX.Element {
  const colorClasses =
    activeColor === 'pink'
      ? {
          active: 'bg-pink-500 text-white shadow-md',
          inactive:
            'bg-transparent text-muted-foreground hover:text-foreground',
        }
      : {
          active: 'bg-teal-500 text-white shadow-md',
          inactive:
            'bg-transparent text-muted-foreground hover:text-foreground',
        };

  return (
    <div className="inline-flex items-center rounded-full bg-card p-1">
      {options.map((option) => {
        const isActive = value === option.value;
        const { Icon } = option;
        return (
          <button
            key={option.value}
            type="button"
            onClick={(): void => onChange(option.value)}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium transition-all sm:px-3 sm:text-sm ${
              isActive ? colorClasses.active : colorClasses.inactive
            }`}
            aria-pressed={isActive}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
