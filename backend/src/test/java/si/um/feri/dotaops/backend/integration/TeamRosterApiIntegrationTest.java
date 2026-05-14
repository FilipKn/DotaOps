package si.um.feri.dotaops.backend.integration;

import java.time.Instant;
import java.util.UUID;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import si.um.feri.dotaops.backend.BackendApplication;
import si.um.feri.dotaops.backend.auth.service.SupabaseJwtTestSupport;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = BackendApplication.class)
@AutoConfigureMockMvc
@ActiveProfiles("integration")
@EnabledIfEnvironmentVariable(named = "SUPABASE_DB_URL", matches = ".+")
@TestPropertySource(properties = {
        "dotaops.supabase.auth.jwt-secret=" + SupabaseJwtTestSupport.SECRET,
        "dotaops.supabase.auth.issuer=" + SupabaseJwtTestSupport.ISSUER,
        "dotaops.supabase.auth.audience=" + SupabaseJwtTestSupport.AUDIENCE
})
class TeamRosterApiIntegrationTest extends PostgresIntegrationTestSupport {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();


    private UUID captainAuthUserId;
    private UUID inviteeAuthUserId;
    private UUID inviteeProfileId;

    @BeforeEach
    void seedProfiles() {
        captainAuthUserId = UUID.randomUUID();
        inviteeAuthUserId = UUID.randomUUID();

        upsertProfile(captainAuthUserId, "player");
        inviteeProfileId = upsertProfile(inviteeAuthUserId, "player");
    }

    @Test
    void rosterInvitationAndSoftDeactivateFlowWorksThroughRestApi() throws Exception {
        String suffix = uniqueSuffix();

        UUID teamId = extractDataId(mockMvc.perform(post("/api/teams")
                        .header("Authorization", bearerToken(captainAuthUserId))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Roster Smoke %s",
                                  "slug": "roster-smoke-%s",
                                  "region": "EU"
                                }
                                """.formatted(suffix, suffix)))
                .andExpect(status().isCreated())
                .andReturn());

        mockMvc.perform(get("/api/me/team")
                        .header("Authorization", bearerToken(captainAuthUserId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.team.id").value(teamId.toString()))
                .andExpect(jsonPath("$.data.captain").value(true))
                .andExpect(jsonPath("$.data.canManageRoster").value(true));

        UUID memberId = extractDataId(mockMvc.perform(post("/api/teams/" + teamId + "/members")
                        .header("Authorization", bearerToken(captainAuthUserId))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "profileId": "%s",
                                  "role": "mid"
                                }
                                """.formatted(inviteeProfileId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.role").value("mid"))
                .andReturn());

        mockMvc.perform(get("/api/teams/" + teamId + "/members"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].profileId").value(inviteeProfileId.toString()))
                .andExpect(jsonPath("$.data[0].active").value(true));

        mockMvc.perform(delete("/api/teams/" + teamId + "/members/" + memberId)
                        .header("Authorization", bearerToken(captainAuthUserId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.active").value(false))
                .andExpect(jsonPath("$.data.leftAt").exists());

        UUID invitationId = extractDataId(mockMvc.perform(post("/api/teams/" + teamId + "/invitations")
                        .header("Authorization", bearerToken(captainAuthUserId))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "inviteeProfileId": "%s",
                                  "proposedRole": "support"
                                }
                                """.formatted(inviteeProfileId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status").value("pending"))
                .andReturn());

        mockMvc.perform(post("/api/teams/" + teamId + "/invitations")
                        .header("Authorization", bearerToken(captainAuthUserId))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "inviteeProfileId": "%s",
                                  "proposedRole": "support"
                                }
                                """.formatted(inviteeProfileId)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("BAD_REQUEST"));

        mockMvc.perform(get("/api/me/team-invitations")
                        .param("status", "pending")
                        .header("Authorization", bearerToken(inviteeAuthUserId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].id").value(invitationId.toString()));

        mockMvc.perform(post("/api/team-invitations/" + invitationId + "/accept")
                        .header("Authorization", bearerToken(inviteeAuthUserId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("accepted"));

        mockMvc.perform(get("/api/teams/" + teamId + "/members"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].profileId").value(inviteeProfileId.toString()))
                .andExpect(jsonPath("$.data[0].role").value("support"))
                .andExpect(jsonPath("$.data[0].active").value(true));
    }

    private UUID extractDataId(org.springframework.test.web.servlet.MvcResult result) throws Exception {
        JsonNode response = objectMapper.readTree(result.getResponse().getContentAsString());

        return UUID.fromString(response.path("data").path("id").asText());
    }

    private static String bearerToken(UUID authUserId) throws Exception {
        return "Bearer " + SupabaseJwtTestSupport.token(authUserId, Instant.now());
    }
}
