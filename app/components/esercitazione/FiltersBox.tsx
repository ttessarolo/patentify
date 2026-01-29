import React from 'react';
import { Card, CardContent } from '~/components/ui/card';
import { Label } from '~/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';

export interface FiltersBoxProps {
  irePlus: string;
  ambiguita: string;
  difficolta: string;
  titoloQuesito: string;
  ambitiOptions: string[];
  onIrePlusChange: (value: string) => void;
  onAmbiguitaChange: (value: string) => void;
  onDifficoltaChange: (value: string) => void;
  onTitoloQuesitoChange: (value: string) => void;
}

const DIFFICULTY_OPTIONS = ['1', '2', '3', '4', '5'];

/**
 * Box filtri per l'esercitazione.
 * Contiene filtri per difficoltà generale, ambiguità, difficoltà e ambito.
 */
export function FiltersBox({
  irePlus,
  ambiguita,
  difficolta,
  titoloQuesito,
  ambitiOptions,
  onIrePlusChange,
  onAmbiguitaChange,
  onDifficoltaChange,
  onTitoloQuesitoChange,
}: FiltersBoxProps): React.JSX.Element {
  return (
    <Card className="w-full">
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Difficoltà Generale (IRE+) */}
          <div className="space-y-2">
            <Label htmlFor="ire-plus">Difficoltà Generale</Label>
            <Select value={irePlus} onValueChange={onIrePlusChange}>
              <SelectTrigger id="ire-plus">
                <SelectValue placeholder="Tutti" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti</SelectItem>
                {DIFFICULTY_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ambiguità */}
          <div className="space-y-2">
            <Label htmlFor="ambiguita">Ambiguità</Label>
            <Select value={ambiguita} onValueChange={onAmbiguitaChange}>
              <SelectTrigger id="ambiguita">
                <SelectValue placeholder="Tutti" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti</SelectItem>
                {DIFFICULTY_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Difficoltà */}
          <div className="space-y-2">
            <Label htmlFor="difficolta">Difficoltà</Label>
            <Select value={difficolta} onValueChange={onDifficoltaChange}>
              <SelectTrigger id="difficolta">
                <SelectValue placeholder="Tutti" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti</SelectItem>
                {DIFFICULTY_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ambito (titolo_quesito) */}
          <div className="space-y-2">
            <Label htmlFor="titolo-quesito">Ambito</Label>
            <Select value={titoloQuesito} onValueChange={onTitoloQuesitoChange}>
              <SelectTrigger id="titolo-quesito">
                <SelectValue placeholder="Tutti" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti</SelectItem>
                {ambitiOptions.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
