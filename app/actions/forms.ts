"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { FormSchema } from "@/lib/forms/types";
import { formSchemaParser } from "@/lib/forms/validation";
import { requireAdmin } from "@/lib/session";

const createFormInput = z.object({
  category: z.string().trim().min(2).max(80),
  schema: formSchemaParser,
});

export type CreateFormResult = {
  success: boolean;
  message: string;
  slug?: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60) || "formulir";
}

export async function createFormAction(input: {
  category: string;
  schema: FormSchema;
}): Promise<CreateFormResult> {
  const staff = await requireAdmin();
  const parsed = createFormInput.safeParse(input);

  if (!parsed.success) {
    return { success: false, message: "Lengkapi judul, deskripsi, bagian, dan pertanyaan formulir." };
  }

  const baseSlug = slugify(parsed.data.schema.shortTitle);

  try {
    const existing = await db.form.findMany({
      where: { slug: { startsWith: baseSlug } },
      select: { slug: true },
    });
    const usedSlugs = new Set(existing.map((form) => form.slug));
    let slug = baseSlug;
    let suffix = 2;
    while (usedSlugs.has(slug)) slug = `${baseSlug}-${suffix++}`;

    await db.$transaction(async (tx) => {
      const form = await tx.form.create({
        data: {
          slug,
          title: parsed.data.schema.title,
          description: parsed.data.schema.description,
          category: parsed.data.category,
          isActive: true,
        },
      });
      const version = await tx.formVersion.create({
        data: {
          formId: form.id,
          version: 1,
          schemaJson: parsed.data.schema as unknown as Prisma.InputJsonValue,
          createdById: staff.id,
          publishedAt: new Date(),
        },
      });
      await tx.form.update({
        where: { id: form.id },
        data: { currentVersionId: version.id },
      });
    });

    revalidatePath("/");
    return { success: true, message: "Formulir berhasil diterbitkan.", slug };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Formulir tidak dapat diterbitkan.",
    };
  }
}

export async function updateFormAction(input: {
  formId: string;
  baseVersion: number;
  category: string;
  schema: FormSchema;
}): Promise<CreateFormResult> {
  const staff = await requireAdmin();
  const parsed = createFormInput.safeParse(input);

  if (!parsed.success) {
    return { success: false, message: "Lengkapi judul, deskripsi, bagian, dan pertanyaan formulir." };
  }

  try {
    const slug = await db.$transaction(async (tx) => {
      const form = await tx.form.findUnique({
        where: { id: input.formId },
        select: {
          slug: true,
          versions: {
            orderBy: { version: "desc" },
            take: 1,
            select: { version: true },
          },
        },
      });
      if (!form) throw new Error("Formulir tidak ditemukan.");

      const latestVersion = form.versions[0]?.version ?? 0;
      if (latestVersion !== input.baseVersion) {
        throw new Error(
          "Formulir telah diperbarui oleh admin lain. Muat ulang halaman sebelum menerbitkan.",
        );
      }

      const version = await tx.formVersion.create({
        data: {
          formId: input.formId,
          version: latestVersion + 1,
          schemaJson: parsed.data.schema as unknown as Prisma.InputJsonValue,
          createdById: staff.id,
          publishedAt: new Date(),
        },
      });
      await tx.form.update({
        where: { id: input.formId },
        data: {
          title: parsed.data.schema.title,
          description: parsed.data.schema.description,
          category: parsed.data.category,
          currentVersionId: version.id,
        },
      });
      return form.slug;
    });

    revalidatePath("/");
    revalidatePath("/admin/reports");
    revalidatePath(`/admin/reports/${input.formId}`);
    return { success: true, message: "Versi baru formulir berhasil diterbitkan.", slug };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Formulir tidak dapat diperbarui.",
    };
  }
}

export type DeleteFormResult = {
  success: boolean;
  message: string;
  archived?: boolean;
};

/**
 * Removes a Form that has no Submissions. Forms with Submissions are only
 * deactivated so patient records and reports stay intact.
 */
export async function deleteFormAction(formId: string): Promise<DeleteFormResult> {
  await requireAdmin();

  try {
    const result = await db.$transaction(async (tx) => {
      const form = await tx.form.findUnique({
        where: { id: formId },
        select: { id: true },
      });
      if (!form) throw new Error("Formulir tidak ditemukan.");

      const submissionCount = await tx.submission.count({
        where: { formVersion: { formId } },
      });
      if (submissionCount > 0) {
        await tx.form.update({ where: { id: formId }, data: { isActive: false } });
        return { archived: true };
      }

      await tx.form.update({ where: { id: formId }, data: { currentVersionId: null } });
      await tx.formVersion.deleteMany({ where: { formId } });
      await tx.form.delete({ where: { id: formId } });
      return { archived: false };
    });

    revalidatePath("/");
    revalidatePath("/admin/reports");
    return {
      success: true,
      archived: result.archived,
      message: result.archived
        ? "Formulir dinonaktifkan. Data pasien dan laporan tetap tersimpan."
        : "Formulir berhasil dihapus.",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Formulir tidak dapat dihapus.",
    };
  }
}

export async function setFormActiveAction(
  formId: string,
  isActive: boolean,
): Promise<DeleteFormResult> {
  await requireAdmin();
  try {
    await db.form.update({ where: { id: formId }, data: { isActive } });
  } catch {
    return { success: false, message: "Status formulir tidak dapat diubah." };
  }
  revalidatePath("/");
  revalidatePath("/admin/reports");
  return {
    success: true,
    message: isActive ? "Formulir diaktifkan kembali." : "Formulir dinonaktifkan.",
  };
}
