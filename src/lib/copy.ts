import type { LoopStage } from "./catalog";

export const STAGE_HINTS: Record<LoopStage, string> = {
  intake: "Human enters the user story into the loop.",
  spec_gen: "AI drafts the tech spec against current code and prior stories.",
  spec_lock: "Human locks the spec. AI waits — required gate, even on first pass.",
  testcase: "Generate tests from the locked spec before writing code.",
  implement: "Write or change code against the locked spec and tests.",
  test: "Run the generated suite (plus existing repo tests).",
  review: "Quality gate before commit. Fail sends work back.",
  commit: "Story completes the loop when commit succeeds.",
};

export const EVENT_LABELS: Record<string, string> = {
  story_received: "Story entered the loop",
  ready: "Story ready for spec gen",
  spec_gen_started: "Spec gen started",
  spec_gen_round: "Spec gen round",
  spec_submitted_for_lock: "Spec submitted for lock",
  spec_locked: "Spec locked by human",
  spec_returned: "Spec returned for rewrite",
  testcase_gen_started: "Testcase gen started",
  testcase_gen_completed: "Testcase gen finished",
  testcase_gen_round: "Testcase gen round",
  implement_started: "Implement started",
  implement_completed: "Implement finished",
  implement_round: "Implement round",
  test_started: "Tests started",
  test_run_completed: "Test run finished",
  test_passed: "Tests passed",
  test_failed: "Tests failed",
  review_started: "Review started",
  review_round_completed: "Review round",
  review_passed: "Review passed",
  review_failed: "Review failed",
  refine_with_human_started: "AI paused for human decision",
  refine_with_human_resumed: "AI resumed after human decision",
  committed: "Committed",
  blocked: "Blocked outside the loop",
  unblocked: "Unblocked",
  human_intervention: "Human takeover (not handed back to AI)",
  cancelled: "Story cancelled",
};

export const REWORK_LABELS: Record<string, string> = {
  spec: "spec return",
  test: "test fail",
  review: "review fail",
};

export function reworkPhrase(branches: string[]) {
  if (branches.length === 0) return "no rework";
  return `rework due to ${branches.map((b) => REWORK_LABELS[b] ?? b).join(", ")}`;
}

export const STATUS_LABELS = {
  open: "open",
  committed: "committed",
  cancelled: "cancelled",
} as const;
