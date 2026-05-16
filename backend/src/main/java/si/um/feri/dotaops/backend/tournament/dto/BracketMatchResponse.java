package si.um.feri.dotaops.backend.tournament.dto;

import java.util.List;
import java.util.UUID;

import si.um.feri.dotaops.backend.tournament.domain.BracketMatch;

public record BracketMatchResponse(
        UUID matchId,
        UUID tournamentId,
        int roundNumber,
        int bracketPosition,
        String stageName,
        String roundName,
        String status,
        List<MatchSlotResponse> slots
) {

    public static BracketMatchResponse from(BracketMatch match) {
        return new BracketMatchResponse(
                match.id(),
                match.tournamentId(),
                match.roundNumber(),
                match.bracketPosition(),
                match.stageName(),
                match.roundName(),
                match.status(),
                match.slots().stream()
                        .map(MatchSlotResponse::from)
                        .toList());
    }
}
