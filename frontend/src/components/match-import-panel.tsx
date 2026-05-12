"use client";

import { RefreshCw, UploadCloud } from "lucide-react";
import { FormEvent, useState } from "react";

import { StatusBadge } from "@/components/status-badge";
import { postApi } from "@/lib/api";
import type { ImportStatus, MatchImportResponse } from "@/lib/types";

export function MatchImportPanel() {
  const [matchId, setMatchId] = useState("7894561230");
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedMatchId = matchId.trim();

    if (!trimmedMatchId) {
      setStatus("error");
      setMessage("Match ID is required.");
      return;
    }

    setStatus("processing");
    setMessage(null);

    try {
      const response = await postApi<MatchImportResponse>("/match-imports", {
        dotaMatchId: trimmedMatchId
      });
      setStatus(response.status);
      setMessage(response.errorMessage ?? `match_id ${response.dotaMatchId}`);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Import failed.");
    }
  }

  return (
    <section className="import-panel">
      <div className="card-title-row">
        <div>
          <p className="eyebrow">OpenDota Flow</p>
          <h3>Match Data Import</h3>
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
        <button className="button button-primary" disabled={status === "processing"} type="submit">
          {status === "processing" ? <RefreshCw size={18} /> : <UploadCloud size={18} />}
          <span>Import</span>
        </button>
      </form>

      {message ? <p className="ops-label">{message}</p> : null}

      <div className="pipeline-grid">
        <span>Input</span>
        <span>Fetching</span>
        <span>Normalization</span>
        <span>Metrics</span>
      </div>
    </section>
  );
}
