# DotaOps

Projekt za organizacijo Dota 2 turnirjev in analitiko tekem.

## Struktura

- `frontend/` - Next.js uporabniski vmesnik.
- `backend/` - Spring Boot API in Flyway migracije za PostgreSQL/Supabase.
- `supabase/` - Supabase konfiguracija projekta.

## Frontend

```bash
cd frontend
npm install
npm run dev
```

## Backend

Backend uporablja Spring Boot, PostgreSQL in Flyway. Konfiguracijo za bazo nastavi prek environment variables:

```bash
SUPABASE_DB_URL=jdbc:postgresql://aws-0-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require
SUPABASE_DB_USER=postgres.hjszjebirxhdtrbhefbv
SUPABASE_DB_PASSWORD=
SPRING_FLYWAY_ENABLED=true
```

Migracije so v `backend/src/main/resources/db/migration`.

Frontend bere javne Supabase vrednosti iz `frontend/.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

## Supabase

Supabase GitHub integration naj uporablja:

- repository: `FilipKn/DotaOps`
- production branch: `main`
- working directory: `.`

Tabele trenutno ustvarja backend prek Flyway migracij.
Obcutljive vrednosti hrani v `.env` ali v deployment secrets, ne v repozitoriju.
