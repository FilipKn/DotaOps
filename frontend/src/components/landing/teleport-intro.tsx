"use client";

import { ArrowDown, Gauge, ShieldCheck, Terminal } from "lucide-react";
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

        <div className="teleport-preview" aria-label="Dashboard preview">
          <div className="teleport-preview-topline">
            <span className="ops-label">Command preview</span>
            <strong className="ops-data">ONLINE</strong>
          </div>
          <div className="teleport-preview-grid">
            <span />
            <span />
            <span />
            <span />
          </div>
          <p className="ops-mono">Dashboard, turnirji, ekipe in analitika so pripravljeni.</p>
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
