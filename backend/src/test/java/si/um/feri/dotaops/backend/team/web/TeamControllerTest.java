package si.um.feri.dotaops.backend.team.web;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.List;
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
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import si.um.feri.dotaops.backend.BackendApplication;
import si.um.feri.dotaops.backend.auth.domain.AuthenticatedProfile;
import si.um.feri.dotaops.backend.auth.domain.ProfileRole;
import si.um.feri.dotaops.backend.auth.repository.AuthenticatedProfileRepository;
import si.um.feri.dotaops.backend.auth.service.SupabaseJwtTestSupport;
import si.um.feri.dotaops.backend.common.pagination.PageMeta;
import si.um.feri.dotaops.backend.common.pagination.PageResponse;
import si.um.feri.dotaops.backend.team.service.TeamService;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = {
        BackendApplication.class,
        TeamControllerTest.TeamControllerTestConfig.class
})
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "spring.flyway.enabled=false",
        "dotaops.supabase.auth.jwt-secret=" + SupabaseJwtTestSupport.SECRET,
        "dotaops.supabase.auth.issuer=" + SupabaseJwtTestSupport.ISSUER,
        "dotaops.supabase.auth.audience=" + SupabaseJwtTestSupport.AUDIENCE
})
class TeamControllerTest {

    private static final UUID AUTH_USER_ID = UUID.fromString("55555555-5555-4555-8555-555555555555");
    private static final UUID PROFILE_ID = UUID.fromString("66666666-6666-4666-8666-666666666666");
    private static final UUID TEAM_ID = UUID.fromString("77777777-7777-4777-8777-777777777777");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TeamService teamService;

    @Autowired
    private AuthenticatedProfileRepository authenticatedProfileRepository;

    @BeforeEach
    void setUp() {
        Mockito.reset(teamService, authenticatedProfileRepository);
        when(authenticatedProfileRepository.findByAuthUserId(AUTH_USER_ID))
                .thenReturn(Optional.of(authenticatedProfile()));
    }

    @Test
    void listTeamsWorksWithoutJwt() throws Exception {
        when(teamService.listTeams(isNull(), eq(0), eq(20))).thenReturn(new PageResponse<>(
                List.of(teamResponse()),
                new PageMeta(0, 20, 1, 1, false, false)));

        mockMvc.perform(get("/api/teams"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.data.items[0].id").value(TEAM_ID.toString()))
                .andExpect(jsonPath("$.data.items[0].name").value("Ancient Stack"))
                .andExpect(jsonPath("$.data.items[0].slug").value("ancient-stack"))
                .andExpect(jsonPath("$.data.items[0].captainNickname").value("MidPulse"))
                .andExpect(jsonPath("$.data.page.totalElements").value(1));
    }

    @Test
    void getTeamBySlugWorksWithoutJwt() throws Exception {
        when(teamService.getTeamBySlug("ancient-stack")).thenReturn(teamResponse());

        mockMvc.perform(get("/api/teams/by-slug/ancient-stack"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(TEAM_ID.toString()))
                .andExpect(jsonPath("$.data.slug").value("ancient-stack"));
    }

    @Test
    void createTeamRequiresJwt() throws Exception {
        mockMvc.perform(post("/api/teams")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Ancient Stack"
                                }
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    void createTeamReturnsCreatedTeam() throws Exception {
        when(teamService.createTeam(any(CreateTeamRequest.class))).thenReturn(teamResponse());

        mockMvc.perform(post("/api/teams")
                        .header("Authorization", bearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Ancient Stack",
                                  "tag": "AS",
                                  "region": "EU"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/teams/" + TEAM_ID))
                .andExpect(jsonPath("$.data.name").value("Ancient Stack"))
                .andExpect(jsonPath("$.data.slug").value("ancient-stack"));
    }

    @Test
    void invalidCreatePayloadReturnsValidationError() throws Exception {
        mockMvc.perform(post("/api/teams")
                        .header("Authorization", bearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "A",
                                  "slug": "bad slug"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    void updateTeamReturnsUpdatedTeam() throws Exception {
        when(teamService.updateTeam(eq(TEAM_ID), any(UpdateTeamRequest.class))).thenReturn(teamResponse());

        mockMvc.perform(patch("/api/teams/" + TEAM_ID)
                        .header("Authorization", bearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "region": "EU"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(TEAM_ID.toString()))
                .andExpect(jsonPath("$.data.region").value("EU"));
    }

    private static String bearerToken() throws Exception {
        return "Bearer " + SupabaseJwtTestSupport.token(AUTH_USER_ID, Instant.now());
    }

    private static AuthenticatedProfile authenticatedProfile() {
        return new AuthenticatedProfile(
                PROFILE_ID,
                AUTH_USER_ID,
                "MidPulse",
                ProfileRole.PLAYER);
    }

    private static TeamResponse teamResponse() {
        OffsetDateTime now = OffsetDateTime.parse("2026-05-12T00:00:00Z");

        return new TeamResponse(
                TEAM_ID,
                "Ancient Stack",
                "AS",
                "ancient-stack",
                PROFILE_ID,
                "MidPulse",
                "EU",
                "https://cdn.example.test/logo.png",
                "Tier two squad",
                now,
                now);
    }

    @TestConfiguration
    static class TeamControllerTestConfig {

        @Bean
        @Primary
        TeamService teamService() {
            return Mockito.mock(TeamService.class);
        }

        @Bean
        @Primary
        AuthenticatedProfileRepository authenticatedProfileRepository() {
            return Mockito.mock(AuthenticatedProfileRepository.class);
        }
    }
}
