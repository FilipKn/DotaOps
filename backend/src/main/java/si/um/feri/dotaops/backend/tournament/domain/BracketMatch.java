package si.um.feri.dotaops.backend.tournament.domain;

import java.util.List;
import java.util.UUID;

public record BracketMatch(
        UUID id,
        UUID tournamentId,
        int roundNumber,
        int bracketPosition,
        String stageName,
        String roundName,
        String status,
        List<BracketMatchSlot> slots
) {
}
