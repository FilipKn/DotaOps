"use client";

import {
  AlertTriangle,
  Archive,
  ArrowLeft,
  CalendarDays,
  Check,
  ClipboardList,
  Edit3,
  Eye,
  FileText,
  Globe2,
  Plus,
  RadioTower,
  Rocket,
  Save,
  ShieldCheck,
  Trophy,
  UsersRound,
  X
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { ApiRequestError, type ApiFieldError } from "@/lib/api";
import { getCurrentUserProfile, type ProfileRole } from "@/lib/auth";
import {
  archiveOrganizerTournament,
  approveOrganizerRegistration,
  createOrganizerTournament,
  getOrganizerTournament,
  listOrganizerTournamentRegistrations,
  listOrganizerTournaments,
  publishOrganizerTournament,
  rejectOrganizerRegistration,
  updateOrganizerTournament,
  waitlistOrganizerRegistration,
  type OrganizerTournament,
  type OrganizerTournamentFormat,
  type OrganizerTournamentPayload,
  type OrganizerTournamentRegistration,
  type OrganizerTournamentStatus
} from "@/lib/organizer-tournament-data";
import { classNames } from "@/lib/utils";

type OrganizerView = "dashboard" | "form" | "detail";
type FormMode = "create" | "edit";
type LoadState = "loading" | "ready" | "login" | "permission" | "error";

interface TournamentFormState {
  allowSubstitutes: boolean;
  bestOf: string;
  checkInClosesAt: string;
  checkInEnabled: boolean;
  checkInOpensAt: string;
  description: string;
  endsAt: string;
  format: OrganizerTournamentFormat;
  maxTeams: string;
  minTeams: string;
  prizePool: string;
  registrationClosesAt: string;
  registrationOpensAt: string;
  rules: string;
  slug: string;
  startsAt: string;
  teamSize: string;
  timezone: string;
  title: string;
}

const formatOptions: Array<{ label: string; value: OrganizerTournamentFormat }> = [
  { label: "Single Elimination", value: "single_elimination" },
  { label: "Double Elimination / Playoff", value: "best_of_three_playoff" },
  { label: "Round Robin", value: "round_robin" },
  { label: "Group Stage + Playoff", value: "groups_playoff" }
];

const statusFlow: OrganizerTournamentStatus[] = [
  "draft",
  "published",
  "live",
  "finished",
  "archived"
];

function emptyForm(): TournamentFormState {
  return {
    allowSubstitutes: true,
    bestOf: "3",
    checkInClosesAt: "",
    checkInEnabled: false,
    checkInOpensAt: "",
    description: "",
    endsAt: "",
    format: "single_elimination",
    maxTeams: "8",
    minTeams: "2",
    prizePool: "",
    registrationClosesAt: "",
    registrationOpensAt: "",
    rules: "",
    slug: "",
    startsAt: "",
    teamSize: "5",
    timezone: "UTC",
    title: ""
  };
}

function toLocalInput(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);

  return local.toISOString().slice(0, 16);
}

function fromLocalInput(value: string) {
  return value ? new Date(value).toISOString() : null;
}

function formFromTournament(tournament: OrganizerTournament): TournamentFormState {
  return {
    allowSubstitutes: tournament.settings.allowSubstitutes,
    bestOf: String(tournament.settings.bestOf),
    checkInClosesAt: toLocalInput(tournament.checkInClosesAt),
    checkInEnabled: tournament.settings.checkInEnabled,
    checkInOpensAt: toLocalInput(tournament.checkInOpensAt),
    description: tournament.description ?? "",
    endsAt: toLocalInput(tournament.endsAt),
    format: tournament.format,
    maxTeams: String(tournament.maxTeams),
    minTeams: String(tournament.settings.minTeams),
    prizePool: tournament.prizePool ?? "",
    registrationClosesAt: toLocalInput(tournament.registrationClosesAt),
    registrationOpensAt: toLocalInput(tournament.registrationOpensAt),
    rules: tournament.rules ?? "",
    slug: tournament.slug,
    startsAt: toLocalInput(tournament.startsAt),
    teamSize: String(tournament.settings.teamSize),
    timezone: tournament.timezone,
    title: tournament.title
  };
}

