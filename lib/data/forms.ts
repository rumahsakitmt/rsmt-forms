import "server-only";

import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { parseFormSchema } from "@/lib/forms/validation";
import { requireStaff } from "@/lib/session";

export async function getActiveForms() {
  await requireStaff();
  const forms = await db.form.findMany({
    where: { isActive: true, currentVersionId: { not: null } },
    orderBy: { title: "asc" },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      category: true,
      icon: true,
      currentVersion: { select: { version: true } },
      _count: { select: { versions: true } },
    },
  });

  return forms.map((form) => ({
    ...form,
    version: form.currentVersion?.version ?? 1,
  }));
}

export async function getFormDefinition(slug: string) {
  await requireStaff();
  const form = await db.form.findFirst({
    where: { slug, isActive: true },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      category: true,
      currentVersion: {
        select: { id: true, version: true, schemaJson: true },
      },
    },
  });

  if (!form?.currentVersion) notFound();
  return {
    ...form,
    currentVersion: {
      ...form.currentVersion,
      schema: parseFormSchema(form.currentVersion.schemaJson),
    },
  };
}
