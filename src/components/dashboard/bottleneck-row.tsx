import { LOOP_STAGES, STAGE_LABELS } from "@/lib/catalog";
import { STAGE_HINTS } from "@/lib/copy";
import { durationParts, formatDuration } from "@/lib/format";
import type { OverviewPayload } from "@/lib/types";
import { DualBar, LegendDot } from "./bars";
import { Hint, SectionHead } from "./hint";

export function BottleneckRow({ data }: { data: OverviewPayload }) {
  const max = Math.max(
    1,
    ...LOOP_STAGES.map((s) => {
      const col = data.bottleneck[s];
      return (col?.work_ms ?? 0) + (col?.wait_ms ?? 0);
    }),
  );

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionHead
          title="Nút thắt"
          hint="Cột đặc = đang làm. Cột mờ = đang chờ. Tô nền = chờ chiếm ≥ 40% thời gian xong."
        />
        <div className="flex items-center gap-3">
          <LegendDot tone="work" label="Làm" />
          <LegendDot tone="wait" label="Chờ" />
        </div>
      </div>
      <div className="hidden gap-2 md:grid md:grid-cols-8">
        {LOOP_STAGES.map((stage) => {
          const col = data.bottleneck[stage];
          const work = col?.work_ms ?? 0;
          const wait = col?.wait_ms ?? 0;
          const workP = durationParts(work);
          const waitP = durationParts(wait);
          return (
            <div key={stage} className="flex flex-col gap-2">
              <DualBar work={work} wait={wait} max={max} vertical highlight={col?.highlight} />
              <div className="flex items-center gap-0.5">
                <div className="truncate text-xs font-medium">{STAGE_LABELS[stage]}</div>
                <Hint>{STAGE_HINTS[stage]}</Hint>
              </div>
              <div className="text-[11px] tabular-nums text-muted-foreground">
                {workP ? workP.value : "0"}/{waitP ? waitP.value : "0"} {waitP?.unit ?? workP?.unit ?? "—"}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex flex-col gap-3 md:hidden">
        {LOOP_STAGES.map((stage) => {
          const col = data.bottleneck[stage];
          const work = col?.work_ms ?? 0;
          const wait = col?.wait_ms ?? 0;
          return (
            <div key={stage} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">{STAGE_LABELS[stage]}</span>
                <span className="tabular-nums text-muted-foreground">
                  {formatDuration(work, { empty: "—", zero: "—" })} /{" "}
                  {formatDuration(wait, { empty: "—", zero: "—" })}
                </span>
              </div>
              <DualBar work={work} wait={wait} max={max} highlight={col?.highlight} />
            </div>
          );
        })}
      </div>
    </section>
  );
}
