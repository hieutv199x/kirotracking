import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatD08Split, formatDuration, formatNumber, formatShare } from "@/lib/format";
import type { PersonRow } from "@/lib/types";
import { InfoIcon } from "lucide-react";

export function PeopleTable({ rows }: { rows: PersonRow[] }) {
  const small = rows.some((r) => r.sample_small);
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        Thời gian xong = trung vị từ story vào vòng đến commit. Người làm hộ = người sửa giúp, không
        trả AI. AI dừng để chốt = AI tạm dừng, người quyết, AI chạy tiếp — tách lúc khóa spec và lúc
        review. Khóa spec rồi commit = trong các story đã khóa spec, bao nhiêu % đi đến commit.
      </p>
      {small ? (
        <Alert>
          <InfoIcon />
          <AlertTitle>Mẫu còn nhỏ — xem xu hướng loop, chưa xếp hạng người.</AlertTitle>
          <AlertDescription>
            Kỳ này có người dưới 8 story. Không sort tệ nhất / giỏi nhất.
          </AlertDescription>
        </Alert>
      ) : null}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Người</TableHead>
              <TableHead>Story vào vòng</TableHead>
              <TableHead>Story đã commit</TableHead>
              <TableHead>Thời gian xong (trung vị)</TableHead>
              <TableHead>Người làm hộ</TableHead>
              <TableHead>AI dừng để chốt</TableHead>
              <TableHead>Khóa spec rồi commit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.developer_id}>
                <TableCell>{r.name}</TableCell>
                <TableCell>
                  {r.stories === 0 ? "Không có" : `${formatNumber(r.stories)} story`}
                </TableCell>
                <TableCell>
                  {r.d01_committed === 0 ? "Chưa commit story nào" : `${formatNumber(r.d01_committed)} story`}
                </TableCell>
                <TableCell>
                  {formatDuration(r.d02_median_ms, {
                    empty: "chưa có story commit",
                    zero: "chưa có story commit",
                  })}
                </TableCell>
                <TableCell>
                  {formatShare(
                    r.d03_takeover_rate,
                    "story người làm hộ",
                    "chưa có story",
                  )}
                </TableCell>
                <TableCell>
                  {r.d08_median == null
                    ? "chưa có story commit để đếm"
                    : `Trung vị ${formatNumber(r.d08_median)} lần / story — ${formatD08Split(r.d08_spec_lock_median ?? 0, r.d08_review_median ?? 0)}`}
                </TableCell>
                <TableCell>
                  {formatShare(
                    r.d04_lock_then_commit,
                    "story đã khóa spec đi đến commit",
                    "chưa có story khóa spec",
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col gap-2 md:hidden">
        {rows.map((r) => (
          <Card key={r.developer_id} size="sm">
            <CardHeader>
              <CardTitle>{r.name}</CardTitle>
              <CardDescription>
                {r.stories === 0 ? "Không có story" : `${formatNumber(r.stories)} story vào vòng`}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-1 text-xs text-muted-foreground">
              <div>
                Đã commit:{" "}
                {r.d01_committed === 0 ? "chưa có" : `${formatNumber(r.d01_committed)} story`}
              </div>
              <div>
                Thời gian xong:{" "}
                {formatDuration(r.d02_median_ms, {
                  empty: "chưa có story commit",
                  zero: "chưa có story commit",
                })}
              </div>
              <div>
                Người làm hộ:{" "}
                {formatShare(r.d03_takeover_rate, "story người làm hộ", "chưa có story")}
              </div>
              <div>
                AI dừng để chốt:{" "}
                {r.d08_median == null
                  ? "chưa có story commit để đếm"
                  : `trung vị ${formatNumber(r.d08_median)} lần / story — ${formatD08Split(r.d08_spec_lock_median ?? 0, r.d08_review_median ?? 0)}`}
              </div>
              <div>
                Khóa spec rồi commit:{" "}
                {formatShare(
                  r.d04_lock_then_commit,
                  "story đã khóa spec đi đến commit",
                  "chưa có story khóa spec",
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
