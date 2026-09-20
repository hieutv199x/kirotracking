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
    <div className="flex flex-col gap-4">
      {!compact ? (
        <SectionHead title="Phễu 8 bước" hint="Cùng nhóm story đã vào vòng. Bấm một bậc để xem đang đứng." />
      ) : (
        <SectionHead title="Phễu" hint="Độ dài thanh = số story đã tới bước đó. Chấm trắng = đang đứng." />
      )}
      <div className="flex flex-col gap-1">
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
          return (
            <div
              key={stage}
              className={cn(
                "grid grid-cols-[8.5rem_minmax(0,1fr)_auto] items-center gap-2 rounded-lg px-1 py-1 md:grid-cols-[9.5rem_minmax(0,1fr)_3.5rem_4.5rem]",
                isSelected && "bg-muted",
              )}
            >
              <div className="flex min-w-0 items-center gap-1">
                <span className="w-3 text-xs tabular-nums text-muted-foreground">{i + 1}</span>
                <span className="truncate text-sm font-medium" title={STAGE_HINTS[stage]}>
                  {STAGE_LABELS[stage]}
                </span>
              </div>
              <Link href={href} className="flex h-6 items-center" aria-label={STAGE_LABELS[stage]}>
                <div
                  className="flex h-5 items-center justify-end rounded-sm bg-foreground pr-2"
                  style={{ width: `${width}%` }}
                >
                  {step.standing > 0 ? (
                    <span className="size-1.5 rounded-full bg-background" />
                  ) : null}
                </div>
              </Link>
              <Link href={href} className="text-right text-sm font-medium tabular-nums">
                {step.entered === 0 ? "—" : formatNumber(step.entered)}
              </Link>
              <span className="hidden text-right text-xs tabular-nums text-muted-foreground md:block">
                {dur ? `${dur.value} ${dur.unit}` : conv == null ? "" : `${conv}%`}
              </span>
            </div>
          );
        })}
      </div>
      {compact ? null : selected ? (
        <div className="flex flex-col gap-2">
          <div className="text-sm font-medium">Đang đứng · {STAGE_LABELS[selected]}</div>
          {list.length === 0 ? (
            <p className="text-sm text-muted-foreground">Hàng đợi trống.</p>
          ) : (
            list.map((s) => (
              <Link
                key={s.story_id}
                href={`/stories/${s.story_id}?period=${period}`}
                className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
              >
                <span className="font-medium">{s.story_id}</span>
                <Badge variant="outline">{s.developer_name}</Badge>
              </Link>
            ))
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Bấm một bước.</p>
      )}
    </div>
  );
}
