"use client";

import {
  BarChart3,
  Bell,
  Brackets,
  LayoutDashboard,
  Plus,
  RadioTower,
  Shield,
  Swords,
  Trophy,
  UserRound,
  UsersRound
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { getCurrentUserProfile, type CurrentUserProfile } from "@/lib/auth";
import { classNames } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/turnirji", label: "Tournaments", icon: Trophy },
  { href: "/organizator", label: "Organizer", icon: Brackets },
  { href: "/ekipe", label: "My Team", icon: UsersRound },
  { href: "/analitika", label: "Analytics", icon: BarChart3 },
  { href: "/profile", label: "Profile", icon: UserRound }
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "mock data";
  const isRoleDashboard = pathname.startsWith("/dashboard");
  const isPublicRoute = pathname === "/" || pathname === "/login" || pathname === "/register";
  const [profile, setProfile] = useState<CurrentUserProfile | null>(null);

  useEffect(() => {
    let isMounted = true;

    getCurrentUserProfile()
      .then((loadedProfile) => {
        if (isMounted) {
          setProfile(loadedProfile);
        }
      })
      .catch(() => {
        if (isMounted) {
          setProfile(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [pathname]);

  const primaryAction = useMemo(() => {
    if (profile?.role === "organizer" || profile?.role === "admin") {
      return { href: "/organizator", icon: Plus, label: "New Tournament" };
    }

    if (profile?.role === "captain") {
      return { href: "/turnirji", icon: Trophy, label: "Join Tournament" };
    }

    return { href: "/turnirji", icon: Trophy, label: "View Tournaments" };
  }, [profile?.role]);
  const PrimaryActionIcon = primaryAction.icon;

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar ops-panel ops-scanline">
        <Link href="/" className="brand" aria-label="DotaOps home">
          <span className="brand-mark" aria-hidden="true">
            <Swords size={22} />
          </span>
          <span>
            <strong>DotaOps</strong>
            <small>Dota 2 tournaments and analytics</small>
          </span>
        </Link>

        <nav className="nav-list" aria-label="Main navigation">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/" || pathname.startsWith(item.href)
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                className={classNames("nav-link", isActive && "is-active")}
                href={item.href}
                key={item.href}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-panel ops-card">
          <Shield size={18} />
          <div>
            <span>API connection</span>
            <strong>{apiUrl}</strong>
          </div>
        </div>
      </aside>

      <div className="main-area">
        {isRoleDashboard ? null : (
          <header className="topbar ops-panel">
            <div className="topbar-title">
              <span className="topbar-kicker">DOTAOPS COMMAND CENTER</span>
              <strong>Tournament operations and analytics platform</strong>
            </div>

            <div className="topbar-actions" aria-label="Application status and actions">
              <div className="topbar-status-segment">
                <RadioTower size={16} />
                <span>OPS STATUS</span>
                <strong>ONLINE</strong>
              </div>

              <div className="topbar-status-segment topbar-rank-segment">
                <Shield size={16} />
                <span>RANK</span>
                <strong>IMMORTAL</strong>
              </div>

              <button className="topbar-icon-button" type="button" aria-label="Notifications">
                <Bell size={17} />
              </button>

              <Link className="topbar-profile" href="/profile" aria-label="User profile">
                <span className="topbar-avatar" aria-hidden="true">
                  {profile?.avatarUrl ? (
                    <span
                      className="topbar-avatar-image"
                      style={{ backgroundImage: `url(${profile.avatarUrl})` }}
                    />
                  ) : (
                    <UserRound size={16} />
                  )}
                </span>
                <span>
                  <strong>{profile?.nickname ?? "SOLO_TACTICIAN"}</strong>
                  <small>{profile?.role ?? "Profile"}</small>
                </span>
              </Link>

              <Link className="button button-primary ops-button-primary topbar-primary-action" href={primaryAction.href}>
                <PrimaryActionIcon size={18} />
                <span>{primaryAction.label}</span>
              </Link>
            </div>
          </header>
        )}

        <main className={classNames("page", isRoleDashboard && "dashboard-page")}>
          {children}
        </main>
      </div>
    </div>
  );
}
