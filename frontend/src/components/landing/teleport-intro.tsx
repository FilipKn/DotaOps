import { ArrowDown, Gauge, ShieldCheck, Terminal } from "lucide-react";
import Link from "next/link";

export function TeleportIntro() {
  return (
    <section className="landing-teleport teleport-screen" aria-label="DotaOps intro">
      <div className="teleport-backdrop" aria-hidden="true">
        <div className="teleport-gate" />
        <div className="teleport-grid" />
        <div className="teleport-scanline" />
      </div>

      <div className="teleport-corners" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>

      <div className="teleport-content">
        <div className="teleport-kicker">
          <span />
          <p className="ops-mono">SYSTEM INITIALIZING V3.14</p>
          <span />
        </div>

        <div className="teleport-wordmark" aria-label="DotaOps">
          <span>Dota</span>
          <strong>Ops</strong>
        </div>

        <p className="teleport-description ops-mono">
          Operativni center za Dota 2 turnirje in match analitiko.
        </p>

        <div className="teleport-meta" aria-label="Sistemski status">
          <article>
            <ShieldCheck size={17} />
            <span className="ops-label">Security layer</span>
            <strong className="ops-data">ENCRYPTED</strong>
          </article>
          <article>
            <Terminal size={17} />
            <span className="ops-label">Data stream</span>
            <strong className="ops-data">ACTIVE</strong>
          </article>
          <article>
            <Gauge size={17} />
            <span className="ops-label">Uptime</span>
            <strong className="ops-data">99.99%</strong>
          </article>
        </div>
      </div>

      <div className="teleport-bottom">
        <div className="teleport-scroll-cue">
          <span className="ops-label">Scroll za vstop</span>
          <div aria-hidden="true">
            <ArrowDown size={16} />
          </div>
        </div>

        <Link className="teleport-dashboard-link ops-button-secondary" href="/dashboard">
          Odpri dashboard
        </Link>
      </div>
    </section>
  );
}
