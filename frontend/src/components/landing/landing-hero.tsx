import { Activity, ArrowRight, Brackets, DatabaseZap, Trophy } from "lucide-react";
import Link from "next/link";

export function LandingHero() {
  return (
    <section className="landing-hero" aria-label="DotaOps uvod">
      <div className="landing-hero-content">
        <p className="landing-kicker">Dota 2 tournament operations</p>
        <h1>DotaOps</h1>
        <p>
          Profesionalna dark esports platforma za organizacijo Dota 2 turnirjev,
          razpored tekem, bracket, rezultate in analitiko match podatkov.
        </p>

        <div className="landing-actions">
          <Link className="landing-button landing-button-primary" href="/dashboard">
            <span>Odpri dashboard</span>
            <ArrowRight size={18} />
          </Link>
          <Link className="landing-button landing-button-secondary" href="/turnirji">
            <span>Preglej turnirje</span>
          </Link>
        </div>
      </div>

      <div className="landing-command-panel" aria-label="Operativni pregled">
        <div className="landing-panel-header">
          <span>DotaOps Control</span>
          <strong>LIVE</strong>
        </div>
        <div className="landing-panel-grid">
          <article>
            <Trophy size={18} />
            <span>Turnirji</span>
            <strong>3 active</strong>
          </article>
          <article>
            <Brackets size={18} />
            <span>Bracket</span>
            <strong>ready</strong>
          </article>
          <article>
            <DatabaseZap size={18} />
            <span>match_id</span>
            <strong>7894561230</strong>
          </article>
          <article>
            <Activity size={18} />
            <span>Analitika</span>
            <strong>KDA + win rate</strong>
          </article>
        </div>
        <div className="landing-terminal">
          <span>import.status = processing</span>
          <span>normalize.opendota_payload = ready</span>
          <span>refresh.analytics_views = queued</span>
        </div>
      </div>
    </section>
  );
}
