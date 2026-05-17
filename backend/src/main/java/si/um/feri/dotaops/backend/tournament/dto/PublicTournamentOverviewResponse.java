package si.um.feri.dotaops.backend.tournament.dto;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import si.um.feri.dotaops.backend.tournament.domain.Tournament;

public record PublicTournamentOverviewResponse(
        UUID id,
        String slug,
        String title,
        String description,
        String rules,
        String status,
        String format,
        String game,
        OffsetDateTime startsAt,
        OffsetDateTime endsAt,
        OffsetDateTime registrationOpensAt,
        OffsetDateTime registrationClosesAt,
        String timezone,
        int maxTeams,
        String organizer,
        String prizePool,
        OffsetDateTime publishedAt,
        TournamentSettingsDto settings,
        List<PublicTeamResponse> teams,
        List<PublicTournamentGroupResponse> groups,
        List<PublicTournamentMatchResponse> matches,
        PublicTournamentMetricsResponse metrics,
        PublicTournamentLinksResponse links
) {

    private static final String GAME = "Dota 2";

    public static PublicTournamentOverviewResponse from(
            Tournament tournament,
            List<PublicTeamResponse> teams,
            List<PublicTournamentGroupResponse> groups,
            List<PublicTournamentMatchResponse> matches,
            PublicTournamentMetricsResponse metrics
    ) {
        return new PublicTournamentOverviewResponse(
                tournament.id(),
                tournament.slug(),
                tournament.title(),
                tournament.description(),
                tournament.rules(),
                tournament.status().databaseValue(),
                tournament.format().databaseValue(),
                GAME,
                tournament.startsAt(),
                tournament.endsAt(),
                tournament.registrationOpensAt(),
                tournament.registrationClosesAt(),
                tournament.timezone(),
                tournament.maxTeams(),
                tournament.organizerNickname(),
                tournament.prizePool(),
                tournament.publishedAt(),
                TournamentSettingsDto.from(tournament.settings()),
                teams,
                groups,
                matches,
                metrics,
                PublicTournamentLinksResponse.forTournament(tournament.id()));
    }
}
