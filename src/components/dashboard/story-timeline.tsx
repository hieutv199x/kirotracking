import { STAGE_LABELS } from "@/lib/catalog";
import { EVENT_LABELS, REWORK_LABELS, STAGE_HINTS, reworkPhrase } from "@/lib/copy";
import { formatD08Split, formatDuration, formatNumber, formatTimes } from "@/lib/format";
import type { StoredEvent, StoryRollup } from "@/lib/rollup";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const RESULT: Record<string, string> = {
  pass: "đạt",
  fail: "không đạt",
  returned: "trả spec",
  pending: "đang chờ người",
};

function roundsLabel(stage: string, rounds: number) {
  if (rounds <= 0) return "Chưa có vòng nào";
  const unit =
    stage === "test"
      ? "lần chạy test"
      : stage === "review"
        ? "vòng review"
        : stage === "spec_lock"
          ? "lần trình khóa"
          : "vòng";
  return `${formatNumber(rounds)} ${unit}`;
}

export function StoryTimeline({
  rollup,
  events,
}: {
  rollup: StoryRollup;
  events: StoredEvent[];
}) {
  const metrics = rollup.stage_metrics;
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="flex flex-col gap-3">
        <p className="text-xs text-muted-foreground">
          Tám bước của đúng story này. Mỗi bước: lúc bắt đầu / xong (hoặc đang chờ người), số vòng,
          và số lần AI dừng để chốt. Thời gian xong cả vòng:{" "}
          {formatDuration(rollup.cycle_time_ms, {
            empty: "chưa commit nên chưa có",
            zero: "chưa commit nên chưa có",
          })}
          .
        </p>
        <ol className="flex flex-col gap-3">
          {rollup.timeline.map((step, i) => (
            <li key={step.stage} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="size-2.5 rounded-full bg-foreground" />
                {i < rollup.timeline.length - 1 ? (
                  <div className="w-px flex-1 bg-border" />
                ) : null}
              </div>
              <div className="flex flex-1 flex-col gap-1 pb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{STAGE_LABELS[step.stage]}</span>
                  {step.waiting ? <Badge variant="outline">đang chờ người</Badge> : null}
                  {step.result ? <Badge variant="secondary">{RESULT[step.result]}</Badge> : null}
                </div>
                <p className="text-xs text-muted-foreground">{STAGE_HINTS[step.stage]}</p>
                <div className="text-xs text-muted-foreground">
                  {step.started_at
                    ? `Bắt đầu ${new Date(step.started_at).toLocaleString("vi-VN")}`
                    : "Chưa bắt đầu bước này"}
                  {step.completed_at
                    ? ` → xong ${new Date(step.completed_at).toLocaleString("vi-VN")}`
                    : step.started_at
                      ? " — chưa xong"
                      : ""}
                </div>
                <div className="text-xs text-muted-foreground">
                  Làm{" "}
                  {formatDuration(metrics[step.stage]?.work_ms, {
                    empty: "chưa đo được",
                    zero: "chưa ghi nhận",
                  })}{" "}
                  · Chờ{" "}
                  {formatDuration(metrics[step.stage]?.wait_ms, {
                    empty: "chưa đo được",
                    zero: "không chờ",
                  })}
                </div>
                <div className="text-xs text-muted-foreground">{roundsLabel(step.stage, step.rounds)}</div>
                {step.stage === "spec_lock" ? (
                  <div className="text-xs text-muted-foreground">
                    {rollup.d08_spec_lock === 0
                      ? "Chưa có lần AI dừng lúc khóa spec (happy path vẫn phải có ít nhất một lần trình khóa)."
                      : `AI dừng ${formatTimes(rollup.d08_spec_lock)} lúc khóa spec — kể cả lần khóa thành công.`}
                  </div>
                ) : null}
                {step.stage === "review" ? (
                  <div className="text-xs text-muted-foreground">
                    {rollup.d08_review === 0
                      ? "Không có lần AI dừng để người chốt lúc review (vòng chỉ AI thì không đếm)."
                      : `AI dừng ${formatTimes(rollup.d08_review)} lúc review để người chốt.`}
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </div>
      <div className="flex flex-col gap-3">
        <Card size="sm">
          <CardHeader>
            <CardTitle>Đạt ngay lần đầu — story này</CardTitle>
            <CardDescription>Có / không ở từng cổng. “Chưa tới cổng” = story chưa đi tới bước đó.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            <div>Khóa spec ngay lần trình đầu: {yn(rollup.first_lock_pass)}</div>
            <div>Test xanh lần chạy đầu: {yn(rollup.first_test_pass)}</div>
            <div>Review đạt vòng đầu: {yn(rollup.first_review_pass)}</div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>Làm lại, làm hộ, kẹt ngoài loop</CardTitle>
            <CardDescription>Ba tín hiệu khác nhau — đừng gộp.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <div>
              {reworkPhrase(rollup.rework_branches)}
              {rollup.rework
                ? ` (${formatNumber(rollup.rework_rounds)} vòng: ${rollup.rework_branches.map((b) => REWORK_LABELS[b] ?? b).join(", ")})`
                : ""}
            </div>
            <div>
              Người làm hộ, không trả AI: {rollup.takeover ? "có" : "không"}
            </div>
            <div>
              Kẹt ngoài loop (môi trường, quyền…, không phải chờ khóa spec):{" "}
              {rollup.h04_count === 0
                ? "không lần nào"
                : `${formatTimes(rollup.h04_count)} · ${formatDuration(rollup.h04_ms, { empty: "chưa đo được", zero: "không đáng kể" })}`}
            </div>
            <div>
              AI dừng để chốt với người:{" "}
              {rollup.d08_total === 0
                ? "chưa có lần nào"
                : `${formatTimes(rollup.d08_total)} — ${formatD08Split(rollup.d08_spec_lock, rollup.d08_review, rollup.d08_other)}`}
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>Nhật ký bước</CardTitle>
            <CardDescription>Sự kiện đã cộng thành timeline — đọc visualization, không phải debugger ingest.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {events.length === 0 ? (
              <p className="text-xs text-muted-foreground">Chưa có sự kiện trên story này.</p>
            ) : (
              events.map((ev) => (
                <div key={ev.event_id} className="text-xs">
                  <div className="font-medium">{EVENT_LABELS[ev.name] ?? ev.name}</div>
                  <div className="text-muted-foreground">
                    {new Date(ev.occurred_at).toLocaleString("vi-VN")}
                    {ev.stage ? ` · ${STAGE_LABELS[ev.stage as keyof typeof STAGE_LABELS] ?? ev.stage}` : ""}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function yn(v: number | null) {
  if (v == null) return "chưa tới cổng";
  return v === 1 ? "có" : "không";
}