function nullableText(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function nullableNumber(value: string) {
  if (!value.trim()) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function payloadFromForm(form: TournamentFormState): OrganizerTournamentPayload {
  const maxTeams = nullableNumber(form.maxTeams) ?? 8;

  return {
    checkInClosesAt: fromLocalInput(form.checkInClosesAt),
    checkInOpensAt: fromLocalInput(form.checkInOpensAt),
    description: nullableText(form.description),
    endsAt: fromLocalInput(form.endsAt),
    format: form.format,
    maxTeams,
    prizePool: nullableText(form.prizePool),
    registrationClosesAt: fromLocalInput(form.registrationClosesAt),
    registrationOpensAt: fromLocalInput(form.registrationOpensAt),
    rules: nullableText(form.rules),
    settings: {
      allowSubstitutes: form.allowSubstitutes,
      bestOf: nullableNumber(form.bestOf) ?? 3,
      checkInEnabled: form.checkInEnabled,
      format: form.format,
      maxTeams,
      minTeams: nullableNumber(form.minTeams) ?? 2,
      teamSize: nullableNumber(form.teamSize) ?? 5
    },
    slug: nullableText(form.slug),
    startsAt: fromLocalInput(form.startsAt),
    timezone: nullableText(form.timezone),
    title: form.title.trim()
  };
}

function statusLabel(status: string) {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatLabel(format: OrganizerTournamentFormat | string) {
  return formatOptions.find((option) => option.value === format)?.label ?? statusLabel(format);
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function statusClass(status: string) {
  return `org-tournament-status-${status.replace(/_/g, "-")}`;
}

function canPublish(status: OrganizerTournamentStatus) {
  return status === "draft" || status === "registration" || status === "published";
}

function canArchive(status: OrganizerTournamentStatus) {
  return status !== "archived";
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Request failed.";
}

function fieldError(errors: ApiFieldError[], field: string) {
  return errors.find((error) => error.field === field || error.field?.endsWith(`.${field}`))?.message ?? null;
}

function dashboardCounts(tournaments: OrganizerTournament[]) {
  return {
    archived: tournaments.filter((tournament) => tournament.status === "archived").length,
    drafts: tournaments.filter((tournament) => tournament.status === "draft").length,
    finished: tournaments.filter((tournament) => tournament.status === "finished").length,
    live: tournaments.filter((tournament) => tournament.status === "live").length,
    published: tournaments.filter((tournament) => tournament.status === "published" || tournament.status === "registration").length
  };
}

function canAccessOrganizer(role?: ProfileRole | null) {
  return role === "organizer" || role === "admin";
}

export function OrganizerCommandPage() {
  const [actionError, setActionError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ApiFieldError[]>([]);
  const [form, setForm] = useState<TournamentFormState>(emptyForm);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [isMutating, setIsMutating] = useState(false);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [notice, setNotice] = useState<string | null>(null);
  const [registrations, setRegistrations] = useState<OrganizerTournamentRegistration[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<OrganizerTournament | null>(null);
  const [tournaments, setTournaments] = useState<OrganizerTournament[]>([]);
  const [view, setView] = useState<OrganizerView>("dashboard");

  const loadTournaments = useCallback(async () => {
    setLoadState("loading");
    setActionError(null);

    try {
      const nextTournaments = await listOrganizerTournaments();
      setTournaments(nextTournaments);
      setLoadState("ready");
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401) {
        setLoadState("login");
        setActionError("Login session expired. Please log in again.");
        return;
      }

      if (error instanceof ApiRequestError && error.status === 403) {
        setLoadState("permission");
        setActionError("Organizer access is required for this tournament interface.");
        return;
      }

      setLoadState("error");
      setActionError(errorMessage(error));
    }
  }, []);

  const loadOrganizerAccess = useCallback(async () => {
    setLoadState("loading");
    setActionError(null);
    setFieldErrors([]);
    setNotice(null);

    try {
      const profile = await getCurrentUserProfile();

      if (!profile) {
        setTournaments([]);
        setLoadState("login");
        setActionError("Login is required before opening organizer tournament controls.");
        return;
      }

      if (!canAccessOrganizer(profile.role)) {
        setTournaments([]);
        setLoadState("permission");
        setActionError("This section is only available to tournament organizers.");
        return;
      }

      await loadTournaments();
    } catch (error) {
      setTournaments([]);
      setLoadState("error");
      setActionError(errorMessage(error));
    }
  }, [loadTournaments]);

  async function loadDetail(tournamentId: string) {
    setIsMutating(true);
    setActionError(null);
    setFieldErrors([]);

    try {
      const [tournament, registrationList] = await Promise.all([
        getOrganizerTournament(tournamentId),
        listOrganizerTournamentRegistrations(tournamentId).catch(() => [])
      ]);

      setSelectedTournament(tournament);
      setRegistrations(registrationList);
      setView("detail");
    } catch (error) {
      setActionError(errorMessage(error));
    } finally {
      setIsMutating(false);
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadOrganizerAccess(), 0);

    return () => window.clearTimeout(timeout);
  }, [loadOrganizerAccess]);

  const counts = useMemo(() => dashboardCounts(tournaments), [tournaments]);

  function clearMessages() {
    setActionError(null);
    setFieldErrors([]);
    setNotice(null);
  }

  function openCreate() {
    clearMessages();
    setForm(emptyForm());
    setFormMode("create");
    setSelectedTournament(null);
    setView("form");
  }

  function openEdit(tournament: OrganizerTournament) {
    clearMessages();
    setForm(formFromTournament(tournament));
    setFormMode("edit");
    setSelectedTournament(tournament);
    setView("form");
  }

  function updateForm<K extends keyof TournamentFormState>(key: K, value: TournamentFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleApiError(error: unknown, fallback: string) {
    if (error instanceof ApiRequestError) {
      setFieldErrors(error.errors);
      setActionError(error.message || fallback);
      return;
    }

    setActionError(errorMessage(error) || fallback);
  }

  async function saveTournament(options?: { publishAfterSave?: boolean }) {
    clearMessages();
    setIsMutating(true);

    try {
      const payload = payloadFromForm(form);
      const saved =
        formMode === "create"
          ? await createOrganizerTournament(payload)
          : await updateOrganizerTournament(selectedTournament?.id ?? "", payload);
      const finalTournament = options?.publishAfterSave
        ? await publishOrganizerTournament(saved.id)
        : saved;

      setSelectedTournament(finalTournament);
      setForm(formFromTournament(finalTournament));
      setNotice(options?.publishAfterSave ? "Tournament saved and published." : "Tournament saved successfully.");
      await loadTournaments();
      setView(options?.publishAfterSave ? "detail" : "form");

      if (options?.publishAfterSave) {
        await loadDetail(finalTournament.id);
      }
    } catch (error) {
      handleApiError(error, "Tournament could not be saved.");
    } finally {
      setIsMutating(false);
    }
  }

  async function mutateTournament(
    tournament: OrganizerTournament,
    action: "archive" | "publish"
  ) {
    clearMessages();
    setIsMutating(true);

    try {
      const updated = action === "publish"
        ? await publishOrganizerTournament(tournament.id)
        : await archiveOrganizerTournament(tournament.id);
      setSelectedTournament(updated);
      setNotice(action === "publish" ? "Tournament published successfully." : "Tournament archived successfully.");
      await loadTournaments();

      if (view === "detail") {
        await loadDetail(updated.id);
      }
    } catch (error) {
      handleApiError(error, action === "publish" ? "Tournament could not be published." : "Tournament could not be archived.");
    } finally {
      setIsMutating(false);
    }
  }

  async function reviewRegistration(
    registration: OrganizerTournamentRegistration,
    action: "approve" | "reject" | "waitlist"
  ) {
    if (!selectedTournament) {
      return;
    }

    clearMessages();
    setIsMutating(true);

    try {
      if (action === "approve") {
        await approveOrganizerRegistration(selectedTournament.id, registration.id);
      } else if (action === "reject") {
        await rejectOrganizerRegistration(selectedTournament.id, registration.id);
      } else {
        await waitlistOrganizerRegistration(selectedTournament.id, registration.id);
      }

      setNotice(
        action === "approve"
          ? "Registration approved."
          : action === "reject"
            ? "Registration rejected."
            : "Registration waitlisted."
      );
      setRegistrations(await listOrganizerTournamentRegistrations(selectedTournament.id));
      setSelectedTournament(await getOrganizerTournament(selectedTournament.id));
      await loadTournaments();
    } catch (error) {
      handleApiError(error, "Registration review action failed.");
    } finally {
      setIsMutating(false);
    }
  }

  if (loadState === "loading") {
    return <section className="org-tournament-state ops-panel">Loading organizer tournament uplink...</section>;
  }

  if (loadState === "login" || loadState === "permission" || loadState === "error") {
    return (
      <section className="org-tournament-state ops-panel">
        <p className="ops-label">Organizer tournament access</p>
        <h1>{loadState === "login" ? "Login required" : loadState === "permission" ? "Organizer access required" : "Organizer API unavailable"}</h1>
        <p>{actionError}</p>
        <div>
          {loadState === "login" ? (
            <Link className="button ops-button-primary" href="/login">
              Login
            </Link>
          ) : null}
          {loadState === "permission" ? (
            <Link className="button ops-button-primary" href="/dashboard">
              Back to Dashboard
            </Link>
          ) : null}
          {loadState === "error" ? (
            <button className="button ops-button-secondary" onClick={loadOrganizerAccess} type="button">
              Retry
            </button>
          ) : null}
          <Link className="button ops-button-secondary" href="/turnirji">
            View Tournaments
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="org-tournament-page">
      {notice ? <p className="org-tournament-message org-tournament-notice">{notice}</p> : null}
      {actionError ? <p className="org-tournament-message org-tournament-error">{actionError}</p> : null}

      {view === "dashboard" ? (
        <TournamentDashboard
          counts={counts}
          isMutating={isMutating}
          onArchive={(tournament) => mutateTournament(tournament, "archive")}
          onCreate={openCreate}
          onDetail={(tournament) => loadDetail(tournament.id)}
          onEdit={openEdit}
          onPublish={(tournament) => mutateTournament(tournament, "publish")}
          tournaments={tournaments}
        />
      ) : null}

      {view === "form" ? (
        <TournamentForm
          fieldErrors={fieldErrors}
          form={form}
          isMutating={isMutating}
          mode={formMode}
          onBack={() => {
            clearMessages();
            setView(selectedTournament ? "detail" : "dashboard");
          }}
          onChange={updateForm}
          onPublish={() => saveTournament({ publishAfterSave: true })}
          onSave={() => saveTournament()}
          selectedTournament={selectedTournament}
        />
      ) : null}

      {view === "detail" && selectedTournament ? (
        <TournamentDetail
          isMutating={isMutating}
          onArchive={() => mutateTournament(selectedTournament, "archive")}
          onBack={() => {
            clearMessages();
            setView("dashboard");
          }}
          onEdit={() => openEdit(selectedTournament)}
          onPublish={() => mutateTournament(selectedTournament, "publish")}
          onRefresh={() => loadDetail(selectedTournament.id)}
          onReviewRegistration={reviewRegistration}
          registrations={registrations}
          tournament={selectedTournament}
        />
      ) : null}
    </div>
  );
}

function TournamentDashboard({
  counts,
  isMutating,
  onArchive,
  onCreate,
  onDetail,
  onEdit,
  onPublish,
  tournaments
}: {
  counts: ReturnType<typeof dashboardCounts>;
  isMutating: boolean;
  onArchive: (tournament: OrganizerTournament) => void;
  onCreate: () => void;
  onDetail: (tournament: OrganizerTournament) => void;
  onEdit: (tournament: OrganizerTournament) => void;
  onPublish: (tournament: OrganizerTournament) => void;
  tournaments: OrganizerTournament[];
}) {
  return (
    <>
      <section className="org-tournament-hero ops-panel">
        <div>
          <p className="ops-label">Tournament Command Center</p>
          <h1>Organizer Tournament Dashboard</h1>
          <p>Manage tournament lifecycle, public visibility, registration pressure, and publish/archive workflows from one protected organizer interface.</p>
        </div>
        <button className="org-tournament-primary" onClick={onCreate} type="button">
          <Plus size={18} />
          Create Tournament
        </button>
      </section>

      <section className="org-tournament-summary">
        <SummaryCard icon={FileText} label="Drafts" value={counts.drafts} />
        <SummaryCard icon={RadioTower} label="Published" tone="cyan" value={counts.published} />
        <SummaryCard icon={Trophy} label="Live" tone="red" value={counts.live} />
        <SummaryCard icon={ShieldCheck} label="Finished" tone="green" value={counts.finished} />
        <SummaryCard icon={Archive} label="Archived" tone="muted" value={counts.archived} />
      </section>

      <section className="org-tournament-panel ops-panel">
        <div className="org-tournament-panel-title">
          <div>
            <p className="ops-label">Tournament Registry</p>
            <h2>Managed Tournaments</h2>
          </div>
          <span>{tournaments.length} records</span>
        </div>

        {tournaments.length === 0 ? (
          <div className="org-tournament-empty">
            <h3>No organizer tournaments yet</h3>
            <p>Create the first tournament draft to start the FE-04 workflow.</p>
            <button className="org-tournament-primary" onClick={onCreate} type="button">
              <Plus size={18} />
              Create Tournament
            </button>
          </div>
        ) : (
          <div className="org-tournament-table-wrap">
            <table className="org-tournament-table">
              <thead>
                <tr>
                  <th>Tournament</th>
                  <th>Status</th>
                  <th>Format</th>
                  <th>Schedule</th>
                  <th>Teams</th>
                  <th>Visibility</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tournaments.map((tournament) => (
                  <tr key={tournament.id}>
                    <td>
                      <strong>{tournament.title}</strong>
                      <span>{tournament.slug}</span>
                    </td>
                    <td>
                      <StatusBadge status={tournament.status} />
                    </td>
                    <td>{formatLabel(tournament.format)}</td>
                    <td>{formatDate(tournament.startsAt)}</td>
                    <td>
                      {tournament.registrationsCount}/{tournament.maxTeams}
                    </td>
                    <td>{tournament.publicVisible ? "Public" : "Private"}</td>
                    <td>{formatDate(tournament.updatedAt)}</td>
                    <td>
                      <div className="org-tournament-actions">
                        <button onClick={() => onDetail(tournament)} type="button">
                          <Eye size={15} />
                          Details
                        </button>
                        <button onClick={() => onEdit(tournament)} type="button">
                          <Edit3 size={15} />
                          Edit
                        </button>
                        <button disabled={isMutating || !canPublish(tournament.status)} onClick={() => onPublish(tournament)} type="button">
                          <Rocket size={15} />
                          Publish
                        </button>
                        <button disabled={isMutating || !canArchive(tournament.status)} onClick={() => onArchive(tournament)} type="button">
                          <Archive size={15} />
                          Archive
                        </button>
                        {tournament.slug ? (
                          <Link href={`/turnirji/${tournament.slug}`}>
                            <Globe2 size={15} />
                            Public
                          </Link>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function TournamentForm({
  fieldErrors,
  form,
  isMutating,
  mode,
  onBack,
  onChange,
  onPublish,
  onSave,
  selectedTournament
}: {
  fieldErrors: ApiFieldError[];
  form: TournamentFormState;
  isMutating: boolean;
  mode: FormMode;
  onBack: () => void;
  onChange: <K extends keyof TournamentFormState>(key: K, value: TournamentFormState[K]) => void;
  onPublish: () => void;
  onSave: () => void;
  selectedTournament: OrganizerTournament | null;
}) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave();
  }

  return (
    <section className="org-tournament-form-shell">
      <div className="org-tournament-form-hero ops-panel">
        <button onClick={onBack} type="button">
          <ArrowLeft size={16} />
          Back
        </button>
        <div>
          <p className="ops-label">{mode === "create" ? "Systems Deployment" : "Tournament Configuration"}</p>
          <h1>{mode === "create" ? "New Tournament Initialization" : selectedTournament?.title}</h1>
          <p>Configure only backend-supported tournament fields. Unsupported branding, region, and visibility flags are intentionally not sent.</p>
        </div>
        {selectedTournament ? <StatusBadge status={selectedTournament.status} /> : null}
      </div>

      {fieldErrors.length > 0 ? (
        <ValidationPanel errors={fieldErrors} />
      ) : null}

      <form className="org-tournament-form ops-panel" onSubmit={submit}>
        <div className="org-tournament-form-grid">
          <FormField error={fieldError(fieldErrors, "title")} label="Tournament Name">
            <input onChange={(event) => onChange("title", event.target.value)} required value={form.title} />
          </FormField>
          <FormField error={fieldError(fieldErrors, "slug")} label="Slug">
            <input onChange={(event) => onChange("slug", event.target.value)} placeholder="auto-generated-if-empty" value={form.slug} />
          </FormField>
          <FormField error={fieldError(fieldErrors, "format")} label="Format">
            <select onChange={(event) => onChange("format", event.target.value as OrganizerTournamentFormat)} value={form.format}>
              {formatOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField error={fieldError(fieldErrors, "maxTeams")} label="Max Teams">
            <input max={128} min={2} onChange={(event) => onChange("maxTeams", event.target.value)} type="number" value={form.maxTeams} />
          </FormField>
          <FormField error={fieldError(fieldErrors, "startsAt")} label="Tournament Start">
            <input onChange={(event) => onChange("startsAt", event.target.value)} required type="datetime-local" value={form.startsAt} />
          </FormField>
          <FormField error={fieldError(fieldErrors, "endsAt")} label="Tournament End">
            <input onChange={(event) => onChange("endsAt", event.target.value)} type="datetime-local" value={form.endsAt} />
          </FormField>
          <FormField error={fieldError(fieldErrors, "registrationOpensAt")} label="Registration Opens">
            <input onChange={(event) => onChange("registrationOpensAt", event.target.value)} type="datetime-local" value={form.registrationOpensAt} />
          </FormField>
          <FormField error={fieldError(fieldErrors, "registrationClosesAt")} label="Registration Closes">
            <input onChange={(event) => onChange("registrationClosesAt", event.target.value)} type="datetime-local" value={form.registrationClosesAt} />
          </FormField>
          <FormField error={fieldError(fieldErrors, "timezone")} label="Timezone">
            <input onChange={(event) => onChange("timezone", event.target.value)} value={form.timezone} />
          </FormField>
          <FormField error={fieldError(fieldErrors, "prizePool")} label="Prize Pool / Label">
            <input onChange={(event) => onChange("prizePool", event.target.value)} placeholder="€10,000 / Invite-only" value={form.prizePool} />
          </FormField>
          <FormField error={fieldError(fieldErrors, "description")} label="Description" wide>
            <textarea onChange={(event) => onChange("description", event.target.value)} rows={4} value={form.description} />
          </FormField>
          <FormField error={fieldError(fieldErrors, "rules")} label="Rules / Notes" wide>
            <textarea onChange={(event) => onChange("rules", event.target.value)} rows={5} value={form.rules} />
          </FormField>
        </div>

        <section className="org-tournament-settings-panel">
          <h2>Operational Settings</h2>
          <div className="org-tournament-form-grid">
            <FormField error={fieldError(fieldErrors, "settings.minTeams")} label="Minimum Teams">
              <input min={1} onChange={(event) => onChange("minTeams", event.target.value)} type="number" value={form.minTeams} />
            </FormField>
            <FormField error={fieldError(fieldErrors, "settings.teamSize")} label="Team Size">
              <input min={1} onChange={(event) => onChange("teamSize", event.target.value)} type="number" value={form.teamSize} />
            </FormField>
            <FormField error={fieldError(fieldErrors, "settings.bestOf")} label="Best Of">
              <select onChange={(event) => onChange("bestOf", event.target.value)} value={form.bestOf}>
                <option value="1">Best of 1</option>
                <option value="3">Best of 3</option>
                <option value="5">Best of 5</option>
              </select>
            </FormField>
            <FormField error={fieldError(fieldErrors, "checkInOpensAt")} label="Check-in Opens">
              <input disabled={!form.checkInEnabled} onChange={(event) => onChange("checkInOpensAt", event.target.value)} type="datetime-local" value={form.checkInOpensAt} />
            </FormField>
            <FormField error={fieldError(fieldErrors, "checkInClosesAt")} label="Check-in Closes">
              <input disabled={!form.checkInEnabled} onChange={(event) => onChange("checkInClosesAt", event.target.value)} type="datetime-local" value={form.checkInClosesAt} />
            </FormField>
          </div>
          <div className="org-tournament-toggle-row">
            <label>
              <input checked={form.checkInEnabled} onChange={(event) => onChange("checkInEnabled", event.target.checked)} type="checkbox" />
              Check-in enabled
            </label>
            <label>
              <input checked={form.allowSubstitutes} onChange={(event) => onChange("allowSubstitutes", event.target.checked)} type="checkbox" />
              Allow substitutes
            </label>
          </div>
        </section>

        <div className="org-tournament-form-actions">
          <button className="org-tournament-secondary" onClick={onBack} type="button">
            Cancel
          </button>
          <button className="org-tournament-secondary" disabled={isMutating} onClick={onPublish} type="button">
            <Rocket size={17} />
            Publish Tournament
          </button>
          <button className="org-tournament-primary" disabled={isMutating} type="submit">
            <Save size={17} />
            {mode === "create" ? "Save Draft" : "Save Changes"}
          </button>
        </div>
      </form>
    </section>
  );
}

function TournamentDetail({
  isMutating,
  onArchive,
  onBack,
  onEdit,
  onPublish,
  onRefresh,
  onReviewRegistration,
  registrations,
  tournament
}: {
  isMutating: boolean;
  onArchive: () => void;
  onBack: () => void;
  onEdit: () => void;
  onPublish: () => void;
  onRefresh: () => void;
  onReviewRegistration: (registration: OrganizerTournamentRegistration, action: "approve" | "reject" | "waitlist") => void;
  registrations: OrganizerTournamentRegistration[];
  tournament: OrganizerTournament;
}) {
  return (
    <>
      <section className="org-tournament-detail-hero ops-panel">
        <button onClick={onBack} type="button">
          <ArrowLeft size={16} />
          Registry
        </button>
        <div>
          <p className="ops-label">Tournament Management Detail</p>
          <h1>{tournament.title}</h1>
          <p>{tournament.description ?? "Tournament description is not set yet."}</p>
        </div>
        <StatusBadge status={tournament.status} />
      </section>

      {tournament.status === "archived" ? (
        <section className="org-tournament-warning ops-panel">
          <AlertTriangle size={18} />
          Archived tournament warning: archived tournaments cannot be edited or published again.
        </section>
      ) : null}

      <section className="org-tournament-status-flow ops-panel">
        {statusFlow.map((status) => (
          <div className={classNames("org-tournament-flow-step", tournament.status === status && "is-active")} key={status}>
            <span>{statusLabel(status)}</span>
          </div>
        ))}
      </section>

      <section className="org-tournament-detail-grid">
        <main className="org-tournament-detail-main">
          <section className="org-tournament-meta-grid">
            <MetaCard icon={ClipboardList} label="Format" value={formatLabel(tournament.format)} />
            <MetaCard icon={Globe2} label="Timezone" value={tournament.timezone} />
            <MetaCard icon={CalendarDays} label="Registration Deadline" value={formatDate(tournament.registrationClosesAt)} />
            <MetaCard icon={CalendarDays} label="Date Range" value={`${formatDate(tournament.startsAt)} - ${formatDate(tournament.endsAt)}`} />
            <MetaCard icon={UsersRound} label="Max Teams" value={String(tournament.maxTeams)} />
            <MetaCard icon={Trophy} label="Registered Teams" value={String(tournament.registrationsCount)} />
          </section>

          <section className="org-tournament-panel ops-panel">
            <div className="org-tournament-panel-title">
              <div>
                <p className="ops-label">Registration Review</p>
                <h2>Team Submissions</h2>
              </div>
              <button className="org-tournament-secondary" disabled={isMutating} onClick={onRefresh} type="button">
                Refresh
              </button>
            </div>
            {registrations.length === 0 ? (
              <p className="org-tournament-muted">No registrations are available for this tournament yet.</p>
            ) : (
              <div className="org-tournament-registration-list">
                {registrations.map((registration) => (
                  <article className="org-tournament-registration-card" key={registration.id}>
                    <div>
                      <strong>{registration.teamName}</strong>
                      <span>{registration.teamTag ?? registration.teamSlug ?? "No team tag"} - Captain: {registration.captainNickname ?? "Unknown"}</span>
                    </div>
                    <StatusBadge status={registration.status} />
                    <span>{formatDate(registration.createdAt)}</span>
                    <div className="org-tournament-actions">
                      <button disabled={isMutating || registration.status !== "pending"} onClick={() => onReviewRegistration(registration, "approve")} type="button">
                        <Check size={15} />
                        Approve
                      </button>
                      <button disabled={isMutating || registration.status !== "pending"} onClick={() => onReviewRegistration(registration, "waitlist")} type="button">
                        Waitlist
                      </button>
                      <button disabled={isMutating || registration.status !== "pending"} onClick={() => onReviewRegistration(registration, "reject")} type="button">
                        <X size={15} />
                        Reject
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </main>

        <aside className="org-tournament-detail-side">
          <section className="org-tournament-panel ops-panel">
            <div className="org-tournament-panel-title">
              <h2>Quick Actions</h2>
            </div>
            <div className="org-tournament-side-actions">
              <button className="org-tournament-primary" disabled={tournament.status === "archived"} onClick={onEdit} type="button">
                <Edit3 size={17} />
                Edit Tournament
              </button>
              <button disabled={isMutating || !canPublish(tournament.status)} onClick={onPublish} type="button">
                <Rocket size={17} />
                Publish
              </button>
              <button disabled={isMutating || !canArchive(tournament.status)} onClick={onArchive} type="button">
                <Archive size={17} />
                Archive
              </button>
              <Link href={`/turnirji/${tournament.slug}`}>
                <Globe2 size={17} />
                View Public Page
              </Link>
            </div>
          </section>

          <section className="org-tournament-panel ops-panel">
            <div className="org-tournament-panel-title">
              <h2>Activity / Audit</h2>
            </div>
            <p className="org-tournament-muted">Audit log endpoint is not available yet. Latest status changes are reflected by tournament updated_at.</p>
            <div className="org-tournament-audit-row">
              <span>Last Update</span>
              <strong>{formatDate(tournament.updatedAt)}</strong>
            </div>
            <div className="org-tournament-audit-row">
              <span>Published</span>
              <strong>{formatDate(tournament.publishedAt)}</strong>
            </div>
          </section>
        </aside>
      </section>
    </>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  tone = "gold",
  value
}: {
  icon: LucideIcon;
  label: string;
  tone?: "cyan" | "gold" | "green" | "muted" | "red";
  value: number;
}) {
  return (
    <article className={classNames("org-tournament-summary-card ops-panel", `org-tournament-tone-${tone}`)}>
      <div>
        <span>{label}</span>
        <Icon size={18} />
      </div>
      <strong>{String(value).padStart(2, "0")}</strong>
    </article>
  );
}

function MetaCard({
  icon: Icon,
  label,
  value
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <article className="org-tournament-meta-card ops-panel">
      <Icon size={18} />
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function StatusBadge({ status }: { status: string }) {
  return <span className={classNames("org-tournament-status", statusClass(status))}>{statusLabel(status)}</span>;
}

function ValidationPanel({ errors }: { errors: ApiFieldError[] }) {
  return (
    <section className="org-tournament-validation ops-panel">
      <AlertTriangle size={18} />
      <div>
        <h2>Backend validation failed</h2>
        <ul>
          {errors.map((error, index) => (
            <li key={`${error.field ?? "general"}-${index}`}>
              <strong>{error.field ?? "request"}</strong>
              <span>{error.message ?? "Invalid value"}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function FormField({
  children,
  error,
  label,
  wide = false
}: {
  children: ReactNode;
  error: string | null;
  label: string;
  wide?: boolean;
}) {
  return (
    <label className={classNames("org-tournament-field", wide && "org-tournament-field-wide")}>
      <span>{label}</span>
      {children}
      {error ? <em>{error}</em> : null}
    </label>
  );
}
