import { describe, expect, it } from "vitest";

import type { FormSchema } from "@/lib/forms/types";
import {
  buildAssessmentInsights,
  buildAssessmentReport,
  compareAssessmentReports,
} from "@/lib/reports/assessment-report";

const schema: FormSchema = {
  schemaVersion: 1,
  title: "Assessment",
  shortTitle: "Assessment",
  description: "Test",
  sections: [
    {
      id: "main",
      title: "Main",
      fields: [
        {
          id: "ready",
          type: "singleChoice",
          label: "Ready",
          options: [
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ],
        },
        {
          id: "reason",
          type: "text",
          label: "Reason",
          visibleWhen: { fieldId: "ready", operator: "equals", value: "no" },
        },
      ],
    },
  ],
};

describe("buildAssessmentReport", () => {
  it("summarizes answers and only counts visible fields for completion", () => {
    const report = buildAssessmentReport(schema, [
      { medicalRecordNumber: "001", answers: { ready: "yes" } },
      { medicalRecordNumber: "002", answers: { ready: "no", reason: "Later" } },
      { medicalRecordNumber: "001", answers: { ready: "no", reason: "" } },
    ]);

    expect(report.submissionCount).toBe(3);
    expect(report.uniquePatients).toBe(2);
    expect(report.completionRate).toBe(80);
    expect(report.fields[0].choices).toEqual([
      { value: "yes", label: "Yes", count: 1, percentage: 33 },
      { value: "no", label: "No", count: 2, percentage: 67 },
    ]);
    expect(report.fields[1]).toMatchObject({ answered: 1, responseRate: 50 });
  });

  it("surfaces actionable data-quality and dominant-answer insights", () => {
    const current = buildAssessmentReport(schema, [
      { medicalRecordNumber: "001", answers: { ready: "no", reason: "Later" } },
      { medicalRecordNumber: "002", answers: { ready: "no" } },
      { medicalRecordNumber: "003", answers: { ready: "no" } },
      { medicalRecordNumber: "004", answers: { ready: "yes" } },
      { medicalRecordNumber: "005", answers: { ready: "no" } },
    ]);
    const previous = buildAssessmentReport(schema, [
      { medicalRecordNumber: "001", answers: { ready: "yes" } },
      { medicalRecordNumber: "002", answers: { ready: "yes" } },
    ]);
    const comparison = compareAssessmentReports(current, previous);
    const insights = buildAssessmentInsights(current, previous, comparison);

    expect(comparison).toMatchObject({
      submissionDelta: 3,
      submissionPercentChange: 150,
      uniquePatientDelta: 3,
    });
    expect(insights.map((insight) => insight.title)).toEqual(
      expect.arrayContaining([
        "Ada jawaban yang sering terlewat",
        "Volume asesmen naik",
        "“No” paling sering dipilih",
      ]),
    );
  });

  it("warns when the sample is too small for a strong interpretation", () => {
    const current = buildAssessmentReport(schema, [
      { medicalRecordNumber: "001", answers: { ready: "yes" } },
    ]);
    const previous = buildAssessmentReport(schema, []);
    const comparison = compareAssessmentReports(current, previous);

    expect(
      buildAssessmentInsights(current, previous, comparison)[0],
    ).toMatchObject({ title: "Sampel masih terbatas", tone: "attention" });
  });
});
