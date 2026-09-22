import Link from "next/link";
import {
  IconArrowUpRight,
  IconClipboardHeart,
  IconClockHour4,
  IconFileCheck,
  IconHeartHandshake,
  IconPlus,
} from "@tabler/icons-react";

import { getActiveForms } from "@/lib/data/forms";
import { getSubmissionStats } from "@/lib/data/submissions";
import { requireStaff } from "@/lib/session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export default async function DashboardPage() {
  const [staff, forms, stats] = await Promise.all([
    requireStaff(),
    getActiveForms(),
    getSubmissionStats(),
  ]);

  const firstName = staff.name.split(" ")[0];

  return (
    <div className="page-shell dashboard-page">
      <header className="page-heading dashboard-heading">
        <div>
          <p className="eyebrow">Selamat bertugas, {firstName}</p>
          <h1>Pilih formulir untuk memulai.</h1>
          <p className="page-lead">
            Formulir aktif tersedia di satu ruang kerja yang konsisten dan mudah ditelusuri.
          </p>
        </div>
        <Button className="h-10 px-4" variant="outline" render={<Link href="/submissions" />}>
          Lihat riwayat <IconArrowUpRight size={18} />
        </Button>
      </header>

      <section className="stat-strip" aria-label="Ringkasan formulir">
        <div><IconClipboardHeart size={20} /><span><strong>{forms.length}</strong> Formulir aktif</span></div>
        <div><IconClockHour4 size={20} /><span><strong>{stats.drafts}</strong> Draft berjalan</span></div>
        <div><IconFileCheck size={20} /><span><strong>{stats.today}</strong> Dikirim hari ini</span></div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Katalog</p>
            <h2>Formulir klinis</h2>
          </div>
          <span className="section-count">{forms.length.toString().padStart(2, "0")}</span>
        </div>

        <div className="form-grid">
          {forms.map((form, index) => (
            <Card className="form-card reveal gap-0 py-0" style={{ animationDelay: `${index * 90}ms` }} key={form.id}>
              <CardHeader className="form-card-topline px-0">
                <span className="form-icon"><IconHeartHandshake size={27} stroke={1.55} /></span>
                <Badge variant="secondary">V{form.version.toString().padStart(2, "0")}</Badge>
              </CardHeader>
              <CardContent className="form-card-copy px-0">
                <Badge className="category-tag px-0" variant="link">{form.category}</Badge>
                <h3>{form.title}</h3>
                <p>{form.description}</p>
              </CardContent>
              <CardFooter className="form-card-action px-0">
              <Link className="flex w-full items-center justify-between" href={`/forms/${form.slug}/new`}>
                <span><IconPlus size={17} /> Isi formulir</span>
                <IconArrowUpRight size={20} />
              </Link>
              </CardFooter>
            </Card>
          ))}
          <Card className="form-card form-card-soon gap-0 py-0">
            <span className="form-index">BERIKUTNYA</span>
            <div>
              <h3>Ruang untuk formulir berikutnya.</h3>
              <p>Definisi baru dapat ditambahkan tanpa mengubah struktur data submission.</p>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
