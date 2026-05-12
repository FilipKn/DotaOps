package si.um.feri.dotaops.backend.integration;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("integration")
@EnabledIfEnvironmentVariable(named = "SUPABASE_DB_URL", matches = ".+")
class MigrationIntegrationTest extends PostgresIntegrationTestSupport {

    @Test
    void flywayAppliesAllCurrentMigrations() {
        List<String> appliedVersions = jdbcTemplate.queryForList(
                """
                select version
                from public.flyway_schema_history
                where success
                order by installed_rank
                """,
                String.class);
        Integer failedMigrations = jdbcTemplate.queryForObject(
                "select count(*) from public.flyway_schema_history where not success",
                Integer.class);

        assertThat(appliedVersions).containsExactly("1", "2", "3", "4", "5", "6", "7", "8", "9", "10");
        assertThat(failedMigrations).isZero();
    }

    @Test
    void coreTablesHaveRlsEnabledAfterMigration() {
        List<String> tablesWithoutRls = jdbcTemplate.queryForList(
                """
                select expected.relname
                from (
                    values
                      ('profiles'),
                      ('profile_external_accounts'),
                      ('teams'),
                      ('team_members'),
                      ('tournaments'),
                      ('tournament_registrations'),
                      ('matches'),
                      ('match_games'),
                      ('match_players')
                ) as expected(relname)
                left join pg_class c
                  on c.relname = expected.relname
                left join pg_namespace n
                  on n.oid = c.relnamespace
                 and n.nspname = 'public'
                where n.oid is null
                   or not c.relrowsecurity
                order by expected.relname
                """,
                String.class);

        assertThat(tablesWithoutRls).isEmpty();
    }

    @Test
    void securityHelpersAndKeyConstraintsExist() {
        List<String> missingConstraints = jdbcTemplate.queryForList(
                """
                select expected.conname
                from (
                    values
                      ('profiles_steam_id_format'),
                      ('profiles_opendota_account_id_range'),
                      ('profile_external_accounts_steam_id64_format'),
                      ('matches_scores_fit_series'),
                      ('tournaments_registration_before_start')
                ) as expected(conname)
                left join pg_constraint c
                  on c.conname = expected.conname
                where c.oid is null
                order by expected.conname
                """,
                String.class);
        List<String> missingIndexes = jdbcTemplate.queryForList(
                """
                select expected.indexname
                from (
                    values
                      ('profile_external_accounts_one_primary_idx'),
                      ('profiles_nickname_ci_unique_idx'),
                      ('profiles_opendota_account_id_unique_idx'),
                      ('steam_login_states_expires_idx'),
                      ('matches_tournament_stage_idx')
                ) as expected(indexname)
                left join pg_indexes i
                  on i.schemaname in ('public', 'private')
                 and i.indexname = expected.indexname
                where i.indexname is null
                order by expected.indexname
                """,
                String.class);
        Integer privateSteamHelpers = jdbcTemplate.queryForObject(
                """
                select count(*)
                from pg_proc p
                join pg_namespace n on n.oid = p.pronamespace
                where n.nspname = 'private'
                  and p.proname in (
                    'upsert_steam_profile',
                    'link_steam_account_to_profile',
                    'create_steam_login_state',
                    'consume_steam_login_state'
                  )
                """,
                Integer.class);

        assertThat(missingConstraints).isEmpty();
        assertThat(missingIndexes).isEmpty();
        assertThat(privateSteamHelpers).isEqualTo(4);
    }
}
