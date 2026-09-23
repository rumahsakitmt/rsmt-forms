import { format } from "date-fns";
import { id } from "date-fns/locale";

import { CreateStaffForm } from "@/components/admin/create-staff-form";
import { UserManagementActions } from "@/components/admin/user-management-actions";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export default async function UsersPage() {
  const administrator = await requireAdmin();
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: {
        select: { submissions: true, updates: true, auditEvents: true },
      },
    },
  });

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:tracking-tight">
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Administrasi
          </p>
          <h1>Pengguna</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Buat akun, atur akses, reset kata sandi, dan kelola pengguna ruang
            kerja.
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
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pengguna</TableHead>
                    <TableHead>Peran</TableHead>
                    <TableHead>Dibuat</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
                    const role = user.role === "ADMIN" ? "ADMIN" : "STAFF";
                    const hasClinicalHistory =
                      user._count.submissions > 0 ||
                      user._count.updates > 0 ||
                      user._count.auditEvents > 0;
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex min-w-56 items-center gap-3">
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
                            <div className="flex min-w-0 flex-col">
                              <strong className="truncate">
                                {user.name}
                                {user.id === administrator.id ? " (Anda)" : ""}
                              </strong>
                              <span className="truncate text-xs text-muted-foreground">
                                {user.email}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={role === "ADMIN" ? "secondary" : "outline"}>
                            {role === "ADMIN" ? "Administrator" : "Staf"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <time className="text-xs text-muted-foreground">
                            {format(user.createdAt, "dd MMM yyyy", { locale: id })}
                          </time>
                        </TableCell>
                        <TableCell>
                          <UserManagementActions
                            currentUserId={administrator.id}
                            user={{
                              id: user.id,
                              name: user.name,
                              email: user.email,
                              role,
                              hasClinicalHistory,
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
