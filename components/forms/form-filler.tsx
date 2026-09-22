"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  IconArrowLeft,
  IconCheck,
  IconChevronRight,
  IconDeviceFloppy,
  IconLoader2,
  IconSend,
} from "@tabler/icons-react";

import { saveSubmissionAction } from "@/app/actions/submissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import type { FormAnswers, FormSchema, PatientContext, SubmissionMode } from "@/lib/forms/types";
import { isFieldVisible } from "@/lib/forms/validation";
import { FieldRenderer } from "./field-renderer";

type DraftData = {
  id: string;
  patient: PatientContext;
  answers: FormAnswers;
};

type FormFillerProps = {
  formSlug: string;
  version: number;
  schema: FormSchema;
  draft?: DraftData;
};

function hasAnswer(value: FormAnswers[string]) {
  if (value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return Object.keys(value).length > 0;
}

export function FormFiller({ formSlug, version, schema, draft }: FormFillerProps) {
  const router = useRouter();
  const [patient, setPatient] = useState<PatientContext>(
    draft?.patient ?? { patientName: "", medicalRecordNumber: "", room: "" },
  );
  const [answers, setAnswers] = useState<FormAnswers>(draft?.answers ?? {});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [pendingIntent, setPendingIntent] = useState<SubmissionMode | null>(null);
  const [pending, startTransition] = useTransition();
  const isContinuous = schema.layout === "continuous";

  const progress = useMemo(() => {
    const requiredFields = schema.sections.flatMap((section) =>
      section.fields.filter((field) => field.required && isFieldVisible(field, answers)),
    );
    const completed = requiredFields.filter((field) => hasAnswer(answers[field.id])).length;
    const patientCompleted = Object.values(patient).filter((value) => value.trim()).length;
    return Math.round(((completed + patientCompleted) / (requiredFields.length + 3)) * 100);
  }, [answers, patient, schema.sections]);

  function updatePatient(key: keyof PatientContext, value: string) {
    setPatient((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function updateAnswer(fieldId: string, value: FormAnswers[string]) {
    setAnswers((current) => ({ ...current, [fieldId]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[fieldId];
      return next;
    });
  }

  function save(mode: SubmissionMode) {
    setPendingIntent(mode);
    setMessage("");
    startTransition(async () => {
      const result = await saveSubmissionAction({
        submissionId: draft?.id,
        formSlug,
        patient,
        answers,
        mode,
      });
      setMessage(result.message);
      setErrors(result.errors ?? {});
      setPendingIntent(null);

      if (result.success && result.submissionId) {
        router.push(
          result.status === "SUBMITTED"
            ? `/submissions/${result.submissionId}`
            : `/submissions/${result.submissionId}/edit`,
        );
        router.refresh();
        return;
      }

      if (result.errors) {
        requestAnimationFrame(() => {
          document.querySelector<HTMLElement>(".has-error")?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        });
      }
    });
  }

  return (
    <div className="form-workspace">
      <aside className="form-rail">
        <Button className="back-link h-8 px-0" variant="ghost" type="button" onClick={() => router.back()}>
          <IconArrowLeft size={17} /> Kembali
        </Button>
        <div className="form-rail-title">
          <Badge variant="secondary">Versi {version}</Badge>
          <h2>{schema.shortTitle}</h2>
        </div>
        <div className="progress-block">
          <Progress value={progress}>
            <ProgressLabel>Kelengkapan</ProgressLabel>
            <ProgressValue>{() => `${progress}%`}</ProgressValue>
          </Progress>
        </div>
        {!isContinuous ? <nav aria-label="Bagian formulir" className="section-nav">
          {schema.sections.map((section, index) => (
            <a href={`#${section.id}`} key={section.id}>
              <span>{(index + 1).toString().padStart(2, "0")}</span>
              {section.title}
            </a>
          ))}
        </nav> : null}
        <p className="rail-note"><IconCheck size={16} /> Tanda * wajib dilengkapi sebelum dikirim.</p>
      </aside>

      <div className="form-document">
        <header className="form-hero">
          <p className="eyebrow">Formulir klinis / Versi {version}</p>
          <h1>{schema.title}</h1>
          <p>{schema.description}</p>
        </header>

        <section className="patient-panel" aria-labelledby="patient-title">
          <div className="panel-heading">
            <span>00</span>
            <div><p className="eyebrow">Identitas</p><h2 id="patient-title">Konteks pasien</h2></div>
          </div>
          <div className="patient-fields">
            <Field className={errors.patientName ? "has-error" : ""} data-invalid={Boolean(errors.patientName)}><FieldLabel htmlFor="patientName">Nama pasien *</FieldLabel><Input aria-invalid={Boolean(errors.patientName)} className="h-11 bg-card" id="patientName" value={patient.patientName} onChange={(event) => updatePatient("patientName", event.target.value)} /><FieldError>{errors.patientName}</FieldError></Field>
            <Field className={errors.medicalRecordNumber ? "has-error" : ""} data-invalid={Boolean(errors.medicalRecordNumber)}><FieldLabel htmlFor="medicalRecordNumber">No. CM *</FieldLabel><Input aria-invalid={Boolean(errors.medicalRecordNumber)} className="h-11 bg-card" id="medicalRecordNumber" placeholder="Contoh: 00-12-34" value={patient.medicalRecordNumber} onChange={(event) => updatePatient("medicalRecordNumber", event.target.value)} /><FieldError>{errors.medicalRecordNumber}</FieldError></Field>
            <Field className={errors.room ? "has-error" : ""} data-invalid={Boolean(errors.room)}><FieldLabel htmlFor="room">Ruangan *</FieldLabel><Input aria-invalid={Boolean(errors.room)} className="h-11 bg-card" id="room" placeholder="Nama / nomor ruangan" value={patient.room} onChange={(event) => updatePatient("room", event.target.value)} /><FieldError>{errors.room}</FieldError></Field>
          </div>
        </section>

        {schema.sections.map((section, sectionIndex) => (
          <section className={`form-section${isContinuous ? " continuous-form-section" : ""}`} id={section.id} key={section.id}>
            {!isContinuous ? <div className="panel-heading">
              <span>{(sectionIndex + 1).toString().padStart(2, "0")}</span>
              <div>
                <p className="eyebrow">{section.eyebrow}</p>
                <h2>{section.title}</h2>
                {section.description ? <p>{section.description}</p> : null}
              </div>
            </div> : null}
            <div className="question-list">
              {section.fields.map((field) =>
                isFieldVisible(field, answers) ? (
                  <FieldRenderer
                    answers={answers}
                    error={errors[field.id]}
                    field={field}
                    key={field.id}
                    value={answers[field.id]}
                    onChange={(value) => updateAnswer(field.id, value)}
                  />
                ) : null,
              )}
            </div>
          </section>
        ))}

        <footer className="form-actions">
          <div>
            <p className={Object.keys(errors).length ? "form-error" : "save-message"} aria-live="polite">
              {message || "Simpan sebagai draft jika formulir belum lengkap."}
            </p>
          </div>
          <div className="button-row">
            <Button className="h-10 px-4" variant="outline" disabled={pending} type="button" onClick={() => save("draft")}>
              {pending && pendingIntent === "draft" ? <IconLoader2 className="spin" size={18} /> : <IconDeviceFloppy size={18} />}
              Simpan draft
            </Button>
            <Button className="h-10 px-4" disabled={pending} type="button" onClick={() => save("submit")}>
              {pending && pendingIntent === "submit" ? <IconLoader2 className="spin" size={18} /> : <IconSend size={18} />}
              Kirim formulir <IconChevronRight size={17} />
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
