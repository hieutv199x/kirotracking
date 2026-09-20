import Link from "next/link";
import { LOOP_STAGES, STAGE_LABELS, type LoopStage, type Period } from "@/lib/catalog";
import { STAGE_HINTS } from "@/lib/copy";
import { formatDuration, formatNumber, formatShare } from "@/lib/format";
import type { FunnelStep, StoryListItem } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function FunnelBoard({
  funnel,
  standing,
  period,
  selected,
  viewerId,
}: {
  funnel: FunnelStep[];
  standing: Record<LoopStage, StoryListItem[]>;
  period: Period;
  selected?: LoopStage | null;
  viewerId?: string;
}) {
  const list = selected ? standing[selected] ?? [] : [];

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-muted-foreground">
        Cùng một nhóm story đã vào vòng trong kỳ. Mỗi bậc: bao nhiêu story đã tới bước đó, bao nhiêu
        đang đứng, thường mất bao lâu, bao nhiêu phần trăm đi tiếp. Bấm một bậc để xem story đang kẹt.
      </p>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {LOOP_STAGES.map((stage, i) => {
          const step = funnel.find((f) => f.stage === stage);
          if (!step) return null;
          const isSelected = selected === stage;
          return (
            <Link
              key={stage}
              href={`?period=${period}&stand=${isSelected ? "" : stage}${viewerId && viewerId !== "lead" ? `&viewer=${viewerId}` : ""}`}
              aria-pressed={isSelected}
              className="text-left"
            >
              <Card
                size="sm"
                className={cn("h-full hover:bg-muted/40", isSelected && "ring-2 ring-foreground")}
              >
                <CardHeader>
                  <CardDescription>
                    Bước {i + 1} · {STAGE_LABELS[stage]}
                  </CardDescription>
                  <CardTitle className="text-base">
                    {step.entered === 0
                      ? "Chưa có story tới bước này"
                      : `${formatNumber(step.entered)} story đã tới`}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-1 text-xs text-muted-foreground">
                  <p>{STAGE_HINTS[stage]}</p>
                  <div>
                    {step.standing === 0
                      ? "Không có story đang đứng đây"
                      : `${formatNumber(step.standing)} story đang đứng đây`}
                  </div>
                  <div>
                    Thời gian bước này:{" "}
                    {formatDuration(step.median_ms, {
                      empty: "chưa đo được",
                      zero: "chưa đo được",
                    })}{" "}
                    (trung vị)
                  </div>
                  <div>
                    {step.conversion == null
                      ? "Không có bước sau"
                      : formatShare(
                          step.conversion,
                          "story đi tiếp bước sau",
                          "Chưa có story để tính tỷ lệ đi tiếp",
                        )}
                  </div>
                  {stage === "spec_lock" ? (
                    <div>
                      {step.extra?.lk03_median == null
                        ? "Chưa có lần trả spec"
                        : step.extra.lk03_median === 0
                          ? "Thường khóa ngay, không bị trả spec"
                          : `Thường bị trả spec ${formatNumber(step.extra.lk03_median)} lần trước khi khóa`}
                    </div>
                  ) : null}
                  {stage === "review" && step.extra ? (
                    <div>
                      {step.extra.rv02_blocker_median == null &&
                      step.extra.rv02_major_median == null
                        ? "Chưa có vòng review nên chưa đếm lỗi phát hiện lúc review"
                        : step.extra.rv02_blocker_median === 0 &&
                            step.extra.rv02_major_median === 0
                          ? "Thường không phát hiện lỗi lúc review"
                          : `Phát hiện lúc review (trung vị mỗi story): ${formatNumber(step.extra.rv02_blocker_median ?? 0)} lỗi chặn merge · ${formatNumber(step.extra.rv02_major_median ?? 0)} lỗi lớn`}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
      {selected ? (
        <div className="flex flex-col gap-2 rounded-xl border p-4">
          <div className="text-sm font-medium">
            Story đang đứng ở bước {STAGE_LABELS[selected]}
          </div>
          <p className="text-xs text-muted-foreground">
            Các story đã vào bước này mà chưa đi tiếp trong kỳ đang chọn.
          </p>
          {list.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Không có story đang kẹt ở bước này — hàng đợi bước này đang trống.
            </p>
          ) : (
            list.map((s) => (
              <Link
                key={s.story_id}
                href={`/stories/${s.story_id}?period=${period}`}
                className="flex items-center justify-between rounded-lg border p-2 text-sm"
              >
                <span>{s.story_id}</span>
                <Badge variant="outline">{s.developer_name}</Badge>
              </Link>
            ))
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Bấm một bước để xem story đang đứng.</p>
      )}
    </div>
  );
}
