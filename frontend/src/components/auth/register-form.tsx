"use client";

import { BarChart3, Gamepad2, Shield, Trophy, UsersRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";

import { registerWithEmailPassword, type RequestedAuthRole } from "@/lib/auth";
import { classNames } from "@/lib/utils";

const roleOptions: Array<{
  role: RequestedAuthRole;
  label: string;
  detail: string;
  icon: LucideIcon;
}> = [
  { detail: "Performance Tracking", icon: Gamepad2, label: "Player", role: "player" },
  { detail: "Manage Roster", icon: UsersRound, label: "Team Captain", role: "captain" },
  { detail: "Host Tournaments", icon: Trophy, label: "Organizer", role: "organizer" }
];

export function RegisterForm() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [steamIdOrProfile, setSteamIdOrProfile] = useState("");
  const [bio, setBio] = useState("");
  const [requestedRole, setRequestedRole] = useState<RequestedAuthRole>("captain");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await registerWithEmailPassword({
        bio,
        countryCode,
        displayName,
        email,
        nickname,
        password,
        requestedRole,
        steamIdOrProfile
      });
      setNotice(result.message ?? "Account created.");
      window.setTimeout(() => {
        router.push(result.dashboardPath);
      }, 700);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Registration failed.");
      setIsLoading(false);
    }
  }

  return (
    <main className="auth-register-main">
      <section className="auth-register-copy">
        <span>Dominate the Draft</span>
        <h1>
          Create your <strong>DotaOps account</strong>
        </h1>
        <p>
          Join the elite analytical engine for professional teams and tournament organizers. Access
          tactical prediction models and full-spectrum match telemetry.
        </p>
        <div className="auth-register-benefits">
          <article>
            <BarChart3 size={30} />
            <h2>Real-time Data</h2>
            <p>Synchronized telemetry from all active match clusters.</p>
          </article>
          <article>
            <Shield size={30} />
            <h2>Secure Core</h2>
            <p>Enterprise-grade encryption for team roster and strategy locks.</p>
          </article>
        </div>
      </section>

      <section className="auth-card auth-register-card">
        <form className="auth-form auth-register-form" onSubmit={onSubmit}>
          <div className="auth-form-grid">
            <label>
              <span>Username / Nickname</span>
              <input
                onChange={(event) => setNickname(event.target.value)}
                placeholder="Terminal ID"
                required
                value={nickname}
              />
            </label>
            <label>
              <span>Display Name</span>
              <input
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Operative Name"
                required
                value={displayName}
              />
            </label>
            <label className="auth-form-wide">
              <span>Email Address</span>
              <input
                autoComplete="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="hq@network.ops"
                required
                type="email"
                value={email}
              />
            </label>
            <label>
              <span>Password</span>
              <input
                autoComplete="new-password"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="............"
                required
                type="password"
                value={password}
              />
            </label>
            <label>
              <span>Confirm Password</span>
              <input
                autoComplete="new-password"
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="............"
                required
                type="password"
                value={confirmPassword}
              />
            </label>
          </div>

          <div className="auth-optional-section">
            <span>Optional Profile Details</span>
            <div className="auth-form-grid">
              <label>
                <span>Country / Region</span>
                <input
                  maxLength={24}
                  onChange={(event) => setCountryCode(event.target.value)}
                  placeholder="Sector"
                  value={countryCode}
                />
              </label>
              <label>
                <span>Steam ID / Profile Link</span>
                <input
                  onChange={(event) => setSteamIdOrProfile(event.target.value)}
                  placeholder="steamcommunity.com/id/..."
                  value={steamIdOrProfile}
                />
              </label>
              <label className="auth-form-wide">
                <span>Short Bio</span>
                <textarea
                  onChange={(event) => setBio(event.target.value)}
                  placeholder="Brief operative history..."
                  rows={4}
                  value={bio}
                />
              </label>
            </div>
          </div>

          <div className="auth-role-section">
            <span>Operational Role</span>
            <div className="auth-role-grid">
              {roleOptions.map((option) => {
                const Icon = option.icon;

                return (
                  <button
                    className={classNames(
                      "auth-role-option",
                      requestedRole === option.role && "is-selected"
                    )}
                    key={option.role}
                    onClick={() => setRequestedRole(option.role)}
                    type="button"
                  >
                    <Icon size={26} />
                    <strong>{option.label}</strong>
                    <small>{option.detail}</small>
                  </button>
                );
              })}
            </div>
            <p>
              Note: requested role is saved for backend/admin approval when direct client role
              promotion is blocked by database policies.
            </p>
          </div>

          {error ? <p className="auth-message auth-error">{error}</p> : null}
          {notice ? <p className="auth-message auth-success">{notice}</p> : null}

          <button className="auth-submit auth-register-submit" disabled={isLoading} type="submit">
            {isLoading ? "Registering..." : "Register"}
          </button>

          <p className="auth-switch-link">
            Already have an account? <Link href="/login">Login</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
