"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { FormAnswers, PatientContext, SubmissionMode } from "@/lib/forms/types";
import { parseFormSchema, validateSubmission } from "@/lib/forms/validation";
import { requireStaff } from "@/lib/session";

type SaveSubmissionInput = {
  submissionId?: string;
  formSlug: string;
  patient: PatientContext;
  answers: FormAnswers;
  mode: SubmissionMode;
};

export type SaveSubmissionResult = {
  success: boolean;
  submissionId?: string;
  status?: "DRAFT" | "SUBMITTED";
  message: string;
  errors?: Record<string, string>;
};

export type DeleteSubmissionResult = {
  success: boolean;
  message: string;
};

export async function saveSubmissionAction(
  input: SaveSubmissionInput,
): Promise<SaveSubmissionResult> {
  const staff = await requireStaff();

  const existing = input.submissionId
    ? await db.submission.findUnique({
        where: { id: input.submissionId },
        include: { formVersion: { include: { form: true } } },
      })
    : null;

  if (input.submissionId && !existing) {
    return { success: false, message: "Draft tidak ditemukan." };
  }

  if (existing) {
    if (existing.createdById !== staff.id && staff.role !== "ADMIN") {
      return {
        success: false,
        message: "Anda tidak memiliki akses untuk mengubah formulir ini.",
      };
    }
    if (existing.formVersion.form.slug !== input.formSlug) {
      return { success: false, message: "Jenis formulir tidak sesuai." };
    }
  }

  const currentForm = existing
    ? null
    : await db.form.findFirst({
        where: { slug: input.formSlug, isActive: true },
        include: { currentVersion: true },
      });
  const version = existing?.formVersion ?? currentForm?.currentVersion;

  if (!version) return { success: false, message: "Formulir tidak tersedia." };

  const schema = parseFormSchema(version.schemaJson);
  const patient = {
    patientName: input.patient.patientName.trim(),
    medicalRecordNumber: input.patient.medicalRecordNumber.trim(),
    room: input.patient.room.trim(),
  };
  const effectiveMode =
    existing?.status === "SUBMITTED" ? "submit" : input.mode;
  const validation = validateSubmission(
    schema,
    patient,
    input.answers,
    effectiveMode,
  );

  if (!validation.valid) {
    return {
      success: false,
      message:
        effectiveMode === "submit"
          ? "Periksa kembali bagian yang belum lengkap."
          : "Beberapa jawaban belum dapat disimpan.",
      errors: validation.errors,
    };
  }

  const status = effectiveMode === "submit" ? "SUBMITTED" : "DRAFT";
  const now = new Date();
  const answersJson = input.answers as unknown as Prisma.InputJsonValue;

  const submission = await db.$transaction(async (tx) => {
    if (existing) {
      const updated = await tx.submission.update({
        where: { id: existing.id },
        data: {
          patientName: patient.patientName,
          medicalRecordNumber: patient.medicalRecordNumber,
          room: patient.room,
          answersJson,
          status,
          updatedById: staff.id,
          submittedAt:
            status === "SUBMITTED" ? (existing.submittedAt ?? now) : null,
        },
      });
      await tx.auditEvent.create({
        data: {
          actorId: staff.id,
          action:
            existing.status === "DRAFT" && status === "SUBMITTED"
              ? "SUBMIT"
              : "UPDATE",
          entityId: updated.id,
          submissionId: updated.id,
        },
      });
      return updated;
    }

    const created = await tx.submission.create({
      data: {
        formVersionId: version.id,
        patientName: patient.patientName,
        medicalRecordNumber: patient.medicalRecordNumber,
        room: patient.room,
        answersJson,
        status,
        createdById: staff.id,
        updatedById: staff.id,
        submittedAt: status === "SUBMITTED" ? now : null,
      },
    });
    await tx.auditEvent.createMany({
      data: [
        {
          actorId: staff.id,
          action: "CREATE",
          entityId: created.id,
          submissionId: created.id,
        },
        ...(status === "SUBMITTED"
          ? [
              {
                actorId: staff.id,
                action: "SUBMIT" as const,
                entityId: created.id,
                submissionId: created.id,
              },
            ]
          : []),
      ],
    });
    return created;
  });

  revalidatePath("/");
  revalidatePath("/submissions");
  revalidatePath("/admin/submissions");

  return {
    success: true,
    submissionId: submission.id,
    status,
    message:
      existing?.status === "SUBMITTED"
        ? "Perubahan formulir berhasil disimpan."
        : status === "SUBMITTED"
          ? "Formulir berhasil dikirim."
          : "Draft berhasil disimpan.",
  };
}

export async function deleteSubmissionAction(
  submissionId: string,
): Promise<DeleteSubmissionResult> {
  const staff = await requireStaff();
  const submission = await db.submission.findUnique({
    where: { id: submissionId },
    select: {
      id: true,
      status: true,
      formVersionId: true,
      createdById: true,
    },
  });

  if (!submission) {
    return { success: false, message: "Formulir tidak ditemukan." };
  }
  if (staff.role !== "ADMIN" && submission.createdById !== staff.id) {
    return {
      success: false,
      message: "Anda tidak memiliki akses untuk menghapus formulir ini.",
    };
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.submission.delete({ where: { id: submission.id } });
      await tx.auditEvent.create({
        data: {
          actorId: staff.id,
          action: "DELETE",
          entityId: submission.id,
          metadataJson: {
            status: submission.status,
            formVersionId: submission.formVersionId,
          },
        },
      });
    });
  } catch {
    return {
      success: false,
      message: "Formulir tidak dapat dihapus. Silakan coba lagi.",
    };
  }

  revalidatePath("/");
  revalidatePath("/submissions");
  revalidatePath("/admin/submissions");

  return { success: true, message: "Data formulir berhasil dihapus." };
}
