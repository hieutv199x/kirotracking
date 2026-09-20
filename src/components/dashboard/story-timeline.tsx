import { STAGE_LABELS } from "@/lib/catalog";
import { formatDuration } from "@/lib/format";
import type { StoredEvent, StoryRollup } from "@/lib/rollup";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const RESULT: Record<string, string> = {
  pass: "đạt",
  fail: "fail",
  returned: "trả spec",
  pending: "đang chờ người",
};

export function StoryTimeline({
  rollup,
  events,
}: {
  rollup: StoryRollup;
  events: StoredEvent[];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
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
              <div className="text-xs text-muted-foreground">
                {step.started_at
                  ? new Date(step.started_at).toLocaleString("vi-VN")
                  : "chưa bắt đầu"}
                {step.completed_at
                  ? ` → ${new Date(step.completed_at).toLocaleString("vi-VN")}`
                  : ""}
              </div>
              <div className="text-xs text-muted-foreground">
                {step.rounds} vòng
                {rollup.d08_total > 0 && step.stage === "spec_lock"
                  ? ` · D-08 khóa spec ${rollup.d08_spec_lock}`
                  : ""}
                {step.stage === "review" && rollup.d08_review
                  ? ` · D-08 review ${rollup.d08_review}`
                  : ""}
              </div>
            </div>
          </li>
        ))}
      </ol>
      <div className="flex flex-col gap-3">
        <Card size="sm">
          <CardHeader>
            <CardTitle>Cổng first-pass</CardTitle>
            <CardDescription>Đúng story này</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            <div>Khóa spec: {yn(rollup.first_lock_pass)}</div>
            <div>Test: {yn(rollup.first_test_pass)}</div>
            <div>Review: {yn(rollup.first_review_pass)}</div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>Rework / takeover / blocker</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            <div>
              Rework: {rollup.rework ? rollup.rework_branches.join(" · ") : "không"} (
              {rollup.rework_rounds} vòng)
            </div>
            <div>Takeover (D-03): {rollup.takeover ? "có" : "không"}</div>
            <div>
              Blocker ngoài cổng (H-04): {rollup.h04_count} lần ·{" "}
              {formatDuration(rollup.h04_ms)}
            </div>
            <div>D-08 tổng {rollup.d08_total} · khóa spec {rollup.d08_spec_lock} · review {rollup.d08_review}</div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>Nhật ký bước</CardTitle>
            <CardDescription>Event catalog đã rollup thành timeline</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {events.map((ev) => (
              <div key={ev.event_id} className="text-xs">
                <div className="font-medium">{ev.name}</div>
                <div className="text-muted-foreground">
                  {new Date(ev.occurred_at).toLocaleString("vi-VN")} · {ev.stage}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function yn(v: number | null) {
  if (v == null) return "chưa tới cổng";
  return v === 1 ? "đạt lần đầu" : "không";
}
