import Link from "next/link";
import { STAGE_LABELS, type Period } from "@/lib/catalog";
import { STATUS_LABELS, reworkPhrase } from "@/lib/copy";
import { formatD08Split, formatDuration, formatNumber } from "@/lib/format";
import type { StoryListItem } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function d08Cell(s: StoryListItem) {
  if (s.d08_total === 0) return "Chưa có lần AI dừng để chốt với người";
  return `${formatNumber(s.d08_total)} lần — ${formatD08Split(s.d08_spec_lock, s.d08_review)}`;
}

export function StoryList({
  stories,
  period,
}: {
  stories: StoryListItem[];
  period: Period;
}) {
  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Story</TableHead>
              <TableHead>Người</TableHead>
              <TableHead>Bước hiện tại</TableHead>
              <TableHead>Đã ở trong vòng (từ lúc vào)</TableHead>
              <TableHead>AI dừng để chốt</TableHead>
              <TableHead>Phải làm lại</TableHead>
              <TableHead>Trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stories.map((s) => (
              <TableRow key={s.story_id}>
                <TableCell>
                  <Link href={`/stories/${s.story_id}?period=${period}`} className="underline-offset-4 hover:underline">
                    {s.story_id}
                  </Link>
                </TableCell>
                <TableCell>{s.developer_name}</TableCell>
                <TableCell>{s.current_stage ? STAGE_LABELS[s.current_stage] : "Chưa có bước"}</TableCell>
                <TableCell>
                  {formatDuration(s.age_ms, { empty: "không rõ", zero: "vừa vào" })}
                </TableCell>
                <TableCell>{d08Cell(s)}</TableCell>
                <TableCell>{reworkPhrase(s.rework_branches)}</TableCell>
                <TableCell>
                  <Badge variant="outline">{STATUS_LABELS[s.status]}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col gap-2 md:hidden">
        {stories.map((s) => (
          <Link key={s.story_id} href={`/stories/${s.story_id}?period=${period}`}>
            <Card size="sm">
              <CardHeader>
                <CardTitle>{s.story_id}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1 text-xs text-muted-foreground">
                <div>{s.developer_name}</div>
                <div>
                  {s.current_stage ? STAGE_LABELS[s.current_stage] : "Chưa có bước"} ·{" "}
                  {STATUS_LABELS[s.status]}
                </div>
                <div>
                  Đã ở trong vòng{" "}
                  {formatDuration(s.age_ms, { empty: "không rõ", zero: "vừa vào" })}
                </div>
                <div>AI dừng để chốt: {d08Cell(s)}</div>
                <div>{reworkPhrase(s.rework_branches)}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
