import { LOOP_STAGES, PERIOD_LABELS, type LoopStage, type Period } from "./catalog";
import type { FunnelStep, OverviewPayload, StoryRollup } from "./types";

export function periodRange(period: Period, now = new Date()) {
  const startOfToday = startOfTodayVn(now);
  if (period === "today") {
    return { start: startOfToday.toISOString(), end: now.toISOString(), label: PERIOD_LABELS[period] };
  }
  const days = period === "7d" ? 6 : 29;
  const start = new Date(startOfToday.getTime() - days * 24 * 3600_000);
  return { start: start.toISOString(), end: now.toISOString(), label: PERIOD_LABELS[period] };
}

export function startOfTodayVn(now = new Date()) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const dateStr = fmt.format(now);
  return new Date(`${dateStr}T00:00:00+07:00`);
}

export function inRange(iso: string | null | undefined, start: string, end: string) {
  if (!iso) return false;
  return iso >= start && iso <= end;
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? Math.round((s[mid - 1] + s[mid]) / 2) : s[mid];
}

export function p90(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const idx = Math.min(s.length - 1, Math.ceil(s.length * 0.9) - 1);
  return s[Math.max(0, idx)];
}

export function rate(num: number, den: number): number | null {
  if (den === 0) return null;
  return num / den;
}

function enteredStage(story: StoryRollup, stage: LoopStage): boolean {
  const t = story.timeline.find((x) => x.stage === stage);
  if (stage === "intake") return Boolean(story.received_at);
  if (stage === "commit") return Boolean(story.committed_at || story.timeline.find((x) => x.stage === "review")?.result === "pass");
  return Boolean(t?.started_at);
}

function standingAt(story: StoryRollup, stage: LoopStage): boolean {
  return story.status === "open" && story.current_stage === stage;
}

function stageDuration(story: StoryRollup, stage: LoopStage): number | null {
  const m = story.stage_metrics[stage];
  if (!m) return null;
  const total = m.work_ms + m.wait_ms;
  return total > 0 ? total : null;
}

export function buildOverviewFromStories(
  allStories: StoryRollup[],
  range: { start: string; end: string },
  period: Period,
): OverviewPayload {
  const cohort = allStories.filter((s) => inRange(s.received_at, range.start, range.end));
  const committed = allStories.filter((s) => inRange(s.committed_at, range.start, range.end));
  const cycle = committed
    .map((s) => s.cycle_time_ms)
    .filter((n): n is number => n != null);
  const reworkStories = cohort.filter((s) => s.rework);
  const d08Committed = committed.map((s) => s.d08_total);
  const d08Lock = committed.map((s) => s.d08_spec_lock);
  const d08Review = committed.map((s) => s.d08_review);
  const cycleMedian = median(cycle);

  const bottleneck = Object.fromEntries(
    LOOP_STAGES.map((stage) => {
      const waits = cohort.map((s) => s.stage_metrics[stage]?.wait_ms ?? 0);
      const works = cohort.map((s) => s.stage_metrics[stage]?.work_ms ?? 0);
      const waitMed = median(waits) ?? 0;
      const workMed = median(works) ?? 0;
      const highlight =
        cycleMedian != null && cycleMedian > 0 && waitMed >= 0.4 * cycleMedian;
      return [stage, { work_ms: workMed, wait_ms: waitMed, highlight }];
    }),
  ) as OverviewPayload["bottleneck"];

  const funnel: FunnelStep[] = LOOP_STAGES.map((stage, i) => {
    const next = LOOP_STAGES[i + 1];
    const entered = cohort.filter((s) => enteredStage(s, stage)).length;
    const standing = cohort.filter((s) => standingAt(s, stage)).length;
    const durations = cohort
      .map((s) => stageDuration(s, stage))
      .filter((n): n is number => n != null);
    const extra: FunnelStep["extra"] = {};
    if (stage === "spec_lock") {
      extra.lk03_median = median(cohort.filter((s) => s.reached_lock).map((s) => s.lk03_returns));
    }
    if (stage === "review") {
      extra.rv02_blocker_median = median(
        cohort.filter((s) => s.reached_review).map((s) => s.rv02_blocker),
      );
      extra.rv02_major_median = median(
        cohort.filter((s) => s.reached_review).map((s) => s.rv02_major),
      );
    }
    return {
      stage,
      entered,
      standing,
      median_ms: median(durations),
      conversion: next ? rate(cohort.filter((s) => enteredStage(s, next)).length, entered) : null,
      extra: Object.keys(extra).length ? extra : undefined,
    };
  });

  const lockReached = cohort.filter((s) => s.reached_lock && s.first_lock_pass != null);
  const testReached = cohort.filter((s) => s.reached_test && s.first_test_pass != null);
  const reviewReached = cohort.filter((s) => s.reached_review && s.first_review_pass != null);
  const wip_open = allStories.filter((s) => s.status === "open").length;

  return {
    period,
    org_empty: allStories.length === 0,
    period_empty: cohort.length === 0,
    stale: false,
    computed_at: new Date().toISOString(),
    entered: cohort.length,
    committed: committed.length,
    cycle_median_ms: cycleMedian,
    cycle_p90_ms: p90(cycle),
    rework_rate: rate(reworkStories.length, cohort.length),
    rework_rounds_median: median(reworkStories.map((s) => s.rework_rounds)),
    d08_median: median(d08Committed),
    d08_spec_lock_median: median(d08Lock),
    d08_review_median: median(d08Review),
    d08_spec_lock_sum: cohort.reduce((n, s) => n + s.d08_spec_lock, 0),
    d08_review_sum: cohort.reduce((n, s) => n + s.d08_review, 0),
    d08_other_sum: cohort.reduce((n, s) => n + s.d08_other, 0),
    takeover_rate: rate(cohort.filter((s) => s.takeover).length, cohort.length),
    lk02: rate(lockReached.filter((s) => s.first_lock_pass === 1).length, lockReached.length),
    te01: rate(testReached.filter((s) => s.first_test_pass === 1).length, testReached.length),
    rv01: rate(reviewReached.filter((s) => s.first_review_pass === 1).length, reviewReached.length),
    bottleneck,
    funnel,
    wip_open,
    show_wip: wip_open >= 20,
  };
}
