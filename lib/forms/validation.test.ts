import { describe, expect, it } from "vitest";

import { assessmentSchema } from "./assessment-schema";
import {
  isFieldVisible,
  parseFormSchema,
  pickPatientDetails,
  validateSubmission,
} from "./validation";

const patient = {
  patientName: "Ni Made Sari",
  medicalRecordNumber: "CM-1024",
  room: "Anggrek 2",
};

describe("form schema", () => {
  it("parses the seeded assessment", () => {
    expect(parseFormSchema(assessmentSchema).shortTitle).toBe("Assessment Edukasi Pasien");
  });

  it("preserves continuous form layout", () => {
    expect(parseFormSchema({ ...assessmentSchema, layout: "continuous" }).layout).toBe("continuous");
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

describe("identity fields", () => {
  const schema = parseFormSchema({
    ...assessmentSchema,
    identityFields: [
      { id: "birthDate", label: "Tanggal lahir", type: "date", required: true },
      { id: "weight", label: "Berat badan", type: "number" },
    ],
  });

  it("requires mandatory identity fields on submission only", () => {
    expect(
      validateSubmission(schema, patient, {}, "draft").errors["identity:birthDate"],
    ).toBeUndefined();
    expect(
      validateSubmission(schema, patient, {}, "submit").errors["identity:birthDate"],
    ).toContain("wajib");
  });

  it("rejects malformed dates and numbers", () => {
    const { errors } = validateSubmission(
      schema,
      { ...patient, details: { birthDate: "2026-02-30", weight: "abc" } },
      {},
      "draft",
    );
    expect(errors["identity:birthDate"]).toBeDefined();
    expect(errors["identity:weight"]).toBeDefined();
  });

  it("keeps only details declared by the schema", () => {
    expect(
      pickPatientDetails(schema, { birthDate: " 1990-05-01 ", extra: "x" }),
    ).toEqual({ birthDate: "1990-05-01", weight: "" });
  });
});
