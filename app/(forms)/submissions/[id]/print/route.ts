import { createElement } from "react";
import { renderDocument } from "@formepdf/core";

import { getSubmission, recordSubmissionAccess } from "@/lib/data/submissions";
import type { FormAnswers } from "@/lib/forms/types";
import { pdfContentDisposition } from "@/lib/pdf/response";
import { SubmissionDocument } from "@/lib/pdf/submission-document";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const submission = await getSubmission(id, "view", "staff");
  const pdf = await renderDocument(
    createElement(SubmissionDocument, {
      submission: {
        ...submission,
        answers: submission.answersJson as FormAnswers,
      },
    }),
  );
  await recordSubmissionAccess(id, "PRINT", "staff");
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
