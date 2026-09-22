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
    if (existing.status !== "DRAFT") {
      return { success: false, message: "Formulir yang sudah dikirim tidak dapat diubah." };
    }
    if (existing.createdById !== staff.id && staff.role !== "ADMIN") {
      return { success: false, message: "Anda tidak memiliki akses untuk mengubah draft ini." };
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
  const validation = validateSubmission(schema, patient, input.answers, input.mode);

  if (!validation.valid) {
    return {
      success: false,
      message:
        input.mode === "submit"
          ? "Periksa kembali bagian yang belum lengkap."
          : "Beberapa jawaban belum dapat disimpan.",
      errors: validation.errors,
    };
  }

  const status = input.mode === "submit" ? "SUBMITTED" : "DRAFT";
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
          submittedAt: status === "SUBMITTED" ? now : null,
        },
      });
      await tx.auditEvent.create({
        data: {
          actorId: staff.id,
          action: status === "SUBMITTED" ? "SUBMIT" : "UPDATE",
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

  return {
    success: true,
    submissionId: submission.id,
    status,
    message: status === "SUBMITTED" ? "Formulir berhasil dikirim." : "Draft berhasil disimpan.",
  };
}
