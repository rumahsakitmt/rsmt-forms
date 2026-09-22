import type { Metadata } from "next";

import { FormBuilder } from "@/components/forms/form-builder";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Buat formulir" };

export default async function NewFormPage() {
  await requireAdmin();
  return <FormBuilder />;
}
