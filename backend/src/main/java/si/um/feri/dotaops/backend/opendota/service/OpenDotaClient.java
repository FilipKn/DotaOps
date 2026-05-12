package si.um.feri.dotaops.backend.opendota.service;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
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

    private static final Logger LOGGER = LoggerFactory.getLogger(OpenDotaClient.class);

    private final OpenDotaProperties properties;
    private final RestClient restClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public OpenDotaClient(
            OpenDotaProperties properties,
            @Qualifier("openDotaRestClientBuilder") RestClient.Builder restClientBuilder
    ) {
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
            LOGGER.warn("OpenDota player fetch failed for account {}.", accountId, exception);
            return Optional.empty();
        } catch (Exception exception) {
            LOGGER.warn("OpenDota player payload could not be parsed for account {}.", accountId, exception);
            return Optional.empty();
        }
    }

    public Optional<JsonNode> fetchMatch(long matchId) {
        if (matchId <= 0) {
            return Optional.empty();
        }

        try {
            String body = restClient.get()
                    .uri(uri("/matches/{matchId}", matchId))
                    .retrieve()
                    .body(String.class);
            JsonNode match = objectMapper.readTree(body);
            if (!match.isObject() || match.hasNonNull("error") || !match.hasNonNull("match_id")) {
                return Optional.empty();
            }

            return Optional.of(match);
        } catch (RestClientException exception) {
            LOGGER.warn("OpenDota match fetch failed for match {}.", matchId, exception);
            return Optional.empty();
        } catch (Exception exception) {
            LOGGER.warn("OpenDota match payload could not be parsed for match {}.", matchId, exception);
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
            LOGGER.warn("OpenDota recent matches fetch failed for account {}.", accountId, exception);
            return List.of();
        } catch (Exception exception) {
            LOGGER.warn("OpenDota recent matches payload could not be parsed for account {}.", accountId, exception);
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
