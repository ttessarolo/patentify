import React from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useQuery } from '@tanstack/react-query';
import { Pill } from '~/components/ui/pill';
import { useTimePeriod, SectionSkeleton } from '~/components/errori-ricorrenti';
import { getAllCategorieErrori } from '~/server/errori-ricorrenti';
import type { TimePeriod, AllCategorieErroriResult } from '~/types/db';

export const Route = createFileRoute('/main/errori-ricorrenti/tutte-categorie')(
  {
    component: TutteCategoriePage,
  }
);

type CategoriePayload = { data: { period: TimePeriod } };

function TutteCategoriePage(): React.JSX.Element {
  const period = useTimePeriod();

  const getAllCategorieFn = useServerFn(getAllCategorieErrori);

  const categorieQuery = useQuery({
    queryKey: ['errori-ricorrenti', 'tutte-categorie', period],
    queryFn: async (): Promise<AllCategorieErroriResult> =>
      (
        getAllCategorieFn as unknown as (
          opts: CategoriePayload
        ) => Promise<AllCategorieErroriResult>
      )({
        data: { period },
      }),
    staleTime: 2 * 60 * 1000,
  });

  const categorie = categorieQuery.data?.categorie ?? [];

  return (
    <div className="space-y-4">
      {/* Header sticky: back + titolo */}
      <div className="sticky top-[calc(var(--header-height,3.5rem)+4.5rem)] sm:top-[calc(var(--header-height,3.5rem)+3rem)] z-10 border-b border-border bg-background py-2 shadow-[0_-1rem_0_0_var(--color-background)]">
        <div className="flex items-baseline gap-2">
          <Link
            to="/main/errori-ricorrenti"
            search={{ period }}
            className="inline-flex shrink-0 items-center justify-center text-3xl leading-none text-muted-foreground hover:text-foreground sm:text-4xl"
          >
            «
          </Link>
          <h1 className="text-xl font-bold">Tutte le Categorie con Errori</h1>
        </div>
      </div>

      {/* Loading */}
      {categorieQuery.isLoading && <SectionSkeleton />}

      {/* Error */}
      {categorieQuery.isError && (
        <p className="text-center text-red-500">Errore nel caricamento</p>
      )}

      {/* Lista categorie - stesso layout della pagina principale */}
      {categorie.length > 0 && (
        <div className="space-y-3 px-4">
          {categorie.map((cat) => (
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
      )}

      {/* Nessuna categoria */}
      {categorieQuery.data && categorie.length === 0 && (
        <p className="text-center text-muted-foreground">
          Nessun errore registrato nel periodo selezionato
        </p>
      )}
    </div>
  );
}
