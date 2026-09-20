import {
  Empty,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { PERIOD_LABELS, type Period } from "@/lib/catalog";

export function OrgEmpty() {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyTitle>Chưa có story.</EmptyTitle>
      </EmptyHeader>
    </Empty>
  );
}

export function PeriodEmpty({ period }: { period: Period }) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyTitle>Không có story trong {PERIOD_LABELS[period].toLowerCase()}.</EmptyTitle>
      </EmptyHeader>
    </Empty>
  );
}

export function FunnelEmpty() {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyTitle>Phễu chưa đủ 8 bước.</EmptyTitle>
      </EmptyHeader>
    </Empty>
  );
}

export function MeEmpty() {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyTitle>Bạn chưa có story trong kỳ này.</EmptyTitle>
      </EmptyHeader>
    </Empty>
  );
}

export function ReadError({ message = "Không tải được tổng quan." }: { message?: string }) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyTitle>{message}</EmptyTitle>
      </EmptyHeader>
    </Empty>
  );
}
