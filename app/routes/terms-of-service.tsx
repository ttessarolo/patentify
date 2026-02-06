import type { JSX } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/terms-of-service')({
  component: TermsOfService,
});

function TermsOfService(): JSX.Element {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Torna alla home
        </Link>

        <h1 className="mb-8 text-3xl font-bold text-foreground">
          Termini e Condizioni di Servizio
        </h1>

        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-sm">
            Ultimo aggiornamento: {new Date().toLocaleDateString('it-IT')}
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              1. Accettazione dei Termini
            </h2>
            <p>
              Accedendo e utilizzando Patentify, accetti di essere vincolato dai
              presenti Termini e Condizioni di Servizio. Se non accetti questi
              termini, ti preghiamo di non utilizzare il servizio. L&apos;utilizzo
              continuato del servizio costituisce accettazione di eventuali
              modifiche ai presenti termini.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              2. Descrizione del Servizio
            </h2>
            <p>
              Patentify è una piattaforma educativa che offre strumenti per la
              preparazione ai quiz per il conseguimento della patente di guida.
              Il servizio include:
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Quiz di esercitazione su domande ministeriali</li>
              <li>Simulazioni d&apos;esame in condizioni realistiche</li>
              <li>Statistiche personalizzate sui progressi</li>
              <li>Analisi degli errori ricorrenti</li>
              <li>Consigli e suggerimenti per l&apos;apprendimento</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              3. Registrazione e Account
            </h2>
            <p>
              Per utilizzare Patentify è necessario creare un account. Ti impegni
              a fornire informazioni accurate e complete durante la registrazione
              e a mantenere aggiornati i tuoi dati. Sei responsabile della
              riservatezza delle tue credenziali di accesso e di tutte le attività
              che avvengono tramite il tuo account.
            </p>
            <p>
              Ci riserviamo il diritto di sospendere o terminare account che
              violino questi termini o che risultino inattivi per un periodo
              prolungato.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              4. Utilizzo Consentito
            </h2>
            <p>Ti impegni a utilizzare Patentify esclusivamente per:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Scopi personali e non commerciali</li>
              <li>La preparazione ai quiz per la patente di guida</li>
              <li>Modalità conformi alle leggi vigenti</li>
            </ul>
            <p>È espressamente vietato:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                Condividere le proprie credenziali con terzi o utilizzare account
                altrui
              </li>
              <li>
                Tentare di accedere a parti del sistema non autorizzate
              </li>
              <li>
                Copiare, modificare, distribuire o rivendere i contenuti della
                piattaforma
              </li>
              <li>
                Utilizzare bot, scraper o altri strumenti automatizzati
              </li>
              <li>
                Interferire con il funzionamento del servizio
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              5. Proprietà Intellettuale
            </h2>
            <p>
              Tutti i contenuti presenti su Patentify, inclusi testi, grafica,
              loghi, icone, immagini, software e la loro disposizione, sono di
              proprietà esclusiva di Patentify o dei suoi licenzianti e sono
              protetti dalle leggi sul diritto d&apos;autore e sulla proprietà
              intellettuale.
            </p>
            <p>
              Le domande dei quiz sono basate sul materiale ministeriale ufficiale
              per l&apos;esame di teoria della patente di guida, elaborato e
              organizzato in forma didattica da Patentify.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              6. Limitazione di Responsabilità
            </h2>
            <p>
              Patentify è fornito &quot;così com&apos;è&quot; senza garanzie di
              alcun tipo. Non garantiamo che il servizio sarà sempre disponibile,
              privo di errori o sicuro.
            </p>
            <p>
              <strong>Importante:</strong> Patentify è uno strumento di supporto
              allo studio e non sostituisce la preparazione tradizionale né
              garantisce il superamento dell&apos;esame di teoria. Il superamento
              dell&apos;esame dipende esclusivamente dalla preparazione
              individuale del candidato.
            </p>
            <p>
              In nessun caso saremo responsabili per danni diretti, indiretti,
              incidentali, consequenziali o punitivi derivanti dall&apos;utilizzo
              o dall&apos;impossibilità di utilizzare il servizio.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              7. Disponibilità del Servizio
            </h2>
            <p>
              Ci impegniamo a garantire la massima disponibilità del servizio, ma
              non possiamo garantire un funzionamento ininterrotto. Potremmo
              sospendere temporaneamente il servizio per manutenzione,
              aggiornamenti o cause di forza maggiore, cercando di fornire
              preavviso quando possibile.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              8. Modifiche al Servizio e ai Termini
            </h2>
            <p>
              Ci riserviamo il diritto di modificare, sospendere o interrompere
              qualsiasi aspetto del servizio in qualsiasi momento. Possiamo inoltre
              aggiornare questi Termini periodicamente. Le modifiche significative
              saranno comunicate tramite email o avviso sulla piattaforma.
              L&apos;uso continuato del servizio dopo tali modifiche costituisce
              accettazione dei nuovi termini.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              9. Risoluzione
            </h2>
            <p>
              Puoi cancellare il tuo account in qualsiasi momento attraverso le
              impostazioni del profilo o contattandoci. Ci riserviamo il diritto
              di sospendere o terminare il tuo account in caso di violazione di
              questi termini, con o senza preavviso.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              10. Legge Applicabile e Foro Competente
            </h2>
            <p>
              I presenti Termini sono regolati dalla legge italiana. Per qualsiasi
              controversia derivante dall&apos;utilizzo del servizio sarà
              competente in via esclusiva il Foro di Milano, salvo diversa
              disposizione di legge inderogabile a tutela del consumatore.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              11. Contatti
            </h2>
            <p>
              Per qualsiasi domanda relativa a questi Termini e Condizioni, puoi
              contattarci a: support@patentify.app
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
