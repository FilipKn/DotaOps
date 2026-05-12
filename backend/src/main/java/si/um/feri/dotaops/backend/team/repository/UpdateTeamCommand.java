package si.um.feri.dotaops.backend.team.repository;

public record UpdateTeamCommand(
        String name,
        String tag,
        String slug,
        String region,
        String logoUrl,
        String description
) {
}
