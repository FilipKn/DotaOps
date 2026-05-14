package si.um.feri.dotaops.backend.opendota.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import si.um.feri.dotaops.backend.auth.domain.AuthenticatedActor;
import si.um.feri.dotaops.backend.auth.service.CurrentUserProvider;
import si.um.feri.dotaops.backend.common.error.BadRequestException;
import si.um.feri.dotaops.backend.common.error.ResourceNotFoundException;
import si.um.feri.dotaops.backend.opendota.domain.MatchImport;
import si.um.feri.dotaops.backend.opendota.domain.MatchImportStatus;
import si.um.feri.dotaops.backend.opendota.domain.MatchPlayerImport;
import si.um.feri.dotaops.backend.opendota.repository.MatchImportRepository;
import si.um.feri.dotaops.backend.opendota.web.CreateMatchImportRequest;
import si.um.feri.dotaops.backend.opendota.web.MatchImportResponse;

@Service
public class MatchImportService {

    private static final String FETCH_FAILED_MESSAGE = "OpenDota match was not found or could not be fetched.";

    private final MatchImportRepository matchImportRepository;
    private final CurrentUserProvider currentUserProvider;
    private final OpenDotaClient openDotaClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public MatchImportService(
            MatchImportRepository matchImportRepository,
            CurrentUserProvider currentUserProvider,
            OpenDotaClient openDotaClient
    ) {
        this.matchImportRepository = matchImportRepository;
        this.currentUserProvider = currentUserProvider;
        this.openDotaClient = openDotaClient;
    }

    public MatchImportResponse importMatch(CreateMatchImportRequest request) {
        String dotaMatchId = normalizeDotaMatchId(request.dotaMatchId());
        long parsedMatchId = parseDotaMatchId(dotaMatchId);
        AuthenticatedActor actor = currentUserProvider.requireActor();
        if (!actor.isOrganizer()) {
            throw new AccessDeniedException("Only organizers or admins can import matches.");
        }
        UUID requestedBy = actor.requireProfileId();

        Optional<MatchImport> existing = matchImportRepository.findByDotaMatchId(dotaMatchId);
        if (existing.isPresent()
                && (existing.orElseThrow().status() == MatchImportStatus.READY
                || existing.orElseThrow().status() == MatchImportStatus.PROCESSING)) {
            return MatchImportResponse.from(existing.orElseThrow());
        }

        MatchImport startedImport = existing
                .map(matchImport -> matchImportRepository.markProcessing(matchImport.id())
                        .orElseThrow(() -> new ResourceNotFoundException("Match import", "id", matchImport.id())))
                .orElseGet(() -> createProcessingImport(dotaMatchId, requestedBy));

        return MatchImportResponse.from(fetchAndStoreMatch(startedImport.id(), parsedMatchId));
    }

    private MatchImport createProcessingImport(String dotaMatchId, UUID requestedBy) {
        try {
            return matchImportRepository.createProcessing(dotaMatchId, requestedBy);
        } catch (DataIntegrityViolationException exception) {
            return matchImportRepository.findByDotaMatchId(dotaMatchId)
                    .orElseThrow(() -> new BadRequestException("Match import already exists but could not be loaded."));
        }
    }

    private MatchImport fetchAndStoreMatch(UUID importId, long dotaMatchId) {
        Optional<JsonNode> rawMatch = openDotaClient.fetchMatch(dotaMatchId);
        if (rawMatch.isEmpty()) {
            return matchImportRepository.markError(importId, FETCH_FAILED_MESSAGE)
                    .orElseThrow(() -> new ResourceNotFoundException("Match import", "id", importId));
        }

        try {
            return matchImportRepository.markReady(
                            importId,
                            objectMapper.writeValueAsString(rawMatch.orElseThrow()),
                            objectMapper.writeValueAsString(normalizeMatchPayload(rawMatch.orElseThrow())),
                            extractPlayers(rawMatch.orElseThrow()))
                    .orElseThrow(() -> new ResourceNotFoundException("Match import", "id", importId));
        } catch (Exception exception) {
            return matchImportRepository.markError(importId, "OpenDota match payload could not be normalized.")
                    .orElseThrow(() -> new ResourceNotFoundException("Match import", "id", importId));
        }
    }

