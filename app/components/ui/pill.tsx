import * as React from 'react';
import { cn } from '~/lib/utils';

export interface PillProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
}

/**
 * Componente Pill per visualizzare tag/etichette compatte.
 */
export function Pill({
  className,
  children,
  ...props
}: PillProps): React.JSX.Element {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
