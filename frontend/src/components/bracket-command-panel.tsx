import { BracketView } from "@/components/bracket-view";
import { SectionHeader } from "@/components/section-header";
import type { Match } from "@/lib/types";

interface BracketCommandPanelProps {
  matches: Match[];
}

export function BracketCommandPanel({ matches }: BracketCommandPanelProps) {
  return (
    <section className="bracket-command-panel ops-panel">
      <SectionHeader
        eyebrow="Bracket control"
        title="Napredovanje ekip"
        description="Vizualni pregled krogov, rezultatov in odprtih mest v turnirskem toku."
      />
      <BracketView matches={matches} />
    </section>
  );
}
