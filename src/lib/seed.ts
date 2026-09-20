import { ORG_ID } from "./catalog";
import { getDb, lookupToken, type TokenRow } from "./db";
import { persistEvents, type Envelope } from "./ingest";
import { rollupAllStories } from "./rollup";

function iso(base: Date, hours: number) {
  return new Date(base.getTime() + hours * 3_600_000).toISOString();
}

function uid(storyN: number, eventN: number) {
  return `00000000-0000-4000-a000-${String(storyN).padStart(6, "0")}${String(eventN).padStart(6, "0")}`;
}

type E = {
  hours: number;
  name: string;
  stage: string;
  payload?: Record<string, unknown>;
};

function envelopes(
  storyN: number,
  storyId: string,
  session: string,
  base: Date,
  steps: E[],
): Envelope[] {
  return steps.map((step, i) => ({
    event_id: uid(storyN, i + 1),
    schema_version: 1,
    occurred_at: iso(base, step.hours),
    story_id: storyId,
    session_id: session,
    repo: { remote: "git@github.com:acme/shop.git", branch: `feat/${storyId}` },
    name: step.name,
    stage: step.stage,
    payload: step.payload ?? {},
  }));
}

function happyPath(opts: {
  extra?: E[];
  startAt?: number;
  stretch?: number;
}): E[] {
  const s = opts.startAt ?? 0;
  const k = opts.stretch ?? 1;
  const h = (x: number) => s + x * k;
  return [
    { hours: h(0), name: "story_received", stage: "intake", payload: { ready: true } },
    { hours: h(0.4), name: "spec_gen_started", stage: "spec_gen" },
    { hours: h(1.2), name: "spec_gen_round", stage: "spec_gen" },
    { hours: h(2.5), name: "spec_submitted_for_lock", stage: "spec_lock" },
    {
      hours: h(2.5),
      name: "refine_with_human_started",
      stage: "spec_lock",
      payload: { stage: "spec_lock" },
    },
    { hours: h(4.5), name: "spec_locked", stage: "spec_lock" },
    {
      hours: h(4.5),
      name: "refine_with_human_resumed",
      stage: "spec_lock",
      payload: { stage: "spec_lock" },
    },
    { hours: h(5), name: "testcase_gen_started", stage: "testcase" },
    { hours: h(6), name: "testcase_gen_completed", stage: "testcase" },
    { hours: h(6.3), name: "implement_started", stage: "implement" },
    { hours: h(9), name: "implement_completed", stage: "implement" },
    { hours: h(9.2), name: "test_started", stage: "test" },
    {
      hours: h(9.6),
      name: "test_run_completed",
      stage: "test",
      payload: { result: "pass", run_index: 1 },
    },
    { hours: h(9.6), name: "test_passed", stage: "test" },
    { hours: h(10), name: "review_started", stage: "review" },
    {
      hours: h(11),
      name: "review_round_completed",
      stage: "review",
      payload: { result: "pass", findings: { blocker: 0, major: 0 } },
    },
    { hours: h(11), name: "review_passed", stage: "review" },
    { hours: h(11.5), name: "committed", stage: "commit", payload: { commit_sha: "abc1234" } },
    ...(opts.extra ?? []),
  ];
}

