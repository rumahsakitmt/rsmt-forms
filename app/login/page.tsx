import { redirect } from "next/navigation";
import { IconActivityHeartbeat, IconLock, IconShieldCheck } from "@tabler/icons-react";

import { LoginForm } from "@/components/auth/login-form";
import { getCurrentStaff } from "@/lib/session";

export default async function LoginPage() {
  const staff = await getCurrentStaff();
  if (staff) redirect("/");

  return (
    <main className="login-page">
      <section className="login-story">
        <div className="login-brand">
          <span className="brand-mark light"><IconActivityHeartbeat size={25} /></span>
          <span>RSUD Forms</span>
        </div>
        <div className="login-story-copy">
          <p className="eyebrow light">Ruang kerja klinis</p>
          <h1>Catatan yang rapi.<br />Edukasi yang lebih tepat.</h1>
          <p>
            Satu tempat untuk mengisi, meninjau, dan menjaga kesinambungan formulir pasien.
          </p>
        </div>
        <div className="login-trust">
          <span><IconShieldCheck size={18} /> Data tersimpan aman</span>
          <span><IconLock size={18} /> Khusus staf terautentikasi</span>
        </div>
      </section>
      <section className="login-panel">
        <div className="login-card">
          <p className="eyebrow">Akses staf</p>
          <h2>Selamat datang kembali</h2>
          <p className="muted">Masuk menggunakan akun yang diberikan administrator.</p>
          <LoginForm />
          <p className="login-help">Butuh akses? Hubungi administrator RSUD.</p>
        </div>
      </section>
    </main>
  );
}
