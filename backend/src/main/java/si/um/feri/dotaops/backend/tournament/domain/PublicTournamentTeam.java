package si.um.feri.dotaops.backend.tournament.domain;

import java.util.UUID;

public record PublicTournamentTeam(
        UUID id,
        String name,
        String tag,
        String slug,
        String logoUrl,
        Integer seedNumber
) {
}
