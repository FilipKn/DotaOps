# DotaOps

## Poročilo 2. iteracije - backend

**Datum:** 14. maj 2026  
**Repozitorij:** `DotaOps/DotaOps`  
**Kratek opis:** DotaOps je spletna platforma za organizacijo Dota 2 turnirjev, upravljanje ekip, prijave na turnirje, preverjanje rosterjev, check-in in kasnejšo analitiko podatkov iz OpenDota.

**Člani oziroma sodelavci:** Filip Knez, Gal Kovše, Vid Bezget in Luka Četina.

**Meja poročila:** Poročilo opisuje backend in database delo 2. iteracije od zaključene foundation faze do stanja, kjer so osnovni turnirski tokovi, prijave ekip in frontend kompatibilnost pripravljeni za začetek 3. iteracije.

# 1. Uvod

Druga iteracija je backend premaknila iz osnovne projektne platforme v dejanski turnirski workflow. V 1. iteraciji so bili pripravljeni profili, ekipe, rosterji, povabila, Steam/Supabase identiteta, Flyway shema in testni okvir. V 2. iteraciji se je na tej osnovi dodal uporaben turnirski sloj: organizator lahko ustvari in vodi turnir, kapetan lahko prijavi ekipo, backend ob prijavi shrani snapshot rosterja, organizator lahko prijavo odobri, zavrne ali premakne na waitlist, ekipa pa lahko izvede check-in v dovoljenem časovnem oknu.

Poročilo je namenoma osredotočeno na backend/database del. Frontend je omenjen samo tam, kjer je vplival na API kompatibilnost in na dogovorjene response oblike. Naloge, ki spadajo v bracket, scheduling, result entry, full referee flow ali analitične agregate, niso obravnavane kot zaključene funkcionalnosti 2. iteracije, ampak kot priprava za nadaljnje delo.

Pomembna produktna odločitev v tej iteraciji je, da je organizer self-service vloga: uporabnik se lahko odloči, da bo organizator, ker želi projekt podpirati tudi manjše domače in skupnostne turnirje. To ni obravnavano kot privilegij platformnega administratorja. Varnost zato ni v tem, da uporabnik ne more postati organizer, ampak v tem, da so dejanja nad konkretnim turnirjem vezana na creatorja oziroma organizer/staff povezavo za ta turnir.

# 2. Izhodišče po 1. iteraciji in cilj 2. iteracije

Po 1. iteraciji je projekt že imel stabilno osnovo: Spring Boot API, Flyway migracije, Supabase/PostgreSQL shemo, profile, ekipe, rosterje, invitations, Steam login, Supabase JWT preverjanje, enoten `ApiResponse`/error response in osnovne teste. V bazi so že obstajale tudi turnirske tabele iz širšega V2 modela, vendar poslovni API za celoten turnirski workflow še ni bil zaključen.

Cilj 2. iteracije za backend je bil narediti osnovni tournament operations tok dovolj zanesljiv, da lahko 3. iteracija začne graditi na njem, namesto da bi še vedno popravljala identiteto, prijave, permissione ali osnovno podatkovno integriteto.

| Področje | Stanje po 1. iteraciji | Stanje po 2. iteraciji |
|---|---|---|
| Profili in auth | Supabase JWT in Steam session sta obstajala, profilni API je bil postavljen. | Dodana je robustnejša Supabase JWT validacija z JWKS podporo in avtomatsko ustvarjanje profilov iz `auth.users`. |
| Ekipe in roster | Ekipe, kapetan, člani in povabila so bili implementirani. | Dodani so aggregate `/api/me/team`, dodatna invitation validacija in povezava s team registration statusi. |
| Turnirji | Shema je obstajala, poslovni lifecycle še ni bil dokončan. | Dodani so public in organizer tournament API, create/update/publish/archive, validacije datumov in nastavitev. |
| Prijave ekip | Tabele so obstajale kot del širšega modela. | Dodan je celoten BE/DB-12 tok: prijava, duplicate prevention, roster snapshot, review, waitlist, check-in in status visibility. |
| Vloge/staff | V bazi so obstajale širše staff vrednosti. | Model je namenoma poenostavljen za 2. iteracijo: organizer, player, team captain; owner šteje kot organizer, referee/analyst nimata write flowa. |
| Testi | Pokriti so bili auth, profili, ekipe, Steam/OpenDota foundation in migracije. | Dodani so tournament, registration, security, match import in team compatibility testi. Zadnji run: 198 testov, 0 napak. |

