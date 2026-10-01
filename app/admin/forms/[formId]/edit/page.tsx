import type { Metadata } from "next";

import { FormBuilder } from "@/components/forms/form-builder";
import { getFormForEditing } from "@/lib/data/forms";

export const metadata: Metadata = { title: "Edit formulir" };

export default async function EditFormPage({
  params,
}: PageProps<"/admin/forms/[formId]/edit">) {
  const { formId } = await params;
  const form = await getFormForEditing(formId);
  return (
    <FormBuilder
      key={`${form.id}:${form.version}`}
      editing={{ formId: form.id, version: form.version }}
      initial={{ category: form.category, schema: form.schema }}
    />
  );
}
