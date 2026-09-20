import { LOOP_STAGES, STAGE_LABELS } from "@/lib/catalog";
import { STAGE_HINTS } from "@/lib/copy";
import { formatDuration } from "@/lib/format";
import type { OverviewPayload } from "@/lib/types";
import { cn } from "@/lib/utils";

export function BottleneckRow({ data }: { data: OverviewPayload }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-sm font-medium">Nút thắt — làm vs chờ ở 8 bước</h2>
        <p className="text-xs text-muted-foreground">
          Mỗi cột là thời gian trung vị. <strong className="font-medium text-foreground">Làm</strong>{" "}
          = AI/dev đang chạy bước đó. <strong className="font-medium text-foreground">Chờ</strong>{" "}
          = đứng đợi (khóa spec = chờ người chốt). Cột tô đậm khi chờ chiếm ≥ 40% thời gian xong một
          story — đừng tối ưu implement nếu đang kẹt ở chờ khóa spec.
        </p>
      </div>
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
                Làm{" "}
                {formatDuration(col?.work_ms, {
                  empty: "chưa đo được",
                  zero: "chưa ghi nhận",
                })}
              </div>
              <div className="text-xs text-muted-foreground">
                Chờ{" "}
                {formatDuration(col?.wait_ms, {
                  empty: "chưa đo được",
                  zero: "không chờ",
                })}
              </div>
              <p className="text-[11px] leading-snug text-muted-foreground">{STAGE_HINTS[stage]}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
