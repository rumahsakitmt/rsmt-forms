import Link from "next/link";
import { HeartbeatIcon } from "@phosphor-icons/react/dist/ssr";
import { LogoutButton } from "@/components/auth/logout-button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
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
    <SidebarProvider>
      <Sidebar variant="inset" collapsible="icon" className="print:hidden">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" render={<Link href="/admin" />}>
                <HeartbeatIcon data-icon="inline-start" />
                <span className="flex flex-col">
                  <strong>RSUD Admin</strong>
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Pengelolaan</SidebarGroupLabel>
            <SidebarGroupContent>
              <AppNav isAdmin={staff.role === "ADMIN"} />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                tooltip="Akun saya"
                render={<Link href="/admin/account" />}
              >
                <Avatar>
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <span className="flex min-w-0 flex-col">
                  <strong className="truncate">{staff.name}</strong>
                  <span className="text-xs">
                    {staff.role === "ADMIN" ? "Administrator" : "Staf klinis"}
                  </span>
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <LogoutButton />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset className="min-w-0 print:m-0 print:shadow-none">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4 print:hidden">
          <SidebarTrigger aria-label="Buka atau tutup navigasi" />
          <span className="text-sm font-medium">Administrasi</span>
        </header>
        <div className="flex-1">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
