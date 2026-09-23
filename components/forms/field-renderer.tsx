"use client";
import { cn } from "@/lib/utils";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldError,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
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
    <div className="mb-3 flex items-start gap-3 [&_h3]:text-sm [&_h3]:font-medium [&_p]:mt-1 [&_p]:text-xs [&_p]:text-muted-foreground">
      <div>
        <h3>
          {field.label}
          {field.required ? (
            <span className="ml-1 text-destructive">*</span>
          ) : null}
        </h3>
        {field.description ? <p>{field.description}</p> : null}
      </div>
    </div>
  );
}

export function FieldRenderer({
  field,
  value,
  answers,
  error,
  onChange,
}: FieldRendererProps) {
  if (field.type === "text" || field.type === "textarea") {
    return (
      <Field
        className="min-w-0 border-b pb-6 last:border-0 last:pb-0"
        data-invalid={Boolean(error)}
        data-field-id={field.id}
      >
        <FieldHeader field={field} />
        {field.type === "textarea" ? (
          <Textarea
            className="min-h-24"
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
        {error ? (
          <FieldError id={`${field.id}-error`}>{error}</FieldError>
        ) : null}
      </Field>
    );
  }

  if (field.type === "singleChoice") {
    return (
      <FieldSet
        className="min-w-0 border-b pb-6 last:border-0 last:pb-0"
        data-invalid={Boolean(error)}
        data-field-id={field.id}
      >
        <FieldLegend className="sr-only">{field.label}</FieldLegend>
        <FieldHeader field={field} />
        <RadioGroup
          aria-invalid={Boolean(error)}
          className="grid gap-2 sm:grid-cols-2"
          name={field.id}
          value={typeof value === "string" ? value : ""}
          onValueChange={onChange}
        >
          {field.options.map((option) => {
            const selected = value === option.value;
            return (
              <Label
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-lg border p-3",
                  selected ? "ring-2 ring-ring" : "",
                )}
                htmlFor={`${field.id}-${option.value}`}
                key={option.value}
              >
                <RadioGroupItem
                  id={`${field.id}-${option.value}`}
                  value={option.value}
                />
                <span>{option.label}</span>
              </Label>
            );
          })}
        </RadioGroup>
        {error ? <FieldError>{error}</FieldError> : null}
      </FieldSet>
    );
  }

  if (field.type === "multiChoice") {
    const selected = Array.isArray(value) ? value : [];
    return (
      <FieldSet
        className="min-w-0 border-b pb-6 last:border-0 last:pb-0"
        data-invalid={Boolean(error)}
        data-field-id={field.id}
      >
        <FieldLegend className="sr-only">{field.label}</FieldLegend>
        <FieldHeader field={field} />
        <div className="grid gap-2 sm:grid-cols-2">
          {field.options.map((option) => {
            const checked = selected.includes(option.value);
            return (
              <Label
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-lg border p-3",
                  checked ? "ring-2 ring-ring" : "",
                )}
                htmlFor={`${field.id}-${option.value}`}
                key={option.value}
              >
                <Checkbox
                  checked={checked}
                  aria-invalid={Boolean(error)}
                  id={`${field.id}-${option.value}`}
                  name={field.id}
                  value={option.value}
                  onCheckedChange={() => {
                    const isExclusive = field.exclusiveValues?.includes(
                      option.value,
                    );
                    if (!checked && isExclusive)
                      return onChange([option.value]);
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
        {error ? <FieldError>{error}</FieldError> : null}
      </FieldSet>
    );
  }

  if (field.type !== "matrixSingle") return null;

  const matrixValue =
    value && !Array.isArray(value) && typeof value === "object" ? value : {};
  const sourceRows = field.rowsFromField;
  const selectedSource = sourceRows
    ? Array.isArray(answers[sourceRows])
      ? answers[sourceRows]
      : []
    : null;
  const rows =
    selectedSource !== null
      ? field.rows.filter((row) => selectedSource.includes(row.value))
      : field.rows;

  return (
    <FieldSet
      className="min-w-0 border-b pb-6 last:border-0 last:pb-0"
      data-invalid={Boolean(error)}
      data-field-id={field.id}
    >
      <FieldLegend className="sr-only">{field.label}</FieldLegend>
      <FieldHeader field={field} />
      {rows.length ? (
        <div className="overflow-hidden rounded-lg border">
          <div
            className="grid grid-cols-[minmax(90px,1fr)_repeat(2,64px)] items-center border-b last:border-0 sm:grid-cols-[minmax(150px,1fr)_repeat(2,90px)] [&>span]:p-3 [&>label]:flex [&>label]:justify-center [&>label]:p-3 bg-muted text-xs text-muted-foreground"
            aria-hidden="true"
          >
            <span>Bahasa</span>
            {field.columns.map((column) => (
              <span key={column.value}>{column.label}</span>
            ))}
          </div>
          {rows.map((row) => (
            <RadioGroup
              aria-invalid={Boolean(error)}
              className="grid grid-cols-[minmax(90px,1fr)_repeat(2,64px)] items-center border-b last:border-0 sm:grid-cols-[minmax(150px,1fr)_repeat(2,90px)] [&>span]:p-3 [&>label]:flex [&>label]:justify-center [&>label]:p-3"
              key={row.value}
              name={`${field.id}-${row.value}`}
              value={matrixValue[row.value] ?? ""}
              onValueChange={(column) =>
                onChange({ ...matrixValue, [row.value]: column })
              }
            >
              <span>{row.label}</span>
              {field.columns.map((column) => {
                const checked = matrixValue[row.value] === column.value;
                return (
                  <Label
                    className={cn(checked ? "ring-2 ring-ring" : "")}
                    htmlFor={`${field.id}-${row.value}-${column.value}`}
                    key={column.value}
                  >
                    <RadioGroupItem
                      id={`${field.id}-${row.value}-${column.value}`}
                      value={column.value}
                    />
                    <span className="sr-only">
                      {row.label}: {column.label}
                    </span>
                  </Label>
                );
              })}
            </RadioGroup>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Pilih bahasa terlebih dahulu.
        </p>
      )}
      {error ? <FieldError>{error}</FieldError> : null}
    </FieldSet>
  );
}
