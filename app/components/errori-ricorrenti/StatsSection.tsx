import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { Pill } from '~/components/ui/pill';
import {
  OverallIcon,
  QuizIcon,
  CorrectIcon,
  WrongIcon,
  SkullIcon,
} from '~/icons';
import type { ErroriStatsResult } from '~/types/db';

/** Plugin: riempie il centro del doughnut con i segmenti del dataset più interno (cerchio solido, no buco). */
const doughnutFillCenterPlugin = {
  id: 'doughnutFillCenter',
  afterDraw(chart: {
    config?: { type?: string };
    ctx: CanvasRenderingContext2D;
    chartArea: { left: number; right: number; top: number; bottom: number };
    getDatasetMeta: (index: number) => {
      data: { startAngle: number; endAngle: number; innerRadius: number }[];
    };
    data: { datasets: { backgroundColor: string | string[] }[] };
  }): void {
    if (chart.config?.type !== 'doughnut') return;
    const datasets = chart.data?.datasets;
    if (!datasets?.length) return;
    const innerDatasetIndex = datasets.length - 1;
    const meta = chart.getDatasetMeta(innerDatasetIndex);
    if (!meta?.data?.length) return;
    const firstArc = meta.data[0];
    const innerRadius = firstArc.innerRadius;
    if (innerRadius <= 0) return;
    const centerX = (chart.chartArea.left + chart.chartArea.right) / 2;
    const centerY = (chart.chartArea.top + chart.chartArea.bottom) / 2;
    const dataset = datasets[innerDatasetIndex];
    const colors = dataset.backgroundColor;
    const ctx = chart.ctx;
    meta.data.forEach((arc, i): void => {
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, innerRadius, arc.startAngle, arc.endAngle);
      ctx.closePath();
      const color = Array.isArray(colors) ? colors[i] : colors;
      if (color) {
        ctx.fillStyle = color;
        ctx.fill();
      }
    });
  },
};

// Registra i componenti Chart.js necessari
ChartJS.register(ArcElement, Tooltip, Legend);
ChartJS.register(doughnutFillCenterPlugin);

interface StatsSectionProps {
  stats: ErroriStatsResult;
  isLoading?: boolean;
}

/**
 * Skeleton per la sezione statistiche durante il caricamento.
 */
function StatsSkeleton(): React.JSX.Element {
  return (
    <div className="p-4">
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
    </div>
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
    // Cutout più piccolo = buco centrale più piccolo = anelli più spessi
    cutout: '22%',
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
    <div className="p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Statistiche testuali - mobile: sotto il grafico, desktop: sinistra */}
        <div className="order-2 space-y-2 text-sm sm:order-1 sm:space-y-3 sm:text-base">
          {/* Griglia 3 colonne: icona | testo | pills (allineati) */}
          {/* Copertura */}
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 text-cyan-400">
            <OverallIcon className="h-5 w-5 shrink-0" />
            <span>
              Copertura <span className="font-bold">{copertura}%</span>
            </span>
            <Pill className="bg-muted text-muted-foreground">
              {domande_uniche_risposte}/{totale_domande_db}
            </Pill>
          </div>

          {/* Risposte totali */}
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 text-pink-500">
            <QuizIcon className="h-5 w-5 shrink-0" />
            <span>
              <span className="font-bold">{totale_risposte}</span> Risposte
            </span>
            <span />
          </div>

          {/* Giuste */}
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 text-green-500">
            <CorrectIcon className="h-5 w-5 shrink-0" />
            <span>
              <span className="font-bold">{risposte_corrette}</span> Giuste
            </span>
            <Pill className="bg-muted text-muted-foreground">
              {percentualeCorrette}%
            </Pill>
          </div>

          {/* Sbagliate */}
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 text-red-500">
            <WrongIcon className="h-5 w-5 shrink-0" />
            <span>
              <span className="font-bold">{risposte_errate}</span> Sbagliate
            </span>
            <Pill className="bg-muted text-muted-foreground">
              {percentualeErrate}%
            </Pill>
          </div>

          {/* Skull */}
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 text-orange-500">
            <SkullIcon className="h-5 w-5 shrink-0" />
            <span>
              <span className="font-bold">{skull_count}</span> Skull
            </span>
            <Pill className="bg-muted text-muted-foreground">
              {percentualeSkull}%
            </Pill>
          </div>
        </div>

        {/* Grafico - mobile: sopra e centrato, desktop: destra */}
        <div className="order-1 mx-auto h-32 w-32 sm:order-2 sm:mx-0 sm:h-40 sm:w-40">
          <Doughnut data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}
