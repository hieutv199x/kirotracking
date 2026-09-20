"use client";

import { LOOP_STAGES, STAGE_LABELS, STAGE_SHORT } from "@/lib/catalog";
import { STAGE_HINTS } from "@/lib/copy";
import { formatDuration, msToHours } from "@/lib/format";
import type { OverviewPayload } from "@/lib/types";
import { cn } from "@/lib/utils";
import { LegendDot } from "./bars";
import { SectionHead } from "./hint";

export function BottleneckRow({ data }: { data: OverviewPayload }) {
  const rows = LOOP_STAGES.map((stage) => {
    const col = data.bottleneck[stage];
    const workMs = col?.work_ms ?? 0;
    const waitMs = col?.wait_ms ?? 0;
    return {
      stage,
      label: STAGE_SHORT[stage],
      full: STAGE_LABELS[stage],
      workH: msToHours(workMs),
      waitH: msToHours(waitMs),
      workMs,
      waitMs,
      highlight: Boolean(col?.highlight),
      hint: STAGE_HINTS[stage],
    };
  });

  const maxH = Math.max(1, ...rows.map((r) => Math.max(r.workH, r.waitH)));

  return (
    <section className="reveal panel panel-pad flex flex-col gap-3" style={{ animationDelay: "40ms" }}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionHead
          title="Bottlenecks"
          hint="Grouped columns compare work vs wait (hours, median). Amber marker = wait ≥ 40% of cycle time."
        />
        <div className="flex items-center gap-3">
          <LegendDot tone="work" label="Work" />
          <LegendDot tone="wait" label="Wait" />
        </div>
      </div>

      <div
        className="grid h-56 grid-cols-8 items-end gap-1.5 md:h-64 md:gap-2"
        role="img"
        aria-label="Bottleneck work versus wait column chart"
      >
        {rows.map((row) => {
          const workPct = Math.max(row.workH > 0 ? 6 : 0, (row.workH / maxH) * 100);
          const waitPct = Math.max(row.waitH > 0 ? 6 : 0, (row.waitH / maxH) * 100);
          return (
            <div
              key={row.stage}
              title={`${row.full} — work ${formatDuration(row.workMs, { empty: "—", zero: "0" })}, wait ${formatDuration(row.waitMs, { empty: "—", zero: "0" })}`}
              className={cn(
                "flex h-full flex-col items-center justify-end gap-1 rounded-md px-0.5",
                row.highlight && "bg-accent ring-1 ring-cta/40",
              )}
            >
              <div className="flex w-full flex-1 items-end justify-center gap-0.5 md:gap-1">
                <div className="flex h-full w-[42%] flex-col items-center justify-end">
                  <span className="mb-0.5 hidden font-heading text-[9px] tabular-nums text-muted-foreground sm:block">
                    {row.workH > 0 ? `${row.workH}` : ""}
                  </span>
                  <div
                    className="meter-fill-y w-full rounded-t-sm bg-work"
                    style={{ height: `${workPct}%` }}
                  />
                </div>
                <div className="flex h-full w-[42%] flex-col items-center justify-end">
                  <span className="mb-0.5 hidden font-heading text-[9px] tabular-nums text-muted-foreground sm:block">
                    {row.waitH > 0 ? `${row.waitH}` : ""}
                  </span>
                  <div
                    className="meter-fill-y w-full rounded-t-sm bg-wait"
                    style={{ height: `${waitPct}%` }}
                  />
                </div>
              </div>
              <span
                className="w-full truncate text-center text-[10px] font-medium text-foreground md:text-[11px]"
                title={row.hint}
              >
                {row.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Y-axis in hours (median). Numbers above columns are hours.</span>
        <span className="font-heading tabular-nums">max {maxH} h</span>
      </div>
    </section>
  );
}