# 3. Backend arhitektura v 2. iteraciji

Backend je ohranil isti slojni pristop kot v 1. iteraciji: controller sprejme HTTP zahtevo, service izvaja poslovna pravila in avtorizacijo, repository izvaja SQL, response DTO pa predstavlja stabilno pogodbo za frontend. Druga iteracija ni uvedla nove arhitekturne smeri, ampak je razširila obstoječi vzorec na turnirski modul.

| Sloj | Vloga v 2. iteraciji | Primeri datotek |
|---|---|---|
| Controller | REST endpointi za javne turnirje, organizer turnirje, registracije in check-in. | `TournamentController`, `TournamentRegistrationController`, `TeamRosterController`, `MatchImportController` |
| Service | Validacije, resource-scoped authorization, transakcije, statusni prehodi in koordinacija več repositoryjev. | `TournamentService`, `TournamentRegistrationService`, `TeamRosterService`, `MatchImportService` |
| Repository | SQL dostop prek `JdbcTemplate`, `INSERT RETURNING`, targeted queries, snapshot rosterja in count queryji. | `TournamentRepository`, `TournamentRegistrationRepository`, `TeamRepository`, `TeamInvitationRepository` |
| DTO/domain | Stabilna API pogodba in interni domain recordi za turnirje, registracije, settings in članstvo. | `TournamentResponse`, `TournamentRegistrationResponse`, `TournamentSettingsDto`, `TournamentRegistrationMemberResponse` |
| Security/config | URL-level zaščita, JWT/JWKS preverjanje, Steam cookie fallback, CORS in JSON 401/403 odgovori. | `SecurityConfig`, `SupabaseJwtVerifier`, `SupabaseJwtAuthenticationFilter`, `DatabaseActorContext` |
| DB/migration | RLS, auth triggerji, staff defer in policy popravki brez spreminjanja že uporabljenih migracij. | `V11`, `V12`, `V13`, `V14` |

Največja vrednost arhitekture je ostala v service sloju. Primer: `SecurityConfig` lahko zahteva avtentikacijo za `/api/organizer/**`, vendar `TournamentService` še vedno preveri, ali ima trenutni profil pravico upravljati točno določen turnir. Enako `TournamentRegistrationService` preveri, ali je trenutni profil kapetan konkretne ekipe ali organizer konkretnega turnirja.

# 4. Turnirski lifecycle in tournament API

Turnirski modul je v 2. iteraciji dobil realen REST API. Javni del omogoča pregled objavljenih oziroma javno vidnih turnirjev, organizer del pa omogoča ustvarjanje, urejanje, objavo in arhiviranje. Podatki niso izpostavljeni kot entitete, ampak kot response DTO-ji z omejenimi polji za javne in zasebne poglede.

| Endpoint | Namen | Avtorizacija / vidnost |
|---|---|---|
| `GET /api/tournaments` | Javni paginirani seznam turnirjev. | Public, samo public-safe podatki. |
| `GET /api/tournaments/{slug}` | Javni detail turnirja po slug-u. | Public, samo javno vidni turnirji. |
| `GET /api/organizer/tournaments` | Seznam turnirjev, ki jih trenutni organizer lahko upravlja. | Authenticated, service preveri manageable scope. |
| `GET /api/organizer/tournaments/{tournamentId}` | Organizer detail za konkreten turnir. | Authenticated + `canManage`. |
| `POST /api/organizer/tournaments` | Ustvarjanje turnirja. | Organizer/admin role; creator postane `organizer_profile_id`. |
| `PATCH /api/organizer/tournaments/{tournamentId}` | Urejanje osnovnih podatkov, datumov in settings. | Resource-scoped `canManage`. |
| `POST /api/organizer/tournaments/{tournamentId}/publish` | Objava turnirja po validaciji. | Resource-scoped `canManage`. |
| `POST /api/organizer/tournaments/{tournamentId}/archive` | Arhiviranje turnirja. | Resource-scoped `canManage`. |

