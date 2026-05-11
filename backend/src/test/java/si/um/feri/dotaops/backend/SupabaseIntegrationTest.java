package si.um.feri.dotaops.backend;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

/**
 * Integration test suite for Supabase database connectivity.
 * Runs only when SUPABASE_DB_URL environment variable is present.
 * Used in CI pipelines with real Supabase test project credentials.
 */
@SpringBootTest
@ActiveProfiles("integration")
@EnabledIfEnvironmentVariable(named = "SUPABASE_DB_URL", matches = ".+")
class SupabaseIntegrationTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void testDatabaseConnectivity() {
        Integer result = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
        assert result != null && result == 1 : "Database connectivity check failed";
    }

    @Test
    void testFlywayMigrationsRan() {
        // Verify that flyway_schema_history table exists (created by Flyway)
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'flyway_schema_history'",
                Integer.class
        );
        assert count != null && count > 0 : "Flyway migrations did not run";
    }
}
