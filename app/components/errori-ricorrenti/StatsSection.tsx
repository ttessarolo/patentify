import type { JSX } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { useQuery } from '@tanstack/react-query';
import { Pill } from '~/components/ui/pill';
import {
  OverallIcon,
  QuizIcon,
  CorrectIcon,
  WrongIcon,
  SkullIcon,
} from '~/icons';
import { useAppStore } from '~/store';
import { orpc, client } from '~/lib/orpc';

type ErroriStatsResult = Awaited<ReturnType<typeof client.errori.getStats>>;
type TimelineStatsResult = Awaited<ReturnType<typeof client.errori.getTimeline>>;
type TimePeriod = Parameters<typeof client.errori.getStats>[0]['period'];

// Registra i componenti Chart.js necessari
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
);

interface StatsSectionProps {
  stats: ErroriStatsResult;
  isLoading?: boolean;
  /** Periodo corrente per la query timeline */
  period: TimePeriod;
}

/**
 * Skeleton per la sezione statistiche durante il caricamento.
 */
function StatsSkeleton(): JSX.Element {
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
 * Componente per visualizzare le statistiche con grafico multi-series doughnut
 * o grafico a barre timeline. Click sul grafico per toggle tra i due tipi.
 * Mobile-first: layout verticale su mobile, orizzontale su desktop.
 */
export function StatsSection({
  stats,
  isLoading = false,
  period,
}: StatsSectionProps): JSX.Element {
  // Stato persistente per toggle tra Pie e Bar (dallo store Zustand)
  const chartType = useAppStore((s) => s.erroriRicorrenti.chartType);
  const toggleChartType = useAppStore((s) => s.toggleErroriRicorrentiChartType);

  // Query per timeline (lazy, attivata solo quando chartType === 'bar')
  const timelineQuery = useQuery({
    ...orpc.errori.getTimeline.queryOptions({ input: { period } }),
    staleTime: 2 * 60 * 1000,
    enabled: chartType === 'bar',
  });

  // Handler per toggle del grafico (usa lo store per persistenza)
  const handleChartToggle = (): void => {
    toggleChartType();
  };

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
        {/* Click per toggle tra Pie e Bar */}
        <div
          className={`order-1 cursor-pointer sm:order-2 sm:mx-0 ${
            chartType === 'pie' ? 'mx-auto' : 'w-full sm:w-auto'
          }`}
          onClick={handleChartToggle}
          onKeyDown={(e): void => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleChartToggle();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={`Clicca per ${chartType === 'pie' ? 'vedere la timeline' : 'tornare al grafico circolare'}`}
        >
          {chartType === 'pie' ? (
            <div className="mx-auto h-32 w-32 transition-opacity hover:opacity-80 sm:h-40 sm:w-40">
              <Doughnut data={chartData} options={chartOptions} />
            </div>
          ) : (
            <TimelineBarChart
              data={timelineQuery.data}
              isLoading={timelineQuery.isLoading || timelineQuery.isFetching}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// TimelineBarChart - Grafico a barre per timeline
// ============================================================

interface TimelineBarChartProps {
  data: TimelineStatsResult | undefined;
  isLoading: boolean;
}

/**
 * Grafico a barre timeline con bordi full-rounded.
 * Mostra totale, corrette e errate per ogni intervallo temporale.
 * Riferimento: https://www.chartjs.org/docs/latest/samples/bar/border-radius.html
 */
function TimelineBarChart({
  data,
  isLoading,
}: TimelineBarChartProps): JSX.Element {
  if (isLoading || !data) {
    return (
      <div className="flex h-32 w-full items-center justify-center sm:h-48 sm:w-[520px]">
        <div className="h-full w-full animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  // Se non ci sono dati, mostra messaggio
  if (data.data.length === 0) {
    return (
      <div className="flex h-32 w-full items-center justify-center text-sm text-muted-foreground sm:h-48 sm:w-[520px]">
        Nessun dato
      </div>
    );
  }

  // Ordine dataset: Totale > Giuste > Errori (scaletta decrescente)
  const barChartData = {
    labels: data.data.map((point) => point.label),
    datasets: [
      {
        label: 'Totale',
        data: data.data.map((point) => point.totale),
        borderColor: '#22d3ee',
        backgroundColor: 'rgba(34, 211, 238, 0.5)',
        borderWidth: 2,
        borderRadius: Number.MAX_VALUE,
        borderSkipped: false,
      },
      {
        label: 'Giuste',
        data: data.data.map((point) => point.corrette),
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        borderWidth: 2,
        borderRadius: Number.MAX_VALUE,
        borderSkipped: false,
      },
      {
        label: 'Errate',
        data: data.data.map((point) => point.errate),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        borderWidth: 2,
        borderRadius: Number.MAX_VALUE,
        borderSkipped: false,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#9ca3af',
          font: {
            size: 10,
          },
        },
      },
      y: {
        grid: {
          color: '#374151',
        },
        ticks: {
          color: '#9ca3af',
          font: {
            size: 10,
          },
        },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="h-32 w-full transition-opacity hover:opacity-80 sm:h-48 sm:w-[520px]">
      <Bar data={barChartData} options={barChartOptions} />
    </div>
  );
}
