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
 *
 * Mobile: icona in un pill colorato con label sotto (stile TimePeriodToolbar).
 * Desktop: segmented control orizzontale classico.
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
          btnActive: 'sm:bg-pink-500 sm:text-white sm:shadow-md',
          btnInactive:
            'sm:bg-muted sm:text-muted-foreground sm:hover:text-foreground',
          iconActive:
            'bg-pink-500 text-white shadow-md sm:bg-transparent sm:shadow-none',
          iconInactive: 'bg-muted text-muted-foreground sm:bg-transparent',
          labelActive: 'text-pink-500 sm:text-white',
          labelInactive: 'text-muted-foreground',
        }
      : {
          btnActive: 'sm:bg-amber-600 sm:text-white sm:shadow-md',
          btnInactive:
            'sm:bg-muted sm:text-muted-foreground sm:hover:text-foreground',
          iconActive:
            'bg-amber-600 text-white shadow-md sm:bg-transparent sm:shadow-none',
          iconInactive: 'bg-muted text-muted-foreground sm:bg-transparent',
          labelActive: 'text-amber-600 sm:text-white',
          labelInactive: 'text-muted-foreground',
        };

  return (
    <div className="inline-flex items-center gap-3 sm:gap-2 sm:rounded-full sm:bg-card sm:p-1">
      {options.map((option) => {
        const isActive = value === option.value;
        const { Icon } = option;
        return (
          <button
            key={option.value}
            type="button"
            onClick={(): void => onChange(option.value)}
            className={`flex flex-col items-center gap-1 text-xs font-medium transition-all sm:flex-row sm:gap-1.5 sm:rounded-full sm:px-3 sm:py-1.5 sm:text-sm ${
              isActive ? colorClasses.btnActive : colorClasses.btnInactive
            }`}
            aria-pressed={isActive}
          >
            {/* Icona in pill allungato su mobile, trasparente su desktop */}
            <span
              className={`flex items-center justify-center rounded-full px-4 py-2 transition-all sm:rounded-none sm:bg-transparent sm:p-0 ${
                isActive ? colorClasses.iconActive : colorClasses.iconInactive
              }`}
            >
              <Icon className="h-5 w-5 sm:h-4 sm:w-4" />
            </span>
            {/* Label sotto l'icona su mobile, inline su desktop */}
            <span
              className={`text-[10px] sm:text-sm ${
                isActive ? colorClasses.labelActive : colorClasses.labelInactive
              }`}
            >
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
