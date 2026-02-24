import type { JSX } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { getValueColorClass } from '~/commons';

export const Route = createFileRoute('/main/consigli-e-trucchi/')({
  component: ConsigliETrucchiIndex,
});

const TOC_ITEMS = [
  { href: '#perche-sbagliamo', label: 'Perché si sbaglia tanto al quiz della patente?' },
  {
    href: '#ambiguita',
    label: 'Il livello di ambiguità: le "trappole linguistiche"',
  },
  {
    href: '#trigger',
    label: "I segnali d'allarme (trigger): la lista da tenere a mente",
  },
  {
    href: '#difficolta',
    label: 'Il livello di difficoltà: quando la materia è ostica',
  },
  {
    href: '#livelli-difficolta',
    label: 'I cinque livelli di difficoltà, spiegati bene',
  },
  {
    href: '#ire',
    label: 'Il punteggio IRE+: come il sistema sceglie le domande per te',
  },
  {
    href: '#vademecum',
    label: "Vademecum: le regole d'oro per non cadere nei tranelli",
  },
] as const;

const TRIGGER_ROWS = [
  {
    trigger: 'Assoluti',
    effect:
      'Rendono la frase vera "senza eccezioni". Nella realtà quasi tutto ha eccezioni, quindi la frase è spesso falsa.',
    badges: [
      'sempre',
      'mai',
      'solo',
      'soltanto',
      'in ogni caso',
      'chiunque',
      'tutti',
      'comunque',
    ],
  },
  {
    trigger: 'Doppia negazione',
    effect:
      'Due "non" si annullano e la frase diventa positiva. Molti leggono di fretta e colgono solo il senso negativo.',
    badges: ['non è vietato non…', 'non è mai falso che…'],
  },
  {
    trigger: 'Obbligo annacquato',
    effect:
      'Un obbligo di legge viene presentato come semplice consiglio. La frase risulta falsa perché la norma è imperativa.',
    badges: ['è consigliabile', 'è opportuno', 'dovrebbe', 'è raccomandabile'],
  },
  {
    trigger: 'Doppie affermazioni',
    effect:
      'La frase unisce due condizioni con "e" o "anche". Basta che una sola sia sbagliata per rendere falsa l’intera domanda.',
    badges: ['e anche', 'sia… sia', 'oltre a… anche'],
  },
  {
    trigger: 'Eccezioni ignorate',
    effect:
      'La domanda enuncia una regola generale come assoluta, ignorando che esistono eccezioni previste dal Codice.',
    badges: ['in vicinanza di qualsiasi incrocio', 'in tutti i casi'],
  },
  {
    trigger: 'Termini tecnici-trappola',
    effect:
      'Parole dal suono tecnico usate in modo improprio o che sembrano sinonimi ma non lo sono nel Codice della Strada.',
    badges: ['corsia vs carreggiata', 'sosta vs fermata', 'autovettura vs autoveicolo'],
  },
  {
    trigger: '"Ovvero"',
    effect:
      'Nel linguaggio comune significa "cioè", ma nel quiz ministeriale significa oppure. Cambia tutto.',
    badges: ['ovvero'],
  },
  {
    trigger: 'Categorie speciali',
    effect:
      'La domanda parla di neopatentati, tricicli, veicoli d’epoca, ecc. con regole diverse da quelle generali.',
    badges: ['neopatentati', 'tricicli a motore', 'servizio di linea'],
  },
] as const;

const DIFFICULTY_LEVELS = [
  {
    level: 1,
    title: 'Facilissimo',
    description:
      "Domanda breve, nessun termine tecnico, risposta di buon senso. Chi ha studiato anche solo un po' non la sbaglia.",
  },
  {
    level: 2,
    title: 'Facile',
    description:
      "Qualche parola specifica, ma tutto sommato nel programma base. Chi è attento non ci ha problemi.",
  },
  {
    level: 3,
    title: 'Medio',
    description:
      'Richiede conoscenza precisa di una norma o un dato numerico. Un candidato preparato la risolve, ma senza studio è rischiosa.',
  },
  {
    level: 4,
    title: 'Difficile',
    description:
      'Contenuto tecnico approfondito, eccezioni normative o combinazione di più condizioni. Errori attesi: oltre il 50%.',
  },
  {
    level: 5,
    title: 'Molto difficile',
    description:
      'Le domande più temute: contenuto complesso + formulazione insidiosa + eccezione non intuitiva. Storicamente oltre il 70-80% di errori.',
  },
] as const;

