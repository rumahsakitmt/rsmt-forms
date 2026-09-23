import { SubmissionList } from "@/components/submissions/submission-list";
import { getActiveForms } from "@/lib/data/forms";
import { getSubmissions } from "@/lib/data/submissions";
import type { SubmissionFilters } from "@/lib/data/submissions";

export default async function StaffSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const status: SubmissionFilters["status"] =
    params.status === "DRAFT" || params.status === "SUBMITTED"
      ? params.status
      : undefined;
  const filters = {
    query: typeof params.q === "string" ? params.q : "",
    status,
    formId: typeof params.formId === "string" ? params.formId : undefined,
    from: typeof params.from === "string" ? params.from : undefined,
    to: typeof params.to === "string" ? params.to : undefined,
  };
  const [submissions, forms] = await Promise.all([
    getSubmissions(filters, "staff"),
    getActiveForms(),
  ]);

  return (
    <SubmissionList
      context="main"
      filters={filters}
      forms={forms}
      submissions={submissions}
    />
  );
}
