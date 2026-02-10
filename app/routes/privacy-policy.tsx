import type { JSX } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/privacy-policy')({
  component: PrivacyPolicy,
});

function PrivacyPolicy(): JSX.Element {
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
          Informativa sulla Privacy
        </h1>

        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-sm">
            Ultimo aggiornamento: {new Date().toLocaleDateString('it-IT')}
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              1. Titolare del Trattamento
            </h2>
            <p>
              Il titolare del trattamento dei dati personali è Patentify. Per
              qualsiasi informazione relativa al trattamento dei tuoi dati
              personali, puoi contattarci all&apos;indirizzo email:
              privacy@patentify.app
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              2. Dati Raccolti
            </h2>
            <p>Raccogliamo le seguenti categorie di dati personali:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>Dati di registrazione:</strong> nome, cognome, indirizzo
                email forniti durante la creazione dell&apos;account.
              </li>
              <li>
                <strong>Dati di utilizzo:</strong> informazioni sulle tue
                interazioni con l&apos;applicazione, inclusi i quiz completati,
                le risposte fornite e le statistiche di apprendimento.
              </li>
              <li>
                <strong>Dati tecnici:</strong> indirizzo IP, tipo di browser,
                sistema operativo, identificatori del dispositivo e dati di log.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              3. Finalità del Trattamento
            </h2>
            <p>
              I tuoi dati personali vengono trattati per le seguenti finalità:
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                Fornire e gestire il servizio di preparazione ai quiz per la
                patente di guida.
              </li>
              <li>
                Personalizzare la tua esperienza di apprendimento in base ai
                tuoi progressi e alle aree di miglioramento.
              </li>
              <li>
                Inviare comunicazioni relative al servizio, inclusi
                aggiornamenti e notifiche importanti.
              </li>
              <li>
                Migliorare e ottimizzare il funzionamento
                dell&apos;applicazione.
              </li>
              <li>Garantire la sicurezza del servizio e prevenire frodi.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              4. Base Giuridica del Trattamento
            </h2>
            <p>
              Il trattamento dei tuoi dati personali si basa su:
              l&apos;esecuzione del contratto di servizio, il tuo consenso
              esplicito per finalità specifiche, il nostro legittimo interesse a
              migliorare il servizio, e l&apos;adempimento di obblighi legali.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              5. Conservazione dei Dati
            </h2>
            <p>
              I tuoi dati personali vengono conservati per il tempo necessario a
              soddisfare le finalità per cui sono stati raccolti. I dati
              dell&apos;account vengono conservati fino alla cancellazione dello
              stesso. I dati di utilizzo e le statistiche vengono conservati per
              un periodo massimo di 24 mesi dalla raccolta.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              6. Condivisione dei Dati
            </h2>
            <p>
              Non vendiamo i tuoi dati personali a terzi. Possiamo condividere i
              tuoi dati con fornitori di servizi che ci assistono
              nell&apos;erogazione del servizio (hosting, autenticazione,
              analytics), sempre nel rispetto di adeguate garanzie di sicurezza
              e riservatezza.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              7. I Tuoi Diritti
            </h2>
            <p>
              Ai sensi del GDPR, hai diritto di: accedere ai tuoi dati
              personali, rettificare dati inesatti, richiedere la cancellazione
              dei tuoi dati, limitare il trattamento, richiedere la portabilità
              dei dati, opporti al trattamento, e revocare il consenso in
              qualsiasi momento.
            </p>
            <p>
              Per esercitare questi diritti, contattaci all&apos;indirizzo
              privacy@patentify.app.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              8. Cookie e Tecnologie Simili
            </h2>
            <p>
              Utilizziamo cookie tecnici necessari per il funzionamento del
              servizio e cookie analitici per comprendere come viene utilizzata
              l&apos;applicazione. Puoi gestire le preferenze sui cookie
              attraverso le impostazioni del tuo browser.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              9. Sicurezza
            </h2>
            <p>
              Adottiamo misure tecniche e organizzative appropriate per
              proteggere i tuoi dati personali da accessi non autorizzati,
              perdita o distruzione. Tuttavia, nessun sistema è completamente
              sicuro e non possiamo garantire la sicurezza assoluta dei tuoi
              dati.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              10. Modifiche alla Privacy Policy
            </h2>
            <p>
              Ci riserviamo il diritto di modificare questa informativa in
              qualsiasi momento. Le modifiche saranno pubblicate su questa
              pagina con indicazione della data di ultimo aggiornamento. Ti
              consigliamo di consultare periodicamente questa pagina.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              11. Contatti
            </h2>
            <p>
              Per qualsiasi domanda relativa a questa informativa o al
              trattamento dei tuoi dati personali, puoi contattarci a:
              privacy@patentify.app
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
