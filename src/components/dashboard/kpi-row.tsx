import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber, formatPct } from "@/lib/format";
import { formatCyclePair } from "@/lib/format";
import type { OverviewPayload } from "@/lib/types";

export function KpiRow({ data }: { data: OverviewPayload }) {
  const cards = [
    {
      title: "Đã commit",
      value: formatNumber(data.committed),
      hint: `${formatNumber(data.entered)} story vào loop`,
    },
    {
      title: "Cycle time",
      value: formatCyclePair(data.cycle_median_ms, data.cycle_p90_ms),
      hint: "H-01 trung vị + p90 — không dùng trung bình",
    },
    {
      title: "Rework",
      value: formatPct(data.rework_rate),
      hint:
        data.rework_rounds_median == null
          ? "H-03"
          : `trung vị ${formatNumber(data.rework_rounds_median)} vòng`,
    },
    {
      title: "Refine với người",
      value:
        data.d08_median == null
          ? "—"
          : `D-08 trung vị ${formatNumber(data.d08_median)} lần`,
      hint: `${data.d08_spec_lock_median ?? 0} khóa spec · ${data.d08_review_median ?? 0} review`,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.title} size="sm">
          <CardHeader>
            <CardDescription>{c.title}</CardDescription>
            <CardTitle className="text-base">{c.value}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">{c.hint}</CardContent>
        </Card>
      ))}
    </div>
  );
}
