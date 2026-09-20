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
        <EmptyTitle>No stories yet.</EmptyTitle>
      </EmptyHeader>
    </Empty>
  );
}

export function PeriodEmpty({ period }: { period: Period }) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyTitle>No stories in {PERIOD_LABELS[period].toLowerCase()}.</EmptyTitle>
      </EmptyHeader>
    </Empty>
  );
}

export function FunnelEmpty() {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyTitle>Funnel does not have all 8 steps yet.</EmptyTitle>
      </EmptyHeader>
    </Empty>
  );
}

export function MeEmpty() {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyTitle>You have no stories in this period.</EmptyTitle>
      </EmptyHeader>
    </Empty>
  );
}

export function ReadError({ message = "Could not load overview." }: { message?: string }) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyTitle>{message}</EmptyTitle>
      </EmptyHeader>
    </Empty>
  );
}
