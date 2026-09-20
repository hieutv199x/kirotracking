import { STAGE_LABELS } from "@/lib/catalog";
import { EVENT_LABELS, reworkPhrase } from "@/lib/copy";
import { durationParts, formatDuration, formatNumber } from "@/lib/format";
import type { StoredEvent, StoryRollup } from "@/lib/rollup";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DualBar, LegendDot, StackedBar } from "./bars";
import { SectionHead } from "./hint";

const RESULT: Record<string, string> = {
  pass: "đạt",
  fail: "fail",
  returned: "trả",
  pending: "chờ",
};

export function StoryTimeline({
  rollup,
  events,
}: {
  rollup: StoryRollup;
  events: StoredEvent[];
}) {
  const metrics = rollup.stage_metrics;
  const max = Math.max(
    1,
    ...rollup.timeline.map((s) => (metrics[s.stage]?.work_ms ?? 0) + (metrics[s.stage]?.wait_ms ?? 0)),
  );
  const cycle = durationParts(rollup.cycle_time_ms);

  return (
    <div className="reveal flex flex-col gap-5">
      <div className="panel panel-pad flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span className="font-heading text-3xl font-semibold tabular-nums text-primary">
            {cycle?.value ?? "—"}
          </span>
          <span className="text-sm text-muted-foreground">
            {cycle ? cycle.unit : "chưa commit"}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <LegendDot tone="work" label="Làm" />
          <LegendDot tone="wait" label="Chờ" />
          <LegendDot tone="lock" label="Khóa spec" />
          <LegendDot tone="review" label="Review" />
        </div>
      </div>

      <ol className="panel panel-pad flex flex-col gap-0">
        {rollup.timeline.map((step, i) => {
          const work = metrics[step.stage]?.work_ms ?? 0;
          const wait = metrics[step.stage]?.wait_ms ?? 0;
          const started = Boolean(step.started_at);
          return (
            <li key={step.stage} className="grid grid-cols-[1.25rem_minmax(0,1fr)] gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "size-2.5 rounded-full transition-colors duration-200",
                    step.waiting
                      ? "bg-wait ring-2 ring-primary/30"
                      : started
                        ? "bg-primary"
                        : "bg-muted",
                  )}
                />
                {i < rollup.timeline.length - 1 ? (
                  <div className="w-px flex-1 bg-border" />
                ) : null}
              </div>
              <div className="flex flex-col gap-2 pb-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{STAGE_LABELS[step.stage]}</span>
                  {step.waiting ? <Badge variant="outline">chờ</Badge> : null}
                  {step.result ? <Badge variant="secondary">{RESULT[step.result]}</Badge> : null}
                  {step.rounds > 0 ? (
                    <span className="font-heading text-xs tabular-nums text-muted-foreground">
                      {formatNumber(step.rounds)} vòng
                    </span>
                  ) : null}
                </div>
                <DualBar work={work} wait={wait} max={max} />
                <div className="flex flex-wrap gap-3 font-heading text-xs tabular-nums text-muted-foreground">
                  <span>làm {formatDuration(work, { empty: "—", zero: "—" })}</span>
                  <span>chờ {formatDuration(wait, { empty: "—", zero: "—" })}</span>
                  {step.stage === "spec_lock" ? (
                    <span>{formatNumber(rollup.d08_spec_lock)} khóa spec</span>
                  ) : null}
                  {step.stage === "review" ? (
                    <span>{formatNumber(rollup.d08_review)} review</span>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="grid gap-3 sm:grid-cols-3">
        <Chip label="Khóa spec" ok={rollup.first_lock_pass} />
        <Chip label="Test xanh" ok={rollup.first_test_pass} />
        <Chip label="Review đạt" ok={rollup.first_review_pass} />
      </div>

      <div className="panel panel-pad flex flex-col gap-3">
        <SectionHead title="AI dừng" hint="Đặc = lúc khóa spec. Mờ = lúc review." />
        <StackedBar
          size="lg"
          parts={[
            { key: "lock", n: rollup.d08_spec_lock, tone: "lock" },
            { key: "review", n: rollup.d08_review, tone: "review" },
            { key: "other", n: rollup.d08_other, tone: "wait" },
          ]}
        />
        <div className="flex flex-wrap gap-4 text-sm">
          <span>
            <span className="font-heading font-medium tabular-nums">
              {formatNumber(rollup.d08_total)}
            </span>{" "}
            <span className="text-muted-foreground">lần</span>
          </span>
          <span className="text-muted-foreground">{reworkPhrase(rollup.rework_branches)}</span>
          {rollup.takeover ? <Badge variant="destructive">làm hộ</Badge> : null}
        </div>
      </div>

      <div className="panel panel-pad flex flex-col gap-2">
        <SectionHead title="Nhật ký" />
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có sự kiện.</p>
        ) : (
          <ol className="flex flex-col">
            {events.map((ev) => (
              <li
                key={ev.event_id}
                className="flex items-baseline justify-between gap-3 border-b border-border/60 py-2 text-xs last:border-0 transition-colors duration-200 hover:bg-secondary/40"
              >
                <span className="font-medium">{EVENT_LABELS[ev.name] ?? ev.name}</span>
                <span className="shrink-0 font-heading tabular-nums text-muted-foreground">
                  {new Date(ev.occurred_at).toLocaleString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

function Chip({ label, ok }: { label: string; ok: number | null }) {
  return (
    <div className="panel flex items-center justify-between px-4 py-3">
      <span className="text-sm">{label}</span>
      <span
        className={cn(
          "size-2.5 rounded-full",
          ok == null ? "bg-muted" : ok === 1 ? "bg-ok" : "bg-destructive",
        )}
        title={ok == null ? "chưa tới" : ok === 1 ? "đạt lần đầu" : "không đạt lần đầu"}
      />
    </div>
  );
}
