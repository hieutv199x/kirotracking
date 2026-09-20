import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatShare } from "@/lib/format";
import type { OverviewPayload } from "@/lib/types";

export function GatesRow({ data }: { data: OverviewPayload }) {
  const gates = [
    {
      title: "Khóa spec ngay lần trình đầu",
      value: formatShare(
        data.lk02,
        "story được khóa ngay, không trả gen lại",
        "Chưa có story tới cổng khóa spec",
      ),
      how: "Người chốt tài liệu kỹ thuật lần đầu. Fail cổng này thì testcase/implement đang xây trên spec chưa chốt.",
    },
    {
      title: "Test xanh lần chạy đầu",
      value: formatShare(
        data.te01,
        "story xanh ngay lần test đầu sau implement",
        "Chưa có story tới bước test",
      ),
      how: "Tín hiệu chất lượng implement trên spec + testcase đã khóa. Fail lần đầu rồi xanh sau vài vòng là bình thường.",
    },
    {
      title: "Review đạt vòng đầu",
      value: formatShare(
        data.rv01,
        "story pass review ngay vòng đầu",
        "Chưa có story tới bước review",
      ),
      how: "Cổng chất lượng cuối trước commit. Test xanh chưa đủ nếu review fail.",
    },
  ];
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-sm font-medium">Cổng chất lượng — đạt ngay lần đầu</h2>
        <p className="text-xs text-muted-foreground">
          Tỷ lệ story không bị trả về ở từng cổng người/test. Không gộp với số lần AI dừng để chốt.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {gates.map((g) => (
          <Card key={g.title} size="sm">
            <CardHeader>
              <CardDescription>{g.title}</CardDescription>
              <CardTitle className="text-base text-pretty">{g.value}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">{g.how}</CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
