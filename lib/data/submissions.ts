import "server-only";

import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { parseFormSchema } from "@/lib/forms/validation";
import { requireAdmin, requireStaff } from "@/lib/session";

export type SubmissionFilters = {
  query?: string;
  status?: "DRAFT" | "SUBMITTED";
  formId?: string;
  from?: string;
  to?: string;
};

export type SubmissionAccess = "admin" | "staff";

export async function getSubmissions(
  filters: SubmissionFilters = {},
  access: SubmissionAccess = "admin",
) {
  const staff = await (access === "admin" ? requireAdmin() : requireStaff());

  const createdAt = {
    ...(filters.from ? { gte: new Date(`${filters.from}T00:00:00`) } : {}),
    ...(filters.to ? { lte: new Date(`${filters.to}T23:59:59.999`) } : {}),
  };

  return db.submission.findMany({
    where: {
      ...(access === "staff" && staff.role !== "ADMIN"
        ? { createdById: staff.id }
        : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.formId ? { formVersion: { formId: filters.formId } } : {}),
      ...(Object.keys(createdAt).length ? { createdAt } : {}),
      ...(filters.query
        ? {
            OR: [
              { patientName: { contains: filters.query, mode: "insensitive" } },
              {
                medicalRecordNumber: {
                  contains: filters.query,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
    select: {
      id: true,
      status: true,
      patientName: true,
      medicalRecordNumber: true,
      room: true,
      updatedAt: true,
      submittedAt: true,
      createdBy: { select: { id: true, name: true } },
      formVersion: {
        select: {
          version: true,
          form: { select: { id: true, title: true, slug: true } },
        },
      },
    },
  });
}

export async function getSubmission(
  id: string,
  mode: "view" | "edit" = "view",
  access: SubmissionAccess = mode === "edit" ? "staff" : "admin",
) {
  const [staff, submission] = await Promise.all([
    access === "admin" ? requireAdmin() : requireStaff(),
    db.submission.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        patientName: true,
        medicalRecordNumber: true,
        room: true,
        answersJson: true,
        createdAt: true,
        updatedAt: true,
        submittedAt: true,
        createdById: true,
        createdBy: { select: { name: true } },
        updatedBy: { select: { name: true } },
        formVersion: {
          select: {
            id: true,
            version: true,
            schemaJson: true,
            form: {
              select: { id: true, slug: true, title: true, category: true },
            },
          },
        },
      },
    }),
  ]);

  if (!submission) notFound();
  if (
    access === "staff" &&
      staff.role !== "ADMIN" &&
      submission.createdById !== staff.id
  ) {
    notFound();
  }

  return {
    ...submission,
    schema: parseFormSchema(submission.formVersion.schemaJson),
  };
}

export async function recordSubmissionAccess(
  submissionId: string,
  action: "VIEW" | "PRINT",
  access: SubmissionAccess = "admin",
) {
  const staff = await (access === "admin" ? requireAdmin() : requireStaff());
  if (access === "staff" && staff.role !== "ADMIN") {
    const submission = await db.submission.findUnique({
      where: { id: submissionId },
      select: { createdById: true },
    });
    if (!submission || submission.createdById !== staff.id) notFound();
  }
  await db.auditEvent.create({
    data: {
      actorId: staff.id,
      action,
      entityId: submissionId,
      submissionId,
    },
  });
}

export async function getSubmissionStats() {
  await requireAdmin();
  const [drafts, submitted, today] = await Promise.all([
    db.submission.count({ where: { status: "DRAFT" } }),
    db.submission.count({ where: { status: "SUBMITTED" } }),
    db.submission.count({
      where: {
        submittedAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
  ]);
  return { drafts, submitted, today };
}
