import { formatNumber, formatShare } from "@/lib/format";
import type { OverviewPayload } from "@/lib/types";

export function D08Bar({ data }: { data: OverviewPayload }) {
  const total = data.d08_spec_lock_sum + data.d08_review_sum + data.d08_other_sum;
  const parts = [
    {
      key: "spec_lock",
      label: "Lúc khóa spec",
      n: data.d08_spec_lock_sum,
      className: "bg-foreground",
    },
    {
      key: "review",
      label: "Lúc review",
      n: data.d08_review_sum,
      className: "bg-foreground/60",
    },
    {
      key: "other",
      label: "Bước khác (testcase, implement…)",
      n: data.d08_other_sum,
      className: "bg-foreground/25",
    },
  ];
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-sm font-medium">
          AI dừng để chốt với người — tách hai cổng
        </h2>
        <p className="text-xs text-muted-foreground">
          Đếm từng lần AI tạm dừng, người chốt, AI chạy tiếp. Happy path cũng có ít nhất một lần lúc
          khóa spec. Không gộp với người làm hộ (takeover) hay blocker môi trường.
        </p>
      </div>
      {total === 0 ? (
        <p className="text-sm text-muted-foreground">
          Chưa có lần AI dừng để chốt với người trong kỳ này. Khi loop chạy, thanh này tách lần dừng
          lúc khóa spec khỏi lúc review.
        </p>
      ) : (
        <div className="flex h-3 overflow-hidden rounded-full bg-muted">
          {parts.map((p) =>
            p.n <= 0 ? null : (
              <div
                key={p.key}
                className={p.className}
                style={{ width: `${(p.n / total) * 100}%` }}
                title={`${p.label}: ${formatNumber(p.n)} lần`}
              />
            ),
          )}
        </div>
      )}
      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
        {parts.map((p) => (
          <span key={p.key}>
            {p.label}: {p.n === 0 ? "không lần nào" : `${formatNumber(p.n)} lần`}
          </span>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Nhiều lần lúc khóa spec = US/spec chưa chốt được. Nhiều lần lúc review = implement/test chưa
        đạt spec đã khóa.
      </p>
      <p className="text-xs text-muted-foreground">
        Người làm hộ (không trả AI):{" "}
        {formatShare(
          data.takeover_rate,
          "story có người làm thay loop",
          "Chưa có story để tính tỷ lệ làm hộ",
        )}
        {data.takeover_rate != null &&
        data.takeover_rate > 0.8 &&
        (data.cycle_median_ms ?? 0) < 8 * 3600_000
          ? " Thời gian xong thấp mà gần như story nào cũng làm hộ — người đang gánh loop, không phải loop tự chạy."
          : null}
      </p>
    </section>
  );
}
