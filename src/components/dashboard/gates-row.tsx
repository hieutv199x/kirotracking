import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPct } from "@/lib/format";
import type { OverviewPayload } from "@/lib/types";

export function GatesRow({ data }: { data: OverviewPayload }) {
  const gates = [
    { title: "Khóa spec lần đầu", value: data.lk02, id: "LK-02" },
    { title: "Test xanh lần đầu", value: data.te01, id: "TE-01" },
    { title: "Review đạt lần đầu", value: data.rv01, id: "RV-01" },
  ];
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-heading text-sm font-medium">Cổng chất lượng</h2>
      <div className="grid gap-3 md:grid-cols-3">
        {gates.map((g) => (
          <Card key={g.id} size="sm">
            <CardHeader>
              <CardDescription>
                {g.title} · {g.id}
              </CardDescription>
              <CardTitle>{formatPct(g.value)}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  );
}
