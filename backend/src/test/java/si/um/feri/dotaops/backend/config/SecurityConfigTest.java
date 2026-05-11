package si.um.feri.dotaops.backend.config;

import java.time.Instant;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import si.um.feri.dotaops.backend.BackendApplication;
import si.um.feri.dotaops.backend.auth.domain.AuthenticatedProfile;
import si.um.feri.dotaops.backend.auth.domain.ProfileRole;
import si.um.feri.dotaops.backend.auth.repository.AuthenticatedProfileRepository;
import si.um.feri.dotaops.backend.auth.service.SupabaseJwtTestSupport;
import si.um.feri.dotaops.backend.auth.service.SupabasePrincipal;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = {
        BackendApplication.class,
        SecurityConfigTest.SecurityTestController.class,
        SecurityConfigTest.SecurityTestRepositoryConfig.class
})
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "spring.flyway.enabled=false",
        "dotaops.supabase.auth.jwt-secret=" + SupabaseJwtTestSupport.SECRET,
        "dotaops.supabase.auth.issuer=" + SupabaseJwtTestSupport.ISSUER,
        "dotaops.supabase.auth.audience=" + SupabaseJwtTestSupport.AUDIENCE
})
class SecurityConfigTest {

    private static final UUID PLAYER_AUTH_USER_ID = UUID.fromString("44444444-4444-4444-8444-444444444444");
    private static final UUID ORGANIZER_AUTH_USER_ID = UUID.fromString("55555555-5555-4555-8555-555555555555");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AuthenticatedProfileRepository profileRepository;

    @BeforeEach
    void setUp() {
        Mockito.reset(profileRepository);
        when(profileRepository.findByAuthUserId(any())).thenReturn(Optional.empty());
        when(profileRepository.findByAuthUserId(PLAYER_AUTH_USER_ID)).thenReturn(Optional.of(profile(
                PLAYER_AUTH_USER_ID,
                ProfileRole.PLAYER)));
        when(profileRepository.findByAuthUserId(ORGANIZER_AUTH_USER_ID)).thenReturn(Optional.of(profile(
                ORGANIZER_AUTH_USER_ID,
                ProfileRole.ORGANIZER)));
    }

    @Test
    void publicEndpointWorksWithoutJwt() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"));
    }

    @Test
    void protectedEndpointRequiresJwt() throws Exception {
        mockMvc.perform(get("/api/me/security-test"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"))
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    void invalidJwtReturnsUnauthorizedContract() throws Exception {
        mockMvc.perform(get("/api/me/security-test")
                        .header("Authorization", "Bearer invalid"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"))
                .andExpect(jsonPath("$.path").value("/api/me/security-test"));
    }

    @Test
    void validJwtCreatesCurrentUserContext() throws Exception {
        mockMvc.perform(get("/api/me/security-test")
                        .header("Authorization", bearerToken(PLAYER_AUTH_USER_ID)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authUserId").value(PLAYER_AUTH_USER_ID.toString()))
                .andExpect(jsonPath("$.role").value("PLAYER"));
    }

    @Test
    void insufficientRoleReturnsForbiddenContract() throws Exception {
        mockMvc.perform(get("/api/organizer/security-test")
                        .header("Authorization", bearerToken(PLAYER_AUTH_USER_ID)))
                .andExpect(status().isForbidden())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.code").value("FORBIDDEN"))
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    void organizerRoleCanAccessOrganizerEndpoint() throws Exception {
        mockMvc.perform(get("/api/organizer/security-test")
                        .header("Authorization", bearerToken(ORGANIZER_AUTH_USER_ID)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result").value("organizer"));
    }

    private static String bearerToken(UUID authUserId) throws Exception {
        return "Bearer " + SupabaseJwtTestSupport.token(authUserId, Instant.now());
    }

    private static AuthenticatedProfile profile(UUID authUserId, ProfileRole role) {
        return new AuthenticatedProfile(
                UUID.nameUUIDFromBytes(authUserId.toString().getBytes(StandardCharsets.UTF_8)),
                authUserId,
                role.databaseValue(),
                role);
    }

    @RestController
    static class SecurityTestController {

        @GetMapping("/api/me/security-test")
        Map<String, String> me(Authentication authentication) {
            SupabasePrincipal principal = (SupabasePrincipal) authentication.getPrincipal();

            return Map.of(
                    "authUserId", principal.authUserId().toString(),
                    "role", principal.role().name());
        }

        @GetMapping("/api/organizer/security-test")
        Map<String, String> organizer() {
            return Map.of("result", "organizer");
        }
    }

    @TestConfiguration
    static class SecurityTestRepositoryConfig {

        @Bean
        @Primary
        AuthenticatedProfileRepository authenticatedProfileRepository() {
            return Mockito.mock(AuthenticatedProfileRepository.class);
        }
    }
}
