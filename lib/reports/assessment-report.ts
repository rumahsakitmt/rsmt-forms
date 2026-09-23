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

export type AssessmentReport = {
  submissionCount: number;
  uniquePatients: number;
  completionRate: number;
  fields: FieldReport[];
};

export type AssessmentComparison = {
  submissionDelta: number;
  submissionPercentChange: number | null;
  uniquePatientDelta: number;
  completionDelta: number;
};

export type ReportInsight = {
  tone: "attention" | "positive" | "neutral";
  title: string;
  description: string;
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
): AssessmentReport {
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

export function compareAssessmentReports(
  current: AssessmentReport,
  previous: AssessmentReport,
): AssessmentComparison {
  return {
    submissionDelta: current.submissionCount - previous.submissionCount,
    submissionPercentChange: previous.submissionCount
      ? Math.round(
          ((current.submissionCount - previous.submissionCount) /
            previous.submissionCount) *
            100,
        )
      : null,
    uniquePatientDelta: current.uniquePatients - previous.uniquePatients,
    completionDelta: current.completionRate - previous.completionRate,
  };
}

export function buildAssessmentInsights(
  report: AssessmentReport,
  previous: AssessmentReport,
  comparison: AssessmentComparison,
): ReportInsight[] {
  if (!report.submissionCount) return [];

  const insights: ReportInsight[] = [];

  if (report.submissionCount < 5) {
    insights.push({
      tone: "attention",
      title: "Sampel masih terbatas",
      description: `Baru ada ${report.submissionCount} asesmen dalam periode ini. Baca persentase sebagai sinyal awal, bukan pola yang sudah kuat.`,
    });
  }

  const lowResponseFields = report.fields
    .filter((field) => field.responseRate < 80)
    .sort((a, b) => a.responseRate - b.responseRate);

  if (lowResponseFields.length) {
    const fieldNames = lowResponseFields
      .slice(0, 2)
      .map((field) => `${field.label} (${field.responseRate}%)`)
      .join(" dan ");
    insights.push({
      tone: "attention",
      title: "Ada jawaban yang sering terlewat",
      description: `${fieldNames} memiliki tingkat pengisian terendah. Tinjau apakah pertanyaannya cukup jelas dan mudah dijawab.`,
    });
  }

  if (previous.submissionCount) {
    const direction = comparison.submissionDelta > 0 ? "naik" : "turun";
    const tone = comparison.submissionDelta >= 0 ? "positive" : "attention";

    if (comparison.submissionDelta !== 0) {
      insights.push({
        tone,
        title: `Volume asesmen ${direction}`,
        description: `${Math.abs(comparison.submissionDelta)} asesmen ${direction} dibanding periode sebelumnya (${comparison.submissionPercentChange && comparison.submissionPercentChange > 0 ? "+" : ""}${comparison.submissionPercentChange ?? 0}%).`,
      });
    }

    if (Math.abs(comparison.completionDelta) >= 5) {
      const improving = comparison.completionDelta > 0;
      insights.push({
        tone: improving ? "positive" : "attention",
        title: `Kelengkapan ${improving ? "membaik" : "menurun"}`,
        description: `Berubah ${improving ? "+" : ""}${comparison.completionDelta} poin dibanding periode sebelumnya.`,
      });
    }
  } else {
    insights.push({
      tone: "neutral",
      title: "Belum ada pembanding",
      description:
        "Periode sebelumnya belum memiliki asesmen. Perbandingan tren akan lebih berguna setelah data berikutnya masuk.",
    });
  }

  const dominantAnswers = report.fields
    .filter((field) => field.type === "singleChoice" && field.answered >= 3)
    .map((field) => ({
      field,
      choice: [...field.choices].sort((a, b) => b.count - a.count)[0],
    }))
    .filter(
      (item): item is { field: FieldReport; choice: ChoiceResult } =>
        Boolean(item.choice && item.choice.percentage >= 60),
    )
    .sort((a, b) => b.choice.percentage - a.choice.percentage)
    .slice(0, 2);

  for (const { field, choice } of dominantAnswers) {
    insights.push({
      tone: "neutral",
      title: `“${choice.label}” paling sering dipilih`,
      description: `${choice.percentage}% responden memilih jawaban ini pada “${field.label}” (${choice.count} dari ${field.answered} jawaban).`,
    });
  }

  if (!insights.length) {
    insights.push({
      tone: "neutral",
      title: "Jawaban tersebar cukup merata",
      description:
        "Belum ada satu pola jawaban yang dominan. Gunakan distribusi per pertanyaan untuk pemeriksaan lebih rinci.",
    });
  }

  return insights.slice(0, 5);
}
