import type { JSX } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import {
  IreIcon,
  AmbiguitaIcon,
  DifficoltaIcon,
  OverallIcon,
  QuizIcon,
  CorrectIcon,
  WrongIcon,
  SkullIcon,
  RandomIcon,
  OggiIcon,
  SettimanaIcon,
  MeseIcon,
  AllIcon,
  StarOnIcon,
  StarOffIcon,
} from '~/icons';

export const Route = createFileRoute('/main/help/')({
  component: HelpIndex,
});

const TOC_ITEMS = [
  { href: '#icone-domanda', label: 'Legenda icone e indicatori' },
  { href: '#esercitazione-libera', label: 'Esercitazione Libera' },
  { href: '#simulazione-quiz', label: 'Simulazione Quiz' },
  { href: '#errori-ricorrenti', label: 'Errori Ricorrenti' },
  { href: '#statistiche-quiz', label: 'Statistiche Quiz' },
  { href: '#classifiche', label: 'Classifiche' },
  { href: '#sfide', label: 'Sfide' },
] as const;

function sectionLabel(index: number, text: string): string {
  const prefix = String(index).padStart(2, '0');
  return `${prefix} — ${text}`;
}

function HelpIndex(): JSX.Element {
  return (
    <article className="mx-auto max-w-5xl px-4 pb-20 md:px-6">
      <header id="top" className="space-y-4 pb-1 pt-8 md:pt-12">
        <h1 className="text-center text-2xl font-bold sm:text-left">Help</h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Qui trovi una guida pratica a tutte le sezioni principali.
        </p>
      </header>

      <nav
        className="rounded-2xl border border-border bg-card p-5 md:p-7"
        aria-label="Indice della pagina Help"
      >
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
          Vai subito a
        </p>
        <ol className="grid gap-2">
          {TOC_ITEMS.map((item, index) => (
            <li key={item.href} className="flex items-baseline gap-3 text-sm">
              <span className="w-6 shrink-0 text-xs font-bold text-primary">
                {String(index + 1).padStart(2, '0')}
              </span>
              <a
                href={item.href}
                className="hover:text-primary hover:underline"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-12 space-y-12">
        <section id="icone-domanda" className="scroll-mt-6 space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">
            {sectionLabel(1, 'Prima cosa da conoscere')}
          </p>
          <h2 className="border-b border-border pb-3 text-2xl font-semibold">
            Legenda icone e indicatori
          </h2>
          <p>
            Queste icone compaiono in molte parti dell&apos;app. Capire cosa
            significano ti fa risparmiare un sacco di tempo.
          </p>
          <p className="text-sm text-muted-foreground">
            Nota rapida: i concetti di <strong>Ambiguita</strong>,{' '}
            <strong>Difficolta</strong> e <strong>IRE+</strong> seguono la
            stessa logica spiegata in &quot;Consigli e Trucchi&quot;, ma qui
            trovi la versione operativa: cosa vedi e cosa succede quando
            tocchi/clicchi.
          </p>

          <div className="space-y-3 md:hidden">
            <article className="space-y-3 rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <IreIcon className="h-5 w-5 text-yellow-500" />
                <h3 className="font-medium">IRE / IRE+</h3>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Significato pratico
                </p>
                <p className="text-sm text-muted-foreground">
                  Indice di rischio errore: piu e alto, piu la domanda puo
                  metterti in difficolta.
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Cosa succede al click/tap
                </p>
                <p className="text-sm text-muted-foreground">
                  Nella card domanda apre/chiude il box &quot;Indice di
                  difficolta&quot; con valore dettagliato.
                </p>
              </div>
            </article>

            <article className="space-y-3 rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <AmbiguitaIcon className="h-5 w-5 text-orange-500" />
                <h3 className="font-medium">Ambiguita</h3>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Significato pratico
                </p>
                <p className="text-sm text-muted-foreground">
                  Quanto la frase e &quot;trappola linguistica&quot;.
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Cosa succede al click/tap
                </p>
                <p className="text-sm text-muted-foreground">
                  Apre/chiude i fattori di ambiguita (pill con trigger).
                </p>
              </div>
            </article>

            <article className="space-y-3 rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <DifficoltaIcon className="h-5 w-5 text-red-500" />
                <h3 className="font-medium">Difficolta</h3>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Significato pratico
                </p>
                <p className="text-sm text-muted-foreground">
                  Quanto il contenuto e tecnico/ostico.
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Cosa succede al click/tap
                </p>
                <p className="text-sm text-muted-foreground">
                  Apre/chiude i fattori di difficolta della domanda.
                </p>
              </div>
            </article>

            <article className="space-y-3 rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <OverallIcon className="h-5 w-5 text-teal-500" />
                <h3 className="font-medium">Statistiche domanda</h3>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Significato pratico
                </p>
                <p className="text-sm text-muted-foreground">
                  Riassunto dei tuoi tentativi su quella domanda.
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Cosa succede al click/tap
                </p>
                <p className="text-sm text-muted-foreground">
                  Apre un menu con totale risposte, corrette e sbagliate.
                </p>
              </div>
            </article>

            <article className="space-y-3 rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <SkullIcon className="h-5 w-5 text-amber-500" />
                <h3 className="font-medium">Skull</h3>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Significato pratico
                </p>
                <p className="text-sm text-muted-foreground">
                  Segnalibro &quot;questa domanda mi mette in crisi&quot;.
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Cosa succede al click/tap
                </p>
                <p className="text-sm text-muted-foreground">
                  Toggle immediato: la aggiungi o la rimuovi da Focus Skull.
                </p>
              </div>
            </article>

            <article className="space-y-3 rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <RandomIcon className="h-5 w-5 text-emerald-500" />
                <h3 className="font-medium">Esercitazione casuale</h3>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Significato pratico
                </p>
                <p className="text-sm text-muted-foreground">
                  Mischia le domande invece di seguire un ordine fisso.
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Cosa succede al click/tap
                </p>
                <p className="text-sm text-muted-foreground">
                  Switch ON/OFF nei filtri di Esercitazione Libera.
                </p>
              </div>
            </article>

            <article className="space-y-3 rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <OggiIcon className="h-5 w-5 text-teal-500" />
                  <SettimanaIcon className="h-5 w-5 text-teal-500" />
                  <MeseIcon className="h-5 w-5 text-teal-500" />
                  <AllIcon className="h-5 w-5 text-teal-500" />
                </div>
                <h3 className="font-medium">Filtri periodo</h3>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Significato pratico
                </p>
                <p className="text-sm text-muted-foreground">
                  Oggi / Settimana / Mese / Sempre per analizzare i dati nel
                  tempo.
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Cosa succede al click/tap
                </p>
                <p className="text-sm text-muted-foreground">
                  Cambia subito i numeri, i grafici e le liste della sezione.
                </p>
              </div>
            </article>

            <article className="space-y-3 rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <StarOffIcon className="h-5 w-5 text-yellow-500" />
                  <StarOnIcon className="h-5 w-5 text-yellow-500" />
                </div>
                <h3 className="font-medium">Segui / Seguito</h3>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Significato pratico
                </p>
                <p className="text-sm text-muted-foreground">
                  Gestione amicizia/seguiti nelle classifiche e nelle sfide.
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Cosa succede al click/tap
                </p>
                <p className="text-sm text-muted-foreground">
                  Cliccando aggiungi o rimuovi un utente dai seguiti; in Sfide
                  puoi filtrare solo i seguiti online.
                </p>
              </div>
            </article>

            <article className="space-y-3 rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <QuizIcon className="h-5 w-5 text-pink-500" />
                  <CorrectIcon className="h-5 w-5 text-green-500" />
                  <WrongIcon className="h-5 w-5 text-red-500" />
                </div>
                <h3 className="font-medium">Contatori quiz</h3>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Significato pratico
                </p>
                <p className="text-sm text-muted-foreground">
                  Totale quiz/risposte, giuste, sbagliate.
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Cosa succede al click/tap
                </p>
                <p className="text-sm text-muted-foreground">
                  Nei grafici, passando da pie a bar (tap/click sul grafico),
                  confronti la stessa metrica lungo la timeline.
                </p>
              </div>
            </article>
          </div>

          <div className="hidden overflow-x-auto rounded-2xl border border-border md:block">
            <table className="min-w-[880px] w-full text-left text-sm">
              <thead className="bg-muted text-foreground">
                <tr>
                  <th className="px-4 py-3 text-xs uppercase tracking-wide">
                    Icona
                  </th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wide">
                    Nome
                  </th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wide">
                    Significato pratico
                  </th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wide">
                    Cosa succede al click/tap
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-3">
                    <IreIcon className="h-5 w-5 text-yellow-500" />
                  </td>
                  <td className="px-4 py-3 font-medium">IRE / IRE+</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    Indice di rischio errore: piu e alto, piu la domanda puo
                    metterti in difficolta.
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    Nella card domanda apre/chiude il box &quot;Indice di
                    difficolta&quot; con valore dettagliato.
                  </td>
                </tr>
                <tr className="bg-muted/30">
                  <td className="px-4 py-3">
                    <AmbiguitaIcon className="h-5 w-5 text-orange-500" />
                  </td>
                  <td className="px-4 py-3 font-medium">Ambiguita</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    Quanto la frase e &quot;trappola linguistica&quot;.
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    Apre/chiude i fattori di ambiguita (pill con trigger).
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3">
                    <DifficoltaIcon className="h-5 w-5 text-red-500" />
                  </td>
                  <td className="px-4 py-3 font-medium">Difficolta</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    Quanto il contenuto e tecnico/ostico.
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    Apre/chiude i fattori di difficolta della domanda.
                  </td>
                </tr>
                <tr className="bg-muted/30">
                  <td className="px-4 py-3">
                    <OverallIcon className="h-5 w-5 text-teal-500" />
                  </td>
                  <td className="px-4 py-3 font-medium">Statistiche domanda</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    Riassunto dei tuoi tentativi su quella domanda.
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    Apre un menu con totale risposte, corrette e sbagliate.
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3">
                    <SkullIcon className="h-5 w-5 text-amber-500" />
                  </td>
                  <td className="px-4 py-3 font-medium">Skull</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    Segnalibro &quot;questa domanda mi mette in crisi&quot;.
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    Toggle immediato: la aggiungi o la rimuovi da Focus Skull.
                  </td>
                </tr>
                <tr className="bg-muted/30">
                  <td className="px-4 py-3">
                    <RandomIcon className="h-5 w-5 text-emerald-500" />
                  </td>
                  <td className="px-4 py-3 font-medium">
                    Esercitazione casuale
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    Mischia le domande invece di seguire un ordine fisso.
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    Switch ON/OFF nei filtri di Esercitazione Libera.
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <OggiIcon className="h-5 w-5 text-teal-500" />
                      <SettimanaIcon className="h-5 w-5 text-teal-500" />
                      <MeseIcon className="h-5 w-5 text-teal-500" />
                      <AllIcon className="h-5 w-5 text-teal-500" />
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">Filtri periodo</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    Oggi / Settimana / Mese / Sempre per analizzare i dati nel
                    tempo.
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    Cambia subito i numeri, i grafici e le liste della sezione.
                  </td>
                </tr>
                <tr className="bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <StarOffIcon className="h-5 w-5 text-yellow-500" />
                      <StarOnIcon className="h-5 w-5 text-yellow-500" />
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">Segui / Seguito</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    Gestione amicizia/seguiti nelle classifiche e nelle sfide.
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    Cliccando aggiungi o rimuovi un utente dai seguiti; in Sfide
                    puoi filtrare solo i seguiti online.
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <QuizIcon className="h-5 w-5 text-pink-500" />
                      <CorrectIcon className="h-5 w-5 text-green-500" />
                      <WrongIcon className="h-5 w-5 text-red-500" />
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">Contatori quiz</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    Totale quiz/risposte, giuste, sbagliate.
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    Nei grafici, passando da pie a bar (tap/click sul grafico),
                    confronti la stessa metrica lungo la timeline.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section id="esercitazione-libera" className="scroll-mt-6 space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">
            {sectionLabel(2, 'Allenamento smart')}
          </p>
          <h2 className="border-b border-border pb-3 text-2xl font-semibold">
            Esercitazione Libera
          </h2>
          <p>
            E la modalita perfetta per allenarti mirato: scegli filtri,
            rispondi, vedi subito se sei corretto e capisci dove stai
            migliorando.
          </p>
          <ul className="grid gap-2 text-sm text-muted-foreground">
            <li>
              <strong>Filtri:</strong> ricerca testo, IRE+, ambiguita,
              difficolta, ambito.
            </li>
            <li>
              <strong>Pannello filtri collassabile:</strong> tap su &quot;Filtra
              Domande&quot; per aprire/chiudere.
            </li>
            <li>
              <strong>Pill contatore:</strong> mostra quanti filtri sono attivi.
            </li>
            <li>
              <strong>Switch casuale:</strong> con icona random decidi se
              mescolare le domande.
            </li>
            <li>
              <strong>Bottone Filtri sticky:</strong> quando scorri in basso
              appare un pulsante flottante per tornare in alto ai filtri.
            </li>
            <li>
              <strong>Carica Altre:</strong> paginazione progressiva da 10 in
              10.
            </li>
          </ul>
          <p className="text-sm text-muted-foreground">
            Click importanti: toccando IRE/Ambiguita/Difficolta nella card
            domanda apri i dettagli; toccando Skull la salvi in Focus Skull.
          </p>
        </section>

        <section id="simulazione-quiz" className="scroll-mt-6 space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">
            {sectionLabel(3, 'Come all esame')}
          </p>
          <h2 className="border-b border-border pb-3 text-2xl font-semibold">
            Simulazione Quiz
          </h2>
          <p>
            Qui alleni il timing e la pressione reale: scegli il tipo di quiz,
            avvia, rispondi e ottieni un risultato finale chiaro.
          </p>
          <div className="grid gap-3 text-sm">
            <div className="rounded-lg border border-border bg-card p-4">
              <strong>Tipi quiz:</strong> Standard, Difficile, Ambiguo.
              Cliccando una card la selezioni (si evidenzia).
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <strong>Boost:</strong> puoi attivare Boost Errori e Boost Skull.
              Se non hai dati sufficienti, gli switch restano disabilitati.
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <strong>Durante il quiz:</strong> timer countdown, progresso
              domanda corrente, bottone Abbandona con conferma.
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <strong>Fine quiz:</strong> Promosso/Bocciato oppure Tempo
              Scaduto, statistiche complete e pulsante per rivedere tutto il
              quiz.
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Click chiave: su &quot;Rivedi Quiz Completo&quot; apri tutte le
            domande del tentativo, anche in modalita di sola revisione.
          </p>
        </section>

        <section id="errori-ricorrenti" className="scroll-mt-6 space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">
            {sectionLabel(4, 'Dove sbagli davvero')}
          </p>
          <h2 className="border-b border-border pb-3 text-2xl font-semibold">
            Errori Ricorrenti
          </h2>
          <p>
            Questa sezione ti mostra in modo molto concreto i tuoi pattern di
            errore: categorie critiche, domande ripetutamente sbagliate, skull e
            anche i tuoi punti forti.
          </p>
          <ul className="grid gap-2 text-sm text-muted-foreground">
            <li>
              <strong>Toolbar periodo:</strong> Oggi/Settimana/Mese/Sempre
              aggiorna tutto in tempo reale.
            </li>
            <li>
              <strong>Grafico metriche:</strong> clicca/tocca il grafico per
              cambiare modalita <em>Doughnut ↔ Timeline Bar</em>.
            </li>
            <li>
              <strong>Sezioni collapsibili:</strong> categorie, maggiori errori,
              skull, risposte esatte si aprono a richiesta (lazy loading).
            </li>
            <li>
              <strong>Card e link:</strong> clic su categoria manda a
              Esercitazione con filtro ambito gia impostato.
            </li>
            <li>
              <strong>Vedi Tutte / Carica Altre:</strong> espandi analisi
              complete con paginazione.
            </li>
          </ul>
          <p className="text-sm text-muted-foreground">
            Insight utile: qui i dati non sono solo numeri; ogni numero ha
            sempre un click successivo che ti porta all&apos;allenamento
            pratico.
          </p>
        </section>

        <section id="statistiche-quiz" className="scroll-mt-6 space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">
            {sectionLabel(5, 'Prestazioni globali')}
          </p>
          <h2 className="border-b border-border pb-3 text-2xl font-semibold">
            Statistiche Quiz
          </h2>
          <p>
            Qui analizzi il rendimento complessivo dei quiz svolti: quanti,
            quanti promossi, quanti bocciati e come cambia il trend nel tempo.
          </p>
          <div className="space-y-3 md:hidden">
            <article className="space-y-2 rounded-xl border border-border bg-card p-4">
              <h3 className="font-medium">Grafico principale</h3>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Cosa mostra
                </p>
                <p className="text-sm text-muted-foreground">
                  Anelli con quiz svolti/promossi/bocciati o barre timeline.
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Interazione
                </p>
                <p className="text-sm text-muted-foreground">
                  Tap/click sul grafico per switch di modalita.
                </p>
              </div>
            </article>

            <article className="space-y-2 rounded-xl border border-border bg-card p-4">
              <h3 className="font-medium">Storico quiz</h3>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Cosa mostra
                </p>
                <p className="text-sm text-muted-foreground">
                  Data, esito, errori, indicatori medi (IRE, difficolta,
                  ambiguita).
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Interazione
                </p>
                <p className="text-sm text-muted-foreground">
                  Click su una riga/card per aprire la revisione di quel quiz.
                </p>
              </div>
            </article>

            <article className="space-y-2 rounded-xl border border-border bg-card p-4">
              <h3 className="font-medium">Infinite scroll</h3>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Cosa mostra
                </p>
                <p className="text-sm text-muted-foreground">
                  Caricamento graduale dello storico lungo.
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Interazione
                </p>
                <p className="text-sm text-muted-foreground">
                  Scorrendo in basso parte il caricamento automatico.
                </p>
              </div>
            </article>
          </div>

          <div className="hidden overflow-x-auto rounded-2xl border border-border md:block">
            <table className="min-w-[740px] w-full text-left text-sm">
              <thead className="bg-muted text-foreground">
                <tr>
                  <th className="px-4 py-3 text-xs uppercase tracking-wide">
                    Elemento
                  </th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wide">
                    Cosa mostra
                  </th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wide">
                    Interazione
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-3 font-medium">Grafico principale</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    Anelli con quiz svolti/promossi/bocciati o barre timeline.
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    Tap/click sul grafico per switch di modalita.
                  </td>
                </tr>
                <tr className="bg-muted/30">
                  <td className="px-4 py-3 font-medium">Storico quiz</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    Data, esito, errori, indicatori medi (IRE, difficolta,
                    ambiguita).
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    Click su una riga/card per aprire la revisione di quel quiz.
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium">Infinite scroll</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    Caricamento graduale dello storico lungo.
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    Scorrendo in basso parte il caricamento automatico.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section id="classifiche" className="scroll-mt-6 space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">
            {sectionLabel(6, 'Confronto con gli altri')}
          </p>
          <h2 className="border-b border-border pb-3 text-2xl font-semibold">
            Classifiche
          </h2>
          <p>
            Se vuoi capire dove sei rispetto agli altri utenti, questa e la tua
            dashboard: risultati quiz, precisione risposte e rete seguiti.
          </p>
          <ul className="grid gap-2 text-sm text-muted-foreground">
            <li>
              <strong>Switch Quiz/Risposte:</strong> cambia il tipo di
              classifica.
            </li>
            <li>
              <strong>Switch Generale/Seguiti:</strong> filtra tutti gli utenti
              o solo quelli che segui.
            </li>
            <li>
              <strong>Filtro periodo:</strong> stessa logica di
              Oggi/Settimana/Mese/Sempre.
            </li>
            <li>
              <strong>Ordinamento mobile:</strong> scegli metrica e direzione
              asc/desc.
            </li>
            <li>
              <strong>Stella follow:</strong> clic su Segui/Seguito per gestire
              l&apos;amicizia/seguiti.
            </li>
          </ul>
        </section>

        <section id="sfide" className="scroll-mt-6 space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">
            {sectionLabel(7, 'Modalita versus')}
          </p>
          <h2 className="border-b border-border pb-3 text-2xl font-semibold">
            Sfide
          </h2>
          <p>
            In Sfide giochi 1v1 in tempo reale. E la parte piu competitiva
            dell&apos;app: online users, invito, timer condiviso e risultato
            testa a testa.
          </p>

          <div className="grid gap-3 text-sm">
            <div className="rounded-lg border border-border bg-card p-4">
              <strong>Badge utenti online:</strong> nel menu principale compare
              sul bottone Sfide se c&apos;e almeno 1 utente online (escluso te).
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <strong>Amicizia/seguiti:</strong> puoi filtrare solo i seguiti
              online con la pill stella.
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <strong>Invio/Ricezione sfida:</strong> dialog con conto alla
              rovescia (30s), accetta/rifiuta, timeout automatico.
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <strong>Temi/Tier sfida:</strong> Speed, Medium, Half Quiz, Full
              Quiz (domande e durata diverse).
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <strong>Timer e progresso live:</strong> timer sincronizzato su
              start comune + barra avanzamento avversario in real-time.
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <strong>Risultati:</strong> vittoria/sconfitta/pareggio, confronto
              punteggi e tempi, rematch, revisione e storico.
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Click tipici: &quot;Sfida&quot; apre il dialog di invio; &quot;Sfida
            di Nuovo&quot; rilancia una rematch verso lo stesso avversario;
            cliccando una riga nello storico apri il dettaglio della sfida/quiz.
          </p>
        </section>

        <section id="chiusura" className="scroll-mt-6 space-y-4">
          <h2 className="border-b border-border pb-3 text-2xl font-semibold">
            Ultimo consiglio
          </h2>
          <p>
            Se una sezione ti sembra &quot;troppo tecnica&quot;, parti sempre da
            due domande: <strong>cosa posso cliccare?</strong> e{' '}
            <strong>cosa succede dopo?</strong>. In Patentify quasi tutto e
            pensato per portarti dal dato all&apos;allenamento in 1-2 tap.
          </p>
          <p className="text-sm">
            <a
              href="#top"
              className="text-muted-foreground hover:text-primary hover:underline"
            >
              ↑ Torna all&apos;inizio
            </a>
          </p>
        </section>
      </div>
    </article>
  );
}
