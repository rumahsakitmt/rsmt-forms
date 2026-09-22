import Link from "next/link";
import { IconActivityHeartbeat } from "@tabler/icons-react";

import { LogoutButton } from "@/components/auth/logout-button";
import type { StaffSession } from "@/lib/session";
import { AppNav } from "./app-nav";

export function AppShell({
  children,
  staff,
}: {
  children: React.ReactNode;
  staff: StaffSession;
}) {
  const initials = staff.name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <Link className="brand" href="/" aria-label="RSUD Forms">
          <span className="brand-mark"><IconActivityHeartbeat size={24} stroke={1.8} /></span>
          <span>
            <strong>RSUD</strong>
            <small>Forms</small>
          </span>
        </Link>

        <div className="sidebar-label">Ruang kerja</div>
        <AppNav isAdmin={staff.role === "ADMIN"} />

        <div className="sidebar-bottom">
          <Link className="staff-card" href="/account" aria-label="Buka pengaturan akun">
            <span className="avatar">{initials}</span>
            <span className="staff-copy">
              <strong>{staff.name}</strong>
              <small>{staff.role === "ADMIN" ? "Administrator" : "Staf klinis"}</small>
            </span>
          </Link>
          <LogoutButton />
        </div>
      </aside>
      <div className="workspace">
        <header className="mobile-header">
          <Link className="brand" href="/">
            <span className="brand-mark"><IconActivityHeartbeat size={22} /></span>
            <strong>RSUD Forms</strong>
          </Link>
          <span className="avatar">{initials}</span>
        </header>
        <main className="workspace-main">{children}</main>
      </div>
    </div>
  );
}
