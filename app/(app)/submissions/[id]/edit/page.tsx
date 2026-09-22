import { FormFiller } from "@/components/forms/form-filler";
import { getSubmission } from "@/lib/data/submissions";
import type { FormAnswers } from "@/lib/forms/types";

export default async function EditSubmissionPage({ params }: PageProps<"/submissions/[id]/edit">) {
  const { id } = await params;
  const submission = await getSubmission(id, "edit");

  return (
    <FormFiller
      draft={{
        id: submission.id,
        patient: {
          patientName: submission.patientName,
          medicalRecordNumber: submission.medicalRecordNumber,
          room: submission.room,
        },
        answers: submission.answersJson as FormAnswers,
      }}
      formSlug={submission.formVersion.form.slug}
      schema={submission.schema}
      version={submission.formVersion.version}
    />
  );
}
