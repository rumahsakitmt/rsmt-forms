import Link from "next/link";
import { HeartbeatIcon, GearIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/auth/logout-button";
import { requireStaff } from "@/lib/session";

export default async function FormsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const staff = await requireStaff();
  return (
    <div className="min-h-svh">
      <header className="border-b print:hidden">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 md:px-8">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <HeartbeatIcon className="size-5" />
            RSUD Forms
          </Link>
          <nav aria-label="Menu aplikasi" className="flex items-center gap-2">
            {staff.role === "ADMIN" ? (
              <Button
                variant="outline"
                nativeButton={false}
                role="link"
                render={<Link href="/admin" />}
              >
                <GearIcon data-icon="inline-start" />
                Administrasi
              </Button>
            ) : null}
            <LogoutButton standalone />
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
