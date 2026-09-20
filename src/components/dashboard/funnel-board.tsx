"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from "recharts";
import {
  LOOP_STAGES,
  STAGE_LABELS,
  STAGE_SHORT,
  type LoopStage,
  type Period,
} from "@/lib/catalog";
import { STAGE_HINTS } from "@/lib/copy";
import { durationParts, formatNumber, pctInt } from "@/lib/format";
import type { FunnelStep, StoryListItem } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { SectionHead } from "./hint";

const chartConfig = {
  entered: { label: "Stories reached", color: "var(--primary)" },
  standing: { label: "Standing", color: "var(--cta)" },
} satisfies ChartConfig;

export function FunnelBoard({
  funnel,
  standing,
  period,
  selected,
  viewerId,
  compact = false,
}: {
  funnel: FunnelStep[];
  standing: Record<LoopStage, StoryListItem[]>;
  period: Period;
  selected?: LoopStage | null;
  viewerId?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const list = selected ? standing[selected] ?? [] : [];
  const viewerQ = viewerId && viewerId !== "lead" ? `&viewer=${viewerId}` : "";

  const data = LOOP_STAGES.map((stage, i) => {
    const step = funnel.find((f) => f.stage === stage);
    const entered = step?.entered ?? 0;
    const prev = i > 0 ? (funnel.find((f) => f.stage === LOOP_STAGES[i - 1])?.entered ?? 0) : entered;
    const drop = i > 0 && prev > 0 ? Math.round(((prev - entered) / prev) * 100) : 0;
    return {
      stage,
      label: STAGE_SHORT[stage],
      full: STAGE_LABELS[stage],
      entered,
      standing: step?.standing ?? 0,
      median_ms: step?.median_ms ?? null,
      conversion: step?.conversion ?? null,
      drop,
      selected: selected === stage,
    };
  });

  function selectStage(stage: LoopStage) {
    const isSelected = selected === stage;
    if (compact) {
      router.push(`/funnel?period=${period}&stand=${stage}${viewerQ}`);
      return;
    }
    const stand = isSelected ? "" : stage;
    router.push(`?period=${period}${stand ? `&stand=${stand}` : ""}${viewerQ}`);
  }

  return (
    <div className={cn("reveal flex flex-col gap-3", !compact && "panel panel-pad")}>
      {!compact ? (
        <SectionHead
          title="8-step funnel"
          hint="Same cohort of stories that entered the loop. Click a column to see who is standing there."
        />
      ) : (
        <SectionHead
          title="Funnel"
          hint="Column height = stories that reached that step. Amber tip = stories standing there now."
        />
      )}

      <div className={cn(compact && "panel panel-pad")}>
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-56 w-full md:h-64"
          initialDimension={{ width: 640, height: 256 }}
        >
          <BarChart
            data={data}
            margin={{ top: 24, right: 8, left: 0, bottom: 4 }}
            barCategoryGap="18%"
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
              allowDecimals={false}
              width={28}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
            />
            <ChartTooltip
              cursor={{ fill: "var(--secondary)" }}
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) => {
                    const row = payload?.[0]?.payload as (typeof data)[number] | undefined;
                    return row?.full ?? "";
                  }}
                  formatter={(value, name, item) => {
                    const row = item?.payload as (typeof data)[number] | undefined;
                    if (name === "entered") {
                      const dur = durationParts(row?.median_ms ?? null);
                      const conv = pctInt(row?.conversion ?? null);
                      const extra = [
                        dur ? `median ${dur.value} ${dur.unit}` : null,
                        conv != null ? `${conv}% continue` : null,
                        row && row.drop > 0 ? `${row.drop}% drop from prior` : null,
                        row && row.standing > 0 ? `${row.standing} standing` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ");
                      return (
                        <div className="flex w-full flex-col gap-0.5">
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Reached</span>
                            <span className="font-heading font-medium tabular-nums">
                              {formatNumber(Number(value))}
                            </span>
                          </div>
                          {extra ? (
                            <span className="text-[11px] text-muted-foreground">{extra}</span>
                          ) : null}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              }
            />
            <Bar
              dataKey="entered"
              radius={[4, 4, 0, 0]}
              maxBarSize={48}
              cursor="pointer"
              onClick={(d) => {
                const stage = (d as { stage?: LoopStage }).stage;
                if (stage) selectStage(stage);
              }}
            >
              {data.map((row) => (
                <Cell
                  key={row.stage}
                  fill={row.selected ? "var(--cta)" : "var(--primary)"}
                  fillOpacity={row.drop >= 25 && !row.selected ? 0.75 : 1}
                  stroke={row.standing > 0 ? "var(--cta)" : undefined}
                  strokeWidth={row.standing > 0 ? 2 : 0}
                />
              ))}
              <LabelList
                dataKey="entered"
                position="top"
                className="fill-foreground font-heading"
                fontSize={11}
                formatter={(v) => (Number(v) === 0 ? "" : formatNumber(Number(v)))}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
        <p className="mt-1 text-[11px] text-muted-foreground" title={STAGE_HINTS.intake}>
          Click a column to inspect standing stories. Amber outline = someone is waiting at that step.
        </p>
      </div>

      {compact ? null : selected ? (
        <div className="flex flex-col gap-2 border-t border-border/70 pt-3">
          <div className="text-sm font-medium">Standing · {STAGE_LABELS[selected]}</div>
          {list.length === 0 ? (
            <p className="text-sm text-muted-foreground">Queue is empty.</p>
          ) : (
            list.map((s) => (
              <Link
                key={s.story_id}
                href={`/stories/${s.story_id}?period=${period}`}
                className="flex cursor-pointer items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-sm transition-colors duration-200 hover:border-primary/40 hover:bg-secondary/60"
              >
                <span className="font-heading font-medium">{s.story_id}</span>
                <Badge variant="outline">{s.developer_name}</Badge>
              </Link>
            ))
          )}
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground">Click a step to see who is standing there.</p>
      )}
    </div>
  );
}
