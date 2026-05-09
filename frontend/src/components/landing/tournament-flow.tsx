import { CalendarDays, CheckCircle2, GitBranch, Swords, UsersRound } from "lucide-react";

const flow = [
  {
    icon: CalendarDays,
    title: "Objava turnirja",
    text: "Format, termin, status prijav in javne informacije za ekipe."
  },
  {
    icon: UsersRound,
    title: "Prijave ekip",
    text: "Kapetani prijavijo rosterje, organizator pa potrdi sodelovanje."
  },
  {
    icon: GitBranch,
    title: "Bracket in pari",
    text: "Zreb, razpored tekem in prikaz napredovanja skozi turnir."
  },
  {
    icon: Swords,
    title: "Rezultati",
    text: "Vnos rezultatov, povezava tekem z match_id in javni prikaz stanja."
  },
  {
    icon: CheckCircle2,
    title: "Analiticni pregled",
    text: "Metrike ekip, igralcev, junakov in turnirjev po obdelavi podatkov."
  }
];

export function TournamentFlow() {
  return (
    <section className="landing-section landing-flow" aria-labelledby="flow-title">
      <div className="landing-section-heading">
        <p className="landing-kicker">Turnirski tok</p>
        <h2 id="flow-title">Od prijav do napredovanja</h2>
        <p>
          DotaOps poveze organizacijski del turnirja z javnim pregledom tekem,
          rezultati in analitiko.
        </p>
      </div>

      <div className="landing-flow-list">
        {flow.map((item, index) => {
          const Icon = item.icon;

          return (
            <article className="landing-flow-step" key={item.title}>
              <span className="landing-step-number">{String(index + 1).padStart(2, "0")}</span>
              <Icon size={20} />
              <div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