`TournamentService` centralizira pravila za slug, format, settings, `maxTeams`, `minTeams`, `teamSize`, `bestOf`, check-in in datume. To je pomembno, ker frontend ne more sam zagotoviti pravilnega zaporedja datumov ali skladnosti med formatom v stolpcu in formatom v settings JSON. Backend zavrne nekonsistentne ali nemogoče kombinacije.

| Pravilo | Backend izvedba |
|---|---|
| Slug | Normalizacija iz naslova ali validacija poslanega slug-a; samo lowercase črke, številke in enojni vezaji. |
| Settings | `maxTeams` 2-128, `minTeams <= maxTeams`, `teamSize = 5` za Dota 2, `bestOf = 1/3/5`, format obvezen. |
| Datumi | Registration close ne sme biti pred open, close ne sme biti po startu, check-in close ne sme biti po startu. |
| Objava | Publish je dovoljen samo iz ustreznega statusa in šele po validaciji obveznih polj. |
| Arhiv | Archived turnir se ne sme ponovno arhivirati in se ne posodablja kot aktiven turnir. |

# 5. BE/DB-12: prijava ekipe, statusi, roster snapshot, approval in check-in

BE/DB-12 je glavni backend rezultat 2. iteracije. Dodan je tok, v katerem team captain prijavi svojo ekipo na turnir, backend zapiše stabilen roster snapshot, organizer pregleda prijavo in jo odobri, zavrne ali premakne na waitlist, ekipa pa se lahko check-ina samo v dovoljenem časovnem oknu.

| Funkcionalnost | Izvedba v backendu | Zakaj je pomembno |
|---|---|---|
| Prijava ekipe | `POST /api/tournaments/{tournamentId}/registrations` kliče `TournamentRegistrationService.registerTeam`. | Kapetan ne pošilja ročnega rosterja; prijava je vezana na realno ekipo. |
| Captain check | `ensureCanRegisterTeam` zahteva, da je trenutni `profileId` enak `teams.captain_profile_id`. | `team_captain` je team-scoped pravica, ne globalna vloga. |
| Duplicate prevention | Service preveri `existsByTournamentIdAndTeamId`, DB pa ima unique constraint `tournament_id + team_id`. | Race condition in dvojni submit ne moreta ustvariti dveh prijav. |
| Roster readiness | Pred prijavo se preveri vsaj `tournament.settings.teamSize` aktivnih članov. | Ekipa mora imeti dovolj igralcev za Dota 2 roster. |
| Roster snapshot | `TournamentRegistrationRepository.create` po insertu pokliče `snapshotActiveRoster`. | Poznejše spremembe ekipe ne spreminjajo stare prijave. |
| Review flow | Organizer endpointi approve/reject/waitlist kličejo `updateStatus` z `reviewed_by` in `reviewed_at`. | Statusi so sledljivi in vezani na organizerja. |
| Check-in | `POST /api/tournaments/{tournamentId}/registrations/{registrationId}/check-in` nastavi `checked_in_at`. | Check-in je dovoljen samo za approved prijavo in znotraj okna. |
| Status visibility | Organizer vidi prijave svojih turnirjev; captain in active members vidijo prijave svoje ekipe. | Private registration podatki niso javno odprti. |

Check-in uporablja polja `check_in_opens_at`, `check_in_closes_at` in `checked_in_at`. Rejected, waitlisted in pending prijave ne morejo narediti check-ina, ker `ensureCheckInAllowed` zahteva status `APPROVED`. Če check-in ni omogočen v tournament settings, backend vrne conflict.

# 6. Permission model in BE/DB-13 odločitev

V 2. iteraciji ni bila uvedena polna staff-role logika za owner, organizer, referee in analyst. Po auditu je bil BE/DB-13 namenoma deferiran, ker trenutni osnovni flow potrebuje samo organizer, player in team captain. To zmanjša kompleksnost in prepreči, da bi referee ali analyst prehitro dobila write pravice brez jasno definiranega sodniškega oziroma analitičnega flowa.

