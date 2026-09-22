// @vitest-environment node
import React from "react";
import { describe, expect, it } from "vitest";
import { renderDocument } from "@formepdf/core";
import { answerText, SubmissionDocument } from "./submission-document";
import type { SubmissionDocumentData } from "./submission-document";

describe("submission PDF", () => {
  it("uses choice labels and excludes deselected matrix rows", () => {
    expect(answerText({ id: "choice", type: "singleChoice", label: "Choice", options: [{ value: "yes", label: "Ya" }] }, { choice: "yes" })).toBe("Ya");
    expect(answerText({ id: "matrix", type: "matrixSingle", label: "Matrix", rowsFromField: "selected", rows: [{ value: "a", label: "A" }, { value: "b", label: "B" }], columns: [{ value: "yes", label: "Ya" }] }, { selected: ["a"], matrix: { a: "yes", b: "yes" } })).toBe("A: Ya");
  });
  it("renders a multipage PDF from saved answers", async () => {
    const fields = Array.from({length: 35}, (_, i) => ({ id: `q${i}`, type: "textarea" as const, label: `Pertanyaan ${i + 1}` }));
    const submission: SubmissionDocumentData = { id: "sample-qa", status: "DRAFT", patientName: "Pasien Contoh", medicalRecordNumber: "QA-001", room: "Ruang Contoh", updatedAt: new Date("2026-09-22"), submittedAt: null, createdBy: { name: "Petugas Contoh" }, formVersion: {version: 1, form: {title: "Pengkajian Klinis", slug: "qa"}}, schema: { schemaVersion: 1, title: "Pengkajian Klinis", shortTitle: "QA", description: "", sections: [{id: "s1", title: "Pengkajian", fields}] }, answers: Object.fromEntries(fields.map(field => [field.id, "Jawaban contoh untuk pemeriksaan tata letak PDF. ".repeat(8)])) };
    const pdf = await renderDocument(<SubmissionDocument submission={submission} />);
    expect(new TextDecoder().decode(pdf.slice(0, 5))).toBe("%PDF-");
    expect(pdf.byteLength).toBeGreaterThan(1000);
    if (process.env.PDF_QA_OUTPUT) {
      const { writeFile } = await import("node:fs/promises");
      await writeFile(process.env.PDF_QA_OUTPUT, pdf);
    }
  });
});
