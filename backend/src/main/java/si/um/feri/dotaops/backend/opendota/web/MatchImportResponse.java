package si.um.feri.dotaops.backend.opendota.web;

import java.time.OffsetDateTime;
import java.util.UUID;

import si.um.feri.dotaops.backend.opendota.domain.MatchImport;
import si.um.feri.dotaops.backend.opendota.domain.MatchImportStatus;

public record MatchImportResponse(
        UUID id,
        UUID matchId,
        UUID matchGameId,
        String dotaMatchId,
        MatchImportStatus status,
        String errorMessage,
        OffsetDateTime startedAt,
        OffsetDateTime completedAt,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {

    public static MatchImportResponse from(MatchImport matchImport) {
        return new MatchImportResponse(
                matchImport.id(),
                matchImport.matchId(),
                matchImport.matchGameId(),
                matchImport.dotaMatchId(),
                matchImport.status(),
                matchImport.errorMessage(),
                matchImport.startedAt(),
                matchImport.completedAt(),
                matchImport.createdAt(),
                matchImport.updatedAt());
    }
}
