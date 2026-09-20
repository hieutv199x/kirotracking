import { Card, CardContent } from "@/components/ui/card";
import { Hint, SectionHead } from "./hint";
import { Meter } from "./bars";
import { pctInt } from "@/lib/format";
import type { OverviewPayload } from "@/lib/types";

export function GatesRow({ data }: { data: OverviewPayload }) {
  const gates = [
    {
      title: "Khóa spec",
      value: pctInt(data.lk02),
      hint: "Khóa ngay lần trình đầu, không trả gen lại.",
    },
    {
      title: "Test xanh",
      value: pctInt(data.te01),
      hint: "Xanh ngay lần test đầu sau implement.",
    },
    {
      title: "Review đạt",
      value: pctInt(data.rv01),
      hint: "Pass review ngay vòng đầu.",
    },
  ];
  return (
    <section className="flex flex-col gap-4">
      <SectionHead title="Cổng đầu" hint="Tỷ lệ đạt ngay lần đầu. Thanh càng đầy càng ít bị trả." />
      <div className="grid gap-4 md:grid-cols-3">
        {gates.map((g) => (
          <Card key={g.title} size="sm">
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium tracking-wide text-muted-foreground">{g.title}</span>
                <Hint>{g.hint}</Hint>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-heading text-3xl font-semibold tabular-nums">
                  {g.value == null ? "—" : `${g.value}%`}
                </span>
              </div>
              <Meter value={g.value ?? 0} max={100} tone={g.value != null && g.value < 50 ? "rework" : "work"} />
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
