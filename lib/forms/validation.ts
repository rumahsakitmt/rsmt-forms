import { z } from "zod";

import type {
  AnswerValue,
  FormAnswers,
  FormField,
  FormSchema,
  PatientContext,
  SubmissionMode,
  ValidationResult,
  VisibilityRule,
} from "./types";

const choiceOptionSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
});

const visibilityRuleSchema = z.object({
  fieldId: z.string().min(1),
  operator: z.enum(["equals", "includes"]),
  value: z.string(),
});

const baseFieldShape = {
  id: z.string().min(1),
  number: z.string().optional(),
  label: z.string().min(1),
  description: z.string().optional(),
  required: z.boolean().optional(),
  visibleWhen: z.union([visibilityRuleSchema, z.array(visibilityRuleSchema)]).optional(),
};

const formFieldSchema = z.discriminatedUnion("type", [
  z.object({
    ...baseFieldShape,
    type: z.enum(["text", "textarea"]),
    placeholder: z.string().optional(),
  }),
  z.object({
    ...baseFieldShape,
    type: z.literal("singleChoice"),
    options: z.array(choiceOptionSchema).min(1),
  }),
  z.object({
    ...baseFieldShape,
    type: z.literal("multiChoice"),
    options: z.array(choiceOptionSchema).min(1),
    minSelections: z.number().int().min(0).optional(),
    exclusiveValues: z.array(z.string()).optional(),
  }),
  z.object({
    ...baseFieldShape,
    type: z.literal("matrixSingle"),
    rows: z.array(choiceOptionSchema).min(1),
    columns: z.array(choiceOptionSchema).min(1),
    minSelections: z.number().int().min(0).optional(),
    rowsFromField: z.string().optional(),
  }),
]);

export const formSchemaParser = z.object({
  schemaVersion: z.literal(1),
  title: z.string().min(1),
  shortTitle: z.string().min(1),
  description: z.string().min(1),
  sections: z.array(
    z.object({
      id: z.string().min(1),
      eyebrow: z.string().optional(),
      title: z.string().min(1),
      description: z.string().optional(),
      fields: z.array(formFieldSchema).min(1),
    }),
  ).min(1),
});

const patientContextParser = z.object({
  patientName: z.string().trim().max(120),
  medicalRecordNumber: z.string().trim().max(50),
  room: z.string().trim().max(80),
});

function isEmpty(value: AnswerValue | undefined) {
  if (value == null) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  return Object.keys(value).length === 0;
}

function ruleMatches(rule: VisibilityRule, answers: FormAnswers) {
  const value = answers[rule.fieldId];
  if (rule.operator === "equals") return value === rule.value;
  return Array.isArray(value) && value.includes(rule.value);
}

export function isFieldVisible(field: FormField, answers: FormAnswers) {
  if (!field.visibleWhen) return true;
  const rules = Array.isArray(field.visibleWhen) ? field.visibleWhen : [field.visibleWhen];
  return rules.every((rule) => ruleMatches(rule, answers));
}

function validateValue(field: FormField, value: AnswerValue | undefined) {
  if (isEmpty(value)) return null;
  if (value == null) return null;

  if (field.type === "text" || field.type === "textarea") {
    return typeof value === "string" ? null : "Jawaban harus berupa teks.";
  }

  if (field.type === "singleChoice") {
    const allowed = new Set(field.options.map((option) => option.value));
    return typeof value === "string" && allowed.has(value)
      ? null
      : "Pilihan tidak dikenali.";
  }

  if (field.type === "multiChoice") {
    const allowed = new Set(field.options.map((option) => option.value));
    if (!Array.isArray(value) || value.some((item) => !allowed.has(item))) {
      return "Pilihan tidak dikenali.";
    }
    if (
      field.exclusiveValues?.some((exclusive) => value.includes(exclusive)) &&
      value.length > 1
    ) {
      return "Pilihan “Tidak ada” tidak dapat digabungkan dengan pilihan lain.";
    }
    if (field.minSelections && value.length < field.minSelections) {
      return `Pilih minimal ${field.minSelections} jawaban.`;
    }
    return null;
  }

  if (field.type !== "matrixSingle") return "Jenis pertanyaan tidak dikenali.";

  if (typeof value !== "object" || Array.isArray(value)) {
    return "Jawaban matriks tidak dikenali.";
  }

  const allowedRows = new Set(field.rows.map((row) => row.value));
  const allowedColumns = new Set(field.columns.map((column) => column.value));
  const entries = Object.entries(value);
  if (entries.some(([row, column]) => !allowedRows.has(row) || !allowedColumns.has(column))) {
    return "Pilihan matriks tidak dikenali.";
  }
  if (field.minSelections && entries.length < field.minSelections) {
    return `Lengkapi minimal ${field.minSelections} baris.`;
  }
  return null;
}

export function validateSubmission(
  schema: FormSchema,
  patient: PatientContext,
  answers: FormAnswers,
  mode: SubmissionMode,
): ValidationResult {
  const errors: Record<string, string> = {};
  const patientResult = patientContextParser.safeParse(patient);

  if (!patientResult.success) {
    for (const issue of patientResult.error.issues) {
      errors[String(issue.path[0])] = "Nilai tidak valid.";
    }
  }

  if (mode === "submit") {
    if (!patient.patientName.trim()) errors.patientName = "Nama pasien wajib diisi.";
    if (!patient.medicalRecordNumber.trim()) {
      errors.medicalRecordNumber = "Nomor rekam medis wajib diisi.";
    }
    if (!patient.room.trim()) errors.room = "Ruangan wajib diisi.";
  }

  for (const section of schema.sections) {
    for (const field of section.fields) {
      if (!isFieldVisible(field, answers)) continue;
      const value = answers[field.id];

      if (mode === "submit" && field.required && isEmpty(value)) {
        errors[field.id] = "Bagian ini wajib diisi.";
        continue;
      }

      const valueError = validateValue(field, value);
      if (valueError) errors[field.id] = valueError;
    }
  }

  const selectedLanguages = answers.languages;
  const languageFluency = answers.languageFluency;
  if (
    mode === "submit" &&
    Array.isArray(selectedLanguages) &&
    languageFluency &&
    !Array.isArray(languageFluency) &&
    typeof languageFluency === "object"
  ) {
    const missing = selectedLanguages.some((language) => !languageFluency[language]);
    if (missing) errors.languageFluency = "Tentukan kemampuan untuk setiap bahasa yang dipilih.";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function parseFormSchema(value: unknown): FormSchema {
  return formSchemaParser.parse(value) as FormSchema;
}
