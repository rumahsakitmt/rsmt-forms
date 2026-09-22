"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  IconAlignLeft,
  IconArrowDown,
  IconArrowLeft,
  IconArrowUp,
  IconCheck,
  IconCheckbox,
  IconCircleDot,
  IconCopy,
  IconDeviceFloppy,
  IconGripVertical,
  IconGitBranch,
  IconLayoutRows,
  IconPlus,
  IconRocket,
  IconSettings,
  IconTrash,
  IconTypography,
} from "@tabler/icons-react";

import { createFormAction } from "@/app/actions/forms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
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
  icon: typeof IconTypography;
}> = [
  { type: "text", title: "Jawaban singkat", description: "Nama, kode, atau satu baris", icon: IconTypography },
  { type: "textarea", title: "Paragraf", description: "Catatan atau uraian panjang", icon: IconAlignLeft },
  { type: "singleChoice", title: "Pilihan tunggal", description: "Pilih satu dari beberapa opsi", icon: IconCircleDot },
  { type: "multiChoice", title: "Kotak centang", description: "Pilih satu atau beberapa opsi", icon: IconCheckbox },
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
  return schema.sections.reduce((total, section) => total + section.fields.length, 0);
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
  return Array.isArray(field.visibleWhen) ? field.visibleWhen[0] ?? null : field.visibleWhen;
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
    return builder.schema.sections.find((section) => section.id === selection.sectionId) ?? null;
  }, [builder.schema.sections, selection]);

  const selectedField = useMemo(() => {
    if (selection.kind !== "field") return null;
    return selectedSection?.fields.find((field) => field.id === selection.fieldId) ?? null;
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
    const selectedIndex = allFields.findIndex((field) => field.id === selectedField.id);
    return allFields.slice(0, selectedIndex).filter(
      (field) => field.type === "singleChoice" || field.type === "multiChoice",
    );
  }, [allFields, selectedField]);
  const selectedRule = selectedField ? firstVisibilityRule(selectedField) : null;
  const selectedRuleSource = selectedRule ? fieldMap.get(selectedRule.fieldId) : null;

  function updateSchema(patch: Partial<FormSchema>) {
    setBuilder((current) => ({ ...current, schema: { ...current.schema, ...patch } }));
  }

  function updateSection(sectionId: string, patch: Partial<FormSchema["sections"][number]>) {
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

  function updateField(sectionId: string, fieldId: string, patch: Partial<FormField>) {
    setBuilder((current) => ({
      ...current,
      schema: {
        ...current.schema,
        sections: current.schema.sections.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                fields: section.fields.map((field) =>
                  field.id === fieldId ? ({ ...field, ...patch } as FormField) : field,
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
        : builder.schema.sections.find((section) => section.id === selection.sectionId);
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
    updateSchema({ layout: "sectioned", sections: [...builder.schema.sections, section] });
    setSelection({ kind: "section", sectionId: section.id });
  }

  function setLayout(layout: "sectioned" | "continuous") {
    if (layout === "continuous") {
      const [first, ...rest] = builder.schema.sections;
      const mergedFields = [first, ...rest].flatMap((section) => section.fields);
      updateSchema({
        layout,
        sections: [{
          ...first,
          id: first?.id ?? uniqueId("section"),
          eyebrow: undefined,
          title: "Pertanyaan",
          description: undefined,
          fields: mergedFields.length ? mergedFields : [createField("text", 1)],
        }],
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
      setNotice("Judul bagian dihapus. Formulir kini menggunakan alur kontinu.");
      return;
    }
    const deleted = builder.schema.sections.find((section) => section.id === sectionId);
    const deletedFieldIds = new Set(deleted?.fields.map((field) => field.id) ?? []);
    const sections = builder.schema.sections
      .filter((section) => section.id !== sectionId)
      .map((section) => ({
        ...section,
        fields: section.fields.map((field) => {
          const rules = field.visibleWhen
            ? (Array.isArray(field.visibleWhen) ? field.visibleWhen : [field.visibleWhen])
            : [];
          const remaining = rules.filter((rule) => !deletedFieldIds.has(rule.fieldId));
          if (remaining.length === rules.length) return field;
          return { ...field, visibleWhen: remaining.length ? remaining : undefined } as FormField;
        }),
      }));
    updateSchema({ sections });
    setSelection({ kind: "form" });
    setNotice("Bagian dan pertanyaannya dihapus.");
  }

  function removeField(sectionId: string, fieldId: string) {
    const section = builder.schema.sections.find((item) => item.id === sectionId);
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
                ? (Array.isArray(field.visibleWhen) ? field.visibleWhen : [field.visibleWhen])
                : [];
              const remaining = rules.filter((rule) => rule.fieldId !== fieldId);
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
    const section = builder.schema.sections.find((item) => item.id === sectionId);
    const source = section?.fields.find((field) => field.id === fieldId);
    if (!section || !source) return;
    const copy = { ...source, id: uniqueId("field"), label: `${source.label} (salinan)` };
    const index = section.fields.findIndex((field) => field.id === fieldId);
    const fields = [...section.fields];
    fields.splice(index + 1, 0, copy);
    updateSection(sectionId, { fields });
    setSelection({ kind: "field", sectionId, fieldId: copy.id });
  }

  function moveField(sectionId: string, fieldId: string, direction: -1 | 1) {
    const section = builder.schema.sections.find((item) => item.id === sectionId);
    if (!section) return;
    const from = section.fields.findIndex((field) => field.id === fieldId);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= section.fields.length) return;
    const fields = [...section.fields];
    [fields[from], fields[to]] = [fields[to], fields[from]];
    const orderedFields = builder.schema.sections.flatMap((item) =>
      item.id === sectionId ? fields : item.fields,
    );
    const order = new Map(orderedFields.map((field, index) => [field.id, index]));
    const createsBackwardCondition = orderedFields.some((field, index) => {
      const rules = field.visibleWhen
        ? (Array.isArray(field.visibleWhen) ? field.visibleWhen : [field.visibleWhen])
        : [];
      return rules.some((rule) => (order.get(rule.fieldId) ?? -1) >= index);
    });
    if (createsBackwardCondition) {
      setNotice("Pertanyaan pemicu harus tetap berada sebelum pertanyaan kondisional.");
      return;
    }
    updateSection(sectionId, { fields });
  }

  function removeChoiceOption(fieldId: string, optionIndex: number) {
    const source = fieldMap.get(fieldId);
    if (!source || (source.type !== "singleChoice" && source.type !== "multiChoice")) return;
    const removedValue = source.options[optionIndex]?.value;
    if (!removedValue || source.options.length <= 1) return;

    setBuilder((current) => ({
      ...current,
      schema: {
        ...current.schema,
        sections: current.schema.sections.map((section) => ({
          ...section,
          fields: section.fields.map((field) => {
            if (field.id === fieldId && (field.type === "singleChoice" || field.type === "multiChoice")) {
              return { ...field, options: field.options.filter((_, index) => index !== optionIndex) };
            }
            const rules = field.visibleWhen
              ? (Array.isArray(field.visibleWhen) ? field.visibleWhen : [field.visibleWhen])
              : [];
            const remaining = rules.filter((rule) => !(rule.fieldId === fieldId && rule.value === removedValue));
            if (remaining.length === rules.length) return field;
            return { ...field, visibleWhen: remaining.length ? remaining : undefined } as FormField;
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
    <div className="builder-page">
      <header className="builder-topbar">
        <div className="builder-title-group">
          <button aria-label="Kembali ke formulir" className="builder-back" onClick={() => router.push("/")} type="button">
            <IconArrowLeft size={18} />
          </button>
          <div>
            <span className="builder-kicker">Studio formulir</span>
            <input
              aria-label="Judul formulir singkat"
              onChange={(event) => updateSchema({ shortTitle: event.target.value })}
              value={builder.schema.shortTitle}
            />
          </div>
          <span className="autosave-status"><i /> Draft lokal</span>
        </div>
        <div className="builder-top-actions">
          <div className="view-switcher" aria-label="Mode tampilan">
            <button className={mode === "build" ? "is-active" : ""} onClick={() => setMode("build")} type="button">Susun</button>
            <button className={mode === "preview" ? "is-active" : ""} onClick={() => setMode("preview")} type="button">Pratinjau</button>
          </div>
          <Button className="h-9 px-3" onClick={saveDraft} type="button" variant="outline">
            <IconDeviceFloppy /> Simpan draft
          </Button>
          <Button className="h-9 px-4" disabled={isPending} onClick={publish} type="button">
            {isPending ? "Menerbitkan…" : <><IconRocket /> Terbitkan</>}
          </Button>
        </div>
      </header>

      {notice ? <div className="builder-notice" role="status"><IconCheck size={15} /> {notice}</div> : null}

      {mode === "build" ? (
        <div className="builder-layout">
          <aside className="builder-palette">
            <div className="builder-panel-heading">
              <span>Blok pertanyaan</span>
              <small>Klik untuk menambahkan</small>
            </div>
            <div className="palette-list">
              {palette.map((item) => {
                const Icon = item.icon;
                return (
                  <button aria-label={`Tambah ${item.title}`} key={item.type} onClick={() => addField(item.type)} type="button">
                    <span><Icon size={18} /></span>
                    <strong>{item.title}</strong>
                    <small>{item.description}</small>
                    <IconPlus className="palette-plus" size={15} />
                  </button>
                );
              })}
            </div>
            <button className="add-section-button" onClick={addSection} type="button">
              <IconLayoutRows size={17} /> Tambah bagian
            </button>
            <div className="builder-tip">
              <IconGripVertical size={18} />
              <p><strong>Susun dengan cepat.</strong> Pilih blok di kanvas, lalu atur detailnya di panel kanan.</p>
            </div>
          </aside>

          <main className="builder-canvas">
            <button className={`form-cover${selection.kind === "form" ? " is-selected" : ""}`} onClick={() => setSelection({ kind: "form" })} type="button">
              <span className="eyebrow">{builder.category}</span>
              <h1>{builder.schema.title || "Formulir tanpa judul"}</h1>
              <p>{builder.schema.description || "Tambahkan deskripsi formulir."}</p>
              <span className="cover-meta">{builder.schema.sections.length} bagian · {countFields(builder.schema)} pertanyaan</span>
            </button>

            {builder.schema.sections.map((section, sectionIndex) => (
              <section className={`builder-section-card${isContinuous ? " is-continuous" : ""}${selection.kind === "section" && selection.sectionId === section.id ? " is-selected" : ""}`} key={section.id}>
                {!isContinuous ? <button className="builder-section-heading" onClick={() => setSelection({ kind: "section", sectionId: section.id })} type="button">
                  <span>{(sectionIndex + 1).toString().padStart(2, "0")}</span>
                  <div>
                    <small>{section.eyebrow}</small>
                    <h2>{section.title}</h2>
                    <p>{section.description}</p>
                  </div>
                  <b>{section.fields.length} item</b>
                </button> : <div className="continuous-flow-label"><span>Alur kontinu</span><small>{section.fields.length} pertanyaan tanpa pembatas bagian</small></div>}
                <div className="builder-field-list">
                  {section.fields.map((field, fieldIndex) => {
                    const active = selection.kind === "field" && selection.fieldId === field.id;
                    return (
                      <article className={`builder-field-card${field.visibleWhen ? " is-conditional" : ""}${active ? " is-selected" : ""}`} key={field.id}>
                        <button className="field-select" onClick={() => setSelection({ kind: "field", sectionId: section.id, fieldId: field.id })} type="button">
                          <IconGripVertical className="field-grip" size={17} />
                          <span className="field-number">{field.number || (fieldIndex + 1).toString().padStart(2, "0")}</span>
                          <div className="field-card-copy">
                            <span className="field-type">{fieldTypeLabel(field.type)}</span>
                            {firstVisibilityRule(field) ? <ConditionBadge field={field} fieldMap={fieldMap} /> : null}
                            <h3>{field.label}</h3>
                            {field.description ? <p>{field.description}</p> : null}
                            <FieldMock field={field} />
                          </div>
                          {field.required ? <span className="required-pill">Wajib</span> : null}
                        </button>
                        {active ? (
                          <div className="field-quick-actions">
                            <button aria-label="Naikkan pertanyaan" disabled={fieldIndex === 0} onClick={() => moveField(section.id, field.id, -1)} type="button"><IconArrowUp size={15} /></button>
                            <button aria-label="Turunkan pertanyaan" disabled={fieldIndex === section.fields.length - 1} onClick={() => moveField(section.id, field.id, 1)} type="button"><IconArrowDown size={15} /></button>
                            <button aria-label="Duplikat pertanyaan" onClick={() => duplicateField(section.id, field.id)} type="button"><IconCopy size={15} /></button>
                            <button aria-label="Hapus pertanyaan" onClick={() => removeField(section.id, field.id)} type="button"><IconTrash size={15} /></button>
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
            {!isContinuous ? <button className="canvas-add-section" onClick={addSection} type="button"><IconPlus size={17} /> Tambah bagian berikutnya</button> : null}
          </main>

          <aside className="builder-inspector">
            <div className="builder-panel-heading inspector-heading">
              <span><IconSettings size={16} /> Pengaturan</span>
              <small>{selection.kind === "form" ? "Formulir" : selection.kind === "section" ? "Bagian" : "Pertanyaan"}</small>
            </div>
            {selection.kind === "form" ? (
              <div className="inspector-form">
                <div className="layout-picker">
                  <span>Struktur formulir</span>
                  <div>
                    <button className={!isContinuous ? "is-active" : ""} onClick={() => setLayout("sectioned")} type="button"><IconLayoutRows size={16} /> Berbagian</button>
                    <button className={isContinuous ? "is-active" : ""} onClick={() => setLayout("continuous")} type="button"><IconAlignLeft size={16} /> Kontinu</button>
                  </div>
                  <small>{isContinuous ? "Semua pertanyaan tampil dalam satu alur panjang." : "Pertanyaan dikelompokkan dengan judul bagian."}</small>
                </div>
                <InspectorField label="Judul lengkap">
                  <Textarea value={builder.schema.title} onChange={(event) => updateSchema({ title: event.target.value })} />
                </InspectorField>
                <InspectorField label="Nama singkat">
                  <Input value={builder.schema.shortTitle} onChange={(event) => updateSchema({ shortTitle: event.target.value })} />
                </InspectorField>
                <InspectorField label="Kategori">
                  <Input value={builder.category} onChange={(event) => setBuilder((current) => ({ ...current, category: event.target.value }))} />
                </InspectorField>
                <InspectorField label="Deskripsi">
                  <Textarea value={builder.schema.description} onChange={(event) => updateSchema({ description: event.target.value })} />
                </InspectorField>
              </div>
            ) : null}

            {selection.kind === "section" && selectedSection ? (
              <div className="inspector-form">
                <InspectorField label="Penanda bagian">
                  <Input value={selectedSection.eyebrow || ""} onChange={(event) => updateSection(selectedSection.id, { eyebrow: event.target.value })} />
                </InspectorField>
                <InspectorField label="Judul bagian">
                  <Input value={selectedSection.title} onChange={(event) => updateSection(selectedSection.id, { title: event.target.value })} />
                </InspectorField>
                <InspectorField label="Deskripsi">
                  <Textarea value={selectedSection.description || ""} onChange={(event) => updateSection(selectedSection.id, { description: event.target.value })} />
                </InspectorField>
                <button className="delete-section-button" onClick={() => removeSection(selectedSection.id)} type="button">
                  <IconTrash size={15} /> Hapus bagian
                  <small>{builder.schema.sections.length === 1 ? "Pertanyaan tetap disimpan sebagai formulir kontinu" : "Semua pertanyaan di dalamnya ikut dihapus"}</small>
                </button>
              </div>
            ) : null}

            {selection.kind === "field" && selectedField ? (
              <div className="inspector-form">
                <div className="inspector-type-badge">{fieldTypeLabel(selectedField.type)}</div>
                <InspectorField label="Pertanyaan">
                  <Textarea value={selectedField.label} onChange={(event) => updateField(selection.sectionId, selectedField.id, { label: event.target.value })} />
                </InspectorField>
                <InspectorField label="Petunjuk (opsional)">
                  <Textarea value={selectedField.description || ""} onChange={(event) => updateField(selection.sectionId, selectedField.id, { description: event.target.value })} />
                </InspectorField>
                {(selectedField.type === "text" || selectedField.type === "textarea") ? (
                  <InspectorField label="Teks placeholder">
                    <Input value={selectedField.placeholder || ""} onChange={(event) => updateField(selection.sectionId, selectedField.id, { placeholder: event.target.value })} />
                  </InspectorField>
                ) : null}
                {(selectedField.type === "singleChoice" || selectedField.type === "multiChoice") ? (
                  <div className="option-editor">
                    <label>Daftar pilihan</label>
                    {selectedField.options.map((option, index) => (
                      <div key={`${selectedField.id}-${index}`}>
                        <span>{index + 1}</span>
                        <Input
                          value={option.label}
                          onChange={(event) => {
                            const options = selectedField.options.map((item, optionIndex) =>
                              optionIndex === index
                                ? { value: `pilihan_${optionIndex + 1}`, label: event.target.value }
                                : item,
                            );
                            updateField(selection.sectionId, selectedField.id, { options });
                          }}
                        />
                        <button
                          aria-label={`Hapus pilihan ${index + 1}`}
                          disabled={selectedField.options.length <= 1}
                          onClick={() => removeChoiceOption(selectedField.id, index)}
                          type="button"
                        ><IconTrash size={14} /></button>
                      </div>
                    ))}
                    <button onClick={() => updateField(selection.sectionId, selectedField.id, { options: [...selectedField.options, { value: `pilihan_${selectedField.options.length + 1}`, label: `Pilihan ${selectedField.options.length + 1}` }] })} type="button">
                      <IconPlus size={14} /> Tambah pilihan
                    </button>
                  </div>
                ) : null}
                <div className="condition-editor">
                  <label className="required-toggle condition-toggle">
                    <span><strong>Logika kondisi</strong><small>Tampilkan hanya setelah jawaban tertentu</small></span>
                    <Switch
                      checked={Boolean(selectedRule)}
                      disabled={!selectedRule && conditionalSources.length === 0}
                      onCheckedChange={(checked) => {
                        if (!checked) {
                          updateField(selection.sectionId, selectedField.id, { visibleWhen: undefined });
                          return;
                        }
                        const source = conditionalSources.at(-1);
                        if (!source || (source.type !== "singleChoice" && source.type !== "multiChoice")) return;
                        updateField(selection.sectionId, selectedField.id, {
                          visibleWhen: {
                            fieldId: source.id,
                            operator: source.type === "multiChoice" ? "includes" : "equals",
                            value: source.options[0]?.value ?? "",
                          },
                        });
                      }}
                    />
                  </label>
                  {!selectedRule && conditionalSources.length === 0 ? <p className="condition-hint">Tambahkan pertanyaan pilihan sebelum pertanyaan ini untuk membuat kondisi.</p> : null}
                  {selectedRule ? (
                    <div className="condition-rule">
                      <div className="condition-rule-line"><IconGitBranch size={16} /><span>Tampilkan pertanyaan ini jika</span></div>
                      <InspectorField label="Pertanyaan sumber">
                        <NativeSelect
                          className="w-full"
                          value={selectedRule.fieldId}
                          onChange={(event) => {
                            const source = fieldMap.get(event.target.value);
                            if (!source || (source.type !== "singleChoice" && source.type !== "multiChoice")) return;
                            updateField(selection.sectionId, selectedField.id, {
                              visibleWhen: {
                                fieldId: source.id,
                                operator: source.type === "multiChoice" ? "includes" : "equals",
                                value: source.options[0]?.value ?? "",
                              },
                            });
                          }}
                        >
                          {conditionalSources.map((field) => <NativeSelectOption key={field.id} value={field.id}>{field.label}</NativeSelectOption>)}
                        </NativeSelect>
                      </InspectorField>
                      {selectedRuleSource && (selectedRuleSource.type === "singleChoice" || selectedRuleSource.type === "multiChoice") ? (
                        <InspectorField label="Jawaban pemicu">
                          <NativeSelect
                            className="w-full"
                            value={selectedRule.value}
                            onChange={(event) => updateField(selection.sectionId, selectedField.id, {
                              visibleWhen: { ...selectedRule, value: event.target.value },
                            })}
                          >
                            {selectedRuleSource.options.map((option) => <NativeSelectOption key={option.value} value={option.value}>{option.label}</NativeSelectOption>)}
                          </NativeSelect>
                        </InspectorField>
                      ) : null}
                    </div>
                  ) : null}
                </div>
                <label className="required-toggle">
                  <span><strong>Wajib diisi</strong><small>Pengguna harus menjawab pertanyaan ini</small></span>
                  <Switch checked={selectedField.required || false} onCheckedChange={(checked) => updateField(selection.sectionId, selectedField.id, { required: checked })} />
                </label>
              </div>
            ) : null}
          </aside>
        </div>
      ) : (
        <Preview builder={builder} />
      )}
    </div>
  );
}

function InspectorField({ children, label }: { children: React.ReactNode; label: string }) {
  return <label className="inspector-field"><span>{label}</span>{children}</label>;
}

function FieldMock({ field }: { field: FormField }) {
  if (field.type === "text" || field.type === "textarea") {
    return <div className={field.type === "text" ? "field-mock-line" : "field-mock-area"}>{field.placeholder}</div>;
  }
  if (field.type === "matrixSingle") return null;
  if (!("options" in field)) return null;
  return (
    <div className="field-mock-options">
      {field.options.slice(0, 4).map((option) => (
        <span key={option.value}><i className={field.type === "singleChoice" ? "round" : ""} /> {option.label}</span>
      ))}
    </div>
  );
}

function Preview({ builder }: { builder: BuilderState }) {
  const previewFieldMap = new Map(
    builder.schema.sections.flatMap((section) => section.fields).map((field) => [field.id, field]),
  );
  return (
    <main className="builder-preview-wrap">
      <div className="preview-device-label"><span /> Pratinjau desktop · data tidak akan disimpan</div>
      <div className="builder-preview">
        <header>
          <span className="eyebrow">{builder.category}</span>
          <h1>{builder.schema.title}</h1>
          <p>{builder.schema.description}</p>
        </header>
        <div className="preview-patient-row"><span>Nama pasien</span><span>No. rekam medis</span><span>Ruangan</span></div>
        {builder.schema.sections.map((section, index) => (
          <section key={section.id}>
            {!isContinuousSchema(builder.schema) ? <div className="preview-section-title"><b>{(index + 1).toString().padStart(2, "0")}</b><div><small>{section.eyebrow}</small><h2>{section.title}</h2><p>{section.description}</p></div></div> : null}
            <div className="preview-question-list">
              {section.fields.map((field) => (
                <div className={`preview-question${field.visibleWhen ? " is-conditional" : ""}`} key={field.id}>
                  <span>{field.number}</span>
                  <div>{firstVisibilityRule(field) ? <ConditionBadge field={field} fieldMap={previewFieldMap} /> : null}<h3>{field.label}{field.required ? <sup>*</sup> : null}</h3><p>{field.description}</p><FieldMock field={field} /></div>
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

function ConditionBadge({ field, fieldMap }: { field: FormField; fieldMap: Map<string, FormField> }) {
  const rule = firstVisibilityRule(field);
  if (!rule) return null;
  const source = fieldMap.get(rule.fieldId);
  let valueLabel = rule.value;
  if (source && (source.type === "singleChoice" || source.type === "multiChoice")) {
    valueLabel = source.options.find((option) => option.value === rule.value)?.label ?? rule.value;
  }
  return <span className="condition-badge"><IconGitBranch size={12} /> Jika “{source?.label ?? "pertanyaan"}” = “{valueLabel}”</span>;
}
