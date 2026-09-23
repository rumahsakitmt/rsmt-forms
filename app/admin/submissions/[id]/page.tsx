import { SubmissionDetail } from "@/components/submissions/submission-detail";
import { getSubmission, recordSubmissionAccess } from "@/lib/data/submissions";

export default async function SubmissionDetailPage({
  params,
}: PageProps<"/admin/submissions/[id]">) {
  const { id } = await params;
  const submission = await getSubmission(id);
  await recordSubmissionAccess(id, "VIEW");

  return <SubmissionDetail context="admin" submission={submission} />;
}
