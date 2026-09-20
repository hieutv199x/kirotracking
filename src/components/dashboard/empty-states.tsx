import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { PERIOD_LABELS, type Period } from "@/lib/catalog";

export function OrgEmpty() {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyTitle>Chưa có story để hiển thị.</EmptyTitle>
        <EmptyDescription>
          Khi vòng Kiro trên máy đã đẩy event và job đã cộng, tổng quan sẽ hiện số story
          vào/commit, thời gian xong một story, tỷ lệ phải làm lại, và phễu 8 bước.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

export function PeriodEmpty({ period }: { period: Period }) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyTitle>Không có story trong {PERIOD_LABELS[period].toLowerCase()} này.</EmptyTitle>
        <EmptyDescription>
          Đổi kỳ để xem vòng đã commit trước đó.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

export function FunnelEmpty() {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyTitle>Chưa dựng được phễu đủ 8 bước.</EmptyTitle>
        <EmptyDescription>
          Story chưa qua khóa spec / chưa có stage — đợi loop chạy tiếp, không nhập tay
          trên dashboard.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

export function MeEmpty() {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyTitle>Bạn chưa có story trong kỳ này.</EmptyTitle>
        <EmptyDescription>
          Story của team vẫn xem được trên Tổng quan (nếu đúng quyền).
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

export function ReadError({ message = "Không tải được tổng quan." }: { message?: string }) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyTitle>{message}</EmptyTitle>
        <EmptyDescription>Thử lại. Event trên máy không mất — chỉ UI.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
