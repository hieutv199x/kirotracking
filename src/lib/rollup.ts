import {
  D08_DEDUPE_WINDOW_MS,
  LOOP_STAGES,
  PERIODS,
  type LoopStage,
} from "./catalog";
import { getDb, setMeta } from "./db";
import type { OverviewPayload, StageMetric, StoryRollup, TimelineStep } from "./types";
import { buildOverviewFromStories, periodRange } from "./queries-shared";

export type StoredEvent = {
  event_id: string;
  developer_id: string;
  name: string;
  stage: string | null;
  occurred_at: string;
  payload: Record<string, unknown>;
  session_id: string | null;
};

export type { StoryRollup };

function ms(a: string | null | undefined, b: string | null | undefined) {
  if (!a || !b) return 0;
  const d = Date.parse(b) - Date.parse(a);
  return d > 0 ? d : 0;
}

function emptyMetrics(): Record<LoopStage, StageMetric> {
  return Object.fromEntries(
    LOOP_STAGES.map((s) => [s, { work_ms: 0, wait_ms: 0 }]),
  ) as Record<LoopStage, StageMetric>;
}

function payloadOf(row: { payload: string }) {
  try {
    return JSON.parse(row.payload) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function computeStoryRollup(
  orgId: string,
  storyId: string,
  events: StoredEvent[],
): StoryRollup {
  const sorted = [...events].sort((a, b) => {
    const c = a.occurred_at.localeCompare(b.occurred_at);
    return c !== 0 ? c : a.event_id.localeCompare(b.event_id);
  });

  const first = <T extends StoredEvent>(name: string) =>
    sorted.find((e) => e.name === name) as T | undefined;
  const all = (name: string) => sorted.filter((e) => e.name === name);

  const received = first("story_received");
  const developerId = received?.developer_id ?? sorted[0]?.developer_id ?? "unknown";
  const receivedAt = received?.occurred_at ?? sorted[0]?.occurred_at ?? null;
  const readyEvent = first("ready");
  const readyAt =
    readyEvent?.occurred_at ??
    (received?.payload.ready === true ? received.occurred_at : receivedAt);

  const specGenStarts = all("spec_gen_started");
  const submits = all("spec_submitted_for_lock");
  const returns = all("spec_returned");
  const locked = first("spec_locked");
  const testcaseStarts = all("testcase_gen_started");
  const testcaseCompletes = all("testcase_gen_completed");
  const implementStarts = all("implement_started");
  const implementCompletes = all("implement_completed");
  const testStarts = all("test_started");
  const testRuns = all("test_run_completed");
  const testPassed = first("test_passed");
  const testFailed = all("test_failed");
  const reviewStarts = all("review_started");
  const reviewRounds = all("review_round_completed");
  const reviewPassed = first("review_passed");
  const reviewFailed = all("review_failed");
  const committed = first("committed");
  const cancelled = first("cancelled");
  const blocked = all("blocked");
  const takeover = all("human_intervention").length > 0 ? 1 : 0;

  const refineStarts = all("refine_with_human_started");
  const d08Seen: { stage: string; at: number }[] = [];
  for (const ev of refineStarts) {
    const stage =
      (typeof ev.payload.stage === "string" && ev.payload.stage) ||
      ev.stage ||
      "other";
    const at = Date.parse(ev.occurred_at);
    const dup = d08Seen.some(
      (s) => s.stage === stage && Math.abs(s.at - at) <= D08_DEDUPE_WINDOW_MS,
    );
    if (!dup) d08Seen.push({ stage, at });
  }
  const d08_spec_lock = d08Seen.filter((s) => s.stage === "spec_lock").length;
  const d08_review = d08Seen.filter((s) => s.stage === "review").length;
  const d08_other = d08Seen.length - d08_spec_lock - d08_review;

  const firstSubmit = submits[0];
  const firstReturnBeforeLock = returns.find(
    (r) => !locked || r.occurred_at < locked.occurred_at,
  );
  const reached_lock = firstSubmit || locked ? 1 : 0;
  const first_lock_pass = !reached_lock
    ? null
    : firstReturnBeforeLock &&
        (!locked || firstReturnBeforeLock.occurred_at < locked.occurred_at)
      ? 0
      : locked
        ? 1
        : null;

  const firstRun = testRuns[0];
  const reached_test = testStarts.length || testRuns.length ? 1 : 0;
  const first_test_pass = !firstRun
    ? null
    : firstRun.payload.result === "pass"
      ? 1
      : 0;

  const firstReviewRound = reviewRounds[0];
  const reached_review = reviewStarts.length || reviewRounds.length ? 1 : 0;
  const first_review_pass = !firstReviewRound
    ? null
    : firstReviewRound.payload.result === "pass"
      ? 1
      : 0;

  const reworkBranches: string[] = [];
  if (returns.length > 0) reworkBranches.push("spec");
  if (testFailed.length > 0 || testRuns.some((r) => r.payload.result === "fail")) {
    reworkBranches.push("test");
  }
  if (reviewFailed.length > 0 || reviewRounds.some((r) => r.payload.result === "fail")) {
    reworkBranches.push("review");
  }
  const rework_rounds =
    returns.length +
    testRuns.filter((r) => r.payload.result === "fail").length +
    reviewRounds.filter((r) => r.payload.result === "fail").length;

  let h04_ms = 0;
  let openBlock: string | null = null;
  for (const ev of sorted) {
    if (ev.name === "blocked") openBlock = ev.occurred_at;
    if (ev.name === "unblocked" && openBlock) {
      h04_ms += ms(openBlock, ev.occurred_at);
      openBlock = null;
    }
  }
  if (openBlock) h04_ms += ms(openBlock, new Date().toISOString());

  const metrics = emptyMetrics();
  const specGenStartedAt = specGenStarts[0]?.occurred_at ?? null;
  metrics.intake.work_ms = ms(receivedAt, readyAt);
  metrics.intake.wait_ms = ms(readyAt, specGenStartedAt);

  const firstSubmitAt = firstSubmit?.occurred_at ?? null;
  metrics.spec_gen.work_ms = ms(specGenStartedAt, firstSubmitAt);
  for (let i = 0; i < returns.length; i++) {
    const nextGen = specGenStarts.find((g) => g.occurred_at >= returns[i].occurred_at);
    const nextSubmit = submits.find(
      (s) => s.occurred_at >= (nextGen?.occurred_at ?? returns[i].occurred_at),
    );
    if (nextGen && nextSubmit) {
      metrics.spec_gen.work_ms += ms(nextGen.occurred_at, nextSubmit.occurred_at);
    }
  }

  for (const submit of submits) {
    const end =
      returns.find((r) => r.occurred_at >= submit.occurred_at)?.occurred_at ??
      locked?.occurred_at ??
      null;
    metrics.spec_lock.wait_ms += ms(submit.occurred_at, end);
  }

  const tcStart = testcaseStarts[0]?.occurred_at ?? null;
  const tcEnd = testcaseCompletes[0]?.occurred_at ?? null;
  metrics.testcase.wait_ms = ms(locked?.occurred_at, tcStart);
  metrics.testcase.work_ms = ms(tcStart, tcEnd);

  const imStart = implementStarts[0]?.occurred_at ?? null;
  const imEnd = implementCompletes[0]?.occurred_at ?? null;
  metrics.implement.wait_ms = ms(tcEnd, imStart);
  metrics.implement.work_ms = ms(imStart, imEnd);
  for (let i = 1; i < implementStarts.length; i++) {
    const end = implementCompletes[i]?.occurred_at ?? implementCompletes.at(-1)?.occurred_at;
    metrics.implement.work_ms += ms(implementStarts[i].occurred_at, end);
  }

  const teStart = testStarts[0]?.occurred_at ?? null;
  const teEnd = testPassed?.occurred_at ?? testRuns.at(-1)?.occurred_at ?? null;
  metrics.test.wait_ms = ms(imEnd, teStart);
  metrics.test.work_ms = ms(teStart, teEnd);

  const rvStart = reviewStarts[0]?.occurred_at ?? null;
  const rvEnd = reviewPassed?.occurred_at ?? reviewRounds.at(-1)?.occurred_at ?? null;
  metrics.review.wait_ms = ms(testPassed?.occurred_at ?? teEnd, rvStart);
  metrics.review.work_ms = ms(rvStart, rvEnd);
  metrics.commit.wait_ms = ms(reviewPassed?.occurred_at, committed?.occurred_at);

  let status: StoryRollup["status"] = "open";
  if (committed) status = "committed";
  else if (cancelled) status = "cancelled";

  let current: LoopStage | null = "intake";
  if (specGenStartedAt) current = "spec_gen";
  if (firstSubmitAt) current = "spec_lock";
  if (locked) current = "testcase";
  if (tcStart) current = "testcase";
  if (imStart) current = "implement";
  if (teStart) current = "test";
  if (rvStart) current = "review";
  if (reviewPassed) current = "commit";
  if (committed) current = "commit";
  if (cancelled) current = (cancelled.stage as LoopStage) || current;
  if (returns.length && !locked) current = "spec_gen";
  if (status !== "open") {
    /* keep terminal stage */
  }

  const timeline: TimelineStep[] = LOOP_STAGES.map((stage) => {
    const started =
      stage === "intake"
        ? receivedAt
        : stage === "spec_gen"
          ? specGenStartedAt
          : stage === "spec_lock"
            ? firstSubmitAt
            : stage === "testcase"
              ? tcStart
              : stage === "implement"
                ? imStart
                : stage === "test"
                  ? teStart
                  : stage === "review"
                    ? rvStart
                    : committed?.occurred_at ?? (reviewPassed ? reviewPassed.occurred_at : null);
    const completed =
      stage === "intake"
        ? specGenStartedAt
        : stage === "spec_gen"
          ? firstSubmitAt
          : stage === "spec_lock"
            ? locked?.occurred_at ?? null
            : stage === "testcase"
              ? tcEnd
              : stage === "implement"
                ? imEnd
                : stage === "test"
                  ? testPassed?.occurred_at ?? null
                  : stage === "review"
                    ? reviewPassed?.occurred_at ?? null
                    : committed?.occurred_at ?? null;
    let result: TimelineStep["result"] = null;
    let rounds = 0;
    if (stage === "spec_lock") {
      rounds = returns.length + (locked ? 1 : submits.length ? 1 : 0);
      if (locked && first_lock_pass === 1) result = "pass";
      else if (returns.length) result = "returned";
      else if (submits.length) result = "pending";
    }
    if (stage === "spec_gen") rounds = all("spec_gen_round").length || specGenStarts.length;
    if (stage === "testcase") rounds = all("testcase_gen_round").length || testcaseStarts.length;
    if (stage === "implement") rounds = all("implement_round").length || implementStarts.length;
    if (stage === "test") {
      rounds = testRuns.length;
      if (testPassed) result = first_test_pass === 1 ? "pass" : "fail";
      else if (testFailed.length) result = "fail";
    }
    if (stage === "review") {
      rounds = reviewRounds.length;
      if (reviewPassed) result = first_review_pass === 1 ? "pass" : "fail";
      else if (reviewFailed.length) result = "fail";
    }
    if (stage === "commit" && committed) result = "pass";
    const waiting =
      status === "open" &&
      current === stage &&
      (stage === "spec_lock" || stage === "commit" || (started != null && completed == null));
    return {
      stage,
      started_at: started ?? null,
      completed_at: completed ?? null,
      waiting,
      rounds,
      result,
    };
  });

  const rv02_blocker = reviewRounds.reduce((n, r) => {
    const f = r.payload.findings as { blocker?: number } | undefined;
    return n + (typeof f?.blocker === "number" ? f.blocker : 0);
  }, 0);
  const rv02_major = reviewRounds.reduce((n, r) => {
    const f = r.payload.findings as { major?: number } | undefined;
    return n + (typeof f?.major === "number" ? f.major : 0);
  }, 0);

  return {
    org_id: orgId,
    story_id: storyId,
    developer_id: developerId,
    status,
    current_stage: current,
    received_at: receivedAt,
    committed_at: committed?.occurred_at ?? null,
    cancelled_at: cancelled?.occurred_at ?? null,
    cycle_time_ms: committed && receivedAt ? ms(receivedAt, committed.occurred_at) : null,
    first_lock_pass,
    first_test_pass,
    first_review_pass,
    reached_lock,
    reached_test,
    reached_review,
    spec_locked: locked ? 1 : 0,
    rework: reworkBranches.length > 0 ? 1 : 0,
    rework_rounds,
    rework_branches: reworkBranches,
    d08_total: d08Seen.length,
    d08_spec_lock,
    d08_review,
    d08_other,
    takeover,
    h04_count: blocked.length,
    h04_ms,
    lk03_returns: returns.filter((r) => !locked || r.occurred_at <= locked.occurred_at).length,
    rv02_blocker,
    rv02_major,
    te03_runs: testRuns.length,
    rv04_rounds: reviewRounds.length,
    stage_metrics: metrics,
    timeline,
    updated_at: new Date().toISOString(),
  };
}

export function rollupStory(orgId: string, storyId: string) {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT event_id, developer_id, name, stage, occurred_at, payload, session_id
       FROM events WHERE org_id = ? AND story_id = ?
       ORDER BY occurred_at ASC, event_id ASC`,
    )
    .all(orgId, storyId) as Array<{
    event_id: string;
    developer_id: string;
    name: string;
    stage: string | null;
    occurred_at: string;
    payload: string;
    session_id: string | null;
  }>;
  if (rows.length === 0) return;
  const events: StoredEvent[] = rows.map((r) => ({
    ...r,
    payload: payloadOf(r),
  }));
  const rollup = computeStoryRollup(orgId, storyId, events);
  db.prepare(
    `INSERT INTO story_rollups (
      org_id, story_id, developer_id, status, current_stage, received_at, committed_at,
      cancelled_at, cycle_time_ms, first_lock_pass, first_test_pass, first_review_pass,
      reached_lock, reached_test, reached_review, spec_locked, rework, rework_rounds,
      rework_branches, d08_total, d08_spec_lock, d08_review, d08_other, takeover,
      h04_count, h04_ms, lk03_returns, rv02_blocker, rv02_major, te03_runs, rv04_rounds,
      stage_metrics, timeline, updated_at
    ) VALUES (
      @org_id, @story_id, @developer_id, @status, @current_stage, @received_at, @committed_at,
      @cancelled_at, @cycle_time_ms, @first_lock_pass, @first_test_pass, @first_review_pass,
      @reached_lock, @reached_test, @reached_review, @spec_locked, @rework, @rework_rounds,
      @rework_branches, @d08_total, @d08_spec_lock, @d08_review, @d08_other, @takeover,
      @h04_count, @h04_ms, @lk03_returns, @rv02_blocker, @rv02_major, @te03_runs, @rv04_rounds,
      @stage_metrics, @timeline, @updated_at
    )
    ON CONFLICT(org_id, story_id) DO UPDATE SET
      developer_id=excluded.developer_id, status=excluded.status, current_stage=excluded.current_stage,
      received_at=excluded.received_at, committed_at=excluded.committed_at, cancelled_at=excluded.cancelled_at,
      cycle_time_ms=excluded.cycle_time_ms, first_lock_pass=excluded.first_lock_pass,
      first_test_pass=excluded.first_test_pass, first_review_pass=excluded.first_review_pass,
      reached_lock=excluded.reached_lock, reached_test=excluded.reached_test,
      reached_review=excluded.reached_review, spec_locked=excluded.spec_locked,
      rework=excluded.rework, rework_rounds=excluded.rework_rounds, rework_branches=excluded.rework_branches,
      d08_total=excluded.d08_total, d08_spec_lock=excluded.d08_spec_lock, d08_review=excluded.d08_review,
      d08_other=excluded.d08_other, takeover=excluded.takeover, h04_count=excluded.h04_count,
      h04_ms=excluded.h04_ms, lk03_returns=excluded.lk03_returns, rv02_blocker=excluded.rv02_blocker,
      rv02_major=excluded.rv02_major, te03_runs=excluded.te03_runs, rv04_rounds=excluded.rv04_rounds,
      stage_metrics=excluded.stage_metrics, timeline=excluded.timeline, updated_at=excluded.updated_at`,
  ).run({
    ...rollup,
    rework_branches: JSON.stringify(rollup.rework_branches),
    stage_metrics: JSON.stringify(rollup.stage_metrics),
    timeline: JSON.stringify(rollup.timeline),
  });
  setMeta("last_rollup_at", rollup.updated_at);
}

export function rollupAllStories(orgId: string) {
  const rows = getDb()
    .prepare(`SELECT DISTINCT story_id FROM events WHERE org_id = ?`)
    .all(orgId) as { story_id: string }[];
  for (const row of rows) rollupStory(orgId, row.story_id);
  refreshPeriodRollups(orgId);
}

export function refreshPeriodRollups(orgId: string) {
  const stories = listStoryRollups(orgId);
  const db = getDb();
  const upsert = db.prepare(
    `INSERT INTO org_period_rollups (org_id, period, computed_at, payload)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(org_id, period) DO UPDATE SET computed_at=excluded.computed_at, payload=excluded.payload`,
  );
  const now = new Date().toISOString();
  for (const period of PERIODS) {
    const range = periodRange(period);
    const payload: OverviewPayload = buildOverviewFromStories(stories, range, period);
    upsert.run(orgId, period, now, JSON.stringify(payload));
  }
  setMeta("last_rollup_at", now);
}

export type StoryRollupRow = StoryRollup;

export function listStoryRollups(orgId: string): StoryRollup[] {
  const rows = getDb()
    .prepare(`SELECT * FROM story_rollups WHERE org_id = ?`)
    .all(orgId) as Array<Record<string, unknown>>;
  return rows.map(hydrateStory);
}

export function getStoryRollup(orgId: string, storyId: string): StoryRollup | undefined {
  const row = getDb()
    .prepare(`SELECT * FROM story_rollups WHERE org_id = ? AND story_id = ?`)
    .get(orgId, storyId) as Record<string, unknown> | undefined;
  return row ? hydrateStory(row) : undefined;
}

function hydrateStory(row: Record<string, unknown>): StoryRollup {
  return {
    org_id: String(row.org_id),
    story_id: String(row.story_id),
    developer_id: String(row.developer_id),
    status: row.status as StoryRollup["status"],
    current_stage: (row.current_stage as LoopStage) ?? null,
    received_at: (row.received_at as string) ?? null,
    committed_at: (row.committed_at as string) ?? null,
    cancelled_at: (row.cancelled_at as string) ?? null,
    cycle_time_ms: (row.cycle_time_ms as number) ?? null,
    first_lock_pass: (row.first_lock_pass as number) ?? null,
    first_test_pass: (row.first_test_pass as number) ?? null,
    first_review_pass: (row.first_review_pass as number) ?? null,
    reached_lock: Number(row.reached_lock),
    reached_test: Number(row.reached_test),
    reached_review: Number(row.reached_review),
    spec_locked: Number(row.spec_locked),
    rework: Number(row.rework),
    rework_rounds: Number(row.rework_rounds),
    rework_branches: JSON.parse(String(row.rework_branches ?? "[]")),
    d08_total: Number(row.d08_total),
    d08_spec_lock: Number(row.d08_spec_lock),
    d08_review: Number(row.d08_review),
    d08_other: Number(row.d08_other),
    takeover: Number(row.takeover),
    h04_count: Number(row.h04_count),
    h04_ms: Number(row.h04_ms),
    lk03_returns: Number(row.lk03_returns),
    rv02_blocker: Number(row.rv02_blocker),
    rv02_major: Number(row.rv02_major),
    te03_runs: Number(row.te03_runs),
    rv04_rounds: Number(row.rv04_rounds),
    stage_metrics: JSON.parse(String(row.stage_metrics ?? "{}")),
    timeline: JSON.parse(String(row.timeline ?? "[]")),
    updated_at: String(row.updated_at),
  };
}

export function listStoryEvents(orgId: string, storyId: string): StoredEvent[] {
  const rows = getDb()
    .prepare(
      `SELECT event_id, developer_id, name, stage, occurred_at, payload, session_id
       FROM events WHERE org_id = ? AND story_id = ?
       ORDER BY occurred_at ASC, event_id ASC`,
    )
    .all(orgId, storyId) as Array<{
    event_id: string;
    developer_id: string;
    name: string;
    stage: string | null;
    occurred_at: string;
    payload: string;
    session_id: string | null;
  }>;
  return rows.map((r) => ({ ...r, payload: payloadOf(r) }));
}

export function countStories(orgId: string) {
  const row = getDb()
    .prepare(`SELECT COUNT(*) AS n FROM story_rollups WHERE org_id = ?`)
    .get(orgId) as { n: number };
  return row.n;
}
