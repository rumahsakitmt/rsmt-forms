import Link from "next/link";
import {
  IconArrowUpRight,
  IconFileText,
  IconFilter,
  IconPencil,
  IconSearch,
} from "@tabler/icons-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

import { getActiveForms } from "@/lib/data/forms";
import { getSubmissions } from "@/lib/data/submissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function SubmissionsPage({ searchParams }: PageProps<"/submissions">) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  const status = params.status === "DRAFT" || params.status === "SUBMITTED" ? params.status : undefined;
  const formId = typeof params.formId === "string" ? params.formId : undefined;
  const from = typeof params.from === "string" ? params.from : undefined;
  const to = typeof params.to === "string" ? params.to : undefined;
  const [submissions, forms] = await Promise.all([
    getSubmissions({ query, status, formId, from, to }),
    getActiveForms(),
  ]);

  return (
    <div className="page-shell">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Arsip klinis</p>
          <h1>Riwayat formulir</h1>
          <p className="page-lead">Temukan draft dan formulir terkirim berdasarkan pasien atau nomor CM.</p>
        </div>
      </header>

      <form className="filter-panel" method="get">
        <label className="search-field">
          <IconSearch size={19} />
          <span className="sr-only">Cari pasien atau nomor CM</span>
          <Input className="h-11 bg-card pl-10" defaultValue={query} name="q" placeholder="Cari nama pasien atau No. CM…" />
        </label>
        <NativeSelect className="w-full" defaultValue={status ?? ""} name="status" aria-label="Status"><NativeSelectOption value="">Semua status</NativeSelectOption><NativeSelectOption value="DRAFT">Draft</NativeSelectOption><NativeSelectOption value="SUBMITTED">Terkirim</NativeSelectOption></NativeSelect>
        <NativeSelect className="w-full" defaultValue={formId ?? ""} name="formId" aria-label="Jenis formulir"><NativeSelectOption value="">Semua formulir</NativeSelectOption>{forms.map((form) => <NativeSelectOption key={form.id} value={form.id}>{form.title}</NativeSelectOption>)}</NativeSelect>
        <Input className="h-11 bg-card" defaultValue={from} name="from" type="date" aria-label="Tanggal mulai" />
        <Input className="h-11 bg-card" defaultValue={to} name="to" type="date" aria-label="Tanggal akhir" />
        <Button className="h-11 px-4" type="submit"><IconFilter size={18} /> Terapkan</Button>
      </form>

      <section className="records-panel">
        <div className="records-heading">
          <div><p className="eyebrow">Hasil</p><h2>{submissions.length} catatan</h2></div>
        </div>
        {submissions.length ? (
          <div className="records-table-wrap records-table">
            <Table>
              <TableHeader><TableRow><TableHead>Pasien</TableHead><TableHead>Formulir</TableHead><TableHead>Status</TableHead><TableHead>Diperbarui</TableHead><TableHead aria-label="Aksi" /></TableRow></TableHeader>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell><strong>{submission.patientName || "Tanpa nama"}</strong><span>{submission.medicalRecordNumber || "No. CM belum diisi"} · {submission.room || "Ruangan—"}</span></TableCell>
                    <TableCell><strong>{submission.formVersion.form.title}</strong><span>Versi {submission.formVersion.version} · {submission.createdBy.name}</span></TableCell>
                    <TableCell><Badge variant={submission.status === "DRAFT" ? "outline" : "secondary"} className={`status-badge ${submission.status.toLowerCase()}`}>{submission.status === "DRAFT" ? "Draft" : "Terkirim"}</Badge></TableCell>
                    <TableCell>{format(submission.updatedAt, "dd MMM yyyy, HH.mm", { locale: id })}</TableCell>
                    <TableCell>
                      <Link className="icon-link" href={submission.status === "DRAFT" ? `/submissions/${submission.id}/edit` : `/submissions/${submission.id}`} aria-label={submission.status === "DRAFT" ? "Lanjutkan draft" : "Lihat formulir"}>
                        {submission.status === "DRAFT" ? <IconPencil size={18} /> : <IconArrowUpRight size={18} />}
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="empty-state"><IconFileText size={32} /><h3>Belum ada catatan</h3><p>Ubah filter atau isi formulir pertama Anda.</p></div>
        )}
      </section>
    </div>
  );
}
