import Link from "next/link";
import {
  ArrowUpRightIcon,
  FileTextIcon,
  FunnelIcon,
  PencilIcon,
} from "@phosphor-icons/react/dist/ssr";
import { format } from "date-fns";
import { id } from "date-fns/locale";

import { getActiveForms } from "@/lib/data/forms";
import { getSubmissions } from "@/lib/data/submissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
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

export default async function SubmissionsPage({
  searchParams,
}: PageProps<"/admin/submissions">) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  const status =
    params.status === "DRAFT" || params.status === "SUBMITTED"
      ? params.status
      : undefined;
  const formId = typeof params.formId === "string" ? params.formId : undefined;
  const from = typeof params.from === "string" ? params.from : undefined;
  const to = typeof params.to === "string" ? params.to : undefined;
  const [submissions, forms] = await Promise.all([
    getSubmissions({ query, status, formId, from, to }),
    getActiveForms(),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:tracking-tight">
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Arsip klinis
          </p>
          <h1>Riwayat formulir</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Temukan draft dan formulir terkirim berdasarkan pasien atau nomor
            CM.
          </p>
        </div>
      </header>

      <form method="get">
        <FieldGroup className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Field>
            <Input
              aria-label="Cari pasien atau nomor CM"
              defaultValue={query}
              name="q"
              placeholder="Cari nama pasien atau No. CM…"
            />
          </Field>
          <Field>
            <NativeSelect
              className="w-full"
              defaultValue={status ?? ""}
              name="status"
              aria-label="Status"
            >
              <NativeSelectOption value="">Semua status</NativeSelectOption>
              <NativeSelectOption value="DRAFT">Draft</NativeSelectOption>
              <NativeSelectOption value="SUBMITTED">
                Terkirim
              </NativeSelectOption>
            </NativeSelect>
          </Field>
          <Field>
            <NativeSelect
              className="w-full"
              defaultValue={formId ?? ""}
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
              defaultValue={from}
              name="from"
              type="date"
              aria-label="Tanggal mulai"
            />
          </Field>
          <Field>
            <Input
              defaultValue={to}
              name="to"
              type="date"
              aria-label="Tanggal akhir"
            />
          </Field>
          <Button type="submit">
            <FunnelIcon data-icon="inline-start" /> Terapkan
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
            <div className="overflow-x-auto w-full [&_td>strong]:block [&_td>span]:block [&_td>span]:text-muted-foreground">
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
                  {submissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell>
                        <strong>
                          {submission.patientName || "Tanpa nama"}
                        </strong>
                        <span>
                          {submission.medicalRecordNumber ||
                            "No. CM belum diisi"}{" "}
                          · {submission.room || "Ruangan—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <strong>{submission.formVersion.form.title}</strong>
                        <span>
                          Versi {submission.formVersion.version} ·{" "}
                          {submission.createdBy.name}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            submission.status === "DRAFT"
                              ? "outline"
                              : "secondary"
                          }
                        >
                          {submission.status === "DRAFT" ? "Draft" : "Terkirim"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(submission.updatedAt, "dd MMM yyyy, HH.mm", {
                          locale: id,
                        })}
                      </TableCell>
                      <TableCell>
                        <Button
                          nativeButton={false}
                          role="link"
                          variant="ghost"
                          size="icon"
                          render={
                            <Link
                              href={
                                submission.status === "DRAFT"
                                  ? `/admin/submissions/${submission.id}/edit`
                                  : `/admin/submissions/${submission.id}`
                              }
                            />
                          }
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
                      </TableCell>
                    </TableRow>
                  ))}
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
