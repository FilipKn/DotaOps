# DotaOps Frontend

Next.js frontend za DotaOps: vodenje Dota 2 turnirjev, javni pregled tekem, profili ekip in osnovna analitika uvozenih match podatkov.

## Zagon

```bash
npm install
npm run dev
```

Privzeto se aplikacija odpre na `http://localhost:3000`.

## Konfiguracija API-ja

Ustvari `.env.local` po zgledu `.env.example`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Dokler zaledje ni pripravljeno, strani uporabljajo začetne podatke iz `src/lib/mock-data.ts`.

## Struktura

- `src/app` vsebuje App Router strani.
- `src/components` vsebuje skupne UI komponente.
- `src/lib/types.ts` vsebuje pogodbe za frontend.
- `src/lib/api.ts` je pripravljena vstopna točka za Spring Boot API.
- `src/lib/mock-data.ts` vsebuje začetne podatke za razvoj UI-ja.
