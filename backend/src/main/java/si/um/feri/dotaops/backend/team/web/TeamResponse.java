package si.um.feri.dotaops.backend.team.web;

import java.time.OffsetDateTime;
import java.util.UUID;

import si.um.feri.dotaops.backend.team.domain.Team;

public record TeamResponse(
        UUID id,
        String name,
        String tag,
        String slug,
        UUID captainProfileId,
        String captainNickname,
        String region,
        String logoUrl,
        String description,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {

    public static TeamResponse from(Team team) {
        return new TeamResponse(
                team.id(),
                team.name(),
                team.tag(),
                team.slug(),
                team.captainProfileId(),
                team.captainNickname(),
                team.region(),
                team.logoUrl(),
                team.description(),
                team.createdAt(),
                team.updatedAt());
    }
}
