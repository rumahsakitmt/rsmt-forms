import { AppShell } from "@/components/app-shell";
import { requireStaff } from "@/lib/session";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff();
  return <AppShell staff={staff}>{children}</AppShell>;
}
