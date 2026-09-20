export const MVP_EVENT_NAMES = [
  "story_received",
  "ready",
  "spec_gen_started",
  "spec_gen_round",
  "spec_submitted_for_lock",
  "spec_locked",
  "spec_returned",
  "testcase_gen_started",
  "testcase_gen_completed",
  "testcase_gen_round",
  "implement_started",
  "implement_completed",
  "implement_round",
  "test_started",
  "test_run_completed",
  "test_passed",
  "test_failed",
  "review_started",
  "review_round_completed",
  "review_passed",
  "review_failed",
  "refine_with_human_started",
  "refine_with_human_resumed",
  "committed",
  "blocked",
  "unblocked",
  "human_intervention",
  "cancelled",
] as const;

export type EventName = (typeof MVP_EVENT_NAMES)[number];

export const EVENT_NAME_SET = new Set<string>(MVP_EVENT_NAMES);

export const LOOP_STAGES = [
  "intake",
  "spec_gen",
  "spec_lock",
  "testcase",
  "implement",
  "test",
  "review",
  "commit",
] as const;

export type LoopStage = (typeof LOOP_STAGES)[number];

export const STAGE_SET = new Set<string>(LOOP_STAGES);

export const REFINE_STAGES = [
  "spec_gen",
  "spec_lock",
  "testcase",
  "implement",
  "test",
  "review",
  "commit",
] as const;

export type RefineStage = (typeof REFINE_STAGES)[number];

export const STAGE_LABELS: Record<LoopStage, string> = {
  intake: "Intake",
  spec_gen: "Gen spec",
  spec_lock: "Lock spec",
  testcase: "Gen tests",
  implement: "Implement",
  test: "Test",
  review: "Review",
  commit: "Commit",
};

/** Short labels for dense column charts */
export const STAGE_SHORT: Record<LoopStage, string> = {
  intake: "Intake",
  spec_gen: "Spec",
  spec_lock: "Lock",
  testcase: "Tests",
  implement: "Impl",
  test: "Test",
  review: "Review",
  commit: "Commit",
};

export const PERIODS = ["today", "7d", "30d"] as const;
export type Period = (typeof PERIODS)[number];

export const PERIOD_LABELS: Record<Period, string> = {
  today: "Today",
  "7d": "7 days",
  "30d": "30 days",
};

export const DEVELOPERS = [
  { id: "lan", name: "Lan Nguyen" },
  { id: "minh", name: "Minh Tran" },
  { id: "hoa", name: "Hoa Pham" },
  { id: "khang", name: "Khang Le" },
] as const;

export const DEVELOPER_NAMES: Record<string, string> = Object.fromEntries(
  DEVELOPERS.map((d) => [d.id, d.name]),
);

export const ORG_ID = "acme";
export const ORG_NAME = "Acme";

export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const MAX_EVENTS_PER_BATCH = 100;
export const MAX_BODY_BYTES = 256 * 1024;
export const D08_DEDUPE_WINDOW_MS = 5000;
export const ROLLUP_DEBOUNCE_MS = 5000;
export const RATE_LIMIT_PER_SEC = 10;
export const RATE_LIMIT_BURST = 30;
