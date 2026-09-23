// @vitest-environment node
import { describe, expect, it } from "vitest";

import { pdfContentDisposition } from "@/lib/pdf/response";

describe("PDF response", () => {
  it("opens print requests inline", () => {
    expect(
      pdfContentDisposition(
        new Request("https://example.test/submissions/1/print"),
        "formulir-1.pdf",
      ),
    ).toBe('inline; filename="formulir-1.pdf"');
  });

  it("downloads requests with the download query", () => {
    expect(
      pdfContentDisposition(
        new Request("https://example.test/submissions/1/print?download=1"),
        "formulir-1.pdf",
      ),
    ).toBe('attachment; filename="formulir-1.pdf"');
  });
});
