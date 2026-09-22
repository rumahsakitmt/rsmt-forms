"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconLayoutGrid,
  IconNotes,
  IconUsers,
} from "@tabler/icons-react";

const links = [
  { href: "/", label: "Formulir", icon: IconLayoutGrid },
  { href: "/submissions", label: "Riwayat", icon: IconNotes },
];

export function AppNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const items = isAdmin
    ? [...links, { href: "/admin/users", label: "Pengguna", icon: IconUsers }]
    : links;

  return (
    <nav aria-label="Navigasi utama" className="app-nav">
      {items.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link className={`nav-link${active ? " is-active" : ""}`} href={item.href} key={item.href}>
            <Icon size={19} stroke={1.8} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
