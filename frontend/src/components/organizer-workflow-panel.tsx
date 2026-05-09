import { CalendarDays, DatabaseZap, GitBranch, Send, UsersRound } from "lucide-react";

const workflow = [
  {
    detail: "Osnovni podatki, format in zacetek",
    icon: CalendarDays,
    label: "Turnir"
  },
  {
    detail: "Kapetani, rosterji in potrditve",
    icon: UsersRound,
    label: "Prijave"
  },
  {
    detail: "Pari, rezultati in napredovanje",
    icon: GitBranch,
    label: "Bracket"
  },
  {
    detail: "match_id, normalizacija in metrike",
    icon: DatabaseZap,
    label: "OpenDota"
  },
  {
    detail: "Javni pogled in objava rezultatov",
    icon: Send,
    label: "Objava"
  }
];

export function OrganizerWorkflowPanel() {
  return (
    <div className="organizer-workflow-panel">
      {workflow.map((step, index) => (
        <article key={step.label}>
          <span className="ops-mono">P{index + 1}</span>
          <step.icon size={18} />
          <div>
            <strong>{step.label}</strong>
            <p className="ops-mono">{step.detail}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
