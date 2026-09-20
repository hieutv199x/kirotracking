import Link from "next/link";
import { LOOP_STAGES, STAGE_LABELS, type LoopStage, type Period } from "@/lib/catalog";
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
  const max = Math.max(1, ...funnel.map((s) => s.entered));
  const list = selected ? standing[selected] ?? [] : [];
  const viewerQ = viewerId && viewerId !== "lead" ? `&viewer=${viewerId}` : "";

  return (
    <div className={cn("reveal flex flex-col gap-3", !compact && "panel panel-pad")}>
      {!compact ? (
        <SectionHead
          title="Phễu 8 bước"
          hint="Cùng nhóm story đã vào vòng. Bấm một bậc để xem đang đứng."
        />
      ) : (
        <SectionHead
          title="Phễu"
          hint="Độ dài thanh = số story đã tới bước đó. Chấm trắng = đang đứng."
        />
      )}
      <div className={cn("flex flex-col gap-0.5", compact && "panel panel-pad")}>
        {LOOP_STAGES.map((stage, i) => {
          const step = funnel.find((f) => f.stage === stage);
          if (!step) return null;
          const isSelected = selected === stage;
          const width = Math.max(8, (step.entered / max) * 100);
          const conv = pctInt(step.conversion);
          const dur = durationParts(step.median_ms);
          const href = compact
            ? `/funnel?period=${period}&stand=${stage}${viewerQ}`
            : `?period=${period}&stand=${isSelected ? "" : stage}${viewerQ}`;
          const drop =
            i > 0
              ? (() => {
                  const prev = funnel.find((f) => f.stage === LOOP_STAGES[i - 1]);
                  if (!prev || prev.entered === 0) return null;
                  return Math.round(((prev.entered - step.entered) / prev.entered) * 100);
                })()
              : null;
          return (
            <div
              key={stage}
              className={cn(
                "grid grid-cols-[7.5rem_minmax(0,1fr)_auto] items-center gap-2 rounded-md px-1.5 py-1 transition-colors duration-200 md:grid-cols-[9rem_minmax(0,1fr)_3.25rem_4.25rem]",
                isSelected && "bg-secondary",
                drop != null && drop >= 25 && "bg-accent/40",
              )}
            >
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="w-3 font-heading text-[10px] tabular-nums text-muted-foreground">
                  {i + 1}
                </span>
                <span className="truncate text-sm font-medium" title={STAGE_HINTS[stage]}>
                  {STAGE_LABELS[stage]}
                </span>
              </div>
              <Link
                href={href}
                className="flex h-6 cursor-pointer items-center"
                aria-label={STAGE_LABELS[stage]}
              >
                <div
                  className="meter-fill flex h-4 items-center justify-end rounded-sm bg-primary pr-1.5"
                  style={{ width: `${width}%` }}
                >
                  {step.standing > 0 ? (
                    <span className="size-1.5 rounded-full bg-cta shadow-sm" title="Đang đứng" />
                  ) : null}
                </div>
              </Link>
              <Link
                href={href}
                className="cursor-pointer text-right font-heading text-sm font-medium tabular-nums text-foreground transition-colors duration-200 hover:text-primary"
              >
                {step.entered === 0 ? "—" : formatNumber(step.entered)}
              </Link>
              <span className="hidden text-right font-heading text-[11px] tabular-nums text-muted-foreground md:block">
                {dur ? `${dur.value} ${dur.unit}` : conv == null ? "" : `${conv}%`}
              </span>
            </div>
          );
        })}
      </div>
      {compact ? null : selected ? (
        <div className="flex flex-col gap-2 border-t border-border/70 pt-3">
          <div className="text-sm font-medium">Đang đứng · {STAGE_LABELS[selected]}</div>
          {list.length === 0 ? (
            <p className="text-sm text-muted-foreground">Hàng đợi trống.</p>
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
        <p className="text-[11px] text-muted-foreground">Bấm một bước để xem đang đứng.</p>
      )}
    </div>
  );
}
