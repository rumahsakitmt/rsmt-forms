import { notFound } from "next/navigation";
import { FormFiller } from "@/components/forms/form-filler";
import { getFormDefinition } from "@/lib/data/forms";
import { getSubmission } from "@/lib/data/submissions";
import type { FormAnswers } from "@/lib/forms/types";

export default async function NewFormPage({
  params,
  searchParams,
}: PageProps<"/forms/[slug]/new">) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  if (typeof query.draft === "string") {
    const submission = await getSubmission(query.draft, "edit");
    if (submission.formVersion.form.slug !== slug) notFound();
    return (
      <FormFiller
        key={submission.id}
        formSlug={slug}
        schema={submission.schema}
        version={submission.formVersion.version}
        draft={{
          id: submission.id,
          patient: {
            patientName: submission.patientName,
            medicalRecordNumber: submission.medicalRecordNumber,
            room: submission.room,
          },
          answers: submission.answersJson as FormAnswers,
        }}
      />
    );
  }
  const form = await getFormDefinition(slug);
  return (
    <FormFiller
      key={form.slug}
      formSlug={form.slug}
      schema={form.currentVersion.schema}
      version={form.currentVersion.version}
    />
  );
}
