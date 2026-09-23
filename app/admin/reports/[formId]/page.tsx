import Link from "next/link";
import { ArrowLeftIcon, CalendarBlankIcon } from "@phosphor-icons/react/dist/ssr";

import {
  AssessmentDistribution,
  AssessmentExecutiveSummary,
  AssessmentMetrics,
  AssessmentRecords,
} from "@/components/reports/assessment-report-sections";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getFormAssessmentReport } from "@/lib/data/reports";

export default async function FormReportPage({
  params,
  searchParams,
}: PageProps<"/admin/reports/[formId]">) {
  const [{ formId }, query] = await Promise.all([params, searchParams]);
  const from = typeof query.from === "string" ? query.from : undefined;
  const to = typeof query.to === "string" ? query.to : undefined;
  const report = await getFormAssessmentReport(formId, { from, to });

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-8">
      <Link
        href="/admin/reports"
        className={buttonVariants({ variant: "link", className: "self-start" })}
      >
        <ArrowLeftIcon />
        Semua laporan
      </Link>

      <header className="flex flex-col gap-3 border-b pb-6 [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:tracking-tight">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{report.category}</Badge>
          <Badge variant="secondary">
            Versi aktif {report.currentVersion.version}
          </Badge>
        </div>
        <h1>{report.title}</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {report.description}
        </p>
      </header>

      <form method="get" className="rounded-xl border bg-card p-4">
        <FieldGroup className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <Field>
            <FieldLabel htmlFor="report-from">Dari tanggal</FieldLabel>
            <Input
              id="report-from"
              name="from"
              type="date"
              defaultValue={report.period.from}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="report-to">Sampai tanggal</FieldLabel>
            <Input
              id="report-to"
              name="to"
              type="date"
              defaultValue={report.period.to}
            />
          </Field>
          <Button type="submit">
            <CalendarBlankIcon data-icon="inline-start" />
            Terapkan periode
          </Button>
        </FieldGroup>
      </form>

      <AssessmentExecutiveSummary
        insights={report.insights}
        trend={report.trend}
        periodLabel={report.period.label}
        previousPeriodLabel={report.period.previousLabel}
      />
      <AssessmentMetrics
        summary={report.summary}
        comparison={report.comparison}
        hasPreviousData={report.previousSummary.submissionCount > 0}
      />
      <AssessmentDistribution summary={report.summary} />
      <AssessmentRecords submissions={report.submissions} />
    </div>
  );
}
