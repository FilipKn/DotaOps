package si.um.feri.dotaops.backend.tournament.dto;

import java.util.UUID;

import si.um.feri.dotaops.backend.tournament.domain.PublicTournamentTeam;

public record PublicTeamResponse(
        UUID id,
        String name,
        String tag,
        String slug,
        String logoUrl,
        Integer seedNumber
) {

    public static PublicTeamResponse from(PublicTournamentTeam team) {
        if (team == null) {
            return null;
        }

        return new PublicTeamResponse(
                team.id(),
                team.name(),
                team.tag(),
                team.slug(),
                team.logoUrl(),
                team.seedNumber());
    }
}
