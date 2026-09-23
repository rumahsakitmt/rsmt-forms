import Link from "next/link";
import { NotepadIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/auth/logout-button";
import { Separator } from "@/components/ui/separator";
import { requireStaff } from "@/lib/session";

export default async function FormsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const staff = await requireStaff();
  return (
    <div className="flex min-h-svh flex-col">
      <header className="print:hidden">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 md:px-8">
          <Link href="/" className="font-extrabold text-primary">
            RSUD
            <span className="font-normal text-sm text-muted-foreground italic">
              forms
            </span>
          </Link>
          <nav aria-label="Menu aplikasi" className="flex items-center gap-2">
            <Button
              variant="ghost"
              nativeButton={false}
              role="link"
              render={<Link href="/submissions" />}
            >
              <NotepadIcon data-icon="inline-start" />
              Riwayat
            </Button>
            {staff.role === "ADMIN" ? (
              <Button
                variant="outline"
                nativeButton={false}
                role="link"
                render={<Link href="/admin" />}
              >
                Dashboard
              </Button>
            ) : null}
            <LogoutButton standalone />
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="print:hidden">
        <div className="mx-auto w-full max-w-7xl px-4 pb-6 md:px-8 md:pb-8">
          <Separator />
          <div className="flex flex-col gap-2 pt-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>
              <strong className="font-medium text-foreground">RSUD Forms</strong>
              {" · "}Dokumentasi formulir klinis terstruktur
            </p>
            <p>© {new Date().getFullYear()} RSUD. Untuk penggunaan internal.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
