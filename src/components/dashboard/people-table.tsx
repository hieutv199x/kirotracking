import type { ReactNode } from "react";
import { Alert, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { durationParts, formatNumber, pctInt } from "@/lib/format";
import type { PersonRow } from "@/lib/types";
import { InfoIcon } from "lucide-react";
import { LegendDot, Meter, StackedBar } from "./bars";
import { SectionHead } from "./hint";

export function PeopleTable({ rows }: { rows: PersonRow[] }) {
  const small = rows.some((r) => r.sample_small);
  return (
    <div className="reveal flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionHead title="Theo người" hint="Sắp theo số story vào vòng, không phải xếp hạng." />
        <div className="flex items-center gap-3">
          <LegendDot tone="lock" label="Khóa spec" />
          <LegendDot tone="review" label="Review" />
        </div>
      </div>
      {small ? (
        <Alert>
          <InfoIcon />
          <AlertTitle>Mẫu nhỏ — xem xu hướng, chưa xếp hạng.</AlertTitle>
        </Alert>
      ) : null}
      <div className="panel hidden overflow-hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Người</TableHead>
              <TableHead>Vào / xong</TableHead>
              <TableHead>Thời gian</TableHead>
              <TableHead>Làm hộ</TableHead>
              <TableHead>AI dừng</TableHead>
              <TableHead>Khóa → commit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow
                key={r.developer_id}
                className="transition-colors duration-200 hover:bg-secondary/50"
              >
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell>
                  <div className="flex w-36 flex-col gap-1">
                    <span className="font-heading tabular-nums">
                      {formatNumber(r.d01_committed)}/{formatNumber(r.stories)}
                    </span>
                    <Meter value={r.d01_committed} max={Math.max(r.stories, 1)} />
                  </div>
                </TableCell>
                <TableCell className="font-heading tabular-nums">{fmtDur(r.d02_median_ms)}</TableCell>
                <TableCell>
                  <div className="flex w-28 flex-col gap-1">
                    <span className="font-heading tabular-nums">{pctOrDash(r.d03_takeover_rate)}</span>
                    <Meter value={r.d03_takeover_rate ?? 0} max={1} tone="rework" />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex w-36 flex-col gap-1">
                    <span className="font-heading tabular-nums">
                      {r.d08_median == null ? "—" : `${formatNumber(r.d08_median)} lần`}
                    </span>
                    <StackedBar
                      size="sm"
                      parts={[
                        { key: "l", n: r.d08_spec_lock_median ?? 0, tone: "lock" },
                        { key: "r", n: r.d08_review_median ?? 0, tone: "review" },
                      ]}
                    />
                  </div>
                </TableCell>
                <TableCell className="font-heading tabular-nums">
                  {pctOrDash(r.d04_lock_then_commit)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col gap-2 md:hidden">
        {rows.map((r) => (
          <div key={r.developer_id} className="panel panel-pad flex flex-col gap-3">
            <div className="text-sm font-semibold">{r.name}</div>
            <Row label="Vào / xong" value={`${formatNumber(r.d01_committed)}/${formatNumber(r.stories)}`}>
              <Meter value={r.d01_committed} max={Math.max(r.stories, 1)} />
            </Row>
            <Row label="Thời gian" value={fmtDur(r.d02_median_ms)} />
            <Row label="Làm hộ" value={pctOrDash(r.d03_takeover_rate)}>
              <Meter value={r.d03_takeover_rate ?? 0} max={1} tone="rework" />
            </Row>
            <Row
              label="AI dừng"
              value={r.d08_median == null ? "—" : `${formatNumber(r.d08_median)} lần`}
            >
              <StackedBar
                size="sm"
                parts={[
                  { key: "l", n: r.d08_spec_lock_median ?? 0, tone: "lock" },
                  { key: "r", n: r.d08_review_median ?? 0, tone: "review" },
                ]}
              />
            </Row>
            <Row label="Khóa → commit" value={pctOrDash(r.d04_lock_then_commit)} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-heading font-medium tabular-nums">{value}</span>
      </div>
      {children}
    </div>
  );
}

function fmtDur(ms: number | null) {
  const p = durationParts(ms);
  return p ? `${p.value} ${p.unit}` : "—";
}

function pctOrDash(rate: number | null) {
  const n = pctInt(rate);
  return n == null ? "—" : `${n}%`;
}
