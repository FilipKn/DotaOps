package si.um.feri.dotaops.backend.integration;

import java.util.Map;
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
class DatabasePolicyIntegrationTest extends PostgresIntegrationTestSupport {

    @Test
    void authenticatedUserCanCreateOnlyOwnPlayerProfile() {
        UUID authUserId = UUID.randomUUID();
        UUID otherAuthUserId = UUID.randomUUID();
        seedAuthUser(authUserId);
        seedAuthUser(otherAuthUserId);

        UUID profileId = asAuthenticated(authUserId, () -> jdbcTemplate.queryForObject(
                """
                insert into public.profiles (auth_user_id, nickname)
                values (?, ?)
                returning id
                """,
                UUID.class,
                authUserId,
                "player_" + uniqueSuffix()));

        assertThat(profileId).isNotNull();

        assertThatThrownBy(() -> asAuthenticated(authUserId, () -> {
            jdbcTemplate.update(
                    """
                    insert into public.profiles (auth_user_id, nickname)
                    values (?, ?)
                    """,
                    otherAuthUserId,
                    "other_" + uniqueSuffix());
            return null;
        })).isInstanceOf(DataAccessException.class);
    }

    @Test
    void authenticatedClientCannotMutateSteamExternalAccountsDirectly() {
        UUID authUserId = UUID.randomUUID();
        UUID profileId = upsertProfile(authUserId, "player");

        assertThatThrownBy(() -> asAuthenticated(authUserId, () -> {
            jdbcTemplate.update(
                    """
                    insert into public.profile_external_accounts (
                        profile_id,
                        provider,
                        provider_account_id,
                        is_primary
                    )
                    values (?, 'steam'::public.dotaops_external_account_provider, ?, true)
                    """,
                    profileId,
                    uniqueSteamId64());
            return null;
        })).isInstanceOf(DataAccessException.class);
    }

    @Test
    void serviceRoleSteamHelperCreatesPrimarySteamProfile() {
        UUID authUserId = UUID.randomUUID();
        seedAuthUser(authUserId);
        String steamId64 = uniqueSteamId64();
        String suffix = uniqueSuffix();

        Map<String, Object> result = asServiceRole(() -> jdbcTemplate.queryForMap(
                """
                select
                  out_profile_id,
                  out_external_account_id,
                  out_is_new_profile,
                  out_is_new_external_account
                from private.upsert_steam_profile(
                  ?,
                  ?,
                  ?,
                  ?,
                  ?,
                  ?,
                  ?::jsonb,
                  true
                )
                """,
                steamId64,
                authUserId,
                "steam_" + suffix,
                "Steam " + suffix,
                "https://cdn.example.test/avatar/" + suffix + ".png",
                "https://steamcommunity.com/profiles/" + steamId64 + "/",
                "{\"source\":\"integration-test\"}"));

        UUID profileId = (UUID) result.get("out_profile_id");
        UUID externalAccountId = (UUID) result.get("out_external_account_id");

        assertThat(result.get("out_is_new_profile")).isEqualTo(Boolean.TRUE);
        assertThat(result.get("out_is_new_external_account")).isEqualTo(Boolean.TRUE);
        assertThat(profileId).isNotNull();
        assertThat(externalAccountId).isNotNull();

        Map<String, Object> persisted = jdbcTemplate.queryForMap(
                """
                select
                  p.steam_id,
                  pea.provider_account_id,
                  pea.is_primary,
                  pea.is_login_identity
                from public.profiles p
                join public.profile_external_accounts pea
                  on pea.profile_id = p.id
                where p.id = ?
                  and pea.id = ?
                """,
                profileId,
                externalAccountId);

        assertThat(persisted.get("steam_id")).isEqualTo(steamId64);
        assertThat(persisted.get("provider_account_id")).isEqualTo(steamId64);
        assertThat(persisted.get("is_primary")).isEqualTo(Boolean.TRUE);
        assertThat(persisted.get("is_login_identity")).isEqualTo(Boolean.TRUE);
    }
}
