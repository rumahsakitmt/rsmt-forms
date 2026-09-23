import Link from "next/link";
import {
  ArrowUpRightIcon,
  DownloadSimpleIcon,
  FileTextIcon,
  FunnelIcon,
  PencilIcon,
  PrinterIcon,
} from "@phosphor-icons/react/dist/ssr";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type SubmissionListItem = {
  id: string;
  status: "DRAFT" | "SUBMITTED";
  patientName: string;
  medicalRecordNumber: string;
  room: string;
  updatedAt: Date;
  createdBy: { id: string; name: string };
  formVersion: {
    version: number;
    form: { id: string; title: string; slug: string };
  };
};

type FormOption = {
  id: string;
  title: string;
};

type SubmissionListProps = {
  submissions: SubmissionListItem[];
  forms: FormOption[];
  filters: {
    query: string;
    status?: "DRAFT" | "SUBMITTED";
    formId?: string;
    from?: string;
    to?: string;
  };
  context: "admin" | "main";
};

export function SubmissionList({
  submissions,
  forms,
  filters,
  context,
}: SubmissionListProps) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:tracking-tight">
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Arsip klinis
          </p>
          <h1>Riwayat formulir</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Temukan draft dan formulir terkirim berdasarkan pasien atau nomor CM.
          </p>
        </div>
      </header>

      <form method="get">
        <FieldGroup className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Field>
            <Input
              aria-label="Cari pasien atau nomor CM"
              defaultValue={filters.query}
              name="q"
              placeholder="Cari nama pasien atau No. CM…"
            />
          </Field>
          <Field>
            <NativeSelect
              className="w-full"
              defaultValue={filters.status ?? ""}
              name="status"
              aria-label="Status"
            >
              <NativeSelectOption value="">Semua status</NativeSelectOption>
              <NativeSelectOption value="DRAFT">Draft</NativeSelectOption>
              <NativeSelectOption value="SUBMITTED">Terkirim</NativeSelectOption>
            </NativeSelect>
          </Field>
          <Field>
            <NativeSelect
              className="w-full"
              defaultValue={filters.formId ?? ""}
              name="formId"
              aria-label="Jenis formulir"
            >
              <NativeSelectOption value="">Semua formulir</NativeSelectOption>
              {forms.map((form) => (
                <NativeSelectOption key={form.id} value={form.id}>
                  {form.title}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
          <Field>
            <Input
              defaultValue={filters.from}
              name="from"
              type="date"
              aria-label="Tanggal mulai"
            />
          </Field>
          <Field>
            <Input
              defaultValue={filters.to}
              name="to"
              type="date"
              aria-label="Tanggal akhir"
            />
          </Field>
          <Button type="submit">
            <FunnelIcon data-icon="inline-start" />
            Terapkan
          </Button>
        </FieldGroup>
      </form>

      <Card>
        <CardHeader>
          <CardDescription>Hasil</CardDescription>
          <CardTitle>{submissions.length} catatan</CardTitle>
        </CardHeader>
        <CardContent>
          {submissions.length ? (
            <div className="w-full overflow-x-auto [&_td>span]:block [&_td>span]:text-muted-foreground [&_td>strong]:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pasien</TableHead>
                    <TableHead>Formulir</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Diperbarui</TableHead>
                    <TableHead aria-label="Aksi" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission) => {
                    const href =
                      submission.status === "DRAFT"
                        ? context === "admin"
                          ? `/admin/submissions/${submission.id}/edit`
                          : `/forms/${submission.formVersion.form.slug}/new?draft=${submission.id}`
                        : context === "admin"
                          ? `/admin/submissions/${submission.id}`
                          : `/submissions/${submission.id}`;
                    const printHref =
                      context === "admin"
                        ? `/admin/submissions/${submission.id}/print`
                        : `/submissions/${submission.id}/print`;
                    return (
                      <TableRow key={submission.id}>
                        <TableCell>
                          <strong>{submission.patientName || "Tanpa nama"}</strong>
                          <span>
                            {submission.medicalRecordNumber || "No. CM belum diisi"} · {" "}
                            {submission.room || "Ruangan—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <strong>{submission.formVersion.form.title}</strong>
                          <span>
                            Versi {submission.formVersion.version} · {" "}
                            {submission.createdBy.name}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              submission.status === "DRAFT" ? "outline" : "secondary"
                            }
                          >
                            {submission.status === "DRAFT" ? "Draft" : "Terkirim"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(submission.updatedAt, "dd MMM yyyy, HH.mm", {
                            locale: idLocale,
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              nativeButton={false}
                              role="link"
                              variant="ghost"
                              size="icon"
                              render={<Link href={href} />}
                              aria-label={
                                submission.status === "DRAFT"
                                  ? "Lanjutkan draft"
                                  : "Lihat formulir"
                              }
                            >
                              {submission.status === "DRAFT" ? (
                                <PencilIcon data-icon="inline-start" />
                              ) : (
                                <ArrowUpRightIcon data-icon="inline-start" />
                              )}
                            </Button>
                            <Button
                              nativeButton={false}
                              role="link"
                              variant="ghost"
                              size="icon"
                              render={
                                <a
                                  href={printHref}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                />
                              }
                              aria-label={`Cetak formulir ${submission.patientName || "tanpa nama"}`}
                            >
                              <PrinterIcon data-icon="inline-start" />
                            </Button>
                            <Button
                              nativeButton={false}
                              role="link"
                              variant="ghost"
                              size="icon"
                              render={<a href={`${printHref}?download=1`} download />}
                              aria-label={`Unduh PDF ${submission.patientName || "tanpa nama"}`}
                            >
                              <DownloadSimpleIcon data-icon="inline-start" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileTextIcon />
                </EmptyMedia>
                <EmptyTitle>Belum ada catatan</EmptyTitle>
                <EmptyDescription>
                  Ubah filter atau isi formulir pertama Anda.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
