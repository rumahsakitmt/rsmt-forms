import "server-only";

import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import type { FormAnswers } from "@/lib/forms/types";
import { parseFormSchema } from "@/lib/forms/validation";
import { buildAssessmentReport } from "@/lib/reports/assessment-report";
import { requireAdmin } from "@/lib/session";

export type ReportDateFilters = { from?: string; to?: string };

function submittedAtFilter(filters: ReportDateFilters) {
  const validDate = /^\d{4}-\d{2}-\d{2}$/;
  return {
    ...(filters.from && validDate.test(filters.from)
      ? { gte: new Date(`${filters.from}T00:00:00`) }
      : {}),
    ...(filters.to && validDate.test(filters.to)
      ? { lte: new Date(`${filters.to}T23:59:59.999`) }
      : {}),
  };
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

  return forms.map(({ versions: _versions, ...form }) => {
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
      ...form,
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
  const range = submittedAtFilter(filters);
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
              ...(Object.keys(range).length ? { submittedAt: range } : {}),
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
  const submissions = form.versions.flatMap((version) => version.submissions);
  const summary = buildAssessmentReport(
    schema,
    submissions.map((submission) => ({
      medicalRecordNumber: submission.medicalRecordNumber,
      answers: submission.answersJson as FormAnswers,
    })),
  );

  return { ...form, currentVersion, schema, submissions, summary };
}
