import { describe, expect, it } from "vitest";

import { assessmentSchema } from "./assessment-schema";
import { isFieldVisible, parseFormSchema, validateSubmission } from "./validation";

const patient = {
  patientName: "Ni Made Sari",
  medicalRecordNumber: "CM-1024",
  room: "Anggrek 2",
};

describe("form schema", () => {
  it("parses the seeded assessment", () => {
    expect(parseFormSchema(assessmentSchema).shortTitle).toBe("Assessment Edukasi Pasien");
  });

  it("evaluates conditional visibility", () => {
    const field = assessmentSchema.sections[0].fields[1];
    expect(isFieldVisible(field, { culturalBarrier: "ada" })).toBe(true);
    expect(isFieldVisible(field, { culturalBarrier: "tidak" })).toBe(false);
  });
});

describe("submission validation", () => {
  it("allows incomplete drafts", () => {
    expect(validateSubmission(assessmentSchema, patient, {}, "draft").valid).toBe(true);
  });

  it("requires conditional details on submission", () => {
    const result = validateSubmission(
      assessmentSchema,
      patient,
      { culturalBarrier: "ada" },
      "submit",
    );
    expect(result.errors.culturalBarrierDetails).toBeDefined();
  });

  it("rejects an exclusive none choice combined with another answer", () => {
    const result = validateSubmission(
      assessmentSchema,
      patient,
      { emotionalBarriers: ["tidak_ada", "takut_panik"] },
      "draft",
    );
    expect(result.errors.emotionalBarriers).toContain("Tidak ada");
  });
});
