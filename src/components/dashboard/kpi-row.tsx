import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatD08Split, formatMedianP90, formatNumber, formatShare } from "@/lib/format";
import type { OverviewPayload } from "@/lib/types";

export function KpiRow({ data }: { data: OverviewPayload }) {
  const cycle = formatMedianP90(data.cycle_median_ms, data.cycle_p90_ms);
  const cards = [
    {
      title: "Story đã commit",
      value:
        data.committed === 0
          ? "Chưa có story commit"
          : `${formatNumber(data.committed)} story`,
      context:
        data.entered === 0
          ? "Chưa có story vào vòng trong kỳ này"
          : `${formatNumber(data.entered)} story vào vòng trong kỳ này`,
      how: "Thông lượng: số story đi hết tám bước đến commit. So với số vào vòng để biết loop có chảy ra repo không.",
    },
    {
      title: "Thời gian xong một story",
      value: cycle.value,
      context: cycle.detail,
      how: "Từ lúc story vào vòng đến lúc commit. Chờ khóa spec nằm trong số này — xem hàng nút thắt bên dưới để tách chờ / làm.",
    },
    {
      title: "Phải làm lại",
      value: formatShare(
        data.rework_rate,
        "story phải làm lại",
        "Chưa có story trong kỳ để tính tỷ lệ làm lại",
      ),
      context:
        data.rework_rate == null || data.rework_rate === 0
          ? "Không quay bước trước vì trả spec, test fail, hay review fail."
          : `Trong các story phải làm lại, trung vị ${formatNumber(data.rework_rounds_median ?? 0)} vòng.`,
      how: "Story đã đi tiếp rồi phải quay bước trước. First-pass ở cổng chất lượng nói “fail không”; đây nói “fail rồi làm lại bao nhiêu”.",
    },
    {
      title: "AI dừng để chốt với người",
      value:
        data.d08_median == null
          ? "Chưa đếm được"
          : `Trung vị ${formatNumber(data.d08_median)} lần / story`,
      context:
        data.d08_median == null
          ? "Chưa có story commit trong kỳ — happy path cũng có ít nhất 1 lần lúc khóa spec."
          : formatD08Split(data.d08_spec_lock_median ?? 0, data.d08_review_median ?? 0),
      how: "Mỗi lần AI tạm dừng để người chốt rồi AI chạy tiếp. Cao lúc khóa spec = US/spec chưa chốt. Cao lúc review = code chưa đạt spec đã khóa. Không phải người làm hộ.",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.title} size="sm">
          <CardHeader>
            <CardDescription>{c.title}</CardDescription>
            <CardTitle className="text-base text-pretty">{c.value}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-xs text-muted-foreground">
            <p>{c.context}</p>
            <p>{c.how}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
