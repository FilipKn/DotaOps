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
  { href: "/", label: "Nadzorna plosca", icon: LayoutDashboard },
  { href: "/turnirji", label: "Turnirji", icon: Trophy },
  { href: "/organizator", label: "Organizator", icon: Brackets },
  { href: "/ekipe", label: "Ekipe", icon: UsersRound },
  { href: "/analitika", label: "Analitika", icon: BarChart3 }
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "mock podatki";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/" className="brand" aria-label="DotaOps domov">
          <span className="brand-mark" aria-hidden="true">
            <Swords size={22} />
          </span>
          <span>
            <strong>DotaOps</strong>
            <small>Dota 2 turnirji in analitika</small>
          </span>
        </Link>

        <nav className="nav-list" aria-label="Glavna navigacija">
          {navItems.map((item) => {
            const isActive =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
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

        <div className="sidebar-panel">
          <Shield size={18} />
          <div>
            <span>API povezava</span>
            <strong>{apiUrl}</strong>
          </div>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div>
            <span className="topbar-kicker">Projekt IPT</span>
            <strong>Frontend okolje za razvoj DotaOps</strong>
          </div>
          <Link className="button button-primary" href="/organizator">
            <Brackets size={18} />
            <span>Upravljaj turnir</span>
          </Link>
        </header>

        <main className="page">{children}</main>
      </div>
    </div>
  );
}
