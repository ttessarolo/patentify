import React from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/tanstack-react-start';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { DomandaCard } from '~/components/domanda';
import {
  useTimePeriod,
  StatsSection,
  LazySection,
  SectionSkeleton,
} from '~/components/errori-ricorrenti';
import {
  getErroriStats,
  getTopCategorieErrori,
  getDomandeMaggioriErrori,
  getDomandeSkull,
  getDomandeMaggioriEsatte,
} from '~/server/errori-ricorrenti';
import type {
  TimePeriod,
  ErroriStatsResult,
  TopCategorieErroriResult,
  DomandeErroriResult,
  DomandeSkullResult,
  DomandeEsatteResult,
  DomandaConErrori,
  DomandaConEsatte,
  DomandaSkull,
} from '~/types/db';

export const Route = createFileRoute('/main/errori-ricorrenti/')({
  component: ErroriRicorrentiIndex,
});

/** Payload types per server functions */
type StatsPayload = { data: { period: TimePeriod } };
type TopCategoriePayload = { data: { period: TimePeriod; limit: number } };
type DomandePayload = {
  data: { period: TimePeriod; limit: number; offset: number };
};

function ErroriRicorrentiIndex(): React.JSX.Element {
  const period = useTimePeriod();
  const { userId } = useAuth();

  // Server functions
  const getStatsFn = useServerFn(getErroriStats);
  const getTopCategorieFn = useServerFn(getTopCategorieErrori);
  const getMaggioriErroriFn = useServerFn(getDomandeMaggioriErrori);
  const getSkullFn = useServerFn(getDomandeSkull);
  const getMaggioriEsatteFn = useServerFn(getDomandeMaggioriEsatte);

  // Query per statistiche (Sezione B)
  const statsQuery = useQuery({
    queryKey: ['errori-ricorrenti', 'stats', period],
    queryFn: async (): Promise<ErroriStatsResult> =>
      (
        getStatsFn as unknown as (
          opts: StatsPayload
        ) => Promise<ErroriStatsResult>
      )({
        data: { period },
      }),
    staleTime: 2 * 60 * 1000,
  });

  // Query per top 5 categorie (Sezione D)
  const categorieQuery = useQuery({
    queryKey: ['errori-ricorrenti', 'top-categorie', period],
    queryFn: async (): Promise<TopCategorieErroriResult> =>
      (
        getTopCategorieFn as unknown as (
          opts: TopCategoriePayload
        ) => Promise<TopCategorieErroriResult>
      )({
        data: { period, limit: 5 },
      }),
    staleTime: 2 * 60 * 1000,
  });

  // Query per domande con maggiori errori (Sezione E)
  const maggioriErroriQuery = useQuery({
    queryKey: ['errori-ricorrenti', 'maggiori-errori', period],
    queryFn: async (): Promise<DomandeErroriResult> =>
      (
        getMaggioriErroriFn as unknown as (
          opts: DomandePayload
        ) => Promise<DomandeErroriResult>
      )({
        data: { period, limit: 5, offset: 0 },
      }),
    staleTime: 2 * 60 * 1000,
    enabled: false, // Lazy loaded
  });

  // Query per domande skull (Sezione F)
  const skullQuery = useQuery({
    queryKey: ['errori-ricorrenti', 'skull', period],
    queryFn: async (): Promise<DomandeSkullResult> =>
      (
        getSkullFn as unknown as (
          opts: DomandePayload
        ) => Promise<DomandeSkullResult>
      )({
        data: { period, limit: 5, offset: 0 },
      }),
    staleTime: 2 * 60 * 1000,
    enabled: false, // Lazy loaded
  });

  // Query per domande con maggiori risposte esatte (Sezione G)
  const maggioriEsatteQuery = useQuery({
    queryKey: ['errori-ricorrenti', 'maggiori-esatte', period],
    queryFn: async (): Promise<DomandeEsatteResult> =>
      (
        getMaggioriEsatteFn as unknown as (
          opts: DomandePayload
        ) => Promise<DomandeEsatteResult>
      )({
        data: { period, limit: 5, offset: 0 },
      }),
    staleTime: 2 * 60 * 1000,
    enabled: false, // Lazy loaded
  });

  return (
    <div className="space-y-6">
      {/* Sezione B - Statistiche e Grafico */}
      <StatsSection
        stats={
          statsQuery.data ?? {
            copertura: 0,
            totale_risposte: 0,
            risposte_corrette: 0,
            risposte_errate: 0,
            skull_count: 0,
            domande_uniche_risposte: 0,
            totale_domande_db: 0,
          }
        }
        isLoading={statsQuery.isLoading}
      />

      {/* Sezione C - Bottoni Azione */}
      <Card>
        <CardContent className="flex flex-col gap-2 p-4 sm:gap-3">
          <Link
            to="/main/errori-ricorrenti/domande-sbagliate"
            search={{ period }}
          >
            <Button variant="outline" className="w-full justify-start">
              Riproponi le domande che ho sbagliato
            </Button>
          </Link>
          <Link
            to="/main/errori-ricorrenti/categorie-critiche"
            search={{ period }}
          >
            <Button variant="outline" className="w-full justify-start">
              Esercizio sulle categorie Critiche
            </Button>
          </Link>
          <Link to="/main/errori-ricorrenti/focus-skull" search={{ period }}>
            <Button variant="outline" className="w-full justify-start">
              Focus Skull
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Sezione D - Top 5 Categorie con Errori */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Categorie con Maggiori Errori</h2>
        {categorieQuery.isLoading ? (
          <SectionSkeleton />
        ) : categorieQuery.data?.categorie &&
          categorieQuery.data.categorie.length > 0 ? (
          <>
            <div className="space-y-4 text-sm">
              {categorieQuery.data.categorie.map((cat, idx) => (
                <div key={cat.titolo_quesito}>
                  <div className="font-medium">
                    {idx + 1}) {cat.titolo_quesito}
                  </div>
                  <div className="ml-4 text-muted-foreground">
                    {cat.errori_count} errori ({cat.percentuale}%)
                  </div>
                </div>
              ))}
            </div>
            <Link
              to="/main/errori-ricorrenti/tutte-categorie"
              search={{ period }}
            >
              <Button variant="outline" className="w-full">
                Vedi Tutte
              </Button>
            </Link>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nessun errore registrato nel periodo selezionato
          </p>
        )}
      </section>

      {/* Sezione E - Domande con Maggiori Errori (Lazy) */}
      <LazySection
        onVisible={(): void => {
          void maggioriErroriQuery.refetch();
        }}
      >
        <DomandeSection
          title="Risposte con maggiori errori"
          domande={maggioriErroriQuery.data?.domande ?? []}
          isLoading={
            maggioriErroriQuery.isLoading || maggioriErroriQuery.isFetching
          }
          linkTo="/main/errori-ricorrenti/maggiori-errori"
          linkText="Vedi Tutte"
          period={period}
          userId={userId}
        />
      </LazySection>

      {/* Sezione F - Domande Skull (Lazy) */}
      <LazySection
        onVisible={(): void => {
          void skullQuery.refetch();
        }}
      >
        <DomandeSection
          title="Risposte Skull"
          domande={skullQuery.data?.domande ?? []}
          isLoading={skullQuery.isLoading || skullQuery.isFetching}
          linkTo="/main/errori-ricorrenti/skull-selezionate"
          linkText="Vedi Tutte"
          period={period}
          userId={userId}
        />
      </LazySection>

      {/* Sezione G - Domande con Maggiori Risposte Esatte (Lazy) */}
      <LazySection
        onVisible={(): void => {
          void maggioriEsatteQuery.refetch();
        }}
      >
        <DomandeSection
          title="Risposte Esatte"
          domande={maggioriEsatteQuery.data?.domande ?? []}
          isLoading={
            maggioriEsatteQuery.isLoading || maggioriEsatteQuery.isFetching
          }
          linkTo="/main/errori-ricorrenti/domande-esatte"
          linkText="Vedi Tutte"
          period={period}
          userId={userId}
        />
      </LazySection>
    </div>
  );
}