export function seedIfEmpty() {
  const n = getDb().prepare(`SELECT COUNT(*) AS n FROM events`).get() as { n: number };
  if (n.n > 0) {
    const rollups = getDb().prepare(`SELECT COUNT(*) AS n FROM story_rollups`).get() as {
      n: number;
    };
    if (rollups.n === 0) rollupAllStories(ORG_ID);
    return;
  }

  const hoursAgoStart = (hoursAgo: number) => new Date(Date.now() - hoursAgo * 3_600_000);

  const byDev = new Map<string, Envelope[]>();
  const add = (dev: string, list: Envelope[]) => {
    const cur = byDev.get(dev) ?? [];
    byDev.set(dev, cur.concat(list));
  };

  add(
    "lan",
    envelopes(1, "checkout-retry", "sess-lan-1", hoursAgoStart(80), happyPath({})),
  );

  add(
    "minh",
    envelopes(2, "cart-coupon", "sess-minh-1", hoursAgoStart(100), [
      { hours: 0, name: "story_received", stage: "intake", payload: { ready: true } },
      { hours: 0.5, name: "spec_gen_started", stage: "spec_gen" },
      { hours: 2, name: "spec_submitted_for_lock", stage: "spec_lock" },
      {
        hours: 2,
        name: "refine_with_human_started",
        stage: "spec_lock",
        payload: { stage: "spec_lock" },
      },
      { hours: 3, name: "spec_returned", stage: "spec_lock", payload: { reason: "Thiếu AC refund" } },
      { hours: 3.2, name: "spec_gen_started", stage: "spec_gen" },
      { hours: 5, name: "spec_submitted_for_lock", stage: "spec_lock" },
      {
        hours: 5,
        name: "refine_with_human_started",
        stage: "spec_lock",
        payload: { stage: "spec_lock" },
      },
      { hours: 6, name: "spec_locked", stage: "spec_lock" },
      {
        hours: 6,
        name: "refine_with_human_resumed",
        stage: "spec_lock",
        payload: { stage: "spec_lock" },
      },
      { hours: 6.4, name: "testcase_gen_started", stage: "testcase" },
      { hours: 7.2, name: "testcase_gen_completed", stage: "testcase" },
      { hours: 7.5, name: "implement_started", stage: "implement" },
      { hours: 11, name: "implement_completed", stage: "implement" },
      { hours: 11.2, name: "test_started", stage: "test" },
      {
        hours: 11.8,
        name: "test_run_completed",
        stage: "test",
        payload: { result: "pass", run_index: 1 },
      },
      { hours: 11.8, name: "test_passed", stage: "test" },
      { hours: 12.2, name: "review_started", stage: "review" },
      {
        hours: 13,
        name: "review_round_completed",
        stage: "review",
        payload: { result: "pass", findings: { blocker: 0, major: 1 } },
      },
      { hours: 13, name: "review_passed", stage: "review" },
      { hours: 13.4, name: "committed", stage: "commit" },
    ]),
  );

  add(
    "hoa",
    envelopes(3, "invoice-pdf", "sess-hoa-1", hoursAgoStart(52), [
      { hours: 0, name: "story_received", stage: "intake", payload: { ready: true } },
      { hours: 0.3, name: "spec_gen_started", stage: "spec_gen" },
      { hours: 2, name: "spec_submitted_for_lock", stage: "spec_lock" },
      {
        hours: 2,
        name: "refine_with_human_started",
        stage: "spec_lock",
        payload: { stage: "spec_lock" },
      },
      { hours: 3.5, name: "spec_locked", stage: "spec_lock" },
      { hours: 3.5, name: "refine_with_human_resumed", stage: "spec_lock", payload: { stage: "spec_lock" } },
      { hours: 4, name: "testcase_gen_started", stage: "testcase" },
      { hours: 5, name: "testcase_gen_completed", stage: "testcase" },
      { hours: 5.2, name: "implement_started", stage: "implement" },
      { hours: 8, name: "implement_completed", stage: "implement" },
      { hours: 8.1, name: "test_started", stage: "test" },
      {
        hours: 8.4,
        name: "test_run_completed",
        stage: "test",
        payload: { result: "fail", run_index: 1 },
      },
      { hours: 8.4, name: "test_failed", stage: "test" },
      { hours: 8.6, name: "implement_started", stage: "implement" },
      { hours: 10, name: "implement_completed", stage: "implement" },
      { hours: 10.1, name: "test_started", stage: "test" },
      {
        hours: 10.5,
        name: "test_run_completed",
        stage: "test",
        payload: { result: "pass", run_index: 2 },
      },
      { hours: 10.5, name: "test_passed", stage: "test" },
      { hours: 10.8, name: "review_started", stage: "review" },
      {
        hours: 11.5,
        name: "review_round_completed",
        stage: "review",
        payload: { result: "pass", findings: { blocker: 0, major: 0 } },
      },
      { hours: 11.5, name: "review_passed", stage: "review" },
      { hours: 12, name: "committed", stage: "commit" },
    ]),
  );

  add(
    "khang",
    envelopes(4, "search-synonyms", "sess-khang-1", hoursAgoStart(130), [
      { hours: 0, name: "story_received", stage: "intake", payload: { ready: true } },
      { hours: 0.5, name: "spec_gen_started", stage: "spec_gen" },
      { hours: 2.2, name: "spec_submitted_for_lock", stage: "spec_lock" },
      {
        hours: 2.2,
        name: "refine_with_human_started",
        stage: "spec_lock",
        payload: { stage: "spec_lock" },
      },
      { hours: 4, name: "spec_locked", stage: "spec_lock" },
      { hours: 4, name: "refine_with_human_resumed", stage: "spec_lock", payload: { stage: "spec_lock" } },
      { hours: 4.4, name: "testcase_gen_started", stage: "testcase" },
      { hours: 5.5, name: "testcase_gen_completed", stage: "testcase" },
      { hours: 5.8, name: "implement_started", stage: "implement" },
      { hours: 10, name: "implement_completed", stage: "implement" },
      { hours: 10.2, name: "test_started", stage: "test" },
      {
        hours: 10.8,
        name: "test_run_completed",
        stage: "test",
        payload: { result: "pass", run_index: 1 },
      },
      { hours: 10.8, name: "test_passed", stage: "test" },
      { hours: 11.2, name: "review_started", stage: "review" },
      {
        hours: 12,
        name: "review_round_completed",
        stage: "review",
        payload: {
          result: "fail",
          findings: { blocker: 1, major: 2 },
          rework_to: "implement",
        },
      },
      { hours: 12, name: "review_failed", stage: "review", payload: { rework_to: "implement" } },
      {
        hours: 12.1,
        name: "refine_with_human_started",
        stage: "review",
        payload: { stage: "review" },
      },
      { hours: 13, name: "refine_with_human_resumed", stage: "review", payload: { stage: "review" } },
      { hours: 13.2, name: "implement_started", stage: "implement" },
      { hours: 15, name: "implement_completed", stage: "implement" },
      { hours: 15.2, name: "test_started", stage: "test" },
      {
        hours: 15.6,
        name: "test_run_completed",
        stage: "test",
        payload: { result: "pass", run_index: 2 },
      },
      { hours: 15.6, name: "test_passed", stage: "test" },
      { hours: 16, name: "review_started", stage: "review" },
      {
        hours: 16.8,
        name: "review_round_completed",
        stage: "review",
        payload: { result: "pass", findings: { blocker: 0, major: 0 } },
      },
      { hours: 16.8, name: "review_passed", stage: "review" },
      { hours: 17.2, name: "committed", stage: "commit" },
    ]),
  );

  add(
    "lan",
    envelopes(5, "auth-session", "sess-lan-2", hoursAgoStart(28), [
      ...happyPath({ stretch: 0.8 }).slice(0, 10),
      { hours: 7.2, name: "human_intervention", stage: "implement", payload: { reason: "Sửa tay timeout" } },
      { hours: 8.5, name: "implement_completed", stage: "implement" },
      { hours: 8.7, name: "test_started", stage: "test" },
      {
        hours: 9,
        name: "test_run_completed",
        stage: "test",
        payload: { result: "pass", run_index: 1 },
      },
      { hours: 9, name: "test_passed", stage: "test" },
      { hours: 9.3, name: "review_started", stage: "review" },
      {
        hours: 10,
        name: "review_round_completed",
        stage: "review",
        payload: { result: "pass", findings: { blocker: 0, major: 0 } },
      },
      { hours: 10, name: "review_passed", stage: "review" },
      { hours: 10.4, name: "committed", stage: "commit" },
    ]),
  );

  add(
    "minh",
    envelopes(6, "shipping-zones", "sess-minh-2", hoursAgoStart(18), [
      { hours: 0, name: "story_received", stage: "intake", payload: { ready: true } },
      { hours: 0.4, name: "spec_gen_started", stage: "spec_gen" },
      { hours: 2, name: "spec_submitted_for_lock", stage: "spec_lock" },
      {
        hours: 2,
        name: "refine_with_human_started",
        stage: "spec_lock",
        payload: { stage: "spec_lock" },
      },
    ]),
  );

  add(
    "hoa",
    envelopes(7, "returns-portal", "sess-hoa-2", hoursAgoStart(16), [
      { hours: 0, name: "story_received", stage: "intake", payload: { ready: true } },
      { hours: 0.3, name: "spec_gen_started", stage: "spec_gen" },
      { hours: 1.8, name: "spec_submitted_for_lock", stage: "spec_lock" },
      {
        hours: 1.8,
        name: "refine_with_human_started",
        stage: "spec_lock",
        payload: { stage: "spec_lock" },
      },
      { hours: 3, name: "spec_locked", stage: "spec_lock" },
      { hours: 3, name: "refine_with_human_resumed", stage: "spec_lock", payload: { stage: "spec_lock" } },
      { hours: 3.3, name: "testcase_gen_started", stage: "testcase" },
      { hours: 4.2, name: "testcase_gen_completed", stage: "testcase" },
      { hours: 4.5, name: "implement_started", stage: "implement" },
    ]),
  );

  add(
    "khang",
    envelopes(8, "notify-digest", "sess-khang-2", hoursAgoStart(40), [
      { hours: 0, name: "story_received", stage: "intake", payload: { ready: true } },
      { hours: 0.5, name: "spec_gen_started", stage: "spec_gen" },
      { hours: 2, name: "spec_submitted_for_lock", stage: "spec_lock" },
      {
        hours: 2,
        name: "refine_with_human_started",
        stage: "spec_lock",
        payload: { stage: "spec_lock" },
      },
      { hours: 3.5, name: "spec_locked", stage: "spec_lock" },
      { hours: 3.5, name: "refine_with_human_resumed", stage: "spec_lock", payload: { stage: "spec_lock" } },
      { hours: 4, name: "testcase_gen_started", stage: "testcase" },
      { hours: 5, name: "testcase_gen_completed", stage: "testcase" },
      { hours: 5.3, name: "implement_started", stage: "implement" },
      { hours: 8, name: "implement_completed", stage: "implement" },
      { hours: 8.2, name: "test_started", stage: "test" },
      {
        hours: 8.7,
        name: "test_run_completed",
        stage: "test",
        payload: { result: "pass", run_index: 1 },
      },
      { hours: 8.7, name: "test_passed", stage: "test" },
      { hours: 9, name: "review_started", stage: "review" },
    ]),
  );

  add(
    "lan",
    envelopes(9, "tax-rounding", "sess-lan-3", hoursAgoStart(140), [
      { hours: 0, name: "story_received", stage: "intake", payload: { ready: false, intake_gaps: ["missing_ac"] } },
      { hours: 2, name: "cancelled", stage: "intake", payload: { stage: "intake" } },
    ]),
  );

  add(
    "minh",
    envelopes(10, "payout-batch", "sess-minh-3", hoursAgoStart(18 * 24), happyPath({ stretch: 1.4 })),
  );

  add(
    "hoa",
    envelopes(11, "inventory-hold", "sess-hoa-3", hoursAgoStart(10), happyPath({ stretch: 0.6 })),
  );

  add(
    "lan",
    envelopes(12, "onboarding-tour", "sess-lan-4", hoursAgoStart(2), [
      { hours: 0, name: "story_received", stage: "intake", payload: { ready: true } },
    ]),
  );

  add(
    "khang",
    envelopes(13, "promo-stack", "sess-khang-3", hoursAgoStart(72), [
      { hours: 0, name: "story_received", stage: "intake", payload: { ready: true } },
      { hours: 0.4, name: "spec_gen_started", stage: "spec_gen" },
      { hours: 2, name: "spec_submitted_for_lock", stage: "spec_lock" },
      {
        hours: 2,
        name: "refine_with_human_started",
        stage: "spec_lock",
        payload: { stage: "spec_lock" },
      },
      { hours: 3, name: "spec_locked", stage: "spec_lock" },
      { hours: 3, name: "refine_with_human_resumed", stage: "spec_lock", payload: { stage: "spec_lock" } },
      { hours: 3.4, name: "testcase_gen_started", stage: "testcase" },
      { hours: 4, name: "testcase_gen_completed", stage: "testcase" },
      { hours: 4.2, name: "implement_started", stage: "implement" },
      {
        hours: 5,
        name: "blocked",
        stage: "implement",
        payload: { reason: "staging down", stage: "implement" },
      },
      { hours: 8, name: "unblocked", stage: "implement", payload: { reason: "staging up", stage: "implement" } },
      { hours: 11, name: "implement_completed", stage: "implement" },
      { hours: 11.2, name: "test_started", stage: "test" },
      {
        hours: 11.7,
        name: "test_run_completed",
        stage: "test",
        payload: { result: "pass", run_index: 1 },
      },
      { hours: 11.7, name: "test_passed", stage: "test" },
      { hours: 12, name: "review_started", stage: "review" },
      {
        hours: 12.8,
        name: "review_round_completed",
        stage: "review",
        payload: { result: "pass", findings: { blocker: 0, major: 0 } },
      },
      { hours: 12.8, name: "review_passed", stage: "review" },
      { hours: 13.2, name: "committed", stage: "commit" },
    ]),
  );

  add(
    "lan",
    envelopes(14, "gift-wrap", "sess-lan-5", hoursAgoStart(48), [
      { hours: 0, name: "story_received", stage: "intake", payload: { ready: true } },
      { hours: 0.5, name: "spec_gen_started", stage: "spec_gen" },
      { hours: 2, name: "spec_submitted_for_lock", stage: "spec_lock" },
      {
        hours: 2,
        name: "refine_with_human_started",
        stage: "spec_lock",
        payload: { stage: "spec_lock" },
      },
      { hours: 3, name: "spec_returned", stage: "spec_lock", payload: { reason: "Sai luồng" } },
      { hours: 3.5, name: "spec_gen_started", stage: "spec_gen" },
      { hours: 5, name: "spec_submitted_for_lock", stage: "spec_lock" },
      {
        hours: 5,
        name: "refine_with_human_started",
        stage: "spec_lock",
        payload: { stage: "spec_lock" },
      },
      { hours: 6, name: "spec_returned", stage: "spec_lock", payload: { reason: "Thiếu edge case" } },
      { hours: 6.5, name: "spec_gen_started", stage: "spec_gen" },
      { hours: 8, name: "spec_submitted_for_lock", stage: "spec_lock" },
      {
        hours: 8,
        name: "refine_with_human_started",
        stage: "spec_lock",
        payload: { stage: "spec_lock" },
      },
      { hours: 9, name: "spec_locked", stage: "spec_lock" },
      { hours: 9, name: "refine_with_human_resumed", stage: "spec_lock", payload: { stage: "spec_lock" } },
      { hours: 9.4, name: "testcase_gen_started", stage: "testcase" },
      { hours: 10.2, name: "testcase_gen_completed", stage: "testcase" },
      { hours: 10.5, name: "implement_started", stage: "implement" },
      { hours: 13, name: "implement_completed", stage: "implement" },
      { hours: 13.2, name: "test_started", stage: "test" },
      {
        hours: 13.8,
        name: "test_run_completed",
        stage: "test",
        payload: { result: "pass", run_index: 1 },
      },
      { hours: 13.8, name: "test_passed", stage: "test" },
      { hours: 14.2, name: "review_started", stage: "review" },
      {
        hours: 15,
        name: "review_round_completed",
        stage: "review",
        payload: { result: "pass", findings: { blocker: 0, major: 0 } },
      },
      { hours: 15, name: "review_passed", stage: "review" },
      { hours: 15.5, name: "committed", stage: "commit" },
    ]),
  );

  const tokenOf = (dev: string): TokenRow => {
    const row = lookupToken(`kt_dev_${dev}`);
    if (!row) throw new Error(`Missing seed token for ${dev}`);
    return row;
  };

  for (const [dev, events] of byDev) {
    for (let i = 0; i < events.length; i += 100) {
      persistEvents(tokenOf(dev), events.slice(i, i + 100));
    }
  }
  rollupAllStories(ORG_ID);
}
