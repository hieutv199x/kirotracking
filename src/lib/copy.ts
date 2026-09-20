import type { LoopStage } from "./catalog";

export const STAGE_HINTS: Record<LoopStage, string> = {
  intake: "Người nhập user story vào vòng.",
  spec_gen: "AI viết tài liệu kỹ thuật, so với code hiện có và story trước.",
  spec_lock: "Người chốt spec. AI dừng chờ — cổng bắt buộc, kể cả khi khóa ngay lần đầu.",
  testcase: "Sinh test từ spec đã khóa, trước khi viết code.",
  implement: "Viết/sửa code trên spec và testcase đã có.",
  test: "Chạy bộ test đã gen (cộng test sẵn của repo).",
  review: "Cổng chất lượng trước commit. Fail thì quay implement / test / spec.",
  commit: "Story hoàn tất loop khi commit thành công.",
};

export const EVENT_LABELS: Record<string, string> = {
  story_received: "Story vào vòng",
  ready: "Story đủ để gen spec",
  spec_gen_started: "Bắt đầu gen spec",
  spec_gen_round: "Một vòng gen spec",
  spec_submitted_for_lock: "Trình spec để người khóa",
  spec_locked: "Người đã khóa spec",
  spec_returned: "Người trả spec, gen lại",
  testcase_gen_started: "Bắt đầu gen testcase",
  testcase_gen_completed: "Xong gen testcase",
  testcase_gen_round: "Một vòng gen testcase",
  implement_started: "Bắt đầu implement",
  implement_completed: "Xong implement",
  implement_round: "Một vòng implement",
  test_started: "Bắt đầu chạy test",
  test_run_completed: "Một lần chạy test",
  test_passed: "Test xanh",
  test_failed: "Test fail",
  review_started: "Bắt đầu review",
  review_round_completed: "Một vòng review",
  review_passed: "Review đạt",
  review_failed: "Review không đạt",
  refine_with_human_started: "AI dừng để chốt với người",
  refine_with_human_resumed: "AI chạy tiếp sau khi người chốt",
  committed: "Đã commit",
  blocked: "Bị chặn ngoài loop",
  unblocked: "Hết chặn",
  human_intervention: "Người làm hộ, không trả AI",
  cancelled: "Hủy story",
};

export const REWORK_LABELS: Record<string, string> = {
  spec: "trả spec",
  test: "test fail",
  review: "review fail",
};

export function reworkPhrase(branches: string[]) {
  if (branches.length === 0) return "không phải làm lại";
  return `phải làm lại vì ${branches.map((b) => REWORK_LABELS[b] ?? b).join(", ")}`;
}

export const STATUS_LABELS = {
  open: "đang mở",
  committed: "đã commit",
  cancelled: "đã hủy",
} as const;
