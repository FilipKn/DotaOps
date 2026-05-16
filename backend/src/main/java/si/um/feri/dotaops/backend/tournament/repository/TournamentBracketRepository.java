package si.um.feri.dotaops.backend.tournament.repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import si.um.feri.dotaops.backend.tournament.domain.BracketMatch;
import si.um.feri.dotaops.backend.tournament.domain.BracketMatchSlot;
import si.um.feri.dotaops.backend.tournament.domain.BracketParticipant;
import si.um.feri.dotaops.backend.tournament.domain.MatchSlotName;
import si.um.feri.dotaops.backend.tournament.domain.MatchSlotSourceType;

@Repository
public class TournamentBracketRepository {

    private final JdbcTemplate jdbcTemplate;

    public TournamentBracketRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<BracketParticipant> findApprovedParticipants(UUID tournamentId) {
        return jdbcTemplate.query(
                """
                select
                  tr.id as registration_id,
                  tr.team_id,
                  tm.name as team_name,
                  tr.seed_number,
                  tr.created_at
                from public.tournament_registrations tr
                join public.teams tm on tm.id = tr.team_id
                where tr.tournament_id = ?
                  and tr.status = 'approved'
                order by tr.seed_number nulls last, tr.created_at asc, tm.name asc, tr.id asc
                """,
                this::mapParticipant,
                tournamentId);
    }

    public boolean publicTournamentExists(UUID tournamentId) {
        Boolean exists = jdbcTemplate.queryForObject(
                """
                select exists (
                  select 1
                  from public.tournaments t
                  where t.id = ?
                    and t.is_public = true
                    and t.status in ('registration', 'published', 'live', 'finished')
                )
                """,
                Boolean.class,
                tournamentId);

        return Boolean.TRUE.equals(exists);
    }

    public boolean bracketExists(UUID tournamentId, String stageName) {
        Boolean exists = jdbcTemplate.queryForObject(
                """
                select exists (
                  select 1
                  from public.matches m
                  where m.tournament_id = ?
                    and m.stage_name = ?
                )
                """,
                Boolean.class,
                tournamentId,
                stageName);

        return Boolean.TRUE.equals(exists);
    }

    public boolean hasBlockingMatchesForRegeneration(UUID tournamentId, String stageName) {
        Boolean exists = jdbcTemplate.queryForObject(
                """
                select exists (
                  select 1
                  from public.matches m
                  where m.tournament_id = ?
                    and m.stage_name = ?
                    and m.status in ('live', 'finished')
                    and not exists (
                      select 1
                      from public.match_slots ms
                      where ms.match_id = m.id
                        and ms.source_type = 'bye'
                    )
                )
                """,
                Boolean.class,
                tournamentId,
                stageName);

        return Boolean.TRUE.equals(exists);
    }

    public void deleteBracket(UUID tournamentId, String stageName) {
        jdbcTemplate.update(
                """
                delete from public.matches
                where tournament_id = ?
                  and stage_name = ?
                """,
                tournamentId,
                stageName);
    }

    public BracketMatch createMatch(CreateBracketMatchCommand command) {
        return jdbcTemplate.queryForObject(
                """
                insert into public.matches (
                  tournament_id,
                  stage_name,
                  round_name,
                  round_number,
                  bracket_position,
                  status,
                  best_of,
                  team_a_id,
                  team_b_id,
                  winner_team_id,
                  finished_at
                )
                values (?, ?, ?, ?, ?, ?::public.dotaops_match_status, ?, ?, ?, ?, ?)
                returning
                  id,
                  tournament_id,
                  round_number,
                  bracket_position,
                  stage_name,
                  round_name,
                  status::text as status
                """,
                this::mapMatchWithoutSlots,
                command.tournamentId(),
                command.stageName(),
                command.roundName(),
                command.roundNumber(),
                command.bracketPosition(),
                command.status(),
                command.bestOf(),
                command.teamAId(),
                command.teamBId(),
                command.winnerTeamId(),
                command.finishedAt());
    }