| Vloga / koncept | Odločitev v 2. iteraciji | Učinek |
|---|---|---|
| organizer | Self-service vloga za uporabnike, ki želijo ustvarjati turnirje. | Uporabnik lahko ustvari turnir; upravljanje konkretnega turnirja je še vedno resource-scoped. |
| player | Osnovni igralec oziroma član ekipe. | Lahko vidi relevantne podatke svoje ekipe in status prijav, nima organizer write pravic. |
| team_captain | Ni globalna vloga; izhaja iz `teams.captain_profile_id`. | Kapetan lahko prijavi svojo ekipo in upravlja team-level akcije. |
| owner | Obravnavan kot organizer oziroma primary creator v obstoječem `tournament_staff` modelu. | Legacy staff podatki ostanejo uporabni brez ločene poslovne vloge. |
| referee | Ne dobi write pravic v 2. iteraciji. | Result/import/match write akcije ostanejo zaščitene z organizer pravico. |
| analyst | Ne dobi write pravic v 2. iteraciji. | Analitika ostane prihodnji permission flow. |

Migracija `V14` spremeni helperje tako, da `can_officiate_tournament` trenutno delegira na `can_manage_tournament`. S tem obstoječe match/import RLS politike ne odprejo write pravic referee/analyst vlogam. Koda in `SecurityConfig` pri match importu dodatno zahtevata organizer/admin pravico.

# 7. Supabase auth, JWT/JWKS in profili

V tej iteraciji je bil pomemben stabilizacijski del povezan z realnim Supabase Auth tokenom. Izkazalo se je, da tokeni niso nujno podpisani samo z legacy HS256 secretom, zato backend ne sme predpostavljati samo `SUPABASE_JWT_SECRET`. `SupabaseJwtVerifier` zdaj glede na `alg` header izbere HS256 decoder ali JWKS decoder za RS256/ES256 tokene.

| Področje | Izvedba |
|---|---|
| HS256 legacy tokeni | `NimbusJwtDecoder.withSecretKey` uporablja `SUPABASE_JWT_SECRET`, kadar je `alg` HS256. |
| JWKS tokeni | Za RS256/ES256 se uporabi `jwks-uri`; privzeto se izpelje iz `SUPABASE_URL + /auth/v1/.well-known/jwks.json`. |
| Issuer | Issuer se izpelje iz `SUPABASE_JWT_ISSUER` ali iz `SUPABASE_URL + /auth/v1`. |
| Audience | Validira se audience `authenticated` oziroma konfiguriran `SUPABASE_JWT_AUDIENCE`. |
| Čas | Validirata se `expiresAt` in `notBefore` s clock skew nastavitvijo. |

`V12` migracija doda avtomatsko ustvarjanje profilov za Supabase auth uporabnike. Trigger na `auth.users` kliče `private.ensure_profile_for_auth_user`, ki ustvari `public.profiles` zapis, če ta še ne obstaja. To podpira frontend login/register tok, kjer se lahko profil pojavi ob prijavi brez ročnega SQL posega.

Ker je organizer self-service produktna odločitev, `private.self_selected_profile_role` in `ProfileService` dovoljujeta self-selected organizer. To ne pomeni platform-admin pravic; admin ostaja ločena vloga, turnirsko upravljanje pa se preverja na konkretnem tournament resourceu.

# 8. Team in frontend compatibility popravki

Po frontend integraciji so bili dodani oziroma preverjeni backend tokovi, ki jih uporablja stran `/ekipe`: overview, roster, invitations, team registrations read in permission flags. Najpomembnejši dodatek je `GET /api/me/team` aggregate, da frontend ne ugiba prve ekipe iz seznama, ampak dobi trenutno ekipo, člane in `canManageRoster` informacijo iz backenda.

| Frontend potreba | Backend podpora |
|---|---|
| Prikaz trenutne ekipe | `GET /api/me/team` vrne `CurrentTeamResponse` s team, members, captain in `canManageRoster`. |
| Roster actions za captaina | `POST/PATCH/DELETE /api/teams/{teamId}/members` so zaščiteni s captain/organizer/admin checki. |
| Povabila | `POST /api/teams/{teamId}/invitations`, `GET` team invitations in `GET /api/me/team-invitations`. |
| Accept/decline/cancel | `POST /api/team-invitations/{id}/accept`, `decline`, `cancel`. |
| Team registration status | `GET /api/teams/{teamId}/tournament-registrations` za captaina in active members. |
| Invite edge case | Če sta poslana `inviteeProfileId` in `inviteeEmail`, backend preveri, da pripadata istemu auth uporabniku. |

