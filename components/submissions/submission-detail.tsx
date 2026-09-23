import Link from "next/link";
import {
  ArrowLeftIcon,
  DownloadSimpleIcon,
  PencilSimpleIcon,
  PrinterIcon,
} from "@phosphor-icons/react/dist/ssr";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

import { AnswersView } from "@/components/forms/answers-view";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import type { FormAnswers, FormSchema } from "@/lib/forms/types";

type SubmissionDetailProps = {
  submission: {
    id: string;
    status: "DRAFT" | "SUBMITTED";
    patientName: string;
    medicalRecordNumber: string;
    room: string;
    answersJson: unknown;
    updatedAt: Date;
    submittedAt: Date | null;
    createdBy: { name: string };
    formVersion: {
      form: {
        slug: string;
        title: string;
        category: string;
      };
    };
    schema: FormSchema;
  };
  context: "admin" | "main";
};

export function SubmissionDetail({ submission, context }: SubmissionDetailProps) {
  const backHref = context === "admin" ? "/admin/submissions" : "/submissions";
  const editHref =
    context === "admin"
      ? `/admin/submissions/${submission.id}/edit`
      : `/forms/${submission.formVersion.form.slug}/new?draft=${submission.id}`;
  const printHref =
    context === "admin"
      ? `/admin/submissions/${submission.id}/print`
      : `/submissions/${submission.id}/print`;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={backHref} className={buttonVariants({ variant: "link" })}>
          <ArrowLeftIcon />
          Riwayat
        </Link>
        <div className="flex flex-wrap gap-2">
          {submission.status === "DRAFT" ? (
            <Button
              nativeButton={false}
              role="link"
              variant="outline"
              render={<Link href={editHref} />}
            >
              <PencilSimpleIcon data-icon="inline-start" />
              Lanjutkan draft
            </Button>
          ) : null}
          <Button
            nativeButton={false}
            role="link"
            variant="outline"
            render={<a href={`${printHref}?download=1`} download />}
          >
            <DownloadSimpleIcon data-icon="inline-start" />
            Unduh PDF
          </Button>
          <Button
            nativeButton={false}
            role="link"
            render={
              <a href={printHref} target="_blank" rel="noopener noreferrer" />
            }
          >
            <PrinterIcon data-icon="inline-start" />
            Cetak
          </Button>
        </div>
      </div>
      <article className="overflow-hidden rounded-xl border bg-card">
        <header className="flex items-start justify-between gap-4 border-b p-6 [&_h1]:text-2xl [&_h1]:font-semibold">
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              {submission.formVersion.form.category}
            </p>
            <h1>{submission.formVersion.form.title}</h1>
          </div>
          <Badge
            variant={submission.status === "DRAFT" ? "outline" : "secondary"}
          >
            {submission.status === "DRAFT" ? "Draft" : "Terkirim"}
          </Badge>
        </header>
        <section className="grid divide-y border-b sm:grid-cols-2 lg:grid-cols-4 [&>div]:flex [&>div]:flex-col [&>div]:gap-1 [&>div]:p-4 [&_span]:text-xs [&_span]:text-muted-foreground [&_strong]:text-sm">
          <div>
            <span>Nama pasien</span>
            <strong>{submission.patientName || "—"}</strong>
          </div>
          <div>
            <span>No. CM</span>
            <strong>{submission.medicalRecordNumber || "—"}</strong>
          </div>
          <div>
            <span>Ruangan</span>
            <strong>{submission.room || "—"}</strong>
          </div>
          <div>
            <span>Tanggal</span>
            <strong>
              {format(
                submission.submittedAt ?? submission.updatedAt,
                "dd MMMM yyyy",
                { locale: idLocale },
              )}
            </strong>
          </div>
        </section>
        <AnswersView
          answers={submission.answersJson as FormAnswers}
          schema={submission.schema}
        />
        <footer className="flex flex-wrap justify-between gap-2 border-t bg-muted px-6 py-4 text-xs text-muted-foreground">
          <span>Dibuat oleh {submission.createdBy.name}</span>
          <span>
            Pembaruan terakhir {" "}
            {format(submission.updatedAt, "dd MMM yyyy, HH.mm", {
              locale: idLocale,
            })}
          </span>
        </footer>
      </article>
    </div>
  );
}
