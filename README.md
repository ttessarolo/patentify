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
- `NEON_AUTH_URL`: URL del servizio Neon Auth
- `NEON_AUTH_API_KEY`: API key per Neon Auth

3. Avviare il server di sviluppo:
```bash
pnpm dev
```

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
