import type { LoopStage, Period } from "./catalog";

export type StageMetric = { work_ms: number; wait_ms: number };

export type TimelineStep = {
  stage: LoopStage;
  started_at: string | null;
  completed_at: string | null;
  waiting: boolean;
  rounds: number;
  result: "pass" | "fail" | "returned" | "pending" | null;
};

export type Viewer = "lead" | string;

export type FunnelStep = {
  stage: LoopStage;
  entered: number;
  standing: number;
  median_ms: number | null;
  conversion: number | null;
  extra?: {
    lk03_median?: number | null;
    rv02_blocker_median?: number | null;
    rv02_major_median?: number | null;
  };
};

export type OverviewPayload = {
  period: Period;
  org_empty: boolean;
  period_empty: boolean;
  stale: boolean;
  computed_at: string;
  entered: number;
  committed: number;
  cycle_median_ms: number | null;
  cycle_p90_ms: number | null;
  rework_rate: number | null;
  rework_rounds_median: number | null;
  d08_median: number | null;
  d08_spec_lock_median: number | null;
  d08_review_median: number | null;
  d08_spec_lock_sum: number;
  d08_review_sum: number;
  d08_other_sum: number;
  takeover_rate: number | null;
  lk02: number | null;
  te01: number | null;
  rv01: number | null;
  bottleneck: Record<LoopStage, StageMetric & { highlight: boolean }>;
  funnel: FunnelStep[];
  wip_open: number;
  show_wip: boolean;
};

export type StoryRollup = {
  org_id: string;
  story_id: string;
  developer_id: string;
  status: "open" | "committed" | "cancelled";
  current_stage: LoopStage | null;
  received_at: string | null;
  committed_at: string | null;
  cancelled_at: string | null;
  cycle_time_ms: number | null;
  first_lock_pass: number | null;
  first_test_pass: number | null;
  first_review_pass: number | null;
  reached_lock: number;
  reached_test: number;
  reached_review: number;
  spec_locked: number;
  rework: number;
  rework_rounds: number;
  rework_branches: string[];
  d08_total: number;
  d08_spec_lock: number;
  d08_review: number;
  d08_other: number;
  takeover: number;
  h04_count: number;
  h04_ms: number;
  lk03_returns: number;
  rv02_blocker: number;
  rv02_major: number;
  te03_runs: number;
  rv04_rounds: number;
  stage_metrics: Record<LoopStage, StageMetric>;
  timeline: TimelineStep[];
  updated_at: string;
};

export type StoryListItem = {
  story_id: string;
  developer_id: string;
  developer_name: string;
  current_stage: LoopStage | null;
  age_ms: number | null;
  d08_total: number;
  d08_spec_lock: number;
  d08_review: number;
  rework: boolean;
  rework_branches: string[];
  status: "open" | "committed" | "cancelled";
  received_at: string | null;
  committed_at: string | null;
};

export type PersonRow = {
  developer_id: string;
  name: string;
  stories: number;
  d01_committed: number;
  d02_median_ms: number | null;
  d03_takeover_rate: number | null;
  d08_median: number | null;
  d08_spec_lock_median: number | null;
  d08_review_median: number | null;
  d04_lock_then_commit: number | null;
  sample_small: boolean;
};
