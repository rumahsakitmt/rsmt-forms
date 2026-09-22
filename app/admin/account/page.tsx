import { AtIcon, ShieldCheckIcon } from "@phosphor-icons/react/dist/ssr";

import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { requireAdmin } from "@/lib/session";

export default async function AccountPage() {
  const staff = await requireAdmin();
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-8 max-w-5xl">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:tracking-tight">
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Keamanan akun
          </p>
          <h1>Akun saya</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Kelola kata sandi untuk menjaga akses formulir klinis tetap aman.
          </p>
        </div>
      </header>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card className="[&_dl]:divide-y [&_dl>div]:flex [&_dl>div]:flex-col [&_dl>div]:gap-2 [&_dl>div]:py-4 [&_dt]:flex [&_dt]:items-center [&_dt]:gap-2 [&_dt]:text-sm [&_dt]:text-muted-foreground [&_dd]:text-sm">
          <CardHeader>
            <Avatar>
              <AvatarFallback>
                {staff.name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <CardDescription>Profil staf</CardDescription>
            <CardTitle>{staff.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl>
              <div>
                <dt>
                  <AtIcon size={17} /> Email
                </dt>
                <dd>{staff.email}</dd>
              </div>
              <div>
                <dt>
                  <ShieldCheckIcon size={17} /> Peran
                </dt>
                <dd>
                  {staff.role === "ADMIN" ? "Administrator" : "Staf klinis"}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ubah kata sandi</CardTitle>
            <CardDescription>Kredensial akun</CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
