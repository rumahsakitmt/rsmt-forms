import Link from "next/link";
import {
  ArrowUpRightIcon,
  CheckCircleIcon,
  LightbulbIcon,
  MinusIcon,
  TrendDownIcon,
  TrendUpIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

import { AssessmentVolumeChart } from "@/components/reports/assessment-volume-chart";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  EmptyTitle,
} from "@/components/ui/empty";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  AssessmentComparison,
  AssessmentReport,
  ReportInsight,
} from "@/lib/reports/assessment-report";

type TrendPoint = {
  date: string;
  label: string;
  submissions: number;
};

type SubmissionRecord = {
  id: string;
  patientName: string;
  medicalRecordNumber: string;
  room: string;
  submittedAt: Date | null;
  createdBy: { name: string };
};

function DeltaBadge({ value, suffix = "" }: { value: number; suffix?: string }) {
  const Icon = value > 0 ? TrendUpIcon : value < 0 ? TrendDownIcon : MinusIcon;

  return (
    <Badge variant={value < 0 ? "destructive" : "secondary"}>
      <Icon data-icon="inline-start" />
      {value > 0 ? "+" : ""}
      {value}
      {suffix}
    </Badge>
  );
}

export function AssessmentExecutiveSummary({
  insights,
  trend,
  periodLabel,
  previousPeriodLabel,
}: {
  insights: ReportInsight[];
  trend: TrendPoint[];
  periodLabel: string;
  previousPeriodLabel: string;
}) {
  return (
    <>
      <section
        aria-labelledby="executive-summary"
        className="grid gap-4 lg:grid-cols-5"
      >
        <Card className="lg:col-span-3">
          <CardHeader className="border-b">
            <CardTitle
              id="executive-summary"
              className="flex items-center gap-2 text-base"
            >
              <LightbulbIcon className="size-4 text-primary" />
              Kesimpulan utama
            </CardTitle>
            <CardDescription>
              Temuan otomatis untuk {periodLabel}. Dibandingkan dengan {" "}
              {previousPeriodLabel}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {insights.length ? (
              <ol className="divide-y">
                {insights.map((insight) => {
                  const Icon =
                    insight.tone === "attention"
                      ? WarningCircleIcon
                      : insight.tone === "positive"
                        ? CheckCircleIcon
                        : LightbulbIcon;
                  return (
                    <li
                      key={`${insight.title}-${insight.description}`}
                      className="flex gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <span
                        className={
                          insight.tone === "attention"
                            ? "mt-0.5 text-destructive"
                            : "mt-0.5 text-muted-foreground"
                        }
                      >
                        <Icon className="size-4" />
                      </span>
                      <div>
                        <p className="font-medium text-foreground">{insight.title}</p>
                        <p className="mt-0.5 text-muted-foreground">
                          {insight.description}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="text-muted-foreground">
                Belum ada data untuk menghasilkan kesimpulan pada periode ini.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Aktivitas asesmen</CardTitle>
            <CardDescription>
              Jumlah asesmen yang dikirim dari waktu ke waktu.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AssessmentVolumeChart data={trend} />
          </CardContent>
        </Card>
      </section>

      <Alert className="px-3 py-2">
        <LightbulbIcon />
        <AlertDescription>
          Insight bersifat deskriptif untuk membantu peninjauan data, bukan rekomendasi
          atau keputusan klinis.
        </AlertDescription>
      </Alert>
    </>
  );
}

export function AssessmentMetrics({
  summary,
  comparison,
  hasPreviousData,
}: {
  summary: AssessmentReport;
  comparison: AssessmentComparison;
  hasPreviousData: boolean;
}) {
  const metrics = [
    {
      label: "Asesmen terkirim",
      value: summary.submissionCount,
      note: "Catatan dalam periode",
      delta: comparison.submissionDelta,
      suffix: "",
    },
    {
      label: "Pasien unik",
      value: summary.uniquePatients,
      note: "Berdasarkan nomor CM",
      delta: comparison.uniquePatientDelta,
      suffix: "",
    },
    {
      label: "Kelengkapan",
      value: `${summary.completionRate}%`,
      note: "Jawaban pada pertanyaan tampil",
      delta: comparison.completionDelta,
      suffix: " poin",
    },
  ];
  const comparisonNote = hasPreviousData
    ? "perubahan dari periode sebelumnya"
    : "periode sebelumnya belum punya data";

  return (
    <section aria-label="Ringkasan laporan" className="grid gap-3 sm:grid-cols-3">
      {metrics.map((metric) => (
        <Card key={metric.label}>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardDescription>{metric.label}</CardDescription>
              {hasPreviousData ? (
                <DeltaBadge value={metric.delta} suffix={metric.suffix} />
              ) : (
                <Badge variant="outline">Tanpa pembanding</Badge>
              )}
            </div>
            <CardTitle className="text-3xl tabular-nums">{metric.value}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {metric.note} · {comparisonNote}
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

export function AssessmentDistribution({ summary }: { summary: AssessmentReport }) {
  if (!summary.submissionCount) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>Belum ada asesmen terkirim</EmptyTitle>
          <EmptyDescription>
            Ubah periode laporan atau tunggu hingga formulir ini dikirim.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold">Distribusi jawaban</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Persentase dihitung dari asesmen yang menjawab pertanyaan terkait.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {summary.fields.map((field, index) => (
          <Card key={field.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <CardTitle className="text-base leading-snug">
                  <span className="mr-2 text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {field.label}
                </CardTitle>
                <Badge variant={field.responseRate < 80 ? "destructive" : "outline"}>
                  {field.responseRate}% terisi
                </Badge>
              </div>
              <CardDescription>
                {field.answered} dari {summary.submissionCount} asesmen menjawab
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {field.choices.length ? (
                field.choices.map((choice) => (
                  <div key={choice.value} className="space-y-1.5">
                    <div className="flex justify-between gap-3 text-sm">
                      <span>{choice.label}</span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        {choice.count} · {choice.percentage}%
                      </span>
                    </div>
                    <Progress
                      value={choice.percentage}
                      aria-label={`${choice.label}: ${choice.percentage}%`}
                    />
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
                  <span>Jawaban teks tercatat</span>
                  <strong className="tabular-nums">{field.answered}</strong>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

export function AssessmentRecords({ submissions }: { submissions: SubmissionRecord[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Catatan asesmen</CardTitle>
        <CardDescription>Semua asesmen terkirim dalam periode laporan.</CardDescription>
      </CardHeader>
      <CardContent>
        {submissions.length ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pasien</TableHead>
                  <TableHead>Ruangan</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Petugas</TableHead>
                  <TableHead aria-label="Aksi" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>
                      <strong className="block">{submission.patientName}</strong>
                      <span className="text-xs text-muted-foreground">
                        {submission.medicalRecordNumber}
                      </span>
                    </TableCell>
                    <TableCell>{submission.room || "—"}</TableCell>
                    <TableCell>
                      {submission.submittedAt
                        ? format(submission.submittedAt, "dd MMM yyyy, HH.mm", {
                            locale: idLocale,
                          })
                        : "—"}
                    </TableCell>
                    <TableCell>{submission.createdBy.name}</TableCell>
                    <TableCell>
                      <Button
                        nativeButton={false}
                        role="link"
                        size="icon"
                        variant="ghost"
                        aria-label={`Buka asesmen ${submission.patientName}`}
                        render={<Link href={`/admin/submissions/${submission.id}`} />}
                      >
                        <ArrowUpRightIcon />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Tidak ada catatan dalam periode ini.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