    private JsonNode normalizeMatchPayload(JsonNode rawMatch) {
        ObjectNode normalized = objectMapper.createObjectNode();
        copyLong(rawMatch, normalized, "match_id");
        copyLong(rawMatch, normalized, "start_time");
        copyInt(rawMatch, normalized, "duration");
        copyBoolean(rawMatch, normalized, "radiant_win");

        ArrayNode players = normalized.putArray("players");
        JsonNode rawPlayers = rawMatch.path("players");
        if (rawPlayers.isArray()) {
            rawPlayers.forEach(player -> {
                ObjectNode normalizedPlayer = players.addObject();
                copyLong(player, normalizedPlayer, "account_id");
                copyInt(player, normalizedPlayer, "player_slot");
                copyInt(player, normalizedPlayer, "hero_id");
                copyInt(player, normalizedPlayer, "kills");
                copyInt(player, normalizedPlayer, "deaths");
                copyInt(player, normalizedPlayer, "assists");
                copyInt(player, normalizedPlayer, "last_hits");
                copyInt(player, normalizedPlayer, "denies");
                copyInt(player, normalizedPlayer, "gold_per_min");
                copyInt(player, normalizedPlayer, "xp_per_min");
            });
        }

        return normalized;
    }

    private List<MatchPlayerImport> extractPlayers(JsonNode rawMatch) throws Exception {
        JsonNode rawPlayers = rawMatch.path("players");
        if (!rawPlayers.isArray()) {
            return List.of();
        }

        Integer durationSeconds = nullableInt(rawMatch, "duration");
        Boolean radiantWin = nullableBoolean(rawMatch, "radiant_win");
        List<MatchPlayerImport> players = new ArrayList<>();

        for (JsonNode player : rawPlayers) {
            if (!player.hasNonNull("player_slot")) {
                continue;
            }

            int playerSlot = player.path("player_slot").asInt();
            Boolean radiant = playerSlot < 128;
            Boolean winner = radiantWin == null ? null : radiantWin.equals(radiant);

            players.add(new MatchPlayerImport(
                    nullableLongAsString(player, "account_id"),
                    nullableInt(player, "hero_id"),
                    playerSlot,
                    radiant,
                    winner,
                    nonNegativeInt(player, "kills"),
                    nonNegativeInt(player, "deaths"),
                    nonNegativeInt(player, "assists"),
                    nonNegativeInt(player, "last_hits"),
                    nonNegativeInt(player, "denies"),
                    nullableInt(player, "gold_per_min"),
                    nullableInt(player, "xp_per_min"),
                    nullableInt(player, "net_worth"),
                    nullableInt(player, "hero_damage"),
                    nullableInt(player, "tower_damage"),
                    nullableInt(player, "hero_healing"),
                    nullableInt(player, "level"),
                    durationSeconds,
                    objectMapper.writeValueAsString(player)));
        }

        return players;
    }

    private void copyLong(JsonNode source, ObjectNode target, String fieldName) {
        if (source.hasNonNull(fieldName)) {
            target.put(fieldName, source.path(fieldName).asLong());
        }
    }

    private void copyInt(JsonNode source, ObjectNode target, String fieldName) {
        if (source.hasNonNull(fieldName)) {
            target.put(fieldName, source.path(fieldName).asInt());
        }
    }

    private void copyBoolean(JsonNode source, ObjectNode target, String fieldName) {
        if (source.hasNonNull(fieldName)) {
            target.put(fieldName, source.path(fieldName).asBoolean());
        }
    }

    private Integer nullableInt(JsonNode source, String fieldName) {
        return source.hasNonNull(fieldName) ? source.path(fieldName).asInt() : null;
    }

    private Boolean nullableBoolean(JsonNode source, String fieldName) {
        return source.hasNonNull(fieldName) ? source.path(fieldName).asBoolean() : null;
    }

    private String nullableLongAsString(JsonNode source, String fieldName) {
        return source.hasNonNull(fieldName) ? Long.toString(source.path(fieldName).asLong()) : null;
    }

    private int nonNegativeInt(JsonNode source, String fieldName) {
        if (!source.hasNonNull(fieldName)) {
            return 0;
        }

        return Math.max(0, source.path(fieldName).asInt());
    }

    private String normalizeDotaMatchId(String value) {
        if (!StringUtils.hasText(value)) {
            throw new BadRequestException("Dota match id is required.");
        }

        String normalized = value.trim();
        if (!normalized.matches("^[0-9]{1,20}$")) {
            throw new BadRequestException("Dota match id must contain digits only.");
        }

        return normalized;
    }

    private long parseDotaMatchId(String value) {
        try {
            long matchId = Long.parseLong(value);
            if (matchId <= 0) {
                throw new BadRequestException("Dota match id must be positive.");
            }

            return matchId;
        } catch (NumberFormatException exception) {
            throw new BadRequestException("Dota match id is too large.");
        }
    }
}
