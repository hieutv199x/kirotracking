import Link from "next/link";
import { STAGE_LABELS, type Period } from "@/lib/catalog";
import { formatDuration, formatNumber } from "@/lib/format";
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
import { LockIcon, MessageSquareIcon } from "lucide-react";

const STATUS: Record<StoryListItem["status"], string> = {
  open: "đang mở",
  committed: "committed",
  cancelled: "cancelled",
};

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
              <TableHead>story_id</TableHead>
              <TableHead>Người</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Tuổi</TableHead>
              <TableHead>D-08</TableHead>
              <TableHead>Rework</TableHead>
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
                <TableCell>{s.current_stage ? STAGE_LABELS[s.current_stage] : "—"}</TableCell>
                <TableCell>{formatDuration(s.age_ms)}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1">
                    {formatNumber(s.d08_total)}
                    {s.d08_spec_lock > 0 ? <LockIcon /> : null}
                    {s.d08_review > 0 ? <MessageSquareIcon /> : null}
                  </span>
                </TableCell>
                <TableCell>
                  {s.rework ? s.rework_branches.join(" · ") : "không"}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{STATUS[s.status]}</Badge>
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
                  {s.current_stage ? STAGE_LABELS[s.current_stage] : "—"} · {STATUS[s.status]}
                </div>
                <div>
                  Tuổi {formatDuration(s.age_ms)} · D-08 {formatNumber(s.d08_total)}
                </div>
                <div>Rework {s.rework ? s.rework_branches.join(" · ") : "không"}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
