import { SubmissionDetail } from "@/components/submissions/submission-detail";
import { getSubmission, recordSubmissionAccess } from "@/lib/data/submissions";

export default async function StaffSubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const submission = await getSubmission(id, "view", "staff");
  await recordSubmissionAccess(id, "VIEW", "staff");

  return <SubmissionDetail context="main" submission={submission} />;
}
