"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const chartConfig = {
  submissions: {
    label: "Asesmen",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

type AssessmentVolumeChartProps = {
  data: {
    date: string;
    label: string;
    submissions: number;
  }[];
};

export function AssessmentVolumeChart({ data }: AssessmentVolumeChartProps) {
  return (
    <ChartContainer
      config={chartConfig}
      className="h-56 w-full aspect-auto"
      aria-label="Tren jumlah asesmen selama periode laporan"
    >
      <AreaChart accessibilityLayer data={data} margin={{ left: -24, right: 8 }}>
        <defs>
          <linearGradient id="assessment-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-submissions)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--color-submissions)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tickMargin={10}
          minTickGap={28}
        />
        <YAxis allowDecimals={false} axisLine={false} tickLine={false} width={34} />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="line" />}
        />
        <Area
          dataKey="submissions"
          type="monotone"
          fill="url(#assessment-fill)"
          fillOpacity={1}
          stroke="var(--color-submissions)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}
