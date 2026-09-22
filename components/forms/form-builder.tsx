"use client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  TextAlignLeftIcon,
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowUpIcon,
  CheckIcon,
  CheckSquareIcon,
  RadioButtonIcon,
  CopyIcon,
  FloppyDiskIcon,
  DotsSixVerticalIcon,
  GitBranchIcon,
  RowsIcon,
  PlusIcon,
  RocketIcon,
  GearIcon,
  TrashIcon,
  TextTIcon,
} from "@phosphor-icons/react";

import { createFormAction } from "@/app/actions/forms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { FormField, FormSchema } from "@/lib/forms/types";

type BuilderState = {
  category: string;
  schema: FormSchema;
};

type Selection =
  | { kind: "form" }
  | { kind: "section"; sectionId: string }
  | { kind: "field"; sectionId: string; fieldId: string };

type AddableFieldType = "text" | "textarea" | "singleChoice" | "multiChoice";

const DRAFT_KEY = "rsud-form-builder:v1";

const initialState: BuilderState = {
  category: "Asesmen klinis",
  schema: {
    schemaVersion: 1,
    layout: "sectioned",
    title: "Formulir asesmen baru",
    shortTitle: "Asesmen Baru",
    description: "Catat informasi klinis secara terstruktur dan konsisten.",
    sections: [
      {
        id: "section-1",
        eyebrow: "Bagian 01",
        title: "Informasi utama",
        description: "Tambahkan pertanyaan yang dibutuhkan pada bagian ini.",
        fields: [
          {
            id: "field-1",
            number: "01",
            type: "text",
            label: "Pertanyaan pertama",
            description: "Berikan petunjuk singkat untuk staf.",
            placeholder: "Tuliskan jawaban…",
            required: true,
          },
        ],
      },
    ],
  },
};

const palette: Array<{
  type: AddableFieldType;
  title: string;
  description: string;
  icon: typeof TextTIcon;
}> = [
  {
    type: "text",
    title: "Jawaban singkat",
    description: "Nama, kode, atau satu baris",
    icon: TextTIcon,
  },
  {
    type: "textarea",
    title: "Paragraf",
    description: "Catatan atau uraian panjang",
    icon: TextAlignLeftIcon,
  },
  {
    type: "singleChoice",
    title: "Pilihan tunggal",
    description: "Pilih satu dari beberapa opsi",
    icon: RadioButtonIcon,
  },
  {
    type: "multiChoice",
    title: "Kotak centang",
    description: "Pilih satu atau beberapa opsi",
    icon: CheckSquareIcon,
  },
];

function uniqueId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function createField(type: AddableFieldType, number: number): FormField {
  const base = {
    id: uniqueId("field"),
    number: number.toString().padStart(2, "0"),
    label: "Pertanyaan tanpa judul",
    description: "",
    required: false,
  };
  if (type === "text" || type === "textarea") {
    return { ...base, type, placeholder: "Tuliskan jawaban…" };
  }
  return {
    ...base,
    type,
    options: [
      { value: "pilihan_1", label: "Pilihan 1" },
      { value: "pilihan_2", label: "Pilihan 2" },
    ],
    ...(type === "multiChoice" ? { minSelections: 1 } : {}),
  };
}

function countFields(schema: FormSchema) {
  return schema.sections.reduce(
    (total, section) => total + section.fields.length,
    0,
  );
}

function fieldTypeLabel(type: FormField["type"]) {
  const labels: Record<FormField["type"], string> = {
    text: "Jawaban singkat",
    textarea: "Paragraf",
    singleChoice: "Pilihan tunggal",
    multiChoice: "Kotak centang",
    matrixSingle: "Matriks",
  };
  return labels[type];
}

function firstVisibilityRule(field: FormField) {
  if (!field.visibleWhen) return null;
  return Array.isArray(field.visibleWhen)
    ? (field.visibleWhen[0] ?? null)
    : field.visibleWhen;
}

