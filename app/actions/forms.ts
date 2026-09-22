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
