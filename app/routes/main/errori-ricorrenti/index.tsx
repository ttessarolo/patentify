import type { JSX } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/tanstack-react-start';
import { Button } from '~/components/ui/button';
import { Pill } from '~/components/ui/pill';
import { DomandaCard } from '~/components/domanda';
import {
  useTimePeriod,
  StatsSection,
  SectionReveal,
} from '~/components/errori-ricorrenti';
import { orpc, client } from '~/lib/orpc';

type TimePeriod = Parameters<typeof client.errori.getStats>[0]['period'];
type DomandaConErrori = Awaited<
  ReturnType<typeof client.errori.getMaggioriErrori>
>['domande'][number];
type DomandaConEsatte = Awaited<
  ReturnType<typeof client.errori.getMaggioriEsatte>
>['domande'][number];
type DomandaSkull = Awaited<
  ReturnType<typeof client.errori.getSkull>
>['domande'][number];

export const Route = createFileRoute('/main/errori-ricorrenti/')({
  component: ErroriRicorrentiIndex,
});

function ErroriRicorrentiIndex(): JSX.Element {
  const period = useTimePeriod();
  const { userId } = useAuth();

  // Query per statistiche (Sezione B)
  const statsQuery = useQuery({
    ...orpc.errori.getStats.queryOptions({ input: { period } }),
    staleTime: 2 * 60 * 1000,
  });

  // Query per top 5 categorie (Sezione D) - Lazy loaded
  const categorieQuery = useQuery({
    ...orpc.errori.getTopCategorie.queryOptions({
      input: { period, limit: 5 },
    }),
    staleTime: 2 * 60 * 1000,
    enabled: false, // Lazy loaded
  });

  // Query per domande con maggiori errori (Sezione E)
  const maggioriErroriQuery = useQuery({
    ...orpc.errori.getMaggioriErrori.queryOptions({
      input: { period, limit: 5, offset: 0 },
    }),
    staleTime: 2 * 60 * 1000,
    enabled: false, // Lazy loaded
  });

  // Query per domande skull (Sezione F)
  const skullQuery = useQuery({
    ...orpc.errori.getSkull.queryOptions({
      input: { period, limit: 5, offset: 0 },
    }),
    staleTime: 2 * 60 * 1000,
    enabled: false, // Lazy loaded
  });

  // Query per domande con maggiori risposte esatte (Sezione G)
  const maggioriEsatteQuery = useQuery({
    ...orpc.errori.getMaggioriEsatte.queryOptions({
      input: { period, limit: 5, offset: 0 },
    }),
    staleTime: 2 * 60 * 1000,
    enabled: false, // Lazy loaded
  });

  return (
    <div className="space-y-6">
      {/* Statistiche + Bottoni: raggruppati per ridurre spazio verticale su mobile */}
      <div className="space-y-2 sm:space-y-3">
        {/* Sezione B - Statistiche e Grafico (click per toggle Pie/Bar) */}
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
          period={period}
        />

        {/* Sezione C - Bottoni Azione */}
        <div className="flex flex-col gap-2 px-4 pb-2 sm:gap-3 sm:pb-0">
          <Link
            to="/main/errori-ricorrenti/domande-sbagliate"
            search={{ period }}
          >
            <Button
              variant="outline"
              className="w-full justify-center border-[#888888]! text-[#d8d8d8] hover:bg-[#888888]/10 hover:text-[#e8e8e8]"
            >
              Riproponi le Domande che ho Sbagliato
            </Button>
          </Link>
          <Link
            to="/main/errori-ricorrenti/categorie-critiche"
            search={{ period }}
          >
            <Button
              variant="outline"
              className="w-full justify-center border-[#888888]! text-[#d8d8d8] hover:bg-[#888888]/10 hover:text-[#e8e8e8]"
            >
              Esercizio sulle Categorie Critiche
            </Button>
          </Link>
          <Link to="/main/errori-ricorrenti/focus-skull" search={{ period }}>
            <Button
              variant="outline"
              className="w-full justify-center border-[#888888]! text-[#d8d8d8] hover:bg-[#888888]/10 hover:text-[#e8e8e8]"
            >
              Focus Skull
            </Button>
          </Link>
        </div>
      </div>

      {/* Sezioni collapsibili - stessa spaziatura dei bottoni */}
      <div className="flex flex-col gap-2 px-4 sm:gap-3">
        {/* Sezione D - Top 5 Categorie con Errori (box blu collapsibile) */}
        <SectionReveal
          sectionKey="errori-categorie"
          title="Categorie con Maggiori Errori"
          color="blue"
          isLoading={categorieQuery.isLoading || categorieQuery.isFetching}
          onFirstOpen={(): void => {
            void categorieQuery.refetch();
          }}
          reloadKey={period}
        >
          {categorieQuery.data?.categorie &&
          categorieQuery.data.categorie.length > 0 ? (
            <>
              <div className="space-y-3">
                {categorieQuery.data.categorie.map((cat) => (
                  <Link
                    key={cat.titolo_quesito}
                    to="/main/esercitazione"
                    search={{ titolo_quesito: cat.titolo_quesito }}
                    className="flex flex-col gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-sm transition-colors hover:bg-muted/50"
                  >
                    <div className="flex min-w-0 flex-1 flex-wrap items-start gap-2">
                      <span className="min-w-0 flex-1 font-medium">
                        {cat.titolo_quesito}
                      </span>
                    </div>
                    <div className="flex justify-end">
                      <Pill className="bg-destructive/15 text-destructive">
                        {cat.errori_count} errori ({cat.percentuale}%)
                      </Pill>
                    </div>
                  </Link>
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
        </SectionReveal>

        {/* Sezione E - Domande con Maggiori Errori (box rosso collapsibile) */}
        <SectionReveal
          sectionKey="errori-maggiori"
          title="Risposte con maggiori errori"
          color="red"
          isLoading={
            maggioriErroriQuery.isLoading || maggioriErroriQuery.isFetching
          }
          onFirstOpen={(): void => {
            void maggioriErroriQuery.refetch();
          }}
          reloadKey={period}
        >
          <DomandeContent
            domande={maggioriErroriQuery.data?.domande ?? []}
            linkTo="/main/errori-ricorrenti/maggiori-errori"
            linkText="Vedi Tutte"
            period={period}
            userId={userId}
          />
        </SectionReveal>

        {/* Sezione F - Domande Skull (box arancione collapsibile) */}
        <SectionReveal
          sectionKey="errori-skull"
          title="Risposte Skull"
          color="orange"
          isLoading={skullQuery.isLoading || skullQuery.isFetching}
          onFirstOpen={(): void => {
            void skullQuery.refetch();
          }}
          reloadKey={period}
        >
          <DomandeContent
            domande={skullQuery.data?.domande ?? []}
            linkTo="/main/errori-ricorrenti/skull-selezionate"
            linkText="Vedi Tutte"
            period={period}
            userId={userId}
          />
        </SectionReveal>

        {/* Sezione G - Domande con Maggiori Risposte Esatte (box verde collapsibile) */}
        <SectionReveal
          sectionKey="errori-esatte"
          title="Risposte Esatte"
          color="green"
          isLoading={
            maggioriEsatteQuery.isLoading || maggioriEsatteQuery.isFetching
          }
          onFirstOpen={(): void => {
            void maggioriEsatteQuery.refetch();
          }}
          reloadKey={period}
        >
          <DomandeContent
            domande={maggioriEsatteQuery.data?.domande ?? []}
            linkTo="/main/errori-ricorrenti/domande-esatte"
            linkText="Vedi Tutte"
            period={period}
            userId={userId}
          />
        </SectionReveal>
      </div>
    </div>
  );
}

// ============================================================
// Componente helper per il contenuto delle sezioni domande
// ============================================================

interface DomandeContentProps {
  domande: (DomandaConErrori | DomandaConEsatte | DomandaSkull)[];
  linkTo: string;
  linkText: string;
  period: TimePeriod;
  userId: string | null | undefined;
}

function DomandeContent({
  domande,
  linkTo,
  linkText,
  period,
  userId,
}: DomandeContentProps): JSX.Element {
  // Handler vuoto per readOnly mode
  const handleAnswer = (): void => {
    // readOnly mode, no-op
  };

  if (domande.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nessuna domanda nel periodo selezionato
      </p>
    );
  }

  return (
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

      <Link to={linkTo} search={{ period }}>
        <Button variant="outline" className="w-full">
          {linkText}
        </Button>
      </Link>
    </>
  );
}