export function FormBuilder() {
  const router = useRouter();
  const [builder, setBuilder] = useState<BuilderState>(initialState);
  const [selection, setSelection] = useState<Selection>({ kind: "form" });
  const [mode, setMode] = useState<"build" | "preview">("build");
  const [notice, setNotice] = useState("");
  const [isPending, startTransition] = useTransition();
  const isContinuous = builder.schema.layout === "continuous";

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = window.localStorage.getItem(DRAFT_KEY);
      if (!saved) return;
      try {
        setBuilder(JSON.parse(saved) as BuilderState);
        setNotice("Draft lokal dipulihkan.");
      } catch {
        window.localStorage.removeItem(DRAFT_KEY);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const selectedSection = useMemo(() => {
    if (selection.kind === "form") return null;
    return (
      builder.schema.sections.find(
        (section) => section.id === selection.sectionId,
      ) ?? null
    );
  }, [builder.schema.sections, selection]);

  const selectedField = useMemo(() => {
    if (selection.kind !== "field") return null;
    return (
      selectedSection?.fields.find((field) => field.id === selection.fieldId) ??
      null
    );
  }, [selectedSection, selection]);

  const allFields = useMemo(
    () => builder.schema.sections.flatMap((section) => section.fields),
    [builder.schema.sections],
  );
  const fieldMap = useMemo(
    () => new Map(allFields.map((field) => [field.id, field])),
    [allFields],
  );
  const conditionalSources = useMemo(() => {
    if (!selectedField) return [];
    const selectedIndex = allFields.findIndex(
      (field) => field.id === selectedField.id,
    );
    return allFields
      .slice(0, selectedIndex)
      .filter(
        (field) =>
          field.type === "singleChoice" || field.type === "multiChoice",
      );
  }, [allFields, selectedField]);
  const selectedRule = selectedField
    ? firstVisibilityRule(selectedField)
    : null;
  const selectedRuleSource = selectedRule
    ? fieldMap.get(selectedRule.fieldId)
    : null;

  function updateSchema(patch: Partial<FormSchema>) {
    setBuilder((current) => ({
      ...current,
      schema: { ...current.schema, ...patch },
    }));
  }

  function updateSection(
    sectionId: string,
    patch: Partial<FormSchema["sections"][number]>,
  ) {
    setBuilder((current) => ({
      ...current,
      schema: {
        ...current.schema,
        sections: current.schema.sections.map((section) =>
          section.id === sectionId ? { ...section, ...patch } : section,
        ),
      },
    }));
  }

  function updateField(
    sectionId: string,
    fieldId: string,
    patch: Partial<FormField>,
  ) {
    setBuilder((current) => ({
      ...current,
      schema: {
        ...current.schema,
        sections: current.schema.sections.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                fields: section.fields.map((field) =>
                  field.id === fieldId
                    ? ({ ...field, ...patch } as FormField)
                    : field,
                ),
              }
            : section,
        ),
      },
    }));
  }

  function addField(type: AddableFieldType) {
    const target =
      selection.kind === "form"
        ? builder.schema.sections.at(-1)
        : builder.schema.sections.find(
            (section) => section.id === selection.sectionId,
          );
    if (!target) return;
    const field = createField(type, countFields(builder.schema) + 1);
    updateSection(target.id, { fields: [...target.fields, field] });
    setSelection({ kind: "field", sectionId: target.id, fieldId: field.id });
    setMode("build");
  }

  function addSection() {
    const index = builder.schema.sections.length + 1;
    const section = {
      id: uniqueId("section"),
      eyebrow: `Bagian ${index.toString().padStart(2, "0")}`,
      title: "Bagian baru",
      description: "Jelaskan tujuan bagian ini.",
      fields: [createField("text", countFields(builder.schema) + 1)],
    };
    updateSchema({
      layout: "sectioned",
      sections: [...builder.schema.sections, section],
    });
    setSelection({ kind: "section", sectionId: section.id });
  }

  function setLayout(layout: "sectioned" | "continuous") {
    if (layout === "continuous") {
      const [first, ...rest] = builder.schema.sections;
      const mergedFields = [first, ...rest].flatMap(
        (section) => section.fields,
      );
      updateSchema({
        layout,
        sections: [
          {
            ...first,
            id: first?.id ?? uniqueId("section"),
            eyebrow: undefined,
            title: "Pertanyaan",
            description: undefined,
            fields: mergedFields.length
              ? mergedFields
              : [createField("text", 1)],
          },
        ],
      });
      setSelection({ kind: "form" });
      setNotice("Bagian digabung menjadi satu alur pertanyaan.");
      return;
    }
    updateSchema({ layout });
    setNotice("Tampilan berbasis bagian diaktifkan.");
  }

  function removeSection(sectionId: string) {
    if (builder.schema.sections.length === 1) {
      setLayout("continuous");
      setNotice(
        "Judul bagian dihapus. Formulir kini menggunakan alur kontinu.",
      );
      return;
    }
    const deleted = builder.schema.sections.find(
      (section) => section.id === sectionId,
    );
    const deletedFieldIds = new Set(
      deleted?.fields.map((field) => field.id) ?? [],
    );
    const sections = builder.schema.sections
      .filter((section) => section.id !== sectionId)
      .map((section) => ({
        ...section,
        fields: section.fields.map((field) => {
          const rules = field.visibleWhen
            ? Array.isArray(field.visibleWhen)
              ? field.visibleWhen
              : [field.visibleWhen]
            : [];
          const remaining = rules.filter(
            (rule) => !deletedFieldIds.has(rule.fieldId),
          );
          if (remaining.length === rules.length) return field;
          return {
            ...field,
            visibleWhen: remaining.length ? remaining : undefined,
          } as FormField;
        }),
      }));
    updateSchema({ sections });
    setSelection({ kind: "form" });
    setNotice("Bagian dan pertanyaannya dihapus.");
  }

  function removeField(sectionId: string, fieldId: string) {
    const section = builder.schema.sections.find(
      (item) => item.id === sectionId,
    );
    if (!section || section.fields.length === 1) {
      setNotice("Setiap bagian harus memiliki minimal satu pertanyaan.");
      return;
    }
    setBuilder((current) => ({
      ...current,
      schema: {
        ...current.schema,
        sections: current.schema.sections.map((item) => ({
          ...item,
          fields: item.fields
            .filter((field) => field.id !== fieldId)
            .map((field) => {
              const rules = field.visibleWhen
                ? Array.isArray(field.visibleWhen)
                  ? field.visibleWhen
                  : [field.visibleWhen]
                : [];
              const remaining = rules.filter(
                (rule) => rule.fieldId !== fieldId,
              );
              if (remaining.length === rules.length) return field;
              return {
                ...field,
                visibleWhen: remaining.length ? remaining : undefined,
              } as FormField;
            }),
        })),
      },
    }));
    setSelection({ kind: "section", sectionId });
  }

  function duplicateField(sectionId: string, fieldId: string) {
    const section = builder.schema.sections.find(
      (item) => item.id === sectionId,
    );
    const source = section?.fields.find((field) => field.id === fieldId);
    if (!section || !source) return;
    const copy = {
      ...source,
      id: uniqueId("field"),
      label: `${source.label} (salinan)`,
    };
    const index = section.fields.findIndex((field) => field.id === fieldId);
    const fields = [...section.fields];
    fields.splice(index + 1, 0, copy);
    updateSection(sectionId, { fields });
    setSelection({ kind: "field", sectionId, fieldId: copy.id });
  }

  function moveField(sectionId: string, fieldId: string, direction: -1 | 1) {
    const section = builder.schema.sections.find(
      (item) => item.id === sectionId,
    );
    if (!section) return;
    const from = section.fields.findIndex((field) => field.id === fieldId);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= section.fields.length) return;
    const fields = [...section.fields];
    [fields[from], fields[to]] = [fields[to], fields[from]];
    const orderedFields = builder.schema.sections.flatMap((item) =>
      item.id === sectionId ? fields : item.fields,
    );
    const order = new Map(
      orderedFields.map((field, index) => [field.id, index]),
    );
    const createsBackwardCondition = orderedFields.some((field, index) => {
      const rules = field.visibleWhen
        ? Array.isArray(field.visibleWhen)
          ? field.visibleWhen
          : [field.visibleWhen]
        : [];
      return rules.some((rule) => (order.get(rule.fieldId) ?? -1) >= index);
    });
    if (createsBackwardCondition) {
      setNotice(
        "Pertanyaan pemicu harus tetap berada sebelum pertanyaan kondisional.",
      );
      return;
    }
    updateSection(sectionId, { fields });
  }

  function removeChoiceOption(fieldId: string, optionIndex: number) {
    const source = fieldMap.get(fieldId);
    if (
      !source ||
      (source.type !== "singleChoice" && source.type !== "multiChoice")
    )
      return;
    const removedValue = source.options[optionIndex]?.value;
    if (!removedValue || source.options.length <= 1) return;

    setBuilder((current) => ({
      ...current,
      schema: {
        ...current.schema,
        sections: current.schema.sections.map((section) => ({
          ...section,
          fields: section.fields.map((field) => {
            if (
              field.id === fieldId &&
              (field.type === "singleChoice" || field.type === "multiChoice")
            ) {
              return {
                ...field,
                options: field.options.filter(
                  (_, index) => index !== optionIndex,
                ),
              };
            }
            const rules = field.visibleWhen
              ? Array.isArray(field.visibleWhen)
                ? field.visibleWhen
                : [field.visibleWhen]
              : [];
            const remaining = rules.filter(
              (rule) =>
                !(rule.fieldId === fieldId && rule.value === removedValue),
            );
            if (remaining.length === rules.length) return field;
            return {
              ...field,
              visibleWhen: remaining.length ? remaining : undefined,
            } as FormField;
          }),
        })),
      },
    }));
  }

  function saveDraft() {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(builder));
    setNotice("Draft tersimpan di perangkat ini.");
  }

  function publish() {
    setNotice("");
    startTransition(async () => {
      const result = await createFormAction(builder);
      setNotice(result.message);
      if (result.success) {
        window.localStorage.removeItem(DRAFT_KEY);
        router.push("/");
      }
    });
  }

  return (
    <div className="min-w-0 bg-muted/30">
      <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b bg-background p-4">
        <div className="flex min-w-0 items-center gap-3 [&>div]:flex [&>div]:flex-col [&>div]:gap-1">
          <Button
            variant="outline"
            aria-label="Kembali ke administrasi"
            onClick={() => router.push("/admin")}
            type="button"
          >
            <ArrowLeftIcon data-icon="inline-start" />
          </Button>
          <div>
            <span className="text-xs text-muted-foreground">
              Studio formulir
            </span>
            <Input
              aria-label="Judul formulir singkat"
              onChange={(event) =>
                updateSchema({ shortTitle: event.target.value })
              }
              value={builder.schema.shortTitle}
            />
          </div>
          <span className="hidden text-xs text-muted-foreground 2xl:block">
            <i /> Draft lokal
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ToggleGroup
            aria-label="Mode tampilan"
            value={[mode]}
            onValueChange={(values) => {
              if (values[0] === "build" || values[0] === "preview")
                setMode(values[0]);
            }}
            variant="outline"
          >
            <ToggleGroupItem value="build">Susun</ToggleGroupItem>
            <ToggleGroupItem value="preview">Pratinjau</ToggleGroupItem>
          </ToggleGroup>
          <Button
            className="h-9 px-3"
            onClick={saveDraft}
            type="button"
            variant="outline"
          >
            <FloppyDiskIcon data-icon="inline-start" /> Simpan draft
          </Button>
          <Button
            className="h-9 px-4"
            disabled={isPending}
            onClick={publish}
            type="button"
          >
            {isPending ? (
              "Menerbitkan…"
            ) : (
              <>
                <RocketIcon data-icon="inline-start" /> Terbitkan
              </>
            )}
          </Button>
        </div>
      </header>

      {notice ? (
        <Alert className="mx-4 my-3 w-auto" role="status">
          <CheckIcon />
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      ) : null}

      {mode === "build" ? (
        <div className="grid min-w-0 items-start gap-4 p-4 xl:grid-cols-[210px_minmax(0,1fr)_260px]">
          <aside className="flex flex-col gap-4 rounded-xl border bg-card p-4 xl:sticky xl:top-24">
            <div className="flex flex-col gap-1 [&>span]:text-sm [&>span]:font-semibold [&_small]:text-xs [&_small]:text-muted-foreground">
              <span>Blok pertanyaan</span>
              <small>Klik untuk menambahkan</small>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              {palette.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    variant="outline"
                    className="h-auto justify-start gap-2 whitespace-normal p-3 text-left"
                    aria-label={`Tambah ${item.title}`}
                    key={item.type}
                    onClick={() => addField(item.type)}
                    type="button"
                  >
                    <Icon data-icon="inline-start" />
                    <span className="flex min-w-0 flex-col items-start gap-1">
                      <span>{item.title}</span>
                      <span className="text-xs">{item.description}</span>
                    </span>
                    <PlusIcon data-icon="inline-start" className="ml-auto" />
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={addSection}
              type="button"
            >
              <RowsIcon data-icon="inline-start" /> Tambah bagian
            </Button>
            <Alert>
              <AlertDescription>
                Pilih blok di kanvas, lalu atur detailnya di panel pengaturan.
              </AlertDescription>
            </Alert>
          </aside>

          <main className="flex min-w-0 flex-col gap-4">
            <Button
              variant="outline"
              className={cn(
                "h-auto w-full flex-col items-start gap-3 whitespace-normal p-6 text-left",
                selection.kind === "form" && "ring-2 ring-ring",
              )}
              onClick={() => setSelection({ kind: "form" })}
              type="button"
            >
              <span className="mb-2 text-xs font-medium text-muted-foreground">
                {builder.category}
              </span>
              <span>{builder.schema.title || "Formulir tanpa judul"}</span>
              <span>
                {builder.schema.description || "Tambahkan deskripsi formulir."}
              </span>
              <span className="text-xs text-muted-foreground">
                {builder.schema.sections.length} bagian ·{" "}
                {countFields(builder.schema)} pertanyaan
              </span>
            </Button>

            {builder.schema.sections.map((section, sectionIndex) => (
              <section
                className={cn(
                  "overflow-hidden rounded-xl border bg-card",
                  selection.kind === "section" &&
                    selection.sectionId === section.id
                    ? "ring-2 ring-ring"
                    : "",
                )}
                key={section.id}
              >
                {!isContinuous ? (
                  <Button
                    variant="ghost"
                    className="h-auto w-full justify-start gap-3 whitespace-normal p-4 text-left"
                    onClick={() =>
                      setSelection({ kind: "section", sectionId: section.id })
                    }
                    type="button"
                  >
                    <span>
                      {(sectionIndex + 1).toString().padStart(2, "0")}
                    </span>
                    <div>
                      <small>{section.eyebrow}</small>
                      <h2>{section.title}</h2>
                      <p>{section.description}</p>
                    </div>
                    <b>{section.fields.length} item</b>
                  </Button>
                ) : (
                  <div className="flex flex-wrap justify-between gap-2 border-b bg-muted p-4 text-xs text-muted-foreground">
                    <span>Alur kontinu</span>
                    <small>
                      {section.fields.length} pertanyaan tanpa pembatas bagian
                    </small>
                  </div>
                )}
                <div className="flex flex-col gap-2 p-3">
                  {section.fields.map((field, fieldIndex) => {
                    const active =
                      selection.kind === "field" &&
                      selection.fieldId === field.id;
                    return (
                      <article
                        className={cn(
                          "rounded-lg border border-transparent",
                          field.visibleWhen
                            ? "ml-4 border-l-2 border-l-primary sm:ml-8"
                            : "",
                          active ? "ring-2 ring-ring" : "",
                        )}
                        key={field.id}
                      >
                        <Button
                          variant="ghost"
                          className="h-auto w-full items-start justify-start gap-3 whitespace-normal p-3 text-left"
                          onClick={() =>
                            setSelection({
                              kind: "field",
                              sectionId: section.id,
                              fieldId: field.id,
                            })
                          }
                          type="button"
                        >
                          <DotsSixVerticalIcon
                            data-icon="inline-start"
                            className="shrink-0 text-muted-foreground"
                          />
                          <span className="text-xs text-muted-foreground">
                            {field.number ||
                              (fieldIndex + 1).toString().padStart(2, "0")}
                          </span>
                          <div className="flex min-w-0 flex-col gap-2 [&_h3]:font-medium [&_p]:text-xs [&_p]:text-muted-foreground">
                            <span className="text-xs text-muted-foreground">
                              {fieldTypeLabel(field.type)}
                            </span>
                            {firstVisibilityRule(field) ? (
                              <ConditionBadge
                                field={field}
                                fieldMap={fieldMap}
                              />
                            ) : null}
                            <h3>{field.label}</h3>
                            {field.description ? (
                              <p>{field.description}</p>
                            ) : null}
                          </div>
                          {field.required ? (
                            <Badge variant="secondary">Wajib</Badge>
                          ) : null}
                        </Button>
                        <div className="px-3 pb-3">
                          <FieldMock field={field} />
                        </div>
                        {active ? (
                          <div className="flex justify-end gap-1 border-t p-1">
                            <Button
                              variant="outline"
                              aria-label="Naikkan pertanyaan"
                              disabled={fieldIndex === 0}
                              onClick={() =>
                                moveField(section.id, field.id, -1)
                              }
                              type="button"
                            >
                              <ArrowUpIcon data-icon="inline-start" />
                            </Button>
                            <Button
                              variant="outline"
                              aria-label="Turunkan pertanyaan"
                              disabled={
                                fieldIndex === section.fields.length - 1
                              }
                              onClick={() => moveField(section.id, field.id, 1)}
                              type="button"
                            >
                              <ArrowDownIcon data-icon="inline-start" />
                            </Button>
                            <Button
                              variant="outline"
                              aria-label="Duplikat pertanyaan"
                              onClick={() =>
                                duplicateField(section.id, field.id)
                              }
                              type="button"
                            >
                              <CopyIcon data-icon="inline-start" />
                            </Button>
                            <Button
                              variant="outline"
                              aria-label="Hapus pertanyaan"
                              onClick={() => removeField(section.id, field.id)}
                              type="button"
                            >
                              <TrashIcon data-icon="inline-start" />
                            </Button>
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
            {!isContinuous ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={addSection}
                type="button"
              >
                <PlusIcon data-icon="inline-start" /> Tambah bagian berikutnya
              </Button>
            ) : null}
          </main>

          <aside className="min-w-0 rounded-xl border bg-card xl:sticky xl:top-24 xl:max-h-[calc(100svh-7rem)] xl:overflow-y-auto">
            <div className="flex flex-col gap-1 [&>span]:text-sm [&>span]:font-semibold [&_small]:text-xs [&_small]:text-muted-foreground border-b p-4">
              <span>
                <GearIcon size={16} /> Pengaturan
              </span>
              <small>
                {selection.kind === "form"
                  ? "Formulir"
                  : selection.kind === "section"
                    ? "Bagian"
                    : "Pertanyaan"}
              </small>
            </div>
            {selection.kind === "form" ? (
              <FieldGroup className="p-4">
                <div className="flex flex-col gap-3">
                  <span>Struktur formulir</span>
                  <ToggleGroup
                    aria-label="Struktur formulir"
                    value={[isContinuous ? "continuous" : "sectioned"]}
                    onValueChange={(values) => {
                      if (
                        values[0] === "continuous" ||
                        values[0] === "sectioned"
                      )
                        setLayout(values[0]);
                    }}
                    variant="outline"
                  >
                    <ToggleGroupItem value="sectioned">
                      <RowsIcon data-icon="inline-start" /> Berbagian
                    </ToggleGroupItem>
                    <ToggleGroupItem value="continuous">
                      <TextAlignLeftIcon data-icon="inline-start" /> Kontinu
                    </ToggleGroupItem>
                  </ToggleGroup>
                  <small>
                    {isContinuous
                      ? "Semua pertanyaan tampil dalam satu alur panjang."
                      : "Pertanyaan dikelompokkan dengan judul bagian."}
                  </small>
                </div>
                <InspectorField label="Judul lengkap">
                  <Textarea
                    value={builder.schema.title}
                    onChange={(event) =>
                      updateSchema({ title: event.target.value })
                    }
                  />
                </InspectorField>
                <InspectorField label="Nama singkat">
                  <Input
                    value={builder.schema.shortTitle}
                    onChange={(event) =>
                      updateSchema({ shortTitle: event.target.value })
                    }
                  />
                </InspectorField>
                <InspectorField label="Kategori">
                  <Input
                    value={builder.category}
                    onChange={(event) =>
                      setBuilder((current) => ({
                        ...current,
                        category: event.target.value,
                      }))
                    }
                  />
                </InspectorField>
                <InspectorField label="Deskripsi">
                  <Textarea
                    value={builder.schema.description}
                    onChange={(event) =>
                      updateSchema({ description: event.target.value })
                    }
                  />
                </InspectorField>
              </FieldGroup>
            ) : null}

            {selection.kind === "section" && selectedSection ? (
              <FieldGroup className="p-4">
                <InspectorField label="Penanda bagian">
                  <Input
                    value={selectedSection.eyebrow || ""}
                    onChange={(event) =>
                      updateSection(selectedSection.id, {
                        eyebrow: event.target.value,
                      })
                    }
                  />
                </InspectorField>
                <InspectorField label="Judul bagian">
                  <Input
                    value={selectedSection.title}
                    onChange={(event) =>
                      updateSection(selectedSection.id, {
                        title: event.target.value,
                      })
                    }
                  />
                </InspectorField>
                <InspectorField label="Deskripsi">
                  <Textarea
                    value={selectedSection.description || ""}
                    onChange={(event) =>
                      updateSection(selectedSection.id, {
                        description: event.target.value,
                      })
                    }
                  />
                </InspectorField>
                <Button
                  variant="outline"
                  onClick={() => removeSection(selectedSection.id)}
                  type="button"
                >
                  <TrashIcon data-icon="inline-start" /> Hapus bagian
                  <small>
                    {builder.schema.sections.length === 1
                      ? "Pertanyaan tetap disimpan sebagai formulir kontinu"
                      : "Semua pertanyaan di dalamnya ikut dihapus"}
                  </small>
                </Button>
              </FieldGroup>
            ) : null}

            {selection.kind === "field" && selectedField ? (
              <FieldGroup className="p-4">
                <Badge variant="secondary">
                  {fieldTypeLabel(selectedField.type)}
                </Badge>
                <InspectorField label="Pertanyaan">
                  <Textarea
                    value={selectedField.label}
                    onChange={(event) =>
                      updateField(selection.sectionId, selectedField.id, {
                        label: event.target.value,
                      })
                    }
                  />
                </InspectorField>
                <InspectorField label="Petunjuk (opsional)">
                  <Textarea
                    value={selectedField.description || ""}
                    onChange={(event) =>
                      updateField(selection.sectionId, selectedField.id, {
                        description: event.target.value,
                      })
                    }
                  />
                </InspectorField>
                {selectedField.type === "text" ||
                selectedField.type === "textarea" ? (
                  <InspectorField label="Teks placeholder">
                    <Input
                      value={selectedField.placeholder || ""}
                      onChange={(event) =>
                        updateField(selection.sectionId, selectedField.id, {
                          placeholder: event.target.value,
                        })
                      }
                    />
                  </InspectorField>
                ) : null}
                {selectedField.type === "singleChoice" ||
                selectedField.type === "multiChoice" ? (
                  <div className="flex flex-col gap-2 [&>div]:flex [&>div]:items-center [&>div]:gap-2 [&>div>input]:min-w-0 [&>div>input]:flex-1">
                    <p className="text-sm font-medium">Daftar pilihan</p>
                    {selectedField.options.map((option, index) => (
                      <div key={`${selectedField.id}-${index}`}>
                        <span>{index + 1}</span>
                        <Input
                          aria-label={`Pilihan ${index + 1}`}
                          value={option.label}
                          onChange={(event) => {
                            const options = selectedField.options.map(
                              (item, optionIndex) =>
                                optionIndex === index
                                  ? {
                                      value: `pilihan_${optionIndex + 1}`,
                                      label: event.target.value,
                                    }
                                  : item,
                            );
                            updateField(selection.sectionId, selectedField.id, {
                              options,
                            });
                          }}
                        />
                        <Button
                          variant="outline"
                          aria-label={`Hapus pilihan ${index + 1}`}
                          disabled={selectedField.options.length <= 1}
                          onClick={() =>
                            removeChoiceOption(selectedField.id, index)
                          }
                          type="button"
                        >
                          <TrashIcon data-icon="inline-start" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      onClick={() =>
                        updateField(selection.sectionId, selectedField.id, {
                          options: [
                            ...selectedField.options,
                            {
                              value: `pilihan_${selectedField.options.length + 1}`,
                              label: `Pilihan ${selectedField.options.length + 1}`,
                            },
                          ],
                        })
                      }
                      type="button"
                    >
                      <PlusIcon data-icon="inline-start" /> Tambah pilihan
                    </Button>
                  </div>
                ) : null}
                <div className="flex flex-col gap-3">
                  <label className="flex items-center justify-between gap-3 [&>span]:flex [&>span]:flex-col [&_small]:text-xs [&_small]:text-muted-foreground">
                    <span>
                      <strong>Logika kondisi</strong>
                      <small>Tampilkan hanya setelah jawaban tertentu</small>
                    </span>
                    <Switch
                      checked={Boolean(selectedRule)}
                      disabled={
                        !selectedRule && conditionalSources.length === 0
                      }
                      onCheckedChange={(checked) => {
                        if (!checked) {
                          updateField(selection.sectionId, selectedField.id, {
                            visibleWhen: undefined,
                          });
                          return;
                        }
                        const source = conditionalSources.at(-1);
                        if (
                          !source ||
                          (source.type !== "singleChoice" &&
                            source.type !== "multiChoice")
                        )
                          return;
                        updateField(selection.sectionId, selectedField.id, {
                          visibleWhen: {
                            fieldId: source.id,
                            operator:
                              source.type === "multiChoice"
                                ? "includes"
                                : "equals",
                            value: source.options[0]?.value ?? "",
                          },
                        });
                      }}
                    />
                  </label>
                  {!selectedRule && conditionalSources.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Tambahkan pertanyaan pilihan sebelum pertanyaan ini untuk
                      membuat kondisi.
                    </p>
                  ) : null}
                  {selectedRule ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <GitBranchIcon size={16} />
                        <span>Tampilkan pertanyaan ini jika</span>
                      </div>
                      <InspectorField label="Pertanyaan sumber">
                        <NativeSelect
                          className="w-full"
                          value={selectedRule.fieldId}
                          onChange={(event) => {
                            const source = fieldMap.get(event.target.value);
                            if (
                              !source ||
                              (source.type !== "singleChoice" &&
                                source.type !== "multiChoice")
                            )
                              return;
                            updateField(selection.sectionId, selectedField.id, {
                              visibleWhen: {
                                fieldId: source.id,
                                operator:
                                  source.type === "multiChoice"
                                    ? "includes"
                                    : "equals",
                                value: source.options[0]?.value ?? "",
                              },
                            });
                          }}
                        >
                          {conditionalSources.map((field) => (
                            <NativeSelectOption key={field.id} value={field.id}>
                              {field.label}
                            </NativeSelectOption>
                          ))}
                        </NativeSelect>
                      </InspectorField>
                      {selectedRuleSource &&
                      (selectedRuleSource.type === "singleChoice" ||
                        selectedRuleSource.type === "multiChoice") ? (
                        <InspectorField label="Jawaban pemicu">
                          <NativeSelect
                            className="w-full"
                            value={selectedRule.value}
                            onChange={(event) =>
                              updateField(
                                selection.sectionId,
                                selectedField.id,
                                {
                                  visibleWhen: {
                                    ...selectedRule,
                                    value: event.target.value,
                                  },
                                },
                              )
                            }
                          >
                            {selectedRuleSource.options.map((option) => (
                              <NativeSelectOption
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </NativeSelectOption>
                            ))}
                          </NativeSelect>
                        </InspectorField>
                      ) : null}
                    </div>
                  ) : null}
                </div>
                <label className="flex items-center justify-between gap-3 [&>span]:flex [&>span]:flex-col [&_small]:text-xs [&_small]:text-muted-foreground">
                  <span>
                    <strong>Wajib diisi</strong>
                    <small>Pengguna harus menjawab pertanyaan ini</small>
                  </span>
                  <Switch
                    checked={selectedField.required || false}
                    onCheckedChange={(checked) =>
                      updateField(selection.sectionId, selectedField.id, {
                        required: checked,
                      })
                    }
                  />
                </label>
              </FieldGroup>
            ) : null}
          </aside>
        </div>
      ) : (
        <Preview builder={builder} />
      )}
    </div>
  );
}

function InspectorField({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <Field>
      <FieldLabel className="flex flex-col items-stretch gap-2">
        {label}
        {children}
      </FieldLabel>
    </Field>
  );
}

function FieldMock({ field }: { field: FormField }) {
  if (field.type === "text" || field.type === "textarea") {
    return field.type === "text" ? (
      <Input
        disabled
        aria-label={field.label}
        placeholder={field.placeholder}
      />
    ) : (
      <Textarea
        disabled
        aria-label={field.label}
        placeholder={field.placeholder}
      />
    );
  }
  if (field.type === "matrixSingle") return null;
  if (!("options" in field)) return null;
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {field.options.slice(0, 4).map((option) => (
        <Badge variant="outline" key={option.value}>
          {option.label}
        </Badge>
      ))}
    </div>
  );
}

function Preview({ builder }: { builder: BuilderState }) {
  const previewFieldMap = new Map(
    builder.schema.sections
      .flatMap((section) => section.fields)
      .map((field) => [field.id, field]),
  );
  return (
    <main className="mx-auto max-w-4xl p-4 md:p-8">
      <div className="mb-4 text-center text-xs text-muted-foreground">
        <span /> Pratinjau desktop · data tidak akan disimpan
      </div>
      <div className="overflow-hidden rounded-xl border bg-card [&>header]:flex [&>header]:flex-col [&>header]:gap-3 [&>header]:p-6 [&_h1]:text-2xl [&_h1]:font-semibold [&>header>p]:text-muted-foreground">
        <header>
          <span className="mb-2 text-xs font-medium text-muted-foreground">
            {builder.category}
          </span>
          <h1>{builder.schema.title}</h1>
          <p>{builder.schema.description}</p>
        </header>
        <div className="grid gap-3 border-y bg-muted p-6 sm:grid-cols-3 [&>span]:rounded-md [&>span]:border [&>span]:bg-background [&>span]:p-3 [&>span]:text-xs [&>span]:text-muted-foreground">
          <span>Nama pasien</span>
          <span>No. rekam medis</span>
          <span>Ruangan</span>
        </div>
        {builder.schema.sections.map((section, index) => (
          <section key={section.id}>
            {!isContinuousSchema(builder.schema) ? (
              <div className="flex gap-3 border-b p-6 [&_h2]:text-xl [&_h2]:font-semibold [&_p]:text-sm [&_p]:text-muted-foreground">
                <b>{(index + 1).toString().padStart(2, "0")}</b>
                <div>
                  <small>{section.eyebrow}</small>
                  <h2>{section.title}</h2>
                  <p>{section.description}</p>
                </div>
              </div>
            ) : null}
            <div className="divide-y px-6">
              {section.fields.map((field) => (
                <div
                  className={cn(
                    "flex gap-3 py-5 [&>div]:min-w-0 [&>div]:flex-1 [&_h3]:mb-2 [&_h3]:text-sm [&_h3]:font-medium [&_p]:mb-3 [&_p]:text-xs [&_p]:text-muted-foreground",
                    field.visibleWhen
                      ? "ml-4 border-l-2 border-l-primary sm:ml-8"
                      : "",
                  )}
                  key={field.id}
                >
                  <span>{field.number}</span>
                  <div>
                    {firstVisibilityRule(field) ? (
                      <ConditionBadge
                        field={field}
                        fieldMap={previewFieldMap}
                      />
                    ) : null}
                    <h3>
                      {field.label}
                      {field.required ? <sup>*</sup> : null}
                    </h3>
                    <p>{field.description}</p>
                    <FieldMock field={field} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

function isContinuousSchema(schema: FormSchema) {
  return schema.layout === "continuous";
}

function ConditionBadge({
  field,
  fieldMap,
}: {
  field: FormField;
  fieldMap: Map<string, FormField>;
}) {
  const rule = firstVisibilityRule(field);
  if (!rule) return null;
  const source = fieldMap.get(rule.fieldId);
  let valueLabel = rule.value;
  if (
    source &&
    (source.type === "singleChoice" || source.type === "multiChoice")
  ) {
    valueLabel =
      source.options.find((option) => option.value === rule.value)?.label ??
      rule.value;
  }
  return (
    <Badge variant="secondary">
      <GitBranchIcon data-icon="inline-start" /> Jika “
      {source?.label ?? "pertanyaan"}” = “{valueLabel}”
    </Badge>
  );
}
