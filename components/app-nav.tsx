"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  TextboxIcon,
  SquaresFourIcon,
  NotepadIcon,
  UsersIcon,
} from "@phosphor-icons/react";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const links = [
  { href: "/", label: "Buka aplikasi formulir", icon: SquaresFourIcon },
  { href: "/admin/submissions", label: "Riwayat", icon: NotepadIcon },
];

export function AppNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const items = isAdmin
    ? [
        ...links,
        { href: "/admin/forms/new", label: "Builder", icon: TextboxIcon },
        { href: "/admin/users", label: "Pengguna", icon: UsersIcon },
      ]
    : links;

  return (
    <nav aria-label="Navigasi utama">
      <SidebarMenu>
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                isActive={active}
                tooltip={item.label}
                render={
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                  />
                }
                onClick={() => {
                  if (isMobile) setOpenMobile(false);
                }}
              >
                <Icon data-icon="inline-start" />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </nav>
  );
}
