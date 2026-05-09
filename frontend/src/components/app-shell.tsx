"use client";

import {
  BarChart3,
  Brackets,
  LayoutDashboard,
  Shield,
  Swords,
  Trophy,
  UsersRound
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { classNames } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/turnirji", label: "Tournaments", icon: Trophy },
  { href: "/organizator", label: "Organizer", icon: Brackets },
  { href: "/ekipe", label: "Teams", icon: UsersRound },
  { href: "/analitika", label: "Analytics", icon: BarChart3 }
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "mock data";

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
        <header className="topbar ops-panel">
          <div>
            <span className="topbar-kicker">IPT Project</span>
            <strong>Frontend environment for DotaOps development</strong>
          </div>
          <Link className="button button-primary ops-button-primary" href="/organizator">
            <Brackets size={18} />
            <span>Manage Tournament</span>
          </Link>
        </header>

        <main className="page">{children}</main>
      </div>
    </div>
  );
}
