import Link from "next/link";
import {
  ArrowRightIcon,
  ChartBarIcon,
  ClockCounterClockwiseIcon,
} from "@phosphor-icons/react/dist/ssr";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { getFormReportIndex } from "@/lib/data/reports";

export default async function ReportsPage() {
  const forms = await getFormReportIndex();
  const submitted = forms.reduce((total, form) => total + form.submitted, 0);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-8">
      <header className="flex flex-col gap-3 border-b pb-6 [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:tracking-tight">
        <p className="text-xs font-medium text-muted-foreground">Analisis asesmen</p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1>Laporan per formulir</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Pantau kelengkapan dan pola jawaban dari setiap formulir asesmen yang telah dikirim.
            </p>
          </div>
          <div className="rounded-lg border bg-card px-4 py-3 text-right">
            <strong className="block text-2xl tabular-nums">{submitted}</strong>
            <span className="text-xs text-muted-foreground">asesmen terkirim</span>
          </div>
        </div>
      </header>

      {forms.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {forms.map((form) => (
            <Card key={form.id} className="overflow-hidden">
              <CardHeader>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{form.category}</Badge>
                  {!form.isActive ? <Badge variant="secondary">Nonaktif</Badge> : null}
                </div>
                <CardTitle>{form.title}</CardTitle>
                <CardDescription>{form.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-3 divide-x rounded-lg border bg-muted/30 py-3 text-center">
                  <div><dt className="text-xs text-muted-foreground">Terkirim</dt><dd className="mt-1 text-xl font-semibold tabular-nums">{form.submitted}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Draft</dt><dd className="mt-1 text-xl font-semibold tabular-nums">{form.drafts}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Terakhir</dt><dd className="mt-1 text-sm font-medium">{form.latestSubmissionAt ? format(form.latestSubmissionAt, "dd MMM yy", { locale: idLocale }) : "—"}</dd></div>
                </dl>
              </CardContent>
              <CardFooter className="justify-between border-t bg-muted/20">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><ClockCounterClockwiseIcon /> Semua versi</span>
                <Button nativeButton={false} role="link" variant="outline" render={<Link href={`/admin/reports/${form.id}`} />}>
                  Buka laporan <ArrowRightIcon data-icon="inline-end" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Empty><EmptyHeader><EmptyMedia variant="icon"><ChartBarIcon /></EmptyMedia><EmptyTitle>Belum ada formulir</EmptyTitle><EmptyDescription>Terbitkan formulir agar laporannya tersedia di sini.</EmptyDescription></EmptyHeader></Empty>
      )}
    </div>
  );
}
