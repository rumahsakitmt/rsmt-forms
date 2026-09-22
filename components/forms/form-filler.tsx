"use client";
import { cn } from "@/lib/utils";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  CheckIcon,
  CaretRightIcon,
  FloppyDiskIcon,
  SpinnerGapIcon,
  PaperPlaneTiltIcon,
} from "@phosphor-icons/react";

import { saveSubmissionAction } from "@/app/actions/submissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FieldGroup,
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";
import type {
  FormAnswers,
  FormSchema,
  PatientContext,
  SubmissionMode,
} from "@/lib/forms/types";
import { isFieldVisible } from "@/lib/forms/validation";
import { FieldRenderer } from "./field-renderer";

type DraftData = {
  id: string;
  patient: PatientContext;
  answers: FormAnswers;
};

type FormFillerProps = {
  admin?: boolean;
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

export function FormFiller({
  admin = false,
  formSlug,
  version,
  schema,
  draft,
}: FormFillerProps) {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState(draft?.id);
  const [patient, setPatient] = useState<PatientContext>(
    draft?.patient ?? { patientName: "", medicalRecordNumber: "", room: "" },
  );
  const [answers, setAnswers] = useState<FormAnswers>(draft?.answers ?? {});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [pendingIntent, setPendingIntent] = useState<SubmissionMode | null>(
    null,
  );
  const [pending, startTransition] = useTransition();
  const isContinuous = schema.layout === "continuous";

  const progress = useMemo(() => {
    const requiredFields = schema.sections.flatMap((section) =>
      section.fields.filter(
        (field) => field.required && isFieldVisible(field, answers),
      ),
    );
    const completed = requiredFields.filter((field) =>
      hasAnswer(answers[field.id]),
    ).length;
    const patientCompleted = Object.values(patient).filter((value) =>
      value.trim(),
    ).length;
    return Math.round(
      ((completed + patientCompleted) / (requiredFields.length + 3)) * 100,
    );
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
        submissionId,
        formSlug,
        patient,
        answers,
        mode,
      });
      setMessage(result.message);
      setErrors(result.errors ?? {});
      setPendingIntent(null);

      if (result.success && result.submissionId) {
        setSubmissionId(result.submissionId);
        if (admin) {
          router.push(
            result.status === "SUBMITTED"
              ? `/admin/submissions/${result.submissionId}`
              : `/admin/submissions/${result.submissionId}/edit`,
          );
          router.refresh();
        } else if (result.status === "SUBMITTED") {
          setSubmitted(true);
        } else {
          router.replace(`/forms/${formSlug}/new?draft=${result.submissionId}`);
        }
        return;
      }

      if (result.errors) {
        requestAnimationFrame(() => {
          document
            .querySelector<HTMLElement>('[data-invalid="true"]')
            ?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
        });
      }
    });
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl p-4 md:py-16">
        <Card>
          <CardHeader>
            <CardTitle>Formulir berhasil dikirim</CardTitle>
            <CardDescription>
              Jawaban telah disimpan. Terima kasih telah melengkapi formulir.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button nativeButton={false} role="link" render={<Link href="/" />}>
              Kembali ke formulir
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-7xl items-start gap-6 p-4 md:p-8 xl:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="flex flex-col gap-4 xl:sticky xl:top-6">
        <Button
          className="h-8 px-0"
          variant="ghost"
          type="button"
          onClick={() => router.push(admin ? "/admin/submissions" : "/")}
        >
          <ArrowLeftIcon data-icon="inline-start" /> Kembali
        </Button>
        <div className="flex flex-col gap-3 [&_h2]:text-lg [&_h2]:font-semibold">
          <Badge variant="secondary">Versi {version}</Badge>
          <h2>{schema.shortTitle}</h2>
        </div>
        <div className="py-3">
          <Progress value={progress}>
            <ProgressLabel>Kelengkapan</ProgressLabel>
            <ProgressValue>{() => `${progress}%`}</ProgressValue>
          </Progress>
        </div>
        {!isContinuous ? (
          <nav
            aria-label="Bagian formulir"
            className="hidden flex-col gap-1 xl:flex [&_a]:flex [&_a]:gap-3 [&_a]:rounded-md [&_a]:p-2 [&_a]:text-sm [&_a]:text-muted-foreground [&_a:hover]:bg-accent"
          >
            {schema.sections.map((section, index) => (
              <a href={`#${section.id}`} key={section.id}>
                <span>{(index + 1).toString().padStart(2, "0")}</span>
                {section.title}
              </a>
            ))}
          </nav>
        ) : null}
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <CheckIcon size={16} /> Tanda * wajib dilengkapi sebelum dikirim.
        </p>
      </aside>

      <div className="min-w-0 flex flex-col gap-6">
        <header className="flex flex-col gap-2 [&_h1]:text-3xl [&_h1]:font-semibold [&>p]:text-sm [&>p]:text-muted-foreground">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Formulir klinis / Versi {version}
          </p>
          <h1>{schema.title}</h1>
          <p>{schema.description}</p>
        </header>

        <section
          className="rounded-xl border bg-card p-5"
          aria-labelledby="patient-title"
        >
          <div className="mb-5 flex items-start gap-3 [&_h2]:text-lg [&_h2]:font-semibold [&_p]:text-sm [&_p]:text-muted-foreground [&>span]:text-muted-foreground">
            <span>00</span>
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Identitas
              </p>
              <h2 id="patient-title">Konteks pasien</h2>
            </div>
          </div>
          <FieldGroup className="grid gap-4 md:grid-cols-3">
            <Field data-invalid={Boolean(errors.patientName)}>
              <FieldLabel htmlFor="patientName">Nama pasien *</FieldLabel>
              <Input
                aria-invalid={Boolean(errors.patientName)}
                id="patientName"
                value={patient.patientName}
                onChange={(event) =>
                  updatePatient("patientName", event.target.value)
                }
              />
              <FieldError>{errors.patientName}</FieldError>
            </Field>
            <Field data-invalid={Boolean(errors.medicalRecordNumber)}>
              <FieldLabel htmlFor="medicalRecordNumber">No. CM *</FieldLabel>
              <Input
                aria-invalid={Boolean(errors.medicalRecordNumber)}
                id="medicalRecordNumber"
                placeholder="Contoh: 00-12-34"
                value={patient.medicalRecordNumber}
                onChange={(event) =>
                  updatePatient("medicalRecordNumber", event.target.value)
                }
              />
              <FieldError>{errors.medicalRecordNumber}</FieldError>
            </Field>
            <Field data-invalid={Boolean(errors.room)}>
              <FieldLabel htmlFor="room">Ruangan *</FieldLabel>
              <Input
                aria-invalid={Boolean(errors.room)}
                id="room"
                placeholder="Nama / nomor ruangan"
                value={patient.room}
                onChange={(event) => updatePatient("room", event.target.value)}
              />
              <FieldError>{errors.room}</FieldError>
            </Field>
          </FieldGroup>
        </section>

        {schema.sections.map((section, sectionIndex) => (
          <section
            className="scroll-mt-6 rounded-xl border bg-card p-5"
            id={section.id}
            key={section.id}
          >
            {!isContinuous ? (
              <div className="mb-5 flex items-start gap-3 [&_h2]:text-lg [&_h2]:font-semibold [&_p]:text-sm [&_p]:text-muted-foreground [&>span]:text-muted-foreground">
                <span>{(sectionIndex + 1).toString().padStart(2, "0")}</span>
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    {section.eyebrow}
                  </p>
                  <h2>{section.title}</h2>
                  {section.description ? <p>{section.description}</p> : null}
                </div>
              </div>
            ) : null}
            <FieldGroup>
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
            </FieldGroup>
          </section>
        ))}

        <footer className="sticky bottom-0 flex flex-col gap-4 rounded-xl border bg-background p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p
              className={cn(
                Object.keys(errors).length
                  ? "text-sm text-destructive"
                  : "text-sm text-muted-foreground",
              )}
              aria-live="polite"
            >
              {message || "Simpan sebagai draft jika formulir belum lengkap."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              className="h-10 px-4"
              variant="outline"
              disabled={pending}
              type="button"
              onClick={() => save("draft")}
            >
              {pending && pendingIntent === "draft" ? (
                <SpinnerGapIcon
                  data-icon="inline-start"
                  className="animate-spin motion-reduce:animate-none"
                />
              ) : (
                <FloppyDiskIcon data-icon="inline-start" />
              )}
              Simpan draft
            </Button>
            <Button
              className="h-10 px-4"
              disabled={pending}
              type="button"
              onClick={() => save("submit")}
            >
              {pending && pendingIntent === "submit" ? (
                <SpinnerGapIcon
                  data-icon="inline-start"
                  className="animate-spin motion-reduce:animate-none"
                />
              ) : (
                <PaperPlaneTiltIcon data-icon="inline-start" />
              )}
              Kirim formulir <CaretRightIcon data-icon="inline-start" />
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
