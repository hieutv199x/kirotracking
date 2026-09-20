import Link from "next/link";
import { STAGE_LABELS, type Period } from "@/lib/catalog";
import { STATUS_LABELS, reworkPhrase } from "@/lib/copy";
import { durationParts, formatNumber } from "@/lib/format";
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
import { StackedBar } from "./bars";

export function StoryList({
  stories,
  period,
}: {
  stories: StoryListItem[];
  period: Period;
}) {
  return (
    <>
      <div className="panel hidden overflow-hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Story</TableHead>
              <TableHead>Người</TableHead>
              <TableHead>Bước</TableHead>
              <TableHead>Tuổi</TableHead>
              <TableHead>AI dừng</TableHead>
              <TableHead>Làm lại</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stories.map((s) => {
              const age = durationParts(s.age_ms);
              return (
                <TableRow
                  key={s.story_id}
                  className="transition-colors duration-200 hover:bg-secondary/50"
                >
                  <TableCell>
                    <Link
                      href={`/stories/${s.story_id}?period=${period}`}
                      className="cursor-pointer font-heading font-medium text-primary underline-offset-4 transition-colors duration-200 hover:underline"
                    >
                      {s.story_id}
                    </Link>
                  </TableCell>
                  <TableCell>{s.developer_name}</TableCell>
                  <TableCell>{s.current_stage ? STAGE_LABELS[s.current_stage] : "—"}</TableCell>
                  <TableCell className="font-heading tabular-nums">
                    {age ? `${age.value} ${age.unit}` : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex w-32 flex-col gap-1">
                      <span className="font-heading tabular-nums">
                        {s.d08_total === 0 ? "—" : `${formatNumber(s.d08_total)} lần`}
                      </span>
                      <StackedBar
                        size="sm"
                        parts={[
                          { key: "l", n: s.d08_spec_lock, tone: "lock" },
                          { key: "r", n: s.d08_review, tone: "review" },
                        ]}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    {s.rework ? (
                      <Badge variant="destructive">{reworkPhrase(s.rework_branches)}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{STATUS_LABELS[s.status]}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col gap-2 md:hidden">
        {stories.map((s) => {
          const age = durationParts(s.age_ms);
          return (
            <Link
              key={s.story_id}
              href={`/stories/${s.story_id}?period=${period}`}
              className="panel panel-pad flex cursor-pointer flex-col gap-2 transition-colors duration-200 hover:border-primary/40 hover:bg-secondary/40"
            >
              <div className="font-heading text-sm font-semibold text-primary">{s.story_id}</div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{s.developer_name}</span>
                <span>{s.current_stage ? STAGE_LABELS[s.current_stage] : "—"}</span>
              </div>
              <div className="flex justify-between font-heading text-xs tabular-nums">
                <span>{age ? `${age.value} ${age.unit}` : "—"}</span>
                <span>{s.d08_total === 0 ? "—" : `${formatNumber(s.d08_total)} lần`}</span>
              </div>
              <StackedBar
                size="sm"
                parts={[
                  { key: "l", n: s.d08_spec_lock, tone: "lock" },
                  { key: "r", n: s.d08_review, tone: "review" },
                ]}
              />
            </Link>
          );
        })}
      </div>
    </>
  );
}
