package si.um.feri.dotaops.backend.team.web;

import java.util.List;

public record CurrentTeamResponse(
        TeamResponse team,
        List<TeamMemberResponse> members,
        boolean captain,
        boolean canManageRoster,
        String teamResolution
) {

    public static CurrentTeamResponse none() {
        return new CurrentTeamResponse(
                null,
                List.of(),
                false,
                false,
                "No active team found for the current profile.");
    }
}
