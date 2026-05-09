"use client";

import { ArrowDown, BarChart3, Gauge, ShieldCheck, Terminal, Trophy } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";

export function TeleportIntro() {
  const stageRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const frame = frameRef.current;

    if (!stage || !frame) {
      return;
    }

    const stageElement = stage;
    const frameElement = frame;
    let animationFrame = 0;

    function getPhase(progress: number, start: number, end: number) {
      return Math.min(Math.max((progress - start) / (end - start), 0), 1);
    }

    function updateProgress() {
      const rect = stageElement.getBoundingClientRect();
      const scrollRange = Math.max(stageElement.offsetHeight - window.innerHeight, 1);
      const nextProgress = Math.min(Math.max(-rect.top / scrollRange, 0), 1);
      const activation = getPhase(nextProgress, 0.25, 0.55);
      const surge = getPhase(nextProgress, 0.55, 0.8);
      const arrival = getPhase(nextProgress, 0.8, 1);

      frameElement.style.setProperty("--teleport-progress", nextProgress.toFixed(4));
      frameElement.style.setProperty("--teleport-activation", activation.toFixed(4));
      frameElement.style.setProperty("--teleport-surge", surge.toFixed(4));
      frameElement.style.setProperty("--teleport-arrival", arrival.toFixed(4));
    }

    function requestUpdate() {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(updateProgress);
    }

    updateProgress();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, []);

  return (
    <section className="landing-teleport teleport-stage" ref={stageRef} aria-label="DotaOps intro">
      <div className="teleport-screen teleport-frame" ref={frameRef}>
        <div className="teleport-backdrop" aria-hidden="true">
          <div className="teleport-gate" />
          <div className="teleport-rings">
            <span />
            <span />
            <span />
          </div>
          <div className="teleport-energy-lines">
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="teleport-portal-fragments">
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
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

        <div className="teleport-preview" aria-label="Command center preview">
          <div className="teleport-preview-screen">
            <div className="teleport-preview-topline">
              <span className="ops-label">DotaOps Command Center</span>
              <strong className="ops-data">ONLINE</strong>
            </div>

            <div className="teleport-preview-app">
              <div className="teleport-preview-sidebar" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
              </div>

              <div className="teleport-preview-main">
                <div className="teleport-preview-hero">
                  <span className="ops-label">Komandni center</span>
                  <strong>Turnirski sistem pripravljen</strong>
                </div>

                <div className="teleport-preview-grid">
                  <article>
                    <span className="ops-label">Turnirji</span>
                    <strong className="ops-data">3</strong>
                  </article>
                  <article>
                    <span className="ops-label">Tekme</span>
                    <strong className="ops-data">48</strong>
                  </article>
                  <article>
                    <span className="ops-label">Ekipe</span>
                    <strong className="ops-data">24</strong>
                  </article>
                </div>

                <div className="teleport-preview-rows" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
          </div>

          <div className="teleport-system-summary" aria-label="Sistemski povzetek">
            <span className="ops-mono">TURNIRJI ONLINE</span>
            <span className="ops-mono">MATCH DATA READY</span>
            <span className="ops-mono">ANALYTICS ACTIVE</span>
          </div>

          <div className="teleport-entry-actions">
            <Link className="teleport-entry-primary" href="/dashboard">
              <Terminal size={17} />
              <span>Odpri command center</span>
            </Link>
            <Link className="teleport-entry-secondary" href="/turnirji">
              <Trophy size={17} />
              <span>Preglej turnirje</span>
            </Link>
            <Link className="teleport-entry-chip" href="/analitika">
              <BarChart3 size={15} />
              <span>Analitika</span>
            </Link>
          </div>
        </div>

        <div className="teleport-status-stack" aria-label="Teleport status">
          <span className="ops-mono">SYSTEM INITIALIZING</span>
          <span className="ops-mono">ACCESS GRANTED</span>
          <span className="ops-mono">COMMAND CENTER ONLINE</span>
        </div>

        <div className="teleport-bottom">
          <div className="teleport-scroll-cue">
            <span className="ops-label">Scroll za vstop</span>
            <div aria-hidden="true">
              <ArrowDown size={16} />
            </div>
          </div>

          <Link className="teleport-dashboard-link ops-button-secondary" href="/dashboard">
            Odpri command center
          </Link>
        </div>
      </div>
    </section>
  );
}