Zadnji invitation popravek zapre nejasen primer, kjer bi request lahko vseboval profil enega uporabnika in e-pošto drugega. Backend zdaj pri create invitation preveri povezavo `profiles.auth_user_id -> auth.users.email`, pri accept/decline pa zahteva, da se ob obeh poljih ujemata tako `profileId` kot email. Enako je zaprt read path za obstoječe nejasne zapise.

# 9. OpenDota import in zaščita match/result priprave

OpenDota in result/scheduling področje nista bila glavni cilj 2. iteracije, vendar je bilo treba zagotoviti, da obstoječi import in match-related endpointi ne ostanejo nezaščiteni pred začetkom 3. iteracije. Zato je `MatchImportService` utrjen tako, da import lahko sproži samo organizer/admin, `SecurityConfig` pa `POST /api/match-imports` ščiti z enako vlogo.

| Vidik | Izvedba |
|---|---|
| Import endpoint | `POST /api/match-imports` je dovoljen organizer/admin uporabnikom. |
| Service check | `MatchImportService.importMatch` dodatno preveri `actor.isOrganizer`. |
| Idempotenca | Če import z istim `dotaMatchId` že obstaja v ready ali processing stanju, backend vrne obstoječ zapis. |
| OpenDota payload | Surovi payload se shrani, normalized payload in player importi se izluščijo v kontrolirani obliki. |
| Napake | Manjkajoč ali neveljaven match iz OpenDota preide v error status, ne podre aplikacije. |
| Timeouti | OpenDota in Steam HTTP timeouti so konfigurirani prek `application.properties` in env spremenljivk. |

To še ni končna analytics ali result-management implementacija. Namen v 2. iteraciji je bil zapreti varnostni in kompatibilnostni del, da 3. iteracija lahko varno gradi match scheduling, result entry in progression logiko.

# 10. Database migracije in RLS spremembe

V 2. iteraciji ni bilo destruktivnega spreminjanja že uporabljenih migracij. Nove spremembe so bile dodane kot nadaljnje Flyway migracije, skladno z obstoječim DB-first pristopom. V1 do V10 predstavljajo foundation iz 1. iteracije, V11 do V14 pa stabilizacijo 2. iteracije.

| Migracija | Namen | Ključna vsebina |
|---|---|---|
| `V11__audit_actor_context_fallback.sql` | Audit actor context fallback. | Audit trigger lahko dobi actorja iz `request.dotaops.*` settingov ali `auth.uid` fallbacka. |
| `V12__create_profiles_for_auth_users.sql` | Samodejno ustvarjanje profilov za Supabase auth uporabnike. | `private.ensure_profile_for_auth_user`, `auth.users` trigger, self-selected player/organizer role, no global captain constraint. |
| `V13__allow_team_members_read_registration_status.sql` | Vidnost statusov prijav za aktivne člane ekipe. | `private.is_active_team_member`, `private.can_read_registration` in konservativen SELECT policy. |
| `V14__defer_referee_analyst_write_permissions.sql` | Defer referee/analyst write permissions. | `can_officiate_tournament` uporablja `can_manage_tournament`; match helpers ostanejo omejeni. |
| `V8__allow_registration_returning_under_rls.sql` | RLS popravek za `INSERT ... RETURNING` registracij. | Row-local read policy omogoča captain/organizer create flow pod RLS. |

Pri RLS je najpomembnejše, da se mapping med Supabase uporabnikom in aplikacijskim profilom izvaja prek `auth.uid() -> profiles.auth_user_id`. Ker projekt podpira tudi Steam-only profile, se `auth_user_id` ne sme povsod obravnavati kot obvezen. Zato service layer še naprej uporablja `profileId` kot glavno domensko identiteto, `auth.uid` pa je uporabljen tam, kjer je relevantna Supabase Auth seja.

# 11. API pregled po 2. iteraciji

Po 2. iteraciji backend izpostavlja stabilen nabor endpointov za osnovne turnirske operacije, ekipni roster in frontend integracijo. Vsi pomembni responsei so oviti v `ApiResponse`, list endpointi so paginirani ali omejeni, private endpointi pa imajo `SecurityConfig` in service-level zaščito.