    public void createSlot(CreateMatchSlotCommand command) {
        jdbcTemplate.update(
                """
                insert into public.match_slots (
                  match_id,
                  slot,
                  source_type,
                  team_id,
                  source_match_id,
                  source_registration_id,
                  seed_number,
                  display_label
                )
                values (?, ?::public.dotaops_match_slot, ?::public.dotaops_match_slot_source, ?, ?, ?, ?, ?)
                """,
                command.matchId(),
                command.slot().databaseValue(),
                command.sourceType().databaseValue(),
                command.teamId(),
                command.sourceMatchId(),
                command.sourceRegistrationId(),
                command.seedNumber(),
                command.displayLabel());
    }

    public List<BracketMatch> findBracket(UUID tournamentId, String stageName) {
        List<BracketMatch> matches = jdbcTemplate.query(
                """
                select
                  m.id,
                  m.tournament_id,
                  m.round_number,
                  m.bracket_position,
                  m.stage_name,
                  m.round_name,
                  m.status::text as status
                from public.matches m
                where m.tournament_id = ?
                  and m.stage_name = ?
                order by m.round_number asc, m.bracket_position asc, m.id asc
                """,
                this::mapMatchWithoutSlots,
                tournamentId,
                stageName);

        Map<UUID, List<BracketMatchSlot>> slotsByMatchId = findSlots(tournamentId, stageName)
                .stream()
                .collect(Collectors.groupingBy(BracketMatchSlot::matchId));

        return matches.stream()
                .map(match -> new BracketMatch(
                        match.id(),
                        match.tournamentId(),
                        match.roundNumber(),
                        match.bracketPosition(),
                        match.stageName(),
                        match.roundName(),
                        match.status(),
                        slotsByMatchId.getOrDefault(match.id(), List.of())))
                .toList();
    }

    private List<BracketMatchSlot> findSlots(UUID tournamentId, String stageName) {
        return jdbcTemplate.query(
                """
                select
                  ms.id,
                  ms.match_id,
                  ms.slot::text as slot,
                  ms.source_type::text as source_type,
                  ms.team_id,
                  tm.name as team_name,
                  ms.seed_number,
                  ms.source_match_id
                from public.match_slots ms
                join public.matches m on m.id = ms.match_id
                left join public.teams tm on tm.id = ms.team_id
                where m.tournament_id = ?
                  and m.stage_name = ?
                order by m.round_number asc, m.bracket_position asc, ms.slot asc
                """,
                this::mapSlot,
                tournamentId,
                stageName);
    }

    private BracketParticipant mapParticipant(ResultSet resultSet, int rowNumber) throws SQLException {
        return new BracketParticipant(
                resultSet.getObject("registration_id", UUID.class),
                resultSet.getObject("team_id", UUID.class),
                resultSet.getString("team_name"),
                resultSet.getObject("seed_number", Integer.class),
                resultSet.getObject("created_at", OffsetDateTime.class));
    }

    private BracketMatch mapMatchWithoutSlots(ResultSet resultSet, int rowNumber) throws SQLException {
        return new BracketMatch(
                resultSet.getObject("id", UUID.class),
                resultSet.getObject("tournament_id", UUID.class),
                resultSet.getInt("round_number"),
                resultSet.getInt("bracket_position"),
                resultSet.getString("stage_name"),
                resultSet.getString("round_name"),
                resultSet.getString("status"),
                List.of());
    }

    private BracketMatchSlot mapSlot(ResultSet resultSet, int rowNumber) throws SQLException {
        MatchSlotSourceType sourceType = MatchSlotSourceType.fromDatabaseValue(resultSet.getString("source_type"));

        return new BracketMatchSlot(
                resultSet.getObject("id", UUID.class),
                resultSet.getObject("match_id", UUID.class),
                MatchSlotName.fromDatabaseValue(resultSet.getString("slot")).slotNumber(),
                sourceType,
                resultSet.getObject("team_id", UUID.class),
                resultSet.getString("team_name"),
                resultSet.getObject("seed_number", Integer.class),
                resultSet.getObject("source_match_id", UUID.class),
                sourceType == MatchSlotSourceType.BYE);
    }
}
