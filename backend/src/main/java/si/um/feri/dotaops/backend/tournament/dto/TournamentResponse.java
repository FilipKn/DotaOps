package si.um.feri.dotaops.backend.tournament.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

import si.um.feri.dotaops.backend.tournament.domain.Tournament;

public record TournamentResponse(
        UUID id,
        String slug,
        String title,
        String status,
        String format,
        UUID organizerProfileId,
        String organizerNickname,
        String description,
        String rules,
        String prizePool,
        int maxTeams,
        int teamsCount,
        long registrationsCount,
        OffsetDateTime startsAt,
        OffsetDateTime endsAt,
        OffsetDateTime registrationOpensAt,
        OffsetDateTime registrationClosesAt,
        OffsetDateTime checkInOpensAt,
        OffsetDateTime checkInClosesAt,
        String timezone,
        boolean publicVisible,
        OffsetDateTime publishedAt,
        TournamentSettingsDto settings,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {

    public static TournamentResponse from(Tournament tournament) {
        return new TournamentResponse(
                tournament.id(),
                tournament.slug(),
                tournament.title(),
                tournament.status().databaseValue(),
                tournament.format().databaseValue(),
                tournament.organizerProfileId(),
                tournament.organizerNickname(),
                tournament.description(),
                tournament.rules(),
                tournament.prizePool(),
                tournament.maxTeams(),
                tournament.maxTeams(),
                tournament.registrationsCount(),
                tournament.startsAt(),
                tournament.endsAt(),
                tournament.registrationOpensAt(),
                tournament.registrationClosesAt(),
                tournament.checkInOpensAt(),
                tournament.checkInClosesAt(),
                tournament.timezone(),
                tournament.publicVisible(),
                tournament.publishedAt(),
                TournamentSettingsDto.from(tournament.settings()),
                tournament.createdAt(),
                tournament.updatedAt());
    }
}