const IRE_ROWS = [
  { level: 1, range: 'Sotto 3', text: 'Domanda risolvibile con studio base o semplice buon senso.' },
  { level: 2, range: '3 – 3,99', text: 'Rischio moderato. Vale la pena rileggere con attenzione.' },
  { level: 3, range: '4 – 4,49', text: 'Rischio alto. Studia bene questo argomento prima dell’esame.' },
  {
    level: 4,
    range: '4,5 – 4,99',
    text: 'Rischio molto alto. Priorità di studio: allenati finché non la sbagli più.',
  },
  {
    level: 5,
    range: '5 e oltre',
    text: 'Domanda altamente selettiva. Tra le più sbagliate in assoluto. Deve diventare automatica.',
  },
] as const;

function sectionLabel(index: number, text: string): string {
  const prefix = String(index).padStart(2, '0');
  return `${prefix} — ${text}`;
}

function ConsigliETrucchiIndex(): JSX.Element {
  return (
    <article className="mx-auto max-w-4xl px-4 pb-20 md:px-6">
      <div className="space-y-3">
        <header id="top" className="space-y-4 pb-1 pt-8 md:pt-12">
          <h1 className="text-center text-2xl font-bold sm:text-left">Consigli e Trucchi</h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Tutto quello che devi sapere per capire come sono classificate le domande — e
            soprattutto per non farti fregare dai trabocchetti.
          </p>
        </header>

        <nav
          className="rounded-2xl border border-border bg-card p-5 md:p-7"
          aria-label="Indice della pagina"
        >
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
            In questa pagina
          </p>
          <ol className="grid gap-2">
            {TOC_ITEMS.map((item, index) => (
              <li key={item.href} className="flex items-baseline gap-3 text-sm">
                <span className="w-6 shrink-0 text-xs font-bold text-primary">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <a href={item.href} className="hover:text-primary hover:underline">
                  {item.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </div>

      <div className="mt-12 space-y-12">
      <section id="perche-sbagliamo" className="scroll-mt-6 space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">
          {sectionLabel(1, 'Intro')}
        </p>
        <h2 className="border-b border-border pb-3 text-2xl font-semibold">
          Perché si sbaglia tanto al quiz della patente?
        </h2>
        <p>
          Hai mai risposto "Vero" a una domanda convintissimo, e poi scoperto che era
          "Falso"? Non sei l’unico — alcune domande del Ministero vengono sbagliate da più
          del <strong>80% dei candidati</strong>. E spesso non è colpa tua: è colpa di{' '}
          <em>come è scritta la domanda</em>.
        </p>
        <p>
          Il quiz della patente italiana ha due tipi di difficoltà. La prima è quella che ti
          aspetti: devi conoscere le norme, i segnali, la meccanica. La seconda invece è più
          subdola: alcune domande sono formulate in modo che anche chi sa la risposta giusta
          possa sbagliare, perché la frase stessa è costruita per confonderti.
        </p>
        <p>
          Il nostro sistema analizza ogni domanda su questi due livelli separati —{' '}
          <strong>quanto è difficile come contenuto</strong> e{' '}
          <strong>quanto è ambigua come formulazione</strong> — e combina i due punteggi per
          darti un’idea chiara di quanto devi stare attento.
        </p>
      </section>

      <section id="ambiguita" className="scroll-mt-6 space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">
          {sectionLabel(2, 'Primo livello di analisi')}
        </p>
        <h2 className="border-b border-border pb-3 text-2xl font-semibold">
          Il livello di ambiguità: le "trappole linguistiche"
        </h2>
        <p>
          L’ambiguità misura quanto la <em>formulazione</em> della domanda può ingannarti,
          indipendentemente da quanto conosci l’argomento.
        </p>
        <p>
          Il livello va da <strong>1</strong> (nessuna trappola, domanda chiara) a{' '}
          <strong>5</strong> (domanda-rompicapo).
        </p>
        <h3 className="pt-2 text-lg italic">Livello 1 — Cristallino</h3>
        <p>
          Domanda dritta, senza trucchi. La leggi una volta e capisci esattamente cosa ti
          viene chiesto. Basta conoscere la regola.
        </p>
        <div className="rounded-2xl border border-green-200 bg-green-50/60 p-5 dark:border-green-500/40 dark:bg-green-500/10">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-green-700 dark:text-green-300">
            ✓ Esempio livello 1 — Risposta: Vero
          </p>
          <p className="mb-2 italic">«Il segnale di STOP impone l&apos;arresto del veicolo.»</p>
          <p className="text-sm text-muted-foreground">
            Nessun inganno. Se sai cos&apos;è lo STOP, sai rispondere.{' '}
            <strong className={getValueColorClass(1)}>Ambiguità: 1/5.</strong>
          </p>
        </div>
        <h3 className="pt-2 text-lg italic">Livello 2 — Leggera insidia</h3>
        <p>
          C&apos;è qualche piccola parola-spia, ma chi è attento la nota subito. Di solito
          basta rileggere la domanda con calma.
        </p>
        <h3 className="pt-2 text-lg italic">Livello 3 — Richiede attenzione</h3>
        <p>
          Un trabocchetto vero e proprio. Devi fermarti e ragionare, perché la frase ti
          spinge verso la risposta sbagliata.
        </p>
        <div className="rounded-2xl border border-red-200 bg-red-50/60 p-5 dark:border-red-500/40 dark:bg-red-500/10">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-red-700 dark:text-red-300">
            ✗ Esempio livello 3 — Risposta: Falso
          </p>
          <p className="mb-2 italic">
            «Il conducente deve moderare la velocità{' '}
            <span className="rounded bg-amber-200 px-1 text-amber-950">solo</span> in presenza di nebbia
            fitta.»
          </p>
          <p className="text-sm text-muted-foreground">
            La parola <strong>"solo"</strong> è il tranello: la velocità va adeguata anche in
            caso di pioggia, strade scivolose e traffico intenso.{' '}
            <strong className={getValueColorClass(3)}>Ambiguità: 3/5.</strong>
          </p>
        </div>
        <h3 className="pt-2 text-lg italic">Livello 4 — Alta difficoltà interpretativa</h3>
        <p>
          La domanda combina più elementi confondenti: assoluti, negazioni o dettagli
          normativi insidiosi.
        </p>
        <div className="rounded-2xl border border-red-200 bg-red-50/60 p-5 dark:border-red-500/40 dark:bg-red-500/10">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-red-700 dark:text-red-300">
            ✗ Esempio livello 4 — Risposta: Falso
          </p>
          <p className="mb-2 italic">
            «Fuori dei centri abitati, di notte, quando mancano le luci posteriori,{' '}
            <span className="rounded bg-amber-200 px-1 text-amber-950">è consigliabile</span>{' '}
            presegnalare il
            veicolo fermo con il triangolo.»
          </p>
          <p className="text-sm text-muted-foreground">
            Il triangolo non è facoltativo ma obbligatorio: "è consigliabile" annacqua un
            obbligo di legge. <strong className={getValueColorClass(4)}>Ambiguità: 4/5.</strong>
          </p>
        </div>
        <h3 className="pt-2 text-lg italic">Livello 5 — Rompicapo</h3>
        <p>
          Tre o più elementi fuorvianti nella stessa frase. Va scomposta parola per parola.
        </p>
        <div className="rounded-2xl border border-red-200 bg-red-50/60 p-5 dark:border-red-500/40 dark:bg-red-500/10">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-red-700 dark:text-red-300">
            ✗ Esempio livello 5 — Risposta: Falso
          </p>
          <p className="mb-2 italic">
            «Sulle autostrade e strade extraurbane principali{' '}
            <span className="rounded bg-amber-200 px-1 text-amber-950">è consigliabile</span>{' '}
            evitare la
            circolazione di veicoli a tenuta non stagna e con carico scoperto, se
            trasportano materiali che possono disperdersi.»
          </p>
          <p className="text-sm text-muted-foreground">
            La norma parla di divieto assoluto, non di raccomandazione.{' '}
            <strong className={getValueColorClass(5)}>Ambiguità: 5/5.</strong>
          </p>
        </div>
      </section>

      <section id="trigger" className="scroll-mt-6 space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">
          {sectionLabel(3, "Segnali d'allarme")}
        </p>
        <h2 className="border-b border-border pb-3 text-2xl font-semibold">
          I segnali d&apos;allarme (trigger): la lista da tenere a mente
        </h2>
        <p>
          Alcune parole ed espressioni ricorrono sistematicamente nelle domande trabocchetto.
          Quando le vedi, rallenta e rileggi tutto con occhio critico.
        </p>
        <div className="space-y-3 md:hidden">
          {TRIGGER_ROWS.map((row) => (
            <article
              key={row.trigger}
              className="space-y-3 rounded-xl border border-border bg-card p-4"
            >
              <h3 className="font-semibold text-primary">{row.trigger}</h3>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Cosa succede
                </p>
                <p className="text-sm text-muted-foreground">{row.effect}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Parole tipiche
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {row.badges.map((badge) => (
                    <span
                      key={badge}
                      className="rounded border border-border bg-muted px-2 py-0.5 text-xs text-foreground"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="hidden overflow-x-auto rounded-2xl border border-border md:block">
          <table className="min-w-[760px] w-full text-left text-sm">
            <thead className="bg-muted text-foreground">
              <tr>
                <th className="px-4 py-3 text-xs uppercase tracking-wide">Trigger</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wide">Cosa succede</th>
                <th className="px-4 py-3 text-xs uppercase tracking-wide">Parole tipiche</th>
              </tr>
            </thead>
            <tbody>
              {TRIGGER_ROWS.map((row, index) => (
                <tr key={row.trigger} className={index % 2 === 1 ? 'bg-muted/40' : ''}>
                  <td className="px-4 py-3 align-top font-semibold text-primary">
                    {row.trigger}
                  </td>
                  <td className="px-4 py-3 align-top text-muted-foreground">{row.effect}</td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-wrap gap-1.5">
                      {row.badges.map((badge) => (
                        <span
                          key={badge}
                          className="rounded border border-border bg-muted px-2 py-0.5 text-xs text-foreground"
                        >
                          {badge}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="rounded-2xl border border-amber-300 bg-amber-50/80 p-5 text-sm dark:border-amber-500/40 dark:bg-amber-500/10">
          <strong>💡 Trucco pratico</strong>
          <p className="mt-1 text-muted-foreground">
            Quando vedi uno di questi trigger, fermati e chiediti: "La legge lo impone davvero
            in modo assoluto? Ci sono eccezioni? Sto leggendo tutte le parole?".
          </p>
        </div>
        <h3 className="pt-2 text-lg italic">Esempi classici, uno per tipo</h3>
        <div className="rounded-2xl border border-red-200 bg-red-50/60 p-5 dark:border-red-500/40 dark:bg-red-500/10">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-red-700 dark:text-red-300">
            Trigger: Termini tecnici — Risposta: Falso
          </p>
          <p className="mb-2 italic">
            «La sosta,{' '}
            <span className="rounded bg-amber-200 px-1 text-amber-950">ed anche la fermata</span>,
            sono vietate negli spazi destinati a servizi di emergenza.»
          </p>
          <p className="text-sm text-muted-foreground">
            Sosta e fermata non sono sinonimi: la frase li accorpa come equivalenti e induce
            all&apos;errore.
          </p>
        </div>
      </section>

      <section id="difficolta" className="scroll-mt-6 space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">
          {sectionLabel(4, 'Secondo livello di analisi')}
        </p>
        <h2 className="border-b border-border pb-3 text-2xl font-semibold">
          Il livello di difficoltà: quando la materia è ostica
        </h2>
        <p>
          Separato dall&apos;ambiguità, il <strong>livello di difficoltà</strong> misura quanto
          devi sapere per rispondere correttamente — indipendentemente da come è scritta la
          domanda.
        </p>
        <ul className="grid gap-3">
          <li className="rounded-lg border border-border bg-card p-4 text-sm">
            <strong>📚 Lessico tecnico</strong>
            <p className="mt-1 text-muted-foreground">
              Termini come coefficiente di aderenza, massa complessiva a pieno carico,
              aquaplaning richiedono definizioni precise.
            </p>
          </li>
          <li className="rounded-lg border border-border bg-card p-4 text-sm">
            <strong>🔢 Dati da memorizzare</strong>
            <p className="mt-1 text-muted-foreground">
              Limiti di velocità, tassi alcolemici, distanze minime, soglie in punti o in
              euro.
            </p>
          </li>
          <li className="rounded-lg border border-border bg-card p-4 text-sm">
            <strong>⚠️ Eccezioni alle regole</strong>
            <p className="mt-1 text-muted-foreground">
              Alcune domande testano proprio i casi-limite che contraddicono la regola
              generale.
            </p>
          </li>
          <li className="rounded-lg border border-border bg-card p-4 text-sm">
            <strong>🔀 Scenari multi-condizione</strong>
            <p className="mt-1 text-muted-foreground">
              Valutare più variabili contemporaneamente aumenta il carico mentale.
            </p>
          </li>
          <li className="rounded-lg border border-border bg-card p-4 text-sm">
            <strong>🖼️ Interpretazione di immagini</strong>
            <p className="mt-1 text-muted-foreground">
              Domande con intersezioni, segnali o situazioni di traffico da leggere
              visivamente.
            </p>
          </li>
        </ul>
      </section>

      <section id="livelli-difficolta" className="scroll-mt-6 space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">
          {sectionLabel(5, 'La scala')}
        </p>
        <h2 className="border-b border-border pb-3 text-2xl font-semibold">
          I cinque livelli di difficoltà, spiegati bene
        </h2>
        <div className="grid gap-3">
          {DIFFICULTY_LEVELS.map((item) => (
            <article
              key={item.level}
              className="grid grid-cols-[52px_1fr] items-start gap-4 rounded-2xl border border-border bg-card p-4"
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full border-2 bg-muted/30 text-lg font-extrabold ${getValueColorClass(item.level)} border-current`}
              >
                {item.level}
              </div>
              <div className="space-y-1">
                <h3 className={`text-sm font-bold ${getValueColorClass(item.level)}`}>
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50/60 p-5 dark:border-red-500/40 dark:bg-red-500/10">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-red-700 dark:text-red-300">
            ✗ Esempio livello 5 — Risposta: Falso
          </p>
          <p className="mb-2 italic">
            «Durante le operazioni di traino di un veicolo in avaria, il veicolo trainato{' '}
            <span className="rounded bg-rose-200 px-1 text-rose-950">
              deve mantenere accese le luci posteriori
            </span>{' '}
            in mancanza di altra idonea segnalazione.»
          </p>
          <p className="text-sm text-muted-foreground">
            Formula plausibile ma incompleta: le sole luci posteriori non bastano.{' '}
            <strong>Difficoltà 5 + Ambiguità 4</strong>, domanda altamente selettiva.
          </p>
        </div>
      </section>

      <section id="ire" className="scroll-mt-6 space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">
          {sectionLabel(6, 'Il punteggio combinato')}
        </p>
        <h2 className="border-b border-border pb-3 text-2xl font-semibold">
          Il punteggio IRE+: come il sistema sceglie le domande per te
        </h2>
        <p>
          Ambiguità e difficoltà sono due cose diverse. Il sistema le combina in un unico
          valore: <strong>IRE+</strong> (Indice di Rischio di Errore Potenziato).
        </p>
        <div className="rounded-2xl border border-border border-l-4 border-l-foreground bg-card p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Interpretazione del punteggio IRE+
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Il punteggio può andare indicativamente da 1 a 6. Più è alto, più la domanda è
            selettiva.
          </p>
          <div className="mt-4 space-y-3 md:hidden">
            {IRE_ROWS.map((row) => (
              <article
                key={row.range}
                className="space-y-2 rounded-xl border border-border bg-card p-4"
              >
                <h3 className="font-semibold">
                  <span
                    className={`mr-2 inline-block h-2.5 w-2.5 rounded-full align-middle ${getValueColorClass(row.level)} bg-current`}
                    aria-hidden="true"
                  />
                  <span className={getValueColorClass(row.level)}>{row.range}</span>
                </h3>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Cosa significa
                  </p>
                  <p className="text-sm text-muted-foreground">{row.text}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-4 hidden overflow-x-auto md:block">
            <table className="min-w-[520px] w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2">Punteggio</th>
                  <th className="px-3 py-2">Cosa significa</th>
                </tr>
              </thead>
              <tbody>
                {IRE_ROWS.map((row) => (
                  <tr key={row.range} className="border-b border-border last:border-b-0">
                    <td className="px-3 py-2">
                      <span
                        className={`mr-2 inline-block h-2.5 w-2.5 rounded-full align-middle ${getValueColorClass(row.level)} bg-current`}
                        aria-hidden="true"
                      />
                      <span className={getValueColorClass(row.level)}>{row.range}</span>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{row.text}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section id="vademecum" className="scroll-mt-6 space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">
          {sectionLabel(7, 'Il tuo kit di sopravvivenza')}
        </p>
        <h2 className="border-b border-border pb-3 text-2xl font-semibold">
          Vademecum: le regole d&apos;oro per non cadere nei tranelli
        </h2>
        <p>Quando vedi questi segnali, alza l&apos;antifurto:</p>
        <ul className="grid gap-2">
          <li className="rounded-r-lg border-l-4 border-l-primary bg-card p-3 text-sm">
            <strong>"è consigliabile", "è opportuno", "dovrebbe"</strong> → chiedi sempre se
            è un obbligo di legge o un vero consiglio.
          </li>
          <li className="rounded-r-lg border-l-4 border-l-primary bg-card p-3 text-sm">
            <strong>"sempre", "mai", "solo", "in ogni caso"</strong> → cerca eccezioni.
          </li>
          <li className="rounded-r-lg border-l-4 border-l-primary bg-card p-3 text-sm">
            <strong>"e anche", "sia… sia"</strong> → valuta ogni parte separatamente.
          </li>
          <li className="rounded-r-lg border-l-4 border-l-primary bg-card p-3 text-sm">
            <strong>Doppia negazione</strong> → riscrivi la frase in positivo prima di
            decidere.
          </li>
          <li className="rounded-r-lg border-l-4 border-l-primary bg-card p-3 text-sm">
            <strong>"ovvero"</strong> → nel quiz ministeriale spesso significa "oppure".
          </li>
        </ul>
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-5 dark:border-indigo-500/40 dark:bg-indigo-500/10">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-indigo-700 dark:text-indigo-300">
            Coppie di termini che sembrano sinonimi ma non lo sono
          </p>
          <ul className="grid gap-2 text-sm">
            <li>
              <strong>Sosta</strong> ≠ <strong>Fermata</strong>
            </li>
            <li>
              <strong>Carreggiata</strong> ≠ <strong>Corsia</strong>
            </li>
            <li>
              <strong>Autovettura</strong> ≠ <strong>Autoveicolo</strong>
            </li>
            <li>
              <strong>Consigliabile</strong> ≠ <strong>Obbligatorio</strong>
            </li>
          </ul>
        </div>
        <p className="text-sm text-muted-foreground">
          Le domande più sbagliate hanno una caratteristica comune: sembrano vere. Se una
          frase ti sembra ovvia, fermati e cerca il trabocchetto.
        </p>
        <div className="rounded-2xl border border-amber-300 bg-amber-50/80 p-5 text-sm dark:border-amber-500/40 dark:bg-amber-500/10">
          <strong>🎯 La regola numero uno</strong>
          <p className="mt-1 text-muted-foreground">
            Leggi sempre tutta la frase: il trabocchetto sta spesso in una sola parola, a metà
            o in fondo al periodo.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          Ora che conosci i meccanismi, torna alle sessioni di quiz e allenati: molte domande
          che sembravano impossibili diventano gestibili quando sai già dove guardare.
        </p>
        <p className="text-sm">
          <a href="#top" className="text-muted-foreground hover:text-primary hover:underline">
            ↑ Torna all&apos;inizio
          </a>
        </p>
      </section>
      </div>
    </article>
  );
}