| Skupina | Endpointi | Status po 2. iteraciji |
|---|---|---|
| Turnirji public | `GET /api/tournaments`, `GET /api/tournaments/{slug}` | Javno berljivo, public-safe DTO. |
| Turnirji organizer | `GET/POST/PATCH /api/organizer/tournaments`, publish, archive | Implementirano z resource-scoped `canManage`. |
| Prijave ekip | `POST /api/tournaments/{id}/registrations`, `GET /api/teams/{id}/tournament-registrations` | Implementirano za captain/member visibility. |
| Organizer review | `GET registrations`, `POST approve/reject/waitlist` | Implementirano za organizer/admin konkretnega turnirja. |
| Check-in | `POST /api/tournaments/{id}/registrations/{registrationId}/check-in` | Implementirano za approved prijave znotraj check-in okna. |
| Team aggregate | `GET /api/me/team` | Implementirano za frontend `/ekipe` flow. |
| Team invitations | `GET/POST invitations`, accept/decline/cancel | Implementirano in dodatno validirano pri `profileId + email` kombinaciji. |
| Match import | `POST /api/match-imports` | Implementirano z organizer/admin zaščito in idempotenco po `dotaMatchId`. |

# 12. Testiranje in preverjanje

Testni paket se je v 2. iteraciji razširil predvsem na turnirske service/controller teste, registration flow, `SecurityConfig`, JWT verifier, match import in team compatibility. Zadnji lokalni run je bil izveden 14. maja 2026 z Maven wrapperjem.

| Ukaz | Rezultat | Opomba |
|---|---|---|
| `.\mvnw.cmd test "-Dspring.profiles.active=test"` | `BUILD SUCCESS`; Tests run: 198, Failures: 0, Errors: 0, Skipped: 19 | H2/unit/controller profil; vključuje namenjen WARN iz `SteamAuthServiceTest` za bootstrap failure. |
| `.\mvnw.cmd "-Dtest=*IntegrationTest" test "-Dspring.profiles.active=integration"` | `BUILD SUCCESS`; Tests run: 19, Failures: 0, Errors: 0, Skipped: 19 | Integracijski testi so preskočeni, ker lokalno ni nastavljen `SUPABASE_DB_URL`. |

| Testna skupina | Primeri | Kaj pokriva |
|---|---|---|
| Tournament service | `TournamentServiceTest` | Create/update/publish/archive, settings validacije, datumi, permissioni. |
| Tournament registration service | `TournamentRegistrationServiceTest` | Captain registration, duplicate, roster readiness, snapshot, approve/reject/waitlist, check-in, visibility. |
| Tournament controllers | `TournamentControllerTest`, `TournamentRegistrationControllerTest` | HTTP endpointi, statusi, response shape, authorization path. |
| Security/auth | `SecurityConfigTest`, `SupabaseJwtVerifierTest`, `SupabaseAuthoritiesTest` | Protected endpoints, role mapping, HS256/JWKS JWT validation. |
| Team compatibility | `TeamRosterServiceTest`, `TeamRosterControllerTest` | `/api/me/team`, invitations, membership, role changes, edge cases. |
| OpenDota/import | `MatchImportServiceTest`, `OpenDotaClientTest` | Import authorization, idempotenca, payload handling, mocked external API. |
| Integration | `MigrationIntegrationTest`, `DatabasePolicyIntegrationTest`, `TournamentDatabaseFlowIntegrationTest` | Flyway/RLS/API tokovi ob realnem Supabase/Postgres env. |

# 13. Pregled izvedenih backend nalog in evidence

Spodnja tabela povzema glavne preverljive backend sklope 2. iteracije. Evidenca temelji na trenutni kodi, migracijah, testih in lokalnem git logu.

