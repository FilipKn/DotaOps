package si.um.feri.dotaops.backend.opendota.service;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import si.um.feri.dotaops.backend.config.properties.OpenDotaProperties;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.http.HttpMethod.GET;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class OpenDotaClientTest {

    private static final long ACCOUNT_ID = 39734273L;

    @Test
    void fetchPlayerParsesOpenDotaProfileResponse() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        OpenDotaClient client = new OpenDotaClient(properties(), builder);

        server.expect(requestTo("https://api.opendota.com/api/players/" + ACCOUNT_ID))
                .andExpect(method(GET))
                .andRespond(withSuccess("""
                        {
                          "profile": {
                            "account_id": 39734273,
                            "personaname": "Dota Player",
                            "avatarfull": "https://cdn.example.test/avatar.png",
                            "profileurl": "https://steamcommunity.com/profiles/76561198000000001/"
                          }
                        }
                        """, MediaType.APPLICATION_JSON));

        var profile = client.fetchPlayer(ACCOUNT_ID);

        assertThat(profile).isPresent();
        assertThat(profile.orElseThrow().accountId()).isEqualTo(ACCOUNT_ID);
        assertThat(profile.orElseThrow().personaName()).isEqualTo("Dota Player");
        assertThat(profile.orElseThrow().avatarUrl()).isEqualTo("https://cdn.example.test/avatar.png");
        server.verify();
    }

    @Test
    void fetchPlayerReturnsEmptyOnRateLimit() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        OpenDotaClient client = new OpenDotaClient(properties(), builder);

        server.expect(requestTo("https://api.opendota.com/api/players/" + ACCOUNT_ID))
                .andExpect(method(GET))
                .andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS));

        assertThat(client.fetchPlayer(ACCOUNT_ID)).isEmpty();
        server.verify();
    }

    @Test
    void fetchRecentMatchesParsesBasicMatchFields() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        OpenDotaClient client = new OpenDotaClient(properties(), builder);

        server.expect(requestTo("https://api.opendota.com/api/players/" + ACCOUNT_ID + "/matches?limit=2"))
                .andExpect(method(GET))
                .andRespond(withSuccess("""
                        [
                          {
                            "match_id": 7740000001,
                            "start_time": 1778544000,
                            "hero_id": 1,
                            "player_slot": 0,
                            "radiant_win": true
                          }
                        ]
                        """, MediaType.APPLICATION_JSON));

        var matches = client.fetchRecentMatches(ACCOUNT_ID, 2);

        assertThat(matches).hasSize(1);
        assertThat(matches.getFirst().matchId()).isEqualTo(7740000001L);
        assertThat(matches.getFirst().heroId()).isEqualTo(1);
        assertThat(matches.getFirst().radiantWin()).isTrue();
        server.verify();
    }

    @Test
    void fetchMatchReturnsRawMatchPayload() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        OpenDotaClient client = new OpenDotaClient(properties(), builder);

        server.expect(requestTo("https://api.opendota.com/api/matches/7894561230"))
                .andExpect(method(GET))
                .andRespond(withSuccess("""
                        {
                          "match_id": 7894561230,
                          "duration": 1900,
                          "radiant_win": true,
                          "players": []
                        }
                        """, MediaType.APPLICATION_JSON));

        var match = client.fetchMatch(7894561230L);

        assertThat(match).isPresent();
        assertThat(match.orElseThrow().path("match_id").asLong()).isEqualTo(7894561230L);
        server.verify();
    }

    @Test
    void fetchMatchReturnsEmptyWhenOpenDotaReturnsErrorPayload() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        OpenDotaClient client = new OpenDotaClient(properties(), builder);

        server.expect(requestTo("https://api.opendota.com/api/matches/7894561230"))
                .andExpect(method(GET))
                .andRespond(withSuccess("""
                        {
                          "error": "match not found"
                        }
                        """, MediaType.APPLICATION_JSON));

        assertThat(client.fetchMatch(7894561230L)).isEmpty();
        server.verify();
    }

    private static OpenDotaProperties properties() {
        return new OpenDotaProperties("https://api.opendota.com/api", "");
    }
}
