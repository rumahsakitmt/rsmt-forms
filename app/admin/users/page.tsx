import { format } from "date-fns";
import { id } from "date-fns/locale";

import { CreateStaffForm } from "@/components/admin/create-staff-form";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export default async function UsersPage() {
  await requireAdmin();
  const users = await db.user.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:tracking-tight">
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Administrasi
          </p>
          <h1>Pengguna</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Buat akun staf dan tinjau akses ruang kerja.
          </p>
        </div>
      </header>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(280px,1fr)_2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Tambahkan staf</CardTitle>
            <CardDescription>Akun baru</CardDescription>
          </CardHeader>
          <CardContent>
            <CreateStaffForm />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Direktori</CardDescription>
            <CardTitle>{users.length} pengguna</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y [&_article]:flex [&_article]:flex-wrap [&_article]:items-center [&_article]:gap-3 [&_article]:py-4 [&_article>div]:flex [&_article>div]:min-w-0 [&_article>div]:flex-1 [&_article>div]:flex-col [&_article>div>span]:truncate [&_article>div>span]:text-xs [&_article>div>span]:text-muted-foreground [&_time]:text-xs [&_time]:text-muted-foreground">
              {users.map((user) => (
                <article key={user.id}>
                  <Avatar>
                    <AvatarFallback>
                      {user.name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <strong>{user.name}</strong>
                    <span>{user.email}</span>
                  </div>
                  <Badge variant="secondary">
                    {user.role === "ADMIN" ? "Administrator" : "Staf"}
                  </Badge>
                  <time>
                    {format(user.createdAt, "dd MMM yyyy", { locale: id })}
                  </time>
                </article>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
