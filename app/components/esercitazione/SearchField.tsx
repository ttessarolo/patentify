import React, { useCallback, useEffect, useState } from 'react';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';

export interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

/**
 * Componente input di ricerca con debounce opzionale.
 * Emette il valore verso l'alto dopo il debounce.
 */
export function SearchField({
  value,
  onChange,
  placeholder = 'Cerca nella domanda...',
  debounceMs = 300,
}: SearchFieldProps): React.JSX.Element {
  const [localValue, setLocalValue] = useState(value);

  // Sincronizza il valore locale quando cambia dall'esterno
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounce per limitare le chiamate onChange
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, debounceMs);

    return (): void => {
      clearTimeout(timer);
    };
  }, [localValue, debounceMs, onChange, value]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      setLocalValue(e.target.value);
    },
    []
  );

  return (
    <div className="w-full space-y-2">
      <Label htmlFor="search-field">Ricerca</Label>
      <Input
        id="search-field"
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full"
      />
    </div>
  );
}
