import { Eye, ShieldCheck, UsersRound } from "lucide-react";

const audiences = [
  {
    icon: ShieldCheck,
    title: "Organizatorji",
    text: "Ustvarjanje turnirjev, prijave ekip, razpored, rezultati in nadzor poteka."
  },
  {
    icon: UsersRound,
    title: "Igralci in kapetani",
    text: "Profili ekip, rosterji, zgodovina nastopov in primerljive metrike uspesnosti."
  },
  {
    icon: Eye,
    title: "Obiskovalci",
    text: "Javni pregled bracketov, razporeda, rezultatov, ekip in osnovnih statistik."
  }
];

export function AudienceStrip() {
  return (
    <section className="landing-section landing-audience" aria-labelledby="audience-title">
      <div className="landing-section-heading">
        <p className="landing-kicker">Uporabniki</p>
        <h2 id="audience-title">En tok za vse vloge turnirja</h2>
      </div>
      <div className="landing-card-grid">
        {audiences.map((audience) => {
          const Icon = audience.icon;

          return (
            <article className="landing-card" key={audience.title}>
              <Icon size={22} />
              <h3>{audience.title}</h3>
              <p>{audience.text}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
