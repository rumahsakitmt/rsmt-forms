import { createElement } from "react";
import { renderDocument } from "@formepdf/core";
import { getSubmission, recordSubmissionAccess } from "@/lib/data/submissions";
import { pdfContentDisposition } from "@/lib/pdf/response";
import { SubmissionDocument } from "@/lib/pdf/submission-document";
import type { FormAnswers } from "@/lib/forms/types";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Route handlers do not inherit the admin layout's authentication guard.
  const submission = await getSubmission(id);
  const pdf = await renderDocument(createElement(SubmissionDocument, {
    submission: { ...submission, answers: submission.answersJson as FormAnswers },
  }));
  await recordSubmissionAccess(id, "PRINT");
  const filename = `formulir-${id.replace(/[^a-zA-Z0-9_-]/g, "")}.pdf`;
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": pdfContentDisposition(request, filename),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
