import type {
  FormAnswers,
  FormField,
  FormSchema,
} from "@/lib/forms/types";
import { isFieldVisible } from "@/lib/forms/validation";

export type ReportSubmission = {
  answers: FormAnswers;
  medicalRecordNumber: string;
};

export type ChoiceResult = {
  value: string;
  label: string;
  count: number;
  percentage: number;
};

export type FieldReport = {
  id: string;
  label: string;
  type: FormField["type"];
  answered: number;
  responseRate: number;
  choices: ChoiceResult[];
};

function hasAnswer(value: FormAnswers[string]) {
  if (value == null || value === "") return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
}

function percent(value: number, total: number) {
  return total ? Math.round((value / total) * 100) : 0;
}

export function buildAssessmentReport(
  schema: FormSchema,
  submissions: ReportSubmission[],
) {
  const fields = schema.sections.flatMap((section) => section.fields);
  let visibleAnswers = 0;
  let completedAnswers = 0;

  const fieldReports: FieldReport[] = fields.map((field) => {
    const relevant = submissions.filter((submission) =>
      isFieldVisible(field, submission.answers),
    );
    const answered = relevant.filter((submission) =>
      hasAnswer(submission.answers[field.id]),
    ).length;
    visibleAnswers += relevant.length;
    completedAnswers += answered;

    const counts = new Map<string, number>();
    if (field.type === "singleChoice" || field.type === "multiChoice") {
      for (const submission of relevant) {
        const answer = submission.answers[field.id];
        const values = Array.isArray(answer) ? answer : [answer];
        for (const value of values) {
          if (typeof value === "string" && value) {
            counts.set(value, (counts.get(value) ?? 0) + 1);
          }
        }
      }
    } else if (field.type === "matrixSingle") {
      for (const submission of relevant) {
        const answer = submission.answers[field.id];
        if (!answer || typeof answer !== "object" || Array.isArray(answer)) {
          continue;
        }
        for (const [row, column] of Object.entries(answer)) {
          counts.set(`${row}:${column}`, (counts.get(`${row}:${column}`) ?? 0) + 1);
        }
      }
    }

    const choices = (() => {
      if (field.type === "singleChoice" || field.type === "multiChoice") {
        return field.options.map((option) => ({
            ...option,
            count: counts.get(option.value) ?? 0,
            percentage: percent(counts.get(option.value) ?? 0, answered),
          }));
      }
      if (field.type === "matrixSingle") {
        return field.rows.flatMap((row) =>
          field.columns.map((column) => {
            const value = `${row.value}:${column.value}`;
            const count = counts.get(value) ?? 0;
            return {
              value,
              label: `${row.label} · ${column.label}`,
              count,
              percentage: percent(count, answered),
            };
          }),
        );
      }
      return [];
    })();

    return {
      id: field.id,
      label: field.label,
      type: field.type,
      answered,
      responseRate: percent(answered, relevant.length),
      choices,
    };
  });

  const uniquePatients = new Set(
    submissions
      .map((submission) => submission.medicalRecordNumber.trim())
      .filter(Boolean),
  ).size;

  return {
    submissionCount: submissions.length,
    uniquePatients,
    completionRate: percent(completedAnswers, visibleAnswers),
    fields: fieldReports,
  };
}
