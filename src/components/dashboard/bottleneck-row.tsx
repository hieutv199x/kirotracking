import { LOOP_STAGES, STAGE_LABELS } from "@/lib/catalog";
import { formatDuration } from "@/lib/format";
import type { OverviewPayload } from "@/lib/types";
import { cn } from "@/lib/utils";

export function BottleneckRow({ data }: { data: OverviewPayload }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-heading text-sm font-medium">Nút thắt 8 bước</h2>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-8">
        {LOOP_STAGES.map((stage) => {
          const col = data.bottleneck[stage];
          return (
            <div
              key={stage}
              className={cn(
                "flex flex-col gap-1 rounded-xl border p-2",
                col?.highlight && "ring-2 ring-foreground",
              )}
            >
              <div className="text-xs font-medium">{STAGE_LABELS[stage]}</div>
              <div className="text-xs text-muted-foreground">
                Làm {formatDuration(col?.work_ms ?? 0)}
              </div>
              <div className="text-xs text-muted-foreground">
                Chờ {formatDuration(col?.wait_ms ?? 0)}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        Cycle time dài mà chờ khóa spec chiếm phần lớn thì đừng tối ưu implement.
      </p>
    </section>
  );
}
