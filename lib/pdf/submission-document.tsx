import { Document, Page, View, Fixed } from "@formepdf/react";
import { Text } from "@/components/pdf/text/text";
import type { FormAnswers, FormField, FormSchema } from "@/lib/forms/types";
import { isFieldVisible } from "@/lib/forms/validation";

export function answerText(field: FormField, answers: FormAnswers): string {
  const value = answers[field.id];
  if (value == null || value === "") return "Belum diisi";
  if (
    field.type === "matrixSingle" &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    const selected = field.rowsFromField
      ? answers[field.rowsFromField]
      : undefined;
    const rows = field.rows.filter(
      (row) =>
        !field.rowsFromField ||
        (Array.isArray(selected) && selected.includes(row.value)),
    );
    return (
      rows
        .map(
          (row) =>
            `${row.label}: ${field.columns.find((column) => column.value === value[row.value])?.label ?? value[row.value] ?? "Belum diisi"}`,
        )
        .join("\n") || "Belum diisi"
    );
  }
  const label = (item: string) =>
    field.type === "singleChoice" || field.type === "multiChoice"
      ? (field.options.find((option) => option.value === item)?.label ?? item)
      : item;
  if (Array.isArray(value)) return value.map(label).join("; ") || "Belum diisi";
  return typeof value === "string" ? label(value) : "Belum diisi";
}

export type SubmissionDocumentData = {
  id: string;
  status: string;
  patientName: string;
  medicalRecordNumber: string;
  room: string;
  updatedAt: Date;
  submittedAt: Date | null;
  createdBy: { name: string };
  formVersion: { version: number; form: { title: string; slug: string } };
  schema: FormSchema;
  answers: FormAnswers;
};

const compactText = { fontSize: 8, lineHeight: 1.25 };

function Choice({ label, checked }: { label: string; checked: boolean }) {
  return (
    <View style={{ flexDirection: "row", width: "50%", paddingRight: 6 }}>
      <View
        style={{
          width: 6,
          height: 6,
          borderWidth: 0.6,
          borderColor: "#111111",
          marginTop: 2,
          marginRight: 5,
          flexShrink: 0,
          padding: 1,
        }}
      >
        {checked && (
          <View style={{ width: 3, height: 3, backgroundColor: "#111111" }} />
        )}
      </View>
      <Text noMargin style={{ ...compactText, flex: 1 }}>
        {label}
      </Text>
    </View>
  );
}

function FieldAnswer({
  field,
  answers,
}: {
  field: FormField;
  answers: FormAnswers;
}) {
  if (field.type === "singleChoice" || field.type === "multiChoice") {
    const value = answers[field.id];
    const selected = Array.isArray(value) ? value : [value];
    return (
      <View>
        {Array.from(
          { length: Math.ceil(field.options.length / 2) },
          (_, index) => (
            <View
              key={index}
              wrap={false}
              style={{ flexDirection: "row", marginBottom: 2 }}
            >
              {field.options.slice(index * 2, index * 2 + 2).map((option) => (
                <Choice
                  key={option.value}
                  label={option.label}
                  checked={selected.includes(option.value)}
                />
              ))}
            </View>
          ),
        )}
      </View>
    );
  }
  return (
    <Text noMargin style={compactText}>
      : {answerText(field, answers)}
    </Text>
  );
}

export function SubmissionDocument({
  submission: s,
}: {
  submission: SubmissionDocumentData;
}) {
  const fields = s.schema.sections
    .flatMap((section) => section.fields)
    .filter((field) => isFieldVisible(field, s.answers));
  return (
    <Document title={s.formVersion.form.title} author="RSUD" lang="id-ID">
      <Page size="A4" margin={[22, 40, 28, 40]}>
        <Fixed position="footer">
          <Text
            noMargin
            style={{ fontSize: 6, color: "#777777", textAlign: "right" }}
          >
            {"Halaman {{pageNumber}} / {{totalPages}}"}
          </Text>
        </Fixed>
        <View style={{ marginBottom: 16, paddingLeft: 8 }}>
          {[
            ["Nama Pasien", s.patientName],
            ["Ruangan", s.room],
            ["No. CM", s.medicalRecordNumber],
          ].map(([label, value]) => (
            <View key={label} style={{ flexDirection: "row", marginBottom: 2 }}>
              <Text noMargin weight="bold" style={{ fontSize: 9, width: 74 }}>
                {label}
              </Text>
              <Text noMargin style={{ fontSize: 9, flex: 1 }}>
                : {value || ".............................."}
              </Text>
            </View>
          ))}
          {s.status === "DRAFT" && (
            <Text noMargin style={{ fontSize: 7, marginTop: 4 }}>
              DRAFT - Belum dikirim
            </Text>
          )}
        </View>
        <View
          style={{
            backgroundColor: "#92cf50",
            paddingHorizontal: 5,
            paddingVertical: 3,
            marginBottom: 12,
          }}
        >
          <Text noMargin weight="bold" style={{ fontSize: 9, lineHeight: 1.1 }}>
            {s.formVersion.form.title.toLocaleUpperCase("id-ID")}
          </Text>
        </View>
        {fields.map((field) => {
          const longAnswer = answerText(field, s.answers).length > 500;
          if (longAnswer)
            return (
              <View key={field.id} style={{ marginBottom: 6 }}>
                <Text noMargin style={{ ...compactText, minOrphanLines: 3 }}>
                  {field.number
                    ? `${Number(field.number) || field.number}. `
                    : ""}
                  {field.label}
                  {"\n"}
                  {answerText(field, s.answers)}
                </Text>
              </View>
            );
          return (
            <View
              key={field.id}
              wrap={false}
              style={{ flexDirection: "row", marginBottom: 5 }}
            >
              <Text noMargin style={{ ...compactText, width: 18 }}>
                {field.number ? `${Number(field.number) || field.number}.` : ""}
              </Text>
              <Text
                noMargin
                style={{ ...compactText, width: 158, paddingRight: 10 }}
              >
                {field.label}
              </Text>
              <View style={{ flex: 1 }}>
                <FieldAnswer field={field} answers={s.answers} />
              </View>
            </View>
          );
        })}
      </Page>
    </Document>
  );
}
