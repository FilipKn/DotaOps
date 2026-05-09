import { DatabaseZap, Hash, LineChart, RefreshCw } from "lucide-react";

const pipeline = [
  {
    icon: Hash,
    label: "match_id",
    value: "7894561230"
  },
  {
    icon: RefreshCw,
    label: "OpenDota",
    value: "processing"
  },
  {
    icon: DatabaseZap,
    label: "Normalizacija",
    value: "ready"
  },
  {
    icon: LineChart,
    label: "Metrike",
    value: "KDA / win rate"
  }
];

export function OpenDotaPipeline() {
  return (
    <section className="landing-section landing-pipeline" aria-labelledby="pipeline-title">
      <div className="landing-section-heading">
        <p className="landing-kicker">OpenDota pipeline</p>
        <h2 id="pipeline-title">Uvoz match podatkov brez zmede</h2>
        <p>
          Po vnosu match_id sistem vodi stanje obdelave in pripravi podatke za
          profile, ekipe, junake in turnirske primerjave.
        </p>
      </div>

      <div className="landing-pipeline-grid">
        {pipeline.map((item) => {
          const Icon = item.icon;

          return (
            <article className="landing-pipeline-card" key={item.label}>
              <Icon size={20} />
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </article>
          );
        })}
      </div>
    </section>
  );
}
