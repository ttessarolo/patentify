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
import { QuizIcon, CorrectIcon, WrongIcon } from '~/icons';
import { useAppStore } from '~/store';
import { client, orpc } from '~/lib/orpc';
import type { TimePeriod } from '~/types/db';

type QuizStatsResult = Awaited<
  ReturnType<typeof client.statistiche.getQuizStats>
>;
type QuizTimelineStatsResult = Awaited<
  ReturnType<typeof client.statistiche.getQuizTimeline>
>;

// Registra i componenti Chart.js necessari
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
);

interface QuizStatsSectionProps {
  stats: QuizStatsResult;
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
        </div>
        <div className="mx-auto h-32 w-32 animate-pulse rounded-full bg-muted sm:mx-0 sm:h-40 sm:w-40" />
      </div>
    </div>
  );
}

/**
 * Componente per visualizzare le statistiche dei quiz con grafico multi-series doughnut
 * o grafico a barre timeline. Click sul grafico per toggle tra i due tipi.
 * Mobile-first: layout verticale su mobile, orizzontale su desktop.
 */
export function QuizStatsSection({
  stats,
  isLoading = false,
  period,
}: QuizStatsSectionProps): JSX.Element {
  // Stato persistente per toggle tra Pie e Bar (dallo store Zustand - sezione statistiche)
  const chartType = useAppStore((s) => s.statistiche.chartType);
  const toggleChartType = useAppStore((s) => s.toggleStatisticheChartType);

  // Query per timeline (lazy, attivata solo quando chartType === 'bar')
  const timelineQuery = useQuery({
    ...orpc.statistiche.getQuizTimeline.queryOptions({ input: { period } }),
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

  const { quiz_svolti, quiz_promossi, quiz_bocciati } = stats;

  // Calcola percentuali
  const percentualePromossi =
    quiz_svolti > 0 ? Math.round((quiz_promossi / quiz_svolti) * 100) : 0;
  const percentualeBocciati =
    quiz_svolti > 0 ? Math.round((quiz_bocciati / quiz_svolti) * 100) : 0;

  // Dati per il grafico multi-series doughnut
  // In Chart.js il primo dataset è il più ESTERNO, quindi invertiamo l'ordine
  // Ordine visivo desiderato (interno -> esterno):
  // 1) Quiz svolti (azzurro) - interno (sempre 100%)
  // 2) Promossi (verde)
  // 3) Bocciati (rosso) - esterno
  const chartData = {
    labels: [
      'Bocciati',
      'Resto bocciati',
      'Promossi',
      'Resto promossi',
      'Quiz svolti',
      'Resto svolti',
    ],
    datasets: [
      // Dataset 1 (esterno) - Bocciati (rosso)
      {
        data: [percentualeBocciati, 100 - percentualeBocciati],
        backgroundColor: ['#ef4444', '#1e293b'],
        borderWidth: 0,
      },
      // Dataset 2 - Promossi (verde)
      {
        data: [percentualePromossi, 100 - percentualePromossi],
        backgroundColor: ['#22c55e', '#1e293b'],
        borderWidth: 0,
      },
      // Dataset 3 (interno) - Quiz svolti (azzurro) - sempre 100%
      {
        data: [100, 0],
        backgroundColor: ['#22d3ee', '#1e293b'],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    // Cutout più piccolo = buco centrale più piccolo = anelli più spessi
    cutout: '30%',
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
            // Ordine dataset: Bocciati (0), Promossi (1), Quiz svolti (2)
            const labels = ['Bocciati', 'Promossi', 'Quiz svolti'];
            if (context.dataIndex === 0) {
              if (context.datasetIndex === 2) {
                // Quiz svolti mostra il numero totale
                return `${labels[context.datasetIndex]}: ${quiz_svolti}`;
              }
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
          {/* Quiz svolti */}
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 text-cyan-400">
            <QuizIcon className="h-5 w-5 shrink-0" />
            <span>
              <span className="font-bold">{quiz_svolti}</span> Quiz Svolti
            </span>
            <span />
          </div>

          {/* Promossi */}
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 text-green-500">
            <CorrectIcon className="h-5 w-5 shrink-0" />
            <span>
              <span className="font-bold">{quiz_promossi}</span> Promossi
            </span>
            <Pill className="bg-muted text-muted-foreground">
              {percentualePromossi}%
            </Pill>
          </div>

          {/* Bocciati */}
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 text-red-500">
            <WrongIcon className="h-5 w-5 shrink-0" />
            <span>
              <span className="font-bold">{quiz_bocciati}</span> Bocciati
            </span>
            <Pill className="bg-muted text-muted-foreground">
              {percentualeBocciati}%
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
            <QuizTimelineBarChart
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
// QuizTimelineBarChart - Grafico a barre per timeline quiz
// ============================================================

interface QuizTimelineBarChartProps {
  data: QuizTimelineStatsResult | undefined;
  isLoading: boolean;
}

/**
 * Grafico a barre timeline con bordi full-rounded.
 * Mostra totale, promossi e bocciati per ogni intervallo temporale.
 */
function QuizTimelineBarChart({
  data,
  isLoading,
}: QuizTimelineBarChartProps): JSX.Element {
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

  // Ordine dataset: Totale > Promossi > Bocciati (scaletta decrescente)
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
        label: 'Promossi',
        data: data.data.map((point) => point.promossi),
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        borderWidth: 2,
        borderRadius: Number.MAX_VALUE,
        borderSkipped: false,
      },
      {
        label: 'Bocciati',
        data: data.data.map((point) => point.bocciati),
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
