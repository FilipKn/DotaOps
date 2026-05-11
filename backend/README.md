# DotaOps Backend

Spring Boot API za upravljanje turnirjev, prijav ekip, in uvoz podatkov.

## Zagon (lokalno)

1. Nazadnje poskrbite, da imate v korenu projekta datoteko `.env` (kopirajte iz `.env.example`) in nastavite Supabase povezavo:

```
SUPABASE_DB_URL=jdbc:postgresql://...:5432/postgres
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=your_password
```

2. Iz terminala v mapi `backend/` zaženite aplikacijo z Maven wrapperjem:

```bash
./mvnw clean package -DskipTests
java -jar target/*.jar
```

Ali za razvoj (live reload):

```bash
./mvnw spring-boot:run
```

3. Aplikacija bo privzeto na `http://localhost:8080` (nastavite `SERVER_PORT` v `.env`, če želite drugače).

## Zagon z Dockerjem

Za gradnjo slike in zagon lokalno:

```bash
docker build -t dotaops-backend ./backend
docker run --env-file .env -p 8080:8080 dotaops-backend
```

Ali uporabite `docker-compose up --build` iz korena projekta (priporočeno, če imate tudi frontend):

```bash
docker-compose up --build
```

## Baza podatkov

Projekt uporablja Supabase Postgres; Flyway migracije se sprožijo ob zagonu aplikacije. Poskrbite, da so v `.env` pravilne vrednosti za `SUPABASE_DB_URL`, `SUPABASE_DB_USER` in `SUPABASE_DB_PASSWORD`.

## Napotki

- Če uporabljate Supabase v oblaku, uporabite povezavo iz Supabase dashboarda.
- Za razvoj je priporočljivo uporabljati lokalno `.env` datoteko in preveriti, da baza dovoljuje povezave od vaše okolice.