// ============================================================
// Componente helper per le sezioni domande
// ============================================================

interface DomandeSectionProps {
  title: string;
  domande: (DomandaConErrori | DomandaConEsatte | DomandaSkull)[];
  isLoading: boolean;
  linkTo: string;
  linkText: string;
  period: TimePeriod;
  userId: string | null | undefined;
}

function DomandeSection({
  title,
  domande,
  isLoading,
  linkTo,
  linkText,
  period,
  userId,
}: DomandeSectionProps): React.JSX.Element {
  // Handler vuoto per readOnly mode
  const handleAnswer = (): void => {
    // readOnly mode, no-op
  };

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      {isLoading ? (
        <SectionSkeleton />
      ) : domande.length > 0 ? (
        <>
          <div className="space-y-3">
            {domande.map((d) => (
              <DomandaCard
                key={d.id}
                domanda={{ ...d, skull: 'skull' in d ? d.skull : false }}
                onAnswer={handleAnswer}
                learning={false}
                readOnly={true}
                initialAnswer={d.ultima_risposta ?? undefined}
                userId={userId}
              />
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground">
            ... (elenco 5 domande)
          </p>
          <Link to={linkTo} search={{ period }}>
            <Button variant="outline" className="w-full">
              {linkText}
            </Button>
          </Link>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Nessuna domanda nel periodo selezionato
        </p>
      )}
    </section>
  );
}
