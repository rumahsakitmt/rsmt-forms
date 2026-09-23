import Link from "next/link";
import { ArrowLeftIcon, ArrowUpRightIcon, CalendarBlankIcon } from "@phosphor-icons/react/dist/ssr";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getFormAssessmentReport } from "@/lib/data/reports";

export default async function FormReportPage({ params, searchParams }: PageProps<"/admin/reports/[formId]">) {
  const [{ formId }, query] = await Promise.all([params, searchParams]);
  const from = typeof query.from === "string" ? query.from : undefined;
  const to = typeof query.to === "string" ? query.to : undefined;
  const report = await getFormAssessmentReport(formId, { from, to });

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-8">
      <Link href="/admin/reports" className={buttonVariants({ variant: "link", className: "self-start" })}><ArrowLeftIcon /> Semua laporan</Link>
      <header className="flex flex-col gap-3 border-b pb-6 [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:tracking-tight">
        <div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{report.category}</Badge><Badge variant="secondary">Versi aktif {report.currentVersion.version}</Badge></div>
        <h1>{report.title}</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{report.description}</p>
      </header>

      <form method="get" className="rounded-xl border bg-card p-4">
        <FieldGroup className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <Field><FieldLabel htmlFor="report-from">Dari tanggal</FieldLabel><Input id="report-from" name="from" type="date" defaultValue={from} /></Field>
          <Field><FieldLabel htmlFor="report-to">Sampai tanggal</FieldLabel><Input id="report-to" name="to" type="date" defaultValue={to} /></Field>
          <Button type="submit"><CalendarBlankIcon data-icon="inline-start" /> Terapkan periode</Button>
        </FieldGroup>
      </form>

      <section aria-label="Ringkasan laporan" className="grid gap-3 sm:grid-cols-3">
        {[
          ["Asesmen terkirim", report.summary.submissionCount, "Catatan dalam periode"],
          ["Pasien unik", report.summary.uniquePatients, "Berdasarkan nomor CM"],
          ["Kelengkapan", `${report.summary.completionRate}%`, "Jawaban pada pertanyaan tampil"],
        ].map(([label, value, note]) => (
          <Card key={label}><CardHeader><CardDescription>{label}</CardDescription><CardTitle className="text-3xl tabular-nums">{value}</CardTitle></CardHeader><CardContent className="text-xs text-muted-foreground">{note}</CardContent></Card>
        ))}
      </section>

      {report.summary.submissionCount ? (
        <section className="flex flex-col gap-4">
          <div><h2 className="text-xl font-semibold">Distribusi jawaban</h2><p className="mt-1 text-sm text-muted-foreground">Persentase dihitung dari asesmen yang menjawab pertanyaan terkait.</p></div>
          <div className="grid gap-4 lg:grid-cols-2">
            {report.summary.fields.map((field, index) => (
              <Card key={field.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4"><CardTitle className="text-base leading-snug"><span className="mr-2 text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>{field.label}</CardTitle><Badge variant="outline">{field.responseRate}% terisi</Badge></div>
                  <CardDescription>{field.answered} dari {report.summary.submissionCount} asesmen menjawab</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {field.choices.length ? field.choices.map((choice) => (
                    <div key={choice.value} className="space-y-1.5">
                      <div className="flex justify-between gap-3 text-sm"><span>{choice.label}</span><span className="shrink-0 tabular-nums text-muted-foreground">{choice.count} · {choice.percentage}%</span></div>
                      <Progress value={choice.percentage} aria-label={`${choice.label}: ${choice.percentage}%`} />
                    </div>
                  )) : <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm"><span>Jawaban teks tercatat</span><strong className="tabular-nums">{field.answered}</strong></div>}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : (
        <Empty className="border"><EmptyHeader><EmptyTitle>Belum ada asesmen terkirim</EmptyTitle><EmptyDescription>Ubah periode laporan atau tunggu hingga formulir ini dikirim.</EmptyDescription></EmptyHeader></Empty>
      )}

      <Card>
        <CardHeader><CardTitle>Catatan asesmen</CardTitle><CardDescription>Semua asesmen terkirim dalam periode laporan.</CardDescription></CardHeader>
        <CardContent>
          {report.submissions.length ? (
            <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Pasien</TableHead><TableHead>Ruangan</TableHead><TableHead>Tanggal</TableHead><TableHead>Petugas</TableHead><TableHead aria-label="Aksi" /></TableRow></TableHeader><TableBody>
              {report.submissions.map((submission) => <TableRow key={submission.id}><TableCell><strong className="block">{submission.patientName}</strong><span className="text-xs text-muted-foreground">{submission.medicalRecordNumber}</span></TableCell><TableCell>{submission.room || "—"}</TableCell><TableCell>{submission.submittedAt ? format(submission.submittedAt, "dd MMM yyyy, HH.mm", { locale: idLocale }) : "—"}</TableCell><TableCell>{submission.createdBy.name}</TableCell><TableCell><Button nativeButton={false} role="link" size="icon" variant="ghost" aria-label={`Buka asesmen ${submission.patientName}`} render={<Link href={`/admin/submissions/${submission.id}`} />}><ArrowUpRightIcon /></Button></TableCell></TableRow>)}
            </TableBody></Table></div>
          ) : <p className="py-6 text-center text-sm text-muted-foreground">Tidak ada catatan dalam periode ini.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
