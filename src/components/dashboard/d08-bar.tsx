import { formatNumber, formatShare } from "@/lib/format";
import type { OverviewPayload } from "@/lib/types";
import { LegendDot, Meter, StackedBar } from "./bars";
import { SectionHead } from "./hint";

export function D08Bar({ data }: { data: OverviewPayload }) {
  const total = data.d08_spec_lock_sum + data.d08_review_sum + data.d08_other_sum;
  const takeover = formatShare(data.takeover_rate, "story làm hộ", "—");

  return (
    <section className="reveal panel panel-pad flex flex-col gap-3" style={{ animationDelay: "120ms" }}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionHead
          title="Chốt với người"
          hint="AI tạm dừng, người quyết, AI chạy tiếp. Đặc = khóa spec. Mờ = review."
        />
        <div className="flex items-center gap-3">
          <LegendDot tone="lock" label="Khóa spec" />
          <LegendDot tone="review" label="Review" />
        </div>
      </div>
      <StackedBar
        size="lg"
        parts={[
          { key: "lock", n: data.d08_spec_lock_sum, tone: "lock" },
          { key: "review", n: data.d08_review_sum, tone: "review" },
          { key: "other", n: data.d08_other_sum, tone: "wait" },
        ]}
      />
      <div className="grid grid-cols-3 gap-3 text-sm">
        <Split n={data.d08_spec_lock_sum} total={total} label="Khóa spec" />
        <Split n={data.d08_review_sum} total={total} label="Review" />
        <Split n={data.d08_other_sum} total={total} label="Khác" />
      </div>
      {data.takeover_rate != null && data.takeover_rate > 0 ? (
        <div className="flex flex-col gap-1.5 border-t border-border/70 pt-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Người làm hộ</span>
            <span className="font-heading tabular-nums text-destructive">{takeover}</span>
          </div>
          <Meter value={data.takeover_rate} max={1} tone="rework" />
        </div>
      ) : null}
    </section>
  );
}

function Split({ n, total, label }: { n: number; total: number; label: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-heading text-xl font-semibold tabular-nums text-foreground">
        {n === 0 ? "—" : formatNumber(n)}
      </span>
      <span className="text-[11px] text-muted-foreground">
        {label}
        {total > 0 && n > 0 ? ` · ${Math.round((n / total) * 100)}%` : ""}
      </span>
    </div>
  );
}
