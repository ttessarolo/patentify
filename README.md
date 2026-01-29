# Patentify

Applicazione mobile-first per la gestione dei brevetti.

## Stack Tecnologico

- **Framework**: TanStack Start (v0 - RC) con TanStack Router e TanStack Query
- **UI**: React, Tailwind CSS, shadcn/ui
- **Font**: Noto Sans (Google Font)
- **Icone**: Google Icons (SVG locali in `/app/icons`)
- **Database**: Neon DB
- **Auth**: Neon Auth (managed)
- **Testing**: Vitest
- **Linting/Formatting**: ESLint + Prettier
- **Form**: React Hook Form + Zod
- **Package Manager**: pnpm
- **Node.js**: 24.x
- **TypeScript**: ultima versione

## Setup

1. Installare le dipendenze:

```bash
pnpm install
```

2. Configurare le variabili ambiente:

```bash
cp .env.example .env.local
```

Compilare i valori necessari in `.env.local`:

- `DATABASE_URL`: Connection string per Neon DB
- `VITE_NEON_AUTH_URL`: URL del servizio Neon Auth (ottieni dalla [console Neon](https://console.neon.tech) > Progetto > Auth > Configuration tab)

**Nota**: L'Auth URL ha il formato: `https://ep-xxx.neonauth.region.aws.neon.tech/neondb/auth`

3. Avviare il server di sviluppo:

```bash
pnpm dev
```

## Deploy su Netlify

Il progetto è predisposto per il deploy su [Netlify](https://www.netlify.com/) tramite il plugin ufficiale [@netlify/vite-plugin-tanstack-start](https://docs.netlify.com/build/frameworks/framework-setup-guides/tanstack-start).

**Configurazione:**

- `netlify.toml`: comando di build `pnpm run build`, cartella di publish `dist/client`
- SSR, Server Routes, Server Functions e middleware vengono deployati su Netlify serverless functions

**Passi per il deploy:**

1. Collega il repository a Netlify (Site settings → Build & deploy).
2. Imposta le **variabili d’ambiente** in Netlify (Site settings → Environment variables):
   - `DATABASE_URL`: connection string Neon DB
   - `VITE_NEON_AUTH_URL`: URL del servizio Neon Auth (per il frontend)
3. Build command: `pnpm run build` (o lascia che Netlify usi `netlify.toml`)
4. Publish directory: `dist/client`

**Requisiti:** Netlify CLI 17.31+ se usi il deploy da CLI.

## Comandi Disponibili

- `pnpm dev` - Avvia il server di sviluppo
- `pnpm build` - Crea il build di produzione
- `pnpm start` - Avvia il server di produzione
- `pnpm test` - Esegue i test
- `pnpm lint` - Esegue il linting
- `pnpm format` - Formatta il codice
- `pnpm typecheck` - Verifica i tipi TypeScript

## Struttura del Progetto

```
patentify/
├── app/
│   ├── __root.tsx          # Root route
│   ├── index.tsx           # Homepage (login/registrazione)
│   ├── main.tsx            # Pagina principale dopo login
│   ├── components/         # Componenti React
│   │   ├── ui/            # Componenti shadcn
│   │   └── auth/          # Componenti autenticazione
│   ├── lib/               # Utilities e helpers
│   ├── icons/             # Icone Google Icons (SVG locali)
│   └── styles/            # Stili globali
├── tests/                 # Test files
└── public/                # File statici
```

## Convenzioni

- **TypeScript**: Return types espliciti sempre richiesti
- **Mobile-First**: Design sempre partendo da mobile
- **Componenti**: Uso di shadcn/ui, import icone da `~/icons`
- **Styling**: Tailwind CSS con Noto Sans font
- **Form**: React Hook Form + Zod per validazione
- **Commits**: Usare Conventional Commits per il semantic versioning

## License

ISC
