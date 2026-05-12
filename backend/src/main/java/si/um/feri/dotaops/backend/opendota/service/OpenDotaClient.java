package si.um.feri.dotaops.backend.opendota.service;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.util.UriComponentsBuilder;

import si.um.feri.dotaops.backend.config.properties.OpenDotaProperties;
import si.um.feri.dotaops.backend.opendota.domain.OpenDotaMatchSummary;
import si.um.feri.dotaops.backend.opendota.domain.OpenDotaPlayerProfile;

@Component
public class OpenDotaClient {

    private final OpenDotaProperties properties;
    private final RestClient restClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public OpenDotaClient(OpenDotaProperties properties, RestClient.Builder restClientBuilder) {
        this.properties = properties;
        this.restClient = restClientBuilder.build();
    }

    public Optional<OpenDotaPlayerProfile> fetchPlayer(long accountId) {
        try {
            String body = restClient.get()
                    .uri(uri("/players/{accountId}", accountId))
                    .retrieve()
                    .body(String.class);
            JsonNode profile = objectMapper.readTree(body).path("profile");
            if (profile.isMissingNode() || profile.isNull()) {
                return Optional.empty();
            }

            return Optional.of(new OpenDotaPlayerProfile(
                    profile.path("account_id").asLong(accountId),
                    blankToNull(profile.path("personaname").asText(null)),
                    blankToNull(profile.path("avatarfull").asText(null)),
                    blankToNull(profile.path("profileurl").asText(null))));
        } catch (RestClientException exception) {
            return Optional.empty();
        } catch (Exception exception) {
            return Optional.empty();
        }
    }

    public List<OpenDotaMatchSummary> fetchRecentMatches(long accountId, int limit) {
        try {
            UriComponentsBuilder builder = uriBuilder("/players/{accountId}/matches", accountId);
            if (limit > 0) {
                builder.queryParam("limit", limit);
            }

            String body = restClient.get()
                    .uri(builder.build(accountId))
                    .retrieve()
                    .body(String.class);
            JsonNode matches = objectMapper.readTree(body);
            if (!matches.isArray()) {
                return List.of();
            }

            List<OpenDotaMatchSummary> result = new ArrayList<>();
            matches.forEach(match -> {
                if (match.hasNonNull("match_id")) {
                    result.add(new OpenDotaMatchSummary(
                            match.path("match_id").asLong(),
                            nullableLong(match, "start_time"),
                            nullableInt(match, "hero_id"),
                            nullableInt(match, "player_slot"),
                            nullableBoolean(match, "radiant_win")));
                }
            });
            return result;
        } catch (RestClientException exception) {
            return List.of();
        } catch (Exception exception) {
            return List.of();
        }
    }

    private URI uri(String path, long accountId) {
        return uriBuilder(path, accountId)
                .build(accountId);
    }

    private UriComponentsBuilder uriBuilder(String path, long accountId) {
        UriComponentsBuilder builder = UriComponentsBuilder
                .fromUriString(properties.baseUrl())
                .path(path);
        if (StringUtils.hasText(properties.apiKey())) {
            builder.queryParam("api_key", properties.apiKey());
        }

        return builder;
    }

    private static Long nullableLong(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.path(field).asLong() : null;
    }

    private static Integer nullableInt(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.path(field).asInt() : null;
    }

    private static Boolean nullableBoolean(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.path(field).asBoolean() : null;
    }

    private static String blankToNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }

        return value.trim();
    }
}
