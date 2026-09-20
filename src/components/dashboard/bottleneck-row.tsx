"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { LOOP_STAGES, STAGE_LABELS, STAGE_SHORT } from "@/lib/catalog";
import { STAGE_HINTS } from "@/lib/copy";
import { formatDuration, msToHours } from "@/lib/format";
import type { OverviewPayload } from "@/lib/types";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { SectionHead } from "./hint";

const chartConfig = {
  work: { label: "Work", color: "var(--work)" },
  wait: { label: "Wait", color: "var(--wait)" },
} satisfies ChartConfig;

export function BottleneckRow({ data }: { data: OverviewPayload }) {
  const rows = LOOP_STAGES.map((stage) => {
    const col = data.bottleneck[stage];
    const workMs = col?.work_ms ?? 0;
    const waitMs = col?.wait_ms ?? 0;
    return {
      stage,
      label: STAGE_SHORT[stage],
      full: STAGE_LABELS[stage],
      work: msToHours(workMs),
      wait: msToHours(waitMs),
      workMs,
      waitMs,
      highlight: Boolean(col?.highlight),
      hint: STAGE_HINTS[stage],
    };
  });

  return (
    <section className="reveal panel panel-pad flex flex-col gap-3" style={{ animationDelay: "40ms" }}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionHead
          title="Bottlenecks"
          hint="Grouped columns compare work vs wait (hours, median). Amber row marker = wait ≥ 40% of cycle time."
        />
      </div>

      <ChartContainer
        config={chartConfig}
        className="aspect-auto h-64 w-full md:h-72"
        initialDimension={{ width: 640, height: 288 }}
      >
        <BarChart
          data={rows}
          margin={{ top: 8, right: 8, left: 0, bottom: 4 }}
          barCategoryGap="16%"
          barGap={2}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            interval={0}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            width={36}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => `${v}h`}
            unit=""
          />
          <ChartTooltip
            cursor={{ fill: "var(--secondary)" }}
            content={
              <ChartTooltipContent
                labelFormatter={(_, payload) => {
                  const row = payload?.[0]?.payload as (typeof rows)[number] | undefined;
                  return row?.full ?? "";
                }}
                formatter={(value, name, item) => {
                  const row = item?.payload as (typeof rows)[number] | undefined;
                  const ms = name === "work" ? row?.workMs : row?.waitMs;
                  const label = name === "work" ? "Work" : "Wait";
                  return (
                    <div className="flex w-full items-center justify-between gap-4">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-heading font-medium tabular-nums">
                        {formatDuration(ms ?? 0, { empty: "—", zero: "0" })}
                        <span className="ml-1 text-[11px] text-muted-foreground">
                          ({Number(value)} h)
                        </span>
                      </span>
                    </div>
                  );
                }}
              />
            }
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar
            dataKey="work"
            fill="var(--color-work)"
            radius={[3, 3, 0, 0]}
            maxBarSize={28}
          />
          <Bar
            dataKey="wait"
            fill="var(--color-wait)"
            radius={[3, 3, 0, 0]}
            maxBarSize={28}
          />
        </BarChart>
      </ChartContainer>

      <div className="grid grid-cols-4 gap-1.5 md:grid-cols-8">
        {rows.map((row) => (
          <div
            key={row.stage}
            title={row.hint}
            className={cn(
              "rounded-md px-1 py-1 text-center transition-colors duration-200",
              row.highlight && "bg-accent ring-1 ring-cta/50",
            )}
          >
            <div className="truncate text-[10px] font-medium text-muted-foreground">
              {row.label}
            </div>
            <div className="font-heading text-[11px] tabular-nums text-foreground">
              {formatDuration(row.workMs, { empty: "—", zero: "0" })}
            </div>
            <div className="font-heading text-[10px] tabular-nums text-muted-foreground">
              wait {formatDuration(row.waitMs, { empty: "—", zero: "0" })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
