import React from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '~/components/ui/card';
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
      {/* Header con back link */}
      <div className="flex items-center gap-2">
        <Link
          to="/main/errori-ricorrenti"
          search={{ period }}
          className="text-muted-foreground hover:text-foreground"
        >
          &larr;
        </Link>
        <h1 className="text-xl font-bold">Tutte le Categorie con Errori</h1>
      </div>

      {/* Loading */}
      {categorieQuery.isLoading && <SectionSkeleton />}

      {/* Error */}
      {categorieQuery.isError && (
        <p className="text-center text-red-500">Errore nel caricamento</p>
      )}

      {/* Lista categorie */}
      {categorie.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              {categorie.map((cat, idx) => (
                <div
                  key={cat.titolo_quesito}
                  className="flex items-center justify-between border-b border-border py-2 last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {idx + 1}
                    </span>
                    <span className="text-sm">{cat.titolo_quesito}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-red-500">
                      {cat.errori_count}
                    </span>
                    <span className="ml-1 text-xs text-muted-foreground">
                      errori ({cat.percentuale}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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
