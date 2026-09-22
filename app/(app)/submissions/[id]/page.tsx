import Link from "next/link";
import { IconArrowLeft, IconEdit, IconPrinter } from "@tabler/icons-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

import { AnswersView } from "@/components/forms/answers-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSubmission, recordSubmissionAccess } from "@/lib/data/submissions";
import type { FormAnswers } from "@/lib/forms/types";

export default async function SubmissionDetailPage({ params }: PageProps<"/submissions/[id]">) {
  const { id } = await params;
  const submission = await getSubmission(id);
  await recordSubmissionAccess(id, "VIEW");

  return (
    <div className="page-shell record-detail-page">
      <div className="detail-toolbar">
        <Link className="back-link" href="/submissions"><IconArrowLeft size={17} /> Riwayat</Link>
        <div className="button-row">
          {submission.status === "DRAFT" ? (
            <Button className="h-10 px-4" variant="outline" render={<Link href={`/submissions/${submission.id}/edit`} />}><IconEdit size={18} /> Lanjutkan draft</Button>
          ) : null}
          <Button className="h-10 px-4" render={<Link href={`/submissions/${submission.id}/print`} />}><IconPrinter size={18} /> Tampilan cetak</Button>
        </div>
      </div>
      <article className="record-document">
        <header className="record-header">
          <div>
            <p className="eyebrow">{submission.formVersion.form.category} · Versi {submission.formVersion.version}</p>
            <h1>{submission.formVersion.form.title}</h1>
          </div>
          <Badge variant={submission.status === "DRAFT" ? "outline" : "secondary"} className={`status-badge ${submission.status.toLowerCase()}`}>{submission.status === "DRAFT" ? "Draft" : "Terkirim"}</Badge>
        </header>
        <section className="patient-summary">
          <div><span>Nama pasien</span><strong>{submission.patientName || "—"}</strong></div>
          <div><span>No. CM</span><strong>{submission.medicalRecordNumber || "—"}</strong></div>
          <div><span>Ruangan</span><strong>{submission.room || "—"}</strong></div>
          <div><span>Tanggal</span><strong>{format(submission.submittedAt ?? submission.updatedAt, "dd MMMM yyyy", { locale: idLocale })}</strong></div>
        </section>
        <AnswersView answers={submission.answersJson as FormAnswers} schema={submission.schema} />
        <footer className="record-footer">
          <span>Dibuat oleh {submission.createdBy.name}</span>
          <span>Pembaruan terakhir {format(submission.updatedAt, "dd MMM yyyy, HH.mm", { locale: idLocale })}</span>
        </footer>
      </article>
    </div>
  );
}
