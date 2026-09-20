import type { ReactNode } from "react";
import { Hint } from "./hint";
import { Meter, StackedBar } from "./bars";
import { durationParts, formatNumber, pctInt } from "@/lib/format";
import type { OverviewPayload } from "@/lib/types";

export function KpiRow({ data }: { data: OverviewPayload }) {
  const cycle = durationParts(data.cycle_median_ms);
  const p90 = durationParts(data.cycle_p90_ms);
  const rework = pctInt(data.rework_rate);

  return (
    <div className="reveal grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Kpi
        label="Committed"
        hint="Stories that finished all eight steps through commit."
        value={data.committed === 0 ? "—" : formatNumber(data.committed)}
        unit="stories"
        quiet={data.entered === 0 ? "None entered yet" : `${formatNumber(data.entered)} entered`}
      >
        <Meter value={data.committed} max={Math.max(data.entered, 1)} tone="work" />
      </Kpi>

      <Kpi
        label="Cycle time"
        hint="From loop entry to commit. Median, not mean."
        value={cycle?.value ?? "—"}
        unit={cycle?.unit ?? ""}
        quiet={p90 ? `p90 ${p90.value} ${p90.unit}` : "No commits yet"}
      >
        <Meter
          value={data.cycle_median_ms ?? 0}
          max={data.cycle_p90_ms ?? data.cycle_median_ms ?? 1}
          tone="work"
        />
      </Kpi>

      <Kpi
        label="Rework"
        hint="Stories that advanced, then had to go back a step."
        value={rework == null ? "—" : `${rework}%`}
        unit=""
        quiet={
          rework == null
            ? "Not enough sample"
            : rework === 0
              ? "No step-backs"
              : data.rework_rounds_median
                ? `median ${formatNumber(data.rework_rounds_median)} rounds`
                : null
        }
        alert={rework != null && rework >= 30}
      >
        <Meter value={rework ?? 0} max={100} tone="rework" />
      </Kpi>

      <Kpi
        label="AI pauses"
        hint="Times AI paused for a human decision. Solid = spec lock, muted = review."
        value={data.d08_median == null ? "—" : formatNumber(data.d08_median)}
        unit={data.d08_median == null ? "" : "×"}
        quiet={
          data.d08_median == null
            ? "No commits yet"
            : `${formatNumber(data.d08_spec_lock_median ?? 0)} lock · ${formatNumber(data.d08_review_median ?? 0)} review`
        }
      >
        <StackedBar
          parts={[
            { key: "lock", n: data.d08_spec_lock_median ?? 0, tone: "lock" },
            { key: "review", n: data.d08_review_median ?? 0, tone: "review" },
          ]}
        />
      </Kpi>
    </div>
  );
}

function Kpi({
  label,
  hint,
  value,
  unit,
  quiet,
  children,
  alert = false,
}: {
  label: string;
  hint: string;
  value: string;
  unit: string;
  quiet: string | null;
  children: ReactNode;
  alert?: boolean;
}) {
  return (
    <div className="panel panel-pad flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <Hint>{hint}</Hint>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span
          className={`font-heading text-3xl font-semibold tracking-tight tabular-nums ${
            alert ? "text-destructive" : "text-foreground"
          }`}
        >
          {value}
        </span>
        {unit ? <span className="text-xs text-muted-foreground">{unit}</span> : null}
      </div>
      {children}
      {quiet ? <p className="text-[11px] tabular-nums text-muted-foreground">{quiet}</p> : null}
    </div>
  );
}
