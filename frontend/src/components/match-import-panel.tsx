"use client";

import { RefreshCw, UploadCloud } from "lucide-react";
import { FormEvent, useState } from "react";

import { StatusBadge } from "@/components/status-badge";
import type { ImportStatus } from "@/lib/types";

export function MatchImportPanel() {
  const [matchId, setMatchId] = useState("7894561230");
  const [status, setStatus] = useState<ImportStatus>("idle");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("processing");
    window.setTimeout(() => setStatus(matchId.trim() ? "ready" : "error"), 700);
  }

  return (
    <section className="import-panel">
      <div className="card-title-row">
        <div>
          <p className="eyebrow">OpenDota tok</p>
          <h3>Uvoz match podatkov</h3>
        </div>
        <StatusBadge status={status} />
      </div>

      <form className="import-form" onSubmit={handleSubmit}>
        <label>
          <span>Match ID</span>
          <input
            inputMode="numeric"
            onChange={(event) => setMatchId(event.target.value)}
            placeholder="7894561230"
            value={matchId}
          />
        </label>
        <button className="button button-primary" type="submit">
          {status === "processing" ? <RefreshCw size={18} /> : <UploadCloud size={18} />}
          <span>Uvozi</span>
        </button>
      </form>

      <div className="pipeline-grid">
        <span>Vnos</span>
        <span>Pridobivanje</span>
        <span>Normalizacija</span>
        <span>Metrike</span>
      </div>
    </section>
  );
}
