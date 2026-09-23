import "server-only";

import {
  eachDayOfInterval,
  eachWeekOfInterval,
  endOfDay,
  format,
  startOfDay,
  startOfWeek,
  subDays,
} from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import type { FormAnswers } from "@/lib/forms/types";
import { parseFormSchema } from "@/lib/forms/validation";
import {
  buildAssessmentInsights,
  buildAssessmentReport,
  compareAssessmentReports,
} from "@/lib/reports/assessment-report";
import { requireAdmin } from "@/lib/session";

export type ReportDateFilters = { from?: string; to?: string };

const validDate = /^\d{4}-\d{2}-\d{2}$/;

function parseDate(value: string | undefined, boundary: "start" | "end") {
  if (!value || !validDate.test(value)) return null;
  const date = new Date(`${value}T${boundary === "start" ? "00:00:00" : "23:59:59.999"}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function reportPeriod(filters: ReportDateFilters, now = new Date()) {
  let to = parseDate(filters.to, "end") ?? endOfDay(now);
  let from = parseDate(filters.from, "start") ?? startOfDay(subDays(to, 29));

  if (from > to) {
    to = endOfDay(now);
    from = startOfDay(subDays(to, 29));
  }

  const duration = to.getTime() - from.getTime() + 1;
  const previousTo = new Date(from.getTime() - 1);
  const previousFrom = new Date(previousTo.getTime() - duration + 1);

  return {
    from,
    to,
    previousFrom,
    previousTo,
    fromInput: format(from, "yyyy-MM-dd"),
    toInput: format(to, "yyyy-MM-dd"),
    label: `${format(from, "d MMM yyyy", { locale: idLocale })}–${format(to, "d MMM yyyy", { locale: idLocale })}`,
    previousLabel: `${format(previousFrom, "d MMM yyyy", { locale: idLocale })}–${format(previousTo, "d MMM yyyy", { locale: idLocale })}`,
  };
}

function buildSubmissionTrend(
  submissions: { submittedAt: Date | null }[],
  from: Date,
  to: Date,
) {
  const useWeeklyBuckets = to.getTime() - from.getTime() > 45 * 86_400_000;
  const bucketStart = (date: Date) =>
    useWeeklyBuckets
      ? startOfWeek(date, { weekStartsOn: 1 })
      : startOfDay(date);
  const interval = useWeeklyBuckets
    ? eachWeekOfInterval({ start: from, end: to }, { weekStartsOn: 1 })
    : eachDayOfInterval({ start: from, end: to });
  const counts = new Map<string, number>();

  for (const submission of submissions) {
    if (!submission.submittedAt) continue;
    const key = format(bucketStart(submission.submittedAt), "yyyy-MM-dd");
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return interval.map((date) => {
    const key = format(bucketStart(date), "yyyy-MM-dd");
    return {
      date: key,
      label: format(date, useWeeklyBuckets ? "d MMM" : "d MMM", {
        locale: idLocale,
      }),
      submissions: counts.get(key) ?? 0,
    };
  });
}

export async function getFormReportIndex() {
  await requireAdmin();
  const [forms, groupedSubmissions] = await Promise.all([
    db.form.findMany({
      orderBy: { title: "asc" },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        category: true,
        isActive: true,
        versions: { select: { id: true } },
      },
    }),
    db.submission.groupBy({
      by: ["formVersionId", "status"],
      _count: { _all: true },
      _max: { submittedAt: true },
    }),
  ]);
  const formByVersion = new Map(
    forms.flatMap((form) =>
      form.versions.map((version) => [version.id, form.id] as const),
    ),
  );

  return forms.map((form) => {
    const groups = groupedSubmissions.filter(
      (group) => formByVersion.get(group.formVersionId) === form.id,
    );
    const submitted = groups
      .filter((group) => group.status === "SUBMITTED")
      .reduce((total, group) => total + group._count._all, 0);
    const drafts = groups
      .filter((group) => group.status === "DRAFT")
      .reduce((total, group) => total + group._count._all, 0);
    return {
      id: form.id,
      slug: form.slug,
      title: form.title,
      description: form.description,
      category: form.category,
      isActive: form.isActive,
      submitted,
      drafts,
      latestSubmissionAt: groups.reduce<Date | null>(
        (latest, group) =>
          group.status === "SUBMITTED" &&
          group._max.submittedAt &&
          (!latest || group._max.submittedAt > latest)
            ? group._max.submittedAt
            : latest,
        null,
      ),
    };
  });
}

export async function getFormAssessmentReport(
  formId: string,
  filters: ReportDateFilters = {},
) {
  await requireAdmin();
  const period = reportPeriod(filters);
  const form = await db.form.findUnique({
    where: { id: formId },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      category: true,
      currentVersion: { select: { schemaJson: true, version: true } },
      versions: {
        select: {
          submissions: {
            where: {
              status: "SUBMITTED",
              submittedAt: { gte: period.previousFrom, lte: period.to },
            },
            orderBy: { submittedAt: "desc" },
            select: {
              id: true,
              patientName: true,
              medicalRecordNumber: true,
              room: true,
              answersJson: true,
              submittedAt: true,
              createdBy: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!form?.currentVersion) notFound();
  const currentVersion = form.currentVersion;
  const schema = parseFormSchema(currentVersion.schemaJson);
  const allSubmissions = form.versions.flatMap((version) => version.submissions);
  const submissions = allSubmissions
    .filter(
      (submission) =>
        submission.submittedAt &&
        submission.submittedAt >= period.from &&
        submission.submittedAt <= period.to,
    )
    .sort(
      (a, b) =>
        (b.submittedAt?.getTime() ?? 0) - (a.submittedAt?.getTime() ?? 0),
    );
  const previousSubmissions = allSubmissions.filter(
    (submission) =>
      submission.submittedAt &&
      submission.submittedAt >= period.previousFrom &&
      submission.submittedAt <= period.previousTo,
  );
  const toReportSubmission = (submission: (typeof allSubmissions)[number]) => ({
    medicalRecordNumber: submission.medicalRecordNumber,
    answers: submission.answersJson as FormAnswers,
  });
  const summary = buildAssessmentReport(
    schema,
    submissions.map(toReportSubmission),
  );
  const previousSummary = buildAssessmentReport(
    schema,
    previousSubmissions.map(toReportSubmission),
  );
  const comparison = compareAssessmentReports(summary, previousSummary);
  const insights = buildAssessmentInsights(
    summary,
    previousSummary,
    comparison,
  );
  const trend = buildSubmissionTrend(submissions, period.from, period.to);

  return {
    ...form,
    currentVersion,
    schema,
    submissions,
    summary,
    previousSummary,
    comparison,
    insights,
    trend,
    period: {
      from: period.fromInput,
      to: period.toInput,
      label: period.label,
      previousLabel: period.previousLabel,
    },
  };
}
