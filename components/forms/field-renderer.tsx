"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { FieldError, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import type { AnswerValue, FormAnswers, FormField } from "@/lib/forms/types";

type FieldRendererProps = {
  field: FormField;
  value: AnswerValue | undefined;
  answers: FormAnswers;
  error?: string;
  onChange: (value: AnswerValue) => void;
};

function FieldHeader({ field }: { field: FormField }) {
  return (
    <div className="question-heading">
      {field.number ? <span className="question-number">{field.number}</span> : null}
      <div>
        <h3>{field.label}{field.required ? <span className="required-mark">*</span> : null}</h3>
        {field.description ? <p>{field.description}</p> : null}
      </div>
    </div>
  );
}

export function FieldRenderer({ field, value, answers, error, onChange }: FieldRendererProps) {
  if (field.type === "text" || field.type === "textarea") {
    return (
      <div className={`question-block nested-question${error ? " has-error" : ""}`} data-field-id={field.id}>
        <FieldHeader field={field} />
        {field.type === "textarea" ? (
          <Textarea
            className="min-h-24 bg-card"
            aria-label={field.label}
            aria-describedby={error ? `${field.id}-error` : undefined}
            aria-invalid={Boolean(error)}
            id={field.id}
            placeholder={field.placeholder}
            rows={3}
            value={typeof value === "string" ? value : ""}
            onChange={(event) => onChange(event.target.value)}
          />
        ) : (
          <Input
            className="h-11 bg-card"
            aria-label={field.label}
            aria-describedby={error ? `${field.id}-error` : undefined}
            aria-invalid={Boolean(error)}
            id={field.id}
            placeholder={field.placeholder}
            type="text"
            value={typeof value === "string" ? value : ""}
            onChange={(event) => onChange(event.target.value)}
          />
        )}
        {error ? <FieldError className="field-error" id={`${field.id}-error`}>{error}</FieldError> : null}
      </div>
    );
  }

  if (field.type === "singleChoice") {
    return (
      <FieldSet className={`question-block${error ? " has-error" : ""}`} data-field-id={field.id}>
        <FieldLegend className="sr-only">{field.label}</FieldLegend>
        <FieldHeader field={field} />
        <RadioGroup className="choice-grid" name={field.id} value={typeof value === "string" ? value : ""} onValueChange={onChange}>
          {field.options.map((option) => {
            const selected = value === option.value;
            return (
              <Label className={`choice-tile${selected ? " is-selected" : ""}`} htmlFor={`${field.id}-${option.value}`} key={option.value}>
                <RadioGroupItem id={`${field.id}-${option.value}`} value={option.value} />
                <span>{option.label}</span>
              </Label>
            );
          })}
        </RadioGroup>
        {error ? <FieldError className="field-error">{error}</FieldError> : null}
      </FieldSet>
    );
  }

  if (field.type === "multiChoice") {
    const selected = Array.isArray(value) ? value : [];
    return (
      <FieldSet className={`question-block${error ? " has-error" : ""}`} data-field-id={field.id}>
        <FieldLegend className="sr-only">{field.label}</FieldLegend>
        <FieldHeader field={field} />
        <div className="choice-grid choice-grid-multi">
          {field.options.map((option) => {
            const checked = selected.includes(option.value);
            return (
              <Label className={`choice-tile${checked ? " is-selected" : ""}`} htmlFor={`${field.id}-${option.value}`} key={option.value}>
                <Checkbox
                  checked={checked}
                  id={`${field.id}-${option.value}`}
                  name={field.id}
                  value={option.value}
                  onCheckedChange={() => {
                    const isExclusive = field.exclusiveValues?.includes(option.value);
                    if (!checked && isExclusive) return onChange([option.value]);
                    const withoutExclusive = selected.filter(
                      (item) => !field.exclusiveValues?.includes(item),
                    );
                    onChange(
                      checked
                        ? selected.filter((item) => item !== option.value)
                        : [...withoutExclusive, option.value],
                    );
                  }}
                />
                <span>{option.label}</span>
              </Label>
            );
          })}
        </div>
        {error ? <FieldError className="field-error">{error}</FieldError> : null}
      </FieldSet>
    );
  }

  if (field.type !== "matrixSingle") return null;

  const matrixValue = value && !Array.isArray(value) && typeof value === "object" ? value : {};
  const sourceRows = field.rowsFromField;
  const selectedSource = sourceRows
    ? (Array.isArray(answers[sourceRows]) ? answers[sourceRows] : [])
    : null;
  const rows = selectedSource !== null
    ? field.rows.filter((row) => selectedSource.includes(row.value))
    : field.rows;

  return (
    <FieldSet className={`question-block matrix-question${error ? " has-error" : ""}`} data-field-id={field.id}>
      <FieldLegend className="sr-only">{field.label}</FieldLegend>
      <FieldHeader field={field} />
      {rows.length ? (
        <div className="matrix-table">
          <div className="matrix-row matrix-header" aria-hidden="true">
            <span>Bahasa</span>
            {field.columns.map((column) => <span key={column.value}>{column.label}</span>)}
          </div>
          {rows.map((row) => (
            <RadioGroup className="matrix-row" key={row.value} name={`${field.id}-${row.value}`} value={matrixValue[row.value] ?? ""} onValueChange={(column) => onChange({ ...matrixValue, [row.value]: column })}>
              <span>{row.label}</span>
              {field.columns.map((column) => {
                const checked = matrixValue[row.value] === column.value;
                return (
                  <Label className={checked ? "is-selected" : ""} htmlFor={`${field.id}-${row.value}-${column.value}`} key={column.value}>
                    <RadioGroupItem
                      id={`${field.id}-${row.value}-${column.value}`}
                      value={column.value}
                    />
                    <span className="sr-only">{row.label}: {column.label}</span>
                  </Label>
                );
              })}
            </RadioGroup>
          ))}
        </div>
      ) : (
        <p className="empty-inline">Pilih bahasa terlebih dahulu.</p>
      )}
      {error ? <FieldError className="field-error">{error}</FieldError> : null}
    </FieldSet>
  );
}
