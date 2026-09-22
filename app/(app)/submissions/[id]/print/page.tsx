import Link from "next/link";
import { IconArrowLeft, IconActivityHeartbeat } from "@tabler/icons-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

import { AnswersView } from "@/components/forms/answers-view";
import { PrintButton } from "@/components/print-button";
import { getSubmission, recordSubmissionAccess } from "@/lib/data/submissions";
import type { FormAnswers } from "@/lib/forms/types";

export default async function PrintSubmissionPage({ params }: PageProps<"/submissions/[id]/print">) {
  const { id } = await params;
  const submission = await getSubmission(id);
  await recordSubmissionAccess(id, "PRINT");

  return (
    <div className="print-page">
      <div className="print-toolbar no-print">
        <Link className="back-link" href={`/submissions/${id}`}><IconArrowLeft size={17} /> Kembali</Link>
        <PrintButton />
      </div>
      <article className="print-sheet">
        <header className="print-header">
          <div className="print-logo"><IconActivityHeartbeat size={28} /><span><strong>RSUD</strong><small>FORMULIR KLINIS</small></span></div>
          <div className="print-code">{submission.formVersion.form.slug.toUpperCase()} · V{submission.formVersion.version}</div>
        </header>
        <div className="print-title"><p>ASSESSMENT</p><h1>{submission.formVersion.form.title}</h1></div>
        <section className="patient-summary print-patient">
          <div><span>Nama pasien</span><strong>{submission.patientName}</strong></div>
          <div><span>No. CM</span><strong>{submission.medicalRecordNumber}</strong></div>
          <div><span>Ruangan</span><strong>{submission.room}</strong></div>
          <div><span>Tanggal</span><strong>{format(submission.submittedAt ?? submission.updatedAt, "dd MMMM yyyy", { locale: idLocale })}</strong></div>
        </section>
        <AnswersView answers={submission.answersJson as FormAnswers} schema={submission.schema} />
        <footer className="print-footer">
          <span>Diisi oleh: {submission.createdBy.name}</span>
          <span>ID: {submission.id}</span>
        </footer>
      </article>
    </div>
  );
}
