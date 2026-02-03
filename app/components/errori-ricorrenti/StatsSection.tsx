import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { Card, CardContent } from '~/components/ui/card';
import {
  OverallIcon,
  QuizIcon,
  CorrectIcon,
  WrongIcon,
  SkullIcon,
} from '~/icons';
import type { ErroriStatsResult } from '~/types/db';

// Registra i componenti Chart.js necessari
ChartJS.register(ArcElement, Tooltip, Legend);

interface StatsSectionProps {
  stats: ErroriStatsResult;
  isLoading?: boolean;
}

/**
 * Skeleton per la sezione statistiche durante il caricamento.
 */
function StatsSkeleton(): React.JSX.Element {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-32 rounded bg-muted" />
            <div className="h-6 w-24 rounded bg-muted" />
            <div className="h-4 w-28 rounded bg-muted" />
            <div className="h-4 w-36 rounded bg-muted" />
            <div className="h-4 w-20 rounded bg-muted" />
          </div>
          <div className="mx-auto h-32 w-32 animate-pulse rounded-full bg-muted sm:mx-0 sm:h-40 sm:w-40" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Componente per visualizzare le statistiche con grafico multi-series doughnut.
 * Mobile-first: layout verticale su mobile, orizzontale su desktop.
 */
export function StatsSection({
  stats,
  isLoading = false,
}: StatsSectionProps): React.JSX.Element {
  if (isLoading) {
    return <StatsSkeleton />;
  }

  const {
    copertura,
    totale_risposte,
    risposte_corrette,
    risposte_errate,
    skull_count,
    domande_uniche_risposte,
    totale_domande_db,
  } = stats;

  // Calcola percentuali
  const percentualeCorrette =
    totale_risposte > 0
      ? Math.round((risposte_corrette / totale_risposte) * 100)
      : 0;
  const percentualeErrate =
    totale_risposte > 0
      ? Math.round((risposte_errate / totale_risposte) * 100)
      : 0;
  const percentualeSkull =
    domande_uniche_risposte > 0
      ? Math.round((skull_count / domande_uniche_risposte) * 100)
      : 0;

  // Dati per il grafico multi-series doughnut
  // In Chart.js il primo dataset è il più ESTERNO, quindi invertiamo l'ordine
  // Ordine visivo desiderato (interno -> esterno):
  // 1) Copertura (azzurro) - interno (più piccolo)
  // 2) Errate (rosso)
  // 3) Corrette (verde)
  // 4) Skull (arancione) - esterno (più grande)
  const chartData = {
    labels: [
      'Skull',
      'Non skull',
      'Corrette',
      'Resto corrette',
      'Errate',
      'Resto errate',
      'Copertura',
      'Non coperto',
    ],
    datasets: [
      // Dataset 1 (esterno) - Skull (arancione)
      {
        data: [percentualeSkull, 100 - percentualeSkull],
        backgroundColor: ['#f97316', '#1e293b'],
        borderWidth: 0,
      },
      // Dataset 2 - Risposte corrette (verde)
      {
        data: [percentualeCorrette, 100 - percentualeCorrette],
        backgroundColor: ['#22c55e', '#1e293b'],
        borderWidth: 0,
      },
      // Dataset 3 - Risposte errate (rosso)
      {
        data: [percentualeErrate, 100 - percentualeErrate],
        backgroundColor: ['#ef4444', '#1e293b'],
        borderWidth: 0,
      },
      // Dataset 4 (interno) - Copertura (azzurro)
      {
        data: [copertura, 100 - copertura],
        backgroundColor: ['#22d3ee', '#1e293b'],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: (context: {
            datasetIndex: number;
            dataIndex: number;
            raw: unknown;
          }): string => {
            // Ordine dataset: Skull (0), Corrette (1), Errate (2), Copertura (3)
            const labels = ['Skull', 'Corrette', 'Errate', 'Copertura'];
            if (context.dataIndex === 0) {
              return `${labels[context.datasetIndex]}: ${context.raw}%`;
            }
            return '';
          },
        },
      },
    },
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Statistiche testuali - mobile: sopra, desktop: sinistra */}
          <div className="space-y-2 text-sm sm:space-y-3 sm:text-base">
            {/* Copertura */}
            <div className="flex items-center gap-2">
              <OverallIcon className="h-5 w-5 shrink-0 text-cyan-400" />
              <span>
                copertura{' '}
                <span className="font-bold text-cyan-400">{copertura}%</span>
                <span className="ml-1 text-xs text-muted-foreground">
                  ({domande_uniche_risposte}/{totale_domande_db} domande)
                </span>
              </span>
            </div>

            {/* Risposte totali */}
            <div className="flex items-center gap-2">
              <QuizIcon className="h-5 w-5 shrink-0 text-pink-500" />
              <span>
                <span className="font-bold">{totale_risposte}</span> risposte
              </span>
            </div>

            {/* Giuste */}
            <div className="flex items-center gap-2">
              <CorrectIcon className="h-5 w-5 shrink-0 text-green-500" />
              <span>
                <span className="font-bold text-green-500">
                  {risposte_corrette}
                </span>{' '}
                giuste
                <span className="ml-1 text-muted-foreground">
                  ({percentualeCorrette}%)
                </span>
              </span>
            </div>

            {/* Sbagliate */}
            <div className="flex items-center gap-2">
              <WrongIcon className="h-5 w-5 shrink-0 text-red-500" />
              <span>
                <span className="font-bold text-red-500">
                  {risposte_errate}
                </span>{' '}
                sbagliate
                <span className="ml-1 text-muted-foreground">
                  ({percentualeErrate}%)
                </span>
              </span>
            </div>

            {/* Skull */}
            <div className="flex items-center gap-2">
              <SkullIcon className="h-5 w-5 shrink-0 text-orange-500" />
              <span>
                <span className="font-bold text-orange-500">{skull_count}</span>{' '}
                Skull
                <span className="ml-1 text-muted-foreground">
                  ({percentualeSkull}%)
                </span>
              </span>
            </div>
          </div>

          {/* Grafico - mobile: sotto e centrato, desktop: destra */}
          <div className="mx-auto h-32 w-32 sm:mx-0 sm:h-40 sm:w-40">
            <Doughnut data={chartData} options={chartOptions} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
