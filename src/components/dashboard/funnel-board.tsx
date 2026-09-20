"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { cn } from "@/lib/utils";
import { SectionHead } from "./hint";

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
  const max = Math.max(1, ...funnel.map((s) => s.entered));

  const data = LOOP_STAGES.map((stage, i) => {
    const step = funnel.find((f) => f.stage === stage);
    const entered = step?.entered ?? 0;
    const prev =
      i > 0 ? (funnel.find((f) => f.stage === LOOP_STAGES[i - 1])?.entered ?? 0) : entered;
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
      heightPct: Math.max(entered > 0 ? 8 : 0, (entered / max) * 100),
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

      <div className={cn("flex flex-col gap-2", compact && "panel panel-pad")}>
        <div
          className="grid h-56 grid-cols-8 items-end gap-1.5 md:h-64 md:gap-2"
          role="img"
          aria-label="Funnel column chart by stage"
        >
          {data.map((row) => {
            const dur = durationParts(row.median_ms);
            const conv = pctInt(row.conversion);
            const title = [
              row.full,
              `${formatNumber(row.entered)} reached`,
              dur ? `median ${dur.value} ${dur.unit}` : null,
              conv != null ? `${conv}% continue` : null,
              row.drop > 0 ? `${row.drop}% drop from prior` : null,
              row.standing > 0 ? `${row.standing} standing` : null,
            ]
              .filter(Boolean)
              .join(" · ");
            return (
              <button
                key={row.stage}
                type="button"
                title={title}
                aria-label={`${row.full}: ${row.entered} stories`}
                aria-pressed={row.selected}
                onClick={() => selectStage(row.stage)}
                className={cn(
                  "group flex h-full cursor-pointer flex-col items-center justify-end gap-1 rounded-md px-0.5 transition-colors duration-200",
                  row.selected && "bg-secondary",
                  row.drop >= 25 && !row.selected && "bg-accent/30",
                )}
              >
                <span className="font-heading text-[11px] font-semibold tabular-nums text-foreground md:text-xs">
                  {row.entered === 0 ? "—" : formatNumber(row.entered)}
                </span>
                <div className="relative flex w-full flex-1 items-end justify-center">
                  <div
                    className={cn(
                      "meter-fill-y relative w-full max-w-[2.75rem] rounded-t-md transition-colors duration-200",
                      row.selected ? "bg-cta" : "bg-primary",
                      "group-hover:brightness-110",
                    )}
                    style={{ height: `${row.heightPct}%` }}
                  >
                    {row.standing > 0 ? (
                      <span
                        className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rounded-full bg-cta ring-2 ring-card"
                        title={`${row.standing} standing`}
                      />
                    ) : null}
                  </div>
                </div>
                <span
                  className="w-full truncate text-center text-[10px] font-medium text-muted-foreground md:text-[11px]"
                  title={STAGE_HINTS[row.stage]}
                >
                  {row.label}
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Click a column to inspect standing stories. Amber tip = someone is waiting at that step.
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
        <p className="text-[11px] text-muted-foreground">
          Click a step to see who is standing there.
        </p>
      )}
    </div>
  );
}
