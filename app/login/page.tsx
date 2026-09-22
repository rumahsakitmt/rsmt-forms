import { redirect } from "next/navigation";
import {
  LockIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react/dist/ssr";

import { LoginForm } from "@/components/auth/login-form";
import { getCurrentStaff } from "@/lib/session";
import Image from "next/image";

export default async function LoginPage() {
  const staff = await getCurrentStaff();
  if (staff) redirect("/");

  return (
    <main className="grid min-h-svh lg:grid-cols-2">
      <section className="hidden flex-col justify-center bg-muted p-12 lg:flex">
        <div className="flex flex-col gap-6 [&_h1]:text-4xl [&_h1]:font-semibold [&_h1]:tracking-tight [&>p]:text-muted-foreground">
          <h1>
            Catatan yang rapi.
            <br />
            Edukasi yang lebih tepat.
          </h1>
          <p>
            Satu tempat untuk mengisi, meninjau, dan menjaga kesinambungan
            formulir pasien.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground [&>span]:flex [&>span]:items-center [&>span]:gap-2">
          <span>
            <ShieldCheckIcon size={18} /> Data tersimpan aman
          </span>
          <span>
            <LockIcon size={18} /> Khusus staf terautentikasi
          </span>
        </div>
      </section>
      <section className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md [&_h2]:mb-2 [&_h2]:text-2xl [&_h2]:font-semibold">
          <Image
            className="mx-auto"
            src="/illustration.png"
            width={300}
            height={300}
            alt="Main illustrattion"
          />
          <h2>Selamat datang kembali</h2>
          <p className="text-sm text-muted-foreground">
            Masuk menggunakan akun yang diberikan administrator.
          </p>
          <LoginForm />
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Butuh akses? Hubungi administrator RSUD.
          </p>
        </div>
      </section>
    </main>
  );
}
