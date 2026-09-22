import { IconAt, IconShieldCheck } from "@tabler/icons-react";

import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { Card } from "@/components/ui/card";
import { requireStaff } from "@/lib/session";

export default async function AccountPage() {
  const staff = await requireStaff();
  return (
    <div className="page-shell account-page">
      <header className="page-heading">
        <div><p className="eyebrow">Keamanan akun</p><h1>Akun saya</h1><p className="page-lead">Kelola kata sandi untuk menjaga akses formulir klinis tetap aman.</p></div>
      </header>
      <div className="account-grid">
        <Card className="account-card account-identity">
          <span className="avatar large">{staff.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</span>
          <div><p className="eyebrow">Profil staf</p><h2>{staff.name}</h2></div>
          <dl>
            <div><dt><IconAt size={17} /> Email</dt><dd>{staff.email}</dd></div>
            <div><dt><IconShieldCheck size={17} /> Peran</dt><dd>{staff.role === "ADMIN" ? "Administrator" : "Staf klinis"}</dd></div>
          </dl>
        </Card>
        <Card className="account-card">
          <div className="panel-heading compact"><span><IconShieldCheck size={21} /></span><div><p className="eyebrow">Kredensial</p><h2>Ubah kata sandi</h2></div></div>
          <ChangePasswordForm />
        </Card>
      </div>
    </div>
  );
}
