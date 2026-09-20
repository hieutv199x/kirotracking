import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Hint } from "./hint";
import { Meter, StackedBar } from "./bars";
import { durationParts, formatNumber, pctInt } from "@/lib/format";
import type { OverviewPayload } from "@/lib/types";

export function KpiRow({ data }: { data: OverviewPayload }) {
  const cycle = durationParts(data.cycle_median_ms);
  const p90 = durationParts(data.cycle_p90_ms);
  const rework = pctInt(data.rework_rate);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Kpi
        label="Đã commit"
        hint="Story đi hết tám bước đến commit."
        value={data.committed === 0 ? "—" : formatNumber(data.committed)}
        unit="story"
        quiet={data.entered === 0 ? "Chưa có vào vòng" : `${formatNumber(data.entered)} vào`}
      >
        <Meter value={data.committed} max={Math.max(data.entered, 1)} tone="work" />
      </Kpi>

      <Kpi
        label="Thời gian xong"
        hint="Từ story vào vòng đến commit. Trung vị, không trung bình."
        value={cycle?.value ?? "—"}
        unit={cycle?.unit ?? ""}
        quiet={p90 ? `p90 ${p90.value} ${p90.unit}` : "Chưa có commit"}
      >
        <Meter
          value={data.cycle_median_ms ?? 0}
          max={data.cycle_p90_ms ?? data.cycle_median_ms ?? 1}
          tone="work"
        />
      </Kpi>

      <Kpi
        label="Làm lại"
        hint="Story đã đi tiếp rồi phải quay bước trước."
        value={rework == null ? "—" : `${rework}`}
        unit={rework == null ? "" : "%"}
        quiet={
          rework == null
            ? "Chưa đủ mẫu"
            : rework === 0
              ? "Không quay bước"
              : data.rework_rounds_median
                ? `trung vị ${formatNumber(data.rework_rounds_median)} vòng`
                : null
        }
      >
        <Meter value={rework ?? 0} max={100} tone="rework" />
      </Kpi>

      <Kpi
        label="AI dừng"
        hint="Mỗi lần AI tạm dừng để người chốt. Cột đặc = khóa spec, mờ = review."
        value={data.d08_median == null ? "—" : formatNumber(data.d08_median)}
        unit={data.d08_median == null ? "" : "lần"}
        quiet={
          data.d08_median == null
            ? "Chưa có commit"
            : `${formatNumber(data.d08_spec_lock_median ?? 0)} khóa · ${formatNumber(data.d08_review_median ?? 0)} review`
        }
      >
        <StackedBar
          parts={[
            { key: "lock", n: data.d08_spec_lock_median ?? 0, tone: "lock" },
            { key: "review", n: data.d08_review_median ?? 0, tone: "review" },
          ]}
        />
      </Kpi>
    </div>
  );
}

function Kpi({
  label,
  hint,
  value,
  unit,
  quiet,
  children,
}: {
  label: string;
  hint: string;
  value: string;
  unit: string;
  quiet: string | null;
  children: ReactNode;
}) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium tracking-wide text-muted-foreground">{label}</span>
          <Hint>{hint}</Hint>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-heading text-3xl font-semibold tracking-tight tabular-nums">{value}</span>
          {unit ? <span className="text-sm text-muted-foreground">{unit}</span> : null}
        </div>
        {children}
        {quiet ? <p className="text-xs tabular-nums text-muted-foreground">{quiet}</p> : null}
      </CardContent>
    </Card>
  );
}
