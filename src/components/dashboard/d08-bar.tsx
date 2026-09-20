import { formatNumber, formatPct } from "@/lib/format";
import type { OverviewPayload } from "@/lib/types";

export function D08Bar({ data }: { data: OverviewPayload }) {
  const total = data.d08_spec_lock_sum + data.d08_review_sum + data.d08_other_sum;
  const parts = [
    { key: "spec_lock", label: "Khóa spec", n: data.d08_spec_lock_sum, className: "bg-foreground" },
    { key: "review", label: "Review", n: data.d08_review_sum, className: "bg-foreground/60" },
    { key: "other", label: "Khác", n: data.d08_other_sum, className: "bg-foreground/25" },
  ];
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-heading text-sm font-medium">D-08 theo cổng</h2>
      {total === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có lần refine với người trong kỳ.</p>
      ) : (
        <div className="flex h-3 overflow-hidden rounded-full bg-muted">
          {parts.map((p) =>
            p.n <= 0 ? null : (
              <div
                key={p.key}
                className={p.className}
                style={{ width: `${(p.n / total) * 100}%` }}
                title={`${p.label}: ${p.n}`}
              />
            ),
          )}
        </div>
      )}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        {parts.map((p) => (
          <span key={p.key}>
            {p.label}: {formatNumber(p.n)}
          </span>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Cao ở khóa spec = US/spec chưa chốt. Cao ở review = implement/test chưa đạt spec đã
        khóa. Không gộp với takeover.
      </p>
      <p className="text-xs text-muted-foreground">
        Takeover (D-03): {formatPct(data.takeover_rate)} story có cờ người làm hộ.
        {data.takeover_rate != null && data.takeover_rate > 0.8 && (data.cycle_median_ms ?? 0) < 8 * 3600_000
          ? " Người đang gánh loop, không phải loop tự chạy."
          : null}
      </p>
    </section>
  );
}