| Naloga / commit | Kaj je bilo narejeno | Glavni moduli | Status |
|---|---|---|---|
| `fe1a474` - tournament osnova | Dodana osnovna turnirska domena, DTO-ji, repository/service/controller struktura in javni/organizer API. | `tournament/*` | Narejeno |
| `03d8618` - Supabase profili in vloge | Samodejno ustvarjanje profilov ob `auth.users` insertu ter uskladitev self-service player/organizer modela. | `V12`, `ProfileService` | Narejeno |
| `7295a36` - BE/DB-12 | Prijave ekip, duplicate prevention, roster snapshot, approve/reject/waitlist, check-in in visibility. | `TournamentRegistrationService/Repository/Controller` | Narejeno |
| `9a74b60` - zaključek backend 2. iteracije | Finalni backend review, `V14` defer referee/analyst write permissions in dodatni testi. | `V14`, `SecurityConfig`, `MatchImportService`, tournament DTO/testi | Narejeno |
| `464f6ca` - Docker/env popravek | Docker compose in backend konfiguracija sta usklajena z `.env` načinom nalaganja. | `docker-compose.yml`, `application.properties` | Narejeno |
| `6737929` - conflict/compatibility fix | Uskladitev backend in frontend conflicta po mergeu, vključno z match import response polji in tournament DTO kompatibilnostjo. | `SecurityConfig`, `MatchImportService`, tournament DTO/testi | Narejeno |
| `fd739d9` - invitation target validation | Če sta `inviteeProfileId` in `inviteeEmail` oba poslana, morata pripadati istemu uporabniku; read/accept flow zahteva ujemanje obeh. | `ProfileRepository`, `TeamInvitationRepository`, `TeamRosterService` | Narejeno |
| BE/DB-13 audit/defer | Preverjeno je stanje `tournament_staff` in role; polna owner/referee/analyst logika je odložena za kasnejšo iteracijo. | `V14`, `TournamentRepository.canManage`, `SecurityConfig` | Deferirano pravilno |

# 14. Glavne tehnične odločitve 2. iteracije

| Odločitev | Izbrani pristop | Razlog | Vpliv na 3. iteracijo |
|---|---|---|---|
| Organizer self-service | Uporabnik lahko postane organizer. | Projekt želi omogočiti tudi domače in skupnostne turnirje brez platform-admin gatekeeperja. | 3. iteracija lahko gradi organizer UX, medtem ko backend še vedno scoped preverja konkretne resource. |
| Team captain kot team-scoped pravica | Prijava ekipe preverja `teams.captain_profile_id`. | Captain se lahko skozi čas spremeni; globalna vloga bi bila napačna. | Scheduling/result flow lahko uporablja aktualno team ownership logiko. |
| Roster snapshot ob prijavi | Snapshot se shrani v `tournament_registration_members` ob create. | Zgodovinska prijava mora ostati stabilna tudi po spremembi rosterja. | Bracket in result se lahko navežeta na roster ob prijavi, ne na trenutni roster. |
| Referee/analyst defer | Ne dobita write pravic v 2. iteraciji. | Sodniški in analitični flow še nista definirana. | 3. iteracija lahko doda pravice šele, ko bodo naloge konkretne. |
| JWKS + HS256 JWT podpora | Verifier izbira decoder glede na token `alg`. | Supabase tokeni lahko uporabljajo legacy secret ali signing keys. | Frontend login ostane kompatibilen z novejšim Supabase auth načinom. |
| Service-level authorization | `SecurityConfig` ni edini vir dovoljenj. | Resource ownership je poslovno pravilo. | Novi match/result endpointi morajo nadaljevati isti vzorec. |
| DB constraints kot zadnja zaščita | Duplicate registration in pending invites so zaščiteni tudi v bazi. | Service validacija sama ne odpravi race conditionov. | Pri bracket/result bo treba enako uporabiti constraints za kritična pravila. |

# 15. Kaj je pripravljeno za 3. iteracijo

Backend ima po 2. iteraciji dovolj stabilen turnirski foundation za začetek 3. iteracije. To ne pomeni, da je bracket/result modul že narejen; pomeni pa, da se lahko implementira na zanesljivih prijavah, ekipah, statusih in permissionih.

- Turnirji imajo create/update/publish/archive workflow in public/organizer poglede.
- Ekipe se lahko prijavijo prek trenutnega captaina, brez zaupanja v frontend-owned ownership polja.
- Roster snapshot je zgodovinsko stabilen in ločen od poznejših roster sprememb.
- Organizer lahko pregleda in spremeni status prijav; status visibility je omejen na relevantne uporabnike.
- Check-in je vezan na approved status in check-in časovno okno.
- Owner/referee/analyst kompleksnost ne blokira osnovnega flowa; owner se šteje kot organizer, referee/analyst nimata nepotrebnih write pravic.
- Supabase JWT preverjanje podpira HS256 in JWKS tokene.
- Frontend `/ekipe` flow ima backend endpoint za trenutni team aggregate in invitation tokove.
- Match import je zaščiten z organizer pravico in ne odpira result/import akcij širše, kot je potrebno.

