import { Save, Send } from "lucide-react";

import { MatchImportPanel } from "@/components/match-import-panel";
import { PriorityRoadmap } from "@/components/priority-roadmap";
import { SectionHeader } from "@/components/section-header";
import { roadmap, tournaments } from "@/lib/mock-data";

export default function OrganizerPage() {
  const registrationTournament = tournaments.find(
    (tournament) => tournament.status === "registration"
  );

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">Organizator</p>
          <h1>Upravljanje turnirjev</h1>
          <p>
            Delovni prostor za ustvarjanje turnirjev, prijave ekip, pare,
            rezultate in uvoz Dota 2 match podatkov.
          </p>
        </div>
      </section>

      <section className="content-grid">
        <div className="panel panel-large">
          <SectionHeader
            eyebrow="Obrazec"
            title="Osnovni podatki turnirja"
            description="Polja so pripravljena za povezavo z validacijami in Spring Boot API-jem."
          />

          <form className="form-grid">
            <label>
              <span>Naziv turnirja</span>
              <input defaultValue={registrationTournament?.title ?? ""} />
            </label>
            <label>
              <span>Format</span>
              <select defaultValue={registrationTournament?.format ?? "Single elimination"}>
                <option>Single elimination</option>
                <option>Groups + playoff</option>
                <option>Best of 3 playoff</option>
              </select>
            </label>
            <label>
              <span>Zacetek</span>
              <input defaultValue="2026-05-20T19:00" type="datetime-local" />
            </label>
            <label>
              <span>Stevilo ekip</span>
              <input defaultValue={registrationTournament?.teamsCount ?? 8} min={2} type="number" />
            </label>
            <label className="form-wide">
              <span>Opis</span>
              <textarea defaultValue={registrationTournament?.description ?? ""} rows={4} />
            </label>
            <div className="form-actions">
              <button className="button button-secondary" type="button">
                <Save size={18} />
                <span>Shrani osnutek</span>
              </button>
              <button className="button button-primary" type="button">
                <Send size={18} />
                <span>Objavi</span>
              </button>
            </div>
          </form>
        </div>

        <MatchImportPanel />
      </section>

      <section className="panel">
        <SectionHeader
          eyebrow="Plan izvedbe"
          title="Iteracije projekta"
          description="Sklep iz projektnega dokumenta, uporaben kot frontend roadmap."
        />
        <PriorityRoadmap items={roadmap} />
      </section>
    </div>
  );
}
