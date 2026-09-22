import { format } from "date-fns";
import { id } from "date-fns/locale";
import { IconShieldCheck, IconUsers } from "@tabler/icons-react";

import { CreateStaffForm } from "@/components/admin/create-staff-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export default async function UsersPage() {
  await requireAdmin();
  const users = await db.user.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="page-shell">
      <header className="page-heading">
        <div><p className="eyebrow">Administrasi</p><h1>Pengguna</h1><p className="page-lead">Buat akun staf dan tinjau akses ruang kerja.</p></div>
      </header>
      <div className="admin-grid">
        <Card className="admin-create-panel">
          <div className="panel-heading compact"><span><IconShieldCheck size={20} /></span><div><p className="eyebrow">Akun baru</p><h2>Tambahkan staf</h2></div></div>
          <CreateStaffForm />
        </Card>
        <Card className="records-panel user-panel">
          <div className="records-heading"><div><p className="eyebrow">Direktori</p><h2>{users.length} pengguna</h2></div><IconUsers size={24} /></div>
          <div className="user-list">
            {users.map((user) => (
              <article key={user.id}>
                <span className="avatar">{user.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</span>
                <div><strong>{user.name}</strong><span>{user.email}</span></div>
                <Badge className="role-badge" variant="secondary">{user.role === "ADMIN" ? "Administrator" : "Staf"}</Badge>
                <time>{format(user.createdAt, "dd MMM yyyy", { locale: id })}</time>
              </article>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
