import type { FormAnswers, FormField, FormSchema } from "@/lib/forms/types";
import { isFieldVisible } from "@/lib/forms/validation";

function optionLabel(field: FormField, value: string) {
  if (field.type === "singleChoice" || field.type === "multiChoice") {
    return field.options.find((option) => option.value === value)?.label ?? value;
  }
  return value;
}

function AnswerValue({ field, answers }: { field: FormField; answers: FormAnswers }) {
  const value = answers[field.id];
  if (value == null || value === "" || (Array.isArray(value) && !value.length)) {
    return <span className="answer-empty">Belum diisi</span>;
  }
  if (typeof value === "string") return <span>{optionLabel(field, value)}</span>;
  if (Array.isArray(value)) {
    return (
      <span className="answer-pills">
        {value.map((item) => <span key={item}>{optionLabel(field, item)}</span>)}
      </span>
    );
  }
  if (field.type === "matrixSingle") {
    return (
      <span className="answer-pills">
        {Object.entries(value).map(([row, column]) => {
          const rowLabel = field.rows.find((item) => item.value === row)?.label ?? row;
          const columnLabel = field.columns.find((item) => item.value === column)?.label ?? column;
          return <span key={row}>{rowLabel}: {columnLabel}</span>;
        })}
      </span>
    );
  }
  return <span>{JSON.stringify(value)}</span>;
}

export function AnswersView({ schema, answers }: { schema: FormSchema; answers: FormAnswers }) {
  return (
    <div className="answers-view">
      {schema.sections.map((section, sectionIndex) => (
        <section className={`answer-section${schema.layout === "continuous" ? " continuous-answer-section" : ""}`} key={section.id}>
          {schema.layout !== "continuous" ? <div className="panel-heading compact">
            <span>{(sectionIndex + 1).toString().padStart(2, "0")}</span>
            <div><p className="eyebrow">{section.eyebrow}</p><h2>{section.title}</h2></div>
          </div> : null}
          <dl>
            {section.fields.map((field) =>
              isFieldVisible(field, answers) ? (
                <div className="answer-row" key={field.id}>
                  <dt>{field.number ? <b>{field.number}</b> : null}{field.label}</dt>
                  <dd><AnswerValue answers={answers} field={field} /></dd>
                </div>
              ) : null,
            )}
          </dl>
        </section>
      ))}
    </div>
  );
}
