import { OrganizerCommandPage } from "@/components/organizer-command-page";
import { getMatches, getTournaments } from "@/lib/data";

export default async function OrganizerPage() {
  const [matches, fallbackTournaments] = await Promise.all([
    getMatches(),
    getTournaments()
  ]);

  return (
    <OrganizerCommandPage
      fallbackTournaments={fallbackTournaments}
      matches={matches}
    />
  );
}
