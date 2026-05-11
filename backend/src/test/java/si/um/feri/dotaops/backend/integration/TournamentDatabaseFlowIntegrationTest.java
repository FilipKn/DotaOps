package si.um.feri.dotaops.backend.integration;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataAccessException;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("integration")
@EnabledIfEnvironmentVariable(named = "SUPABASE_DB_URL", matches = ".+")
class TournamentDatabaseFlowIntegrationTest extends PostgresIntegrationTestSupport {

    @Test
    void captainOrganizerAndResultFlowRespectsDatabasePolicies() {
        UUID captainAuthUserId = UUID.randomUUID();
        UUID organizerAuthUserId = UUID.randomUUID();
        UUID playerAuthUserId = UUID.randomUUID();
        UUID captainProfileId = upsertProfile(captainAuthUserId, "captain");
        UUID organizerProfileId = upsertProfile(organizerAuthUserId, "organizer");
        upsertProfile(playerAuthUserId, "player");
        String suffix = uniqueSuffix();

        UUID teamId = asAuthenticated(captainAuthUserId, () -> insertTeam(
                "Captain Team " + suffix,
                "captain-team-" + suffix,
                captainProfileId,
                captainAuthUserId));
        UUID opponentTeamId = asAuthenticated(organizerAuthUserId, () -> insertTeam(
                "Opponent Team " + suffix,
                "opponent-team-" + suffix,
                null,
                organizerAuthUserId));
        UUID tournamentId = asAuthenticated(organizerAuthUserId, () -> insertTournament(
                "integration-cup-" + suffix,
                "Integration Cup " + suffix,
                organizerProfileId,
                organizerAuthUserId));

        UUID registrationId = asAuthenticated(captainAuthUserId, () -> jdbcTemplate.queryForObject(
                """
                insert into public.tournament_registrations (
                    tournament_id,
                    team_id,
                    captain_profile_id,
                    message
                )
                values (?, ?, ?, ?)
                returning id
                """,
                UUID.class,
                tournamentId,
                teamId,
                captainProfileId,
                "Ready for CI integration flow"));

        UUID matchId = asAuthenticated(organizerAuthUserId, () -> jdbcTemplate.queryForObject(
                """
                insert into public.matches (
                    tournament_id,
                    round_name,
                    round_number,
                    team_a_id,
                    team_b_id,
                    status,
                    best_of,
                    score_a,
                    score_b,
                    winner_team_id
                )
                values (?, 'Final', 1, ?, ?, 'finished'::public.dotaops_match_status, 1, 1, 0, ?)
                returning id
                """,
                UUID.class,
                tournamentId,
                teamId,
                opponentTeamId,
                teamId));

        UUID matchGameId = asAuthenticated(organizerAuthUserId, () -> jdbcTemplate.queryForObject(
                """
                insert into public.match_games (
                    match_id,
                    game_number,
                    status,
                    import_status,
                    radiant_team_id,
                    dire_team_id,
                    winner_team_id,
                    duration_seconds,
                    started_at,
                    finished_at
                )
                values (
                    ?,
                    1,
                    'finished'::public.dotaops_match_status,
                    'ready'::public.dotaops_import_status,
                    ?,
                    ?,
                    ?,
                    2400,
                    now() - interval '45 minutes',
                    now()
                )
                returning id
                """,
                UUID.class,
                matchId,
                teamId,
                opponentTeamId,
                teamId));

        assertThat(teamId).isNotNull();
        assertThat(tournamentId).isNotNull();
        assertThat(registrationId).isNotNull();
        assertThat(matchId).isNotNull();
        assertThat(matchGameId).isNotNull();
        assertThat(jdbcTemplate.queryForObject(
                "select status::text from public.tournament_registrations where id = ?",
                String.class,
                registrationId)).isEqualTo("pending");

        assertThatThrownBy(() -> asAuthenticated(playerAuthUserId, () -> insertTournament(
                "player-owned-cup-" + suffix,
                "Player Owned Cup " + suffix,
                null,
                playerAuthUserId))).isInstanceOf(DataAccessException.class);
    }

    private UUID insertTeam(String name, String slug, UUID captainProfileId, UUID createdBy) {
        return jdbcTemplate.queryForObject(
                """
                insert into public.teams (
                    name,
                    slug,
                    captain_profile_id,
                    created_by
                )
                values (?, ?, ?, ?)
                returning id
                """,
                UUID.class,
                name,
                slug,
                captainProfileId,
                createdBy);
    }

    private UUID insertTournament(String slug, String title, UUID organizerProfileId, UUID createdBy) {
        return jdbcTemplate.queryForObject(
                """
                insert into public.tournaments (
                    slug,
                    title,
                    organizer_profile_id,
                    starts_at,
                    registration_closes_at,
                    created_by
                )
                values (?, ?, ?, now() + interval '14 days', now() + interval '7 days', ?)
                returning id
                """,
                UUID.class,
                slug,
                title,
                organizerProfileId,
                createdBy);
    }
}
