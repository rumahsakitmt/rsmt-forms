import { Badge } from "@/components/ui/badge";
import type { FormAnswers, FormField, FormSchema } from "@/lib/forms/types";
import { isFieldVisible } from "@/lib/forms/validation";

function optionLabel(field: FormField, value: string) {
  if (field.type === "singleChoice" || field.type === "multiChoice") {
    return (
      field.options.find((option) => option.value === value)?.label ?? value
    );
  }
  return value;
}

function AnswerValue({
  field,
  answers,
}: {
  field: FormField;
  answers: FormAnswers;
}) {
  const value = answers[field.id];
  if (
    value == null ||
    value === "" ||
    (Array.isArray(value) && !value.length)
  ) {
    return <span className="text-muted-foreground italic">Belum diisi</span>;
  }
  if (typeof value === "string")
    return <span>{optionLabel(field, value)}</span>;
  if (Array.isArray(value)) {
    return (
      <span className="flex flex-wrap gap-1">
        {value.map((item) => (
          <Badge variant="outline" key={item}>
            {optionLabel(field, item)}
          </Badge>
        ))}
      </span>
    );
  }
  if (field.type === "matrixSingle") {
    return (
      <span className="flex flex-wrap gap-1">
        {Object.entries(value).map(([row, column]) => {
          const rowLabel =
            field.rows.find((item) => item.value === row)?.label ?? row;
          const columnLabel =
            field.columns.find((item) => item.value === column)?.label ??
            column;
          return (
            <Badge variant="outline" key={row}>
              {rowLabel}: {columnLabel}
            </Badge>
          );
        })}
      </span>
    );
  }
  return <span>{JSON.stringify(value)}</span>;
}

export function AnswersView({
  schema,
  answers,
}: {
  schema: FormSchema;
  answers: FormAnswers;
}) {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 print:px-0">
      {schema.sections.map((section, sectionIndex) => (
        <section className="break-inside-avoid" key={section.id}>
          {schema.layout !== "continuous" ? (
            <div className="mb-5 flex items-start gap-3 [&_h2]:text-lg [&_h2]:font-semibold [&_p]:text-sm [&_p]:text-muted-foreground [&>span]:text-muted-foreground">
              <span>{(sectionIndex + 1).toString().padStart(2, "0")}</span>
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  {section.eyebrow}
                </p>
                <h2>{section.title}</h2>
              </div>
            </div>
          ) : null}
          <dl>
            {section.fields.map((field) =>
              isFieldVisible(field, answers) ? (
                <div
                  className="grid gap-2 border-b py-3 sm:grid-cols-2 [&_dt]:flex [&_dt]:gap-2 [&_dt]:text-sm [&_dt]:text-muted-foreground [&_dd]:text-sm"
                  key={field.id}
                >
                  <dt>
                    {field.number ? <b>{field.number}</b> : null}
                    {field.label}
                  </dt>
                  <dd>
                    <AnswerValue answers={answers} field={field} />
                  </dd>
                </div>
              ) : null,
            )}
          </dl>
        </section>
      ))}
    </div>
  );
}
