# DotaOps Supabase

This folder contains Supabase project configuration for DotaOps.

## What Is Included

- `config.toml`: Supabase local/project configuration.
- Database migrations are owned by the Spring Boot backend in `../backend/src/main/resources/db/migration`.
- No seed data is committed at this stage.

The schema covers:

- user profiles and roles
- teams and team members
- tournaments and team registrations
- matches, brackets, results, and `dota_match_id`
- OpenDota import state: `queued`, `processing`, `ready`, `error`
- heroes and per-player match rows
- materialized analytics views for players, teams, and heroes
- RLS policies for public reads and authenticated organizer/captain writes

## GitHub Integration

Your Supabase dashboard is configured to read this repository with working directory `.` and production branch `main`.
The GitHub integration may stay connected for project sync, but table creation is currently handled by backend Flyway migrations.

## Local CLI Commands

Use these from the repository root:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase status
```

Do not run seed/reset commands against production unless the team intentionally wants to recreate data.

## Required Secrets

Do not commit real keys. Keep them in `.env` or deployment secrets.

Backend/Spring Boot uses:

```bash
SUPABASE_PROJECT_REF=hjszjebirxhdtrbhefbv
SUPABASE_DB_URL=jdbc:postgresql://aws-0-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require
SUPABASE_DB_USER=postgres.hjszjebirxhdtrbhefbv
SUPABASE_DB_PASSWORD=
SPRING_FLYWAY_ENABLED=true
OPENDOTA_API_BASE_URL=https://api.opendota.com/api
```

Frontend can use only public values:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Never expose server-side secret keys in frontend code.
