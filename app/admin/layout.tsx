import { AppShell } from "@/components/app-shell";
import { requireAdmin } from "@/lib/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const staff = await requireAdmin();
  return <AppShell staff={staff}>{children}</AppShell>;
}