# 16. Znane omejitve in tveganja

| Omejitev / tveganje | Zakaj obstaja | Vpliv / nadaljnji korak |
|---|---|---|
| Integracijski testi lokalno preskočeni | `SUPABASE_DB_URL` ni nastavljen v lokalnem okolju. | Pred production push/deploy je smiselno zagnati integration profil proti varni Supabase/Postgres bazi. |
| Poln staff management ni implementiran | BE/DB-13 je namenoma deferiran. | Ko bo potreben referee/analyst flow, bo treba dodati endpoint-e, audit in natančne permissione. |
| Bracket/scheduling/result progression niso zaključeni | To je predmet naslednje iteracije. | 3. iteracija mora graditi na approved/check-in registrations in match modelu. |
| Registration form dynamic validation ni polno izkoriščena | Osnovni registration flow je narejen; napredni obrazci niso bili glavni cilj. | Če frontend zahteva kompleksne forme, je treba dodati controlled schema validacijo. |
| RLS je treba preverjati v realnem Postgres okolju | H2 test profil ne more dokazati vseh Supabase policy pravil. | Za RLS spremembe naj se uporabljajo integration testi ali ročni Supabase SQL checki. |
| OpenDota analytics še ni končna | Import foundation obstaja, agregati/win rate/form/events niso zaključeni. | To ostaja nadaljnje delo po osnovnem match/result toku. |
| Captain transfer/leave team/join requests niso implementirani | Frontend jih je navedel kot prihodnje backend potrebe. | To niso blokatorji za zaključek osnovne 2. iteracije, ampak prihodnje team workflow naloge. |

# 17. Zaključek

Druga iteracija je za backend dosegla glavni cilj: projekt ima delujoč osnovni turnirski workflow, ki se navezuje na profile, ekipe, rosterje, organizer pravice in Supabase/PostgreSQL model. Najpomembnejši rezultat ni samo dodan endpoint, ampak povezava več pravil v celoto: team captain lahko prijavi realno ekipo, baza prepreči dvojne prijave, snapshot rosterja ostane stabilen, organizer lahko sprejme odločitev o prijavi, check-in je časovno in statusno omejen, igralci pa vidijo relevantne statuse svoje ekipe.

Backend je hkrati ostal pragmatičen: owner/referee/analyst kompleksnost ni bila uvedena, dokler je ne zahteva konkreten flow. Organizer je potrjen kot self-service vloga za ustvarjanje turnirjev, vendar upravljanje konkretnih turnirjev ostaja preverjeno prek resource-scoped pravil. Auth tok je bil stabiliziran z JWKS podporo, team frontend flow pa je dobil `/api/me/team` in dodatno varnost pri invitations.

Na tej točki je backend 2. iteracije dovolj zaključen, da lahko naslednja faza začne delati bracket, scheduling, result entry, match progression in nadaljnjo analitiko brez vračanja na osnovne registracijske in permission temelje.

# Viri in preverjena evidenca

| Vir | Kaj je bilo uporabljeno |
|---|---|
| `docs/reports/Iteracija_1_DotaOps_pregled.docx` in `.md` | Struktura, slog in primerjava s poročilom 1. iteracije. |
| `backend/src/main/java/.../tournament` | Tournament lifecycle, registration, snapshot, check-in in DTO/API izvedba. |
| `backend/src/main/java/.../team` | Roster, invitations, `/api/me/team` in team registration visibility compatibility. |
| `backend/src/main/java/.../auth` in `config` | Supabase JWT/JWKS verifier, SecurityConfig, current actor model in CORS/env konfiguracija. |
| `backend/src/main/java/.../opendota` | Match import authorization, idempotenca in payload normalization. |
| `backend/src/main/resources/db/migration/V8`, `V11` do `V14` | RLS, auth triggerji, profile creation, registration read policy in staff defer. |
| `backend/src/test/java` | Tournament, registration, auth, team, match import in integration test coverage. |
| `git log --oneline --decorate --since 2026-05-13` | Časovni kontekst commitov in mergeev 2. iteracije. |
| Lokalni Maven testi 14. 5. 2026 | `BUILD SUCCESS` rezultati za unit/controller test profil in integration skip status. |
