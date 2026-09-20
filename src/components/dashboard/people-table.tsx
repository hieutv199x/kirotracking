import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDuration, formatNumber, formatPct } from "@/lib/format";
import type { PersonRow } from "@/lib/types";
import { InfoIcon } from "lucide-react";

export function PeopleTable({ rows }: { rows: PersonRow[] }) {
  const small = rows.some((r) => r.sample_small);
  return (
    <div className="flex flex-col gap-3">
      {small ? (
        <Alert>
          <InfoIcon />
          <AlertTitle>Mẫu còn nhỏ — xem xu hướng loop, chưa xếp hạng người.</AlertTitle>
          <AlertDescription>
            Kỳ này có người dưới 8 story. Không sort tệ nhất / giỏi nhất.
          </AlertDescription>
        </Alert>
      ) : null}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Người</TableHead>
            <TableHead>Số story</TableHead>
            <TableHead>D-01 commit</TableHead>
            <TableHead>D-02 cycle</TableHead>
            <TableHead>D-03 takeover</TableHead>
            <TableHead>D-08</TableHead>
            <TableHead>D-04 khóa rồi commit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.developer_id}>
              <TableCell>{r.name}</TableCell>
              <TableCell>{formatNumber(r.stories)}</TableCell>
              <TableCell>{formatNumber(r.d01_committed)}</TableCell>
              <TableCell>{formatDuration(r.d02_median_ms)}</TableCell>
              <TableCell>{formatPct(r.d03_takeover_rate)}</TableCell>
              <TableCell>
                {r.d08_median == null
                  ? "—"
                  : `${formatNumber(r.d08_median)} · ${formatNumber(r.d08_spec_lock_median ?? 0)} khóa · ${formatNumber(r.d08_review_median ?? 0)} review`}
              </TableCell>
              <TableCell>{formatPct(r.d04_lock_then_commit)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
