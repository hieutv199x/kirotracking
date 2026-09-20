import assert from "node:assert/strict";
import { test } from "node:test";
import { computeStoryRollup, type StoredEvent } from "./rollup";
import { validateEnvelope } from "./ingest";

function ev(
  id: string,
  name: string,
  stage: string,
  at: string,
  payload: Record<string, unknown> = {},
): StoredEvent {
  return {
    event_id: id,
    developer_id: "lan",
    name,
    stage,
    occurred_at: at,
    payload,
    session_id: "s1",
  };
}

test("D-08 counts refine_with_human_started only, not spec_submitted_for_lock", () => {
  const t0 = "2026-09-18T00:00:00.000Z";
  const events: StoredEvent[] = [
    ev("00000000-0000-4000-a000-000000000001", "story_received", "intake", t0, { ready: true }),
    ev("00000000-0000-4000-a000-000000000002", "spec_gen_started", "spec_gen", "2026-09-18T01:00:00.000Z"),
    ev("00000000-0000-4000-a000-000000000003", "spec_submitted_for_lock", "spec_lock", "2026-09-18T02:00:00.000Z"),
    ev("00000000-0000-4000-a000-000000000004", "refine_with_human_started", "spec_lock", "2026-09-18T02:00:01.000Z", {
      stage: "spec_lock",
    }),
    ev("00000000-0000-4000-a000-000000000005", "spec_locked", "spec_lock", "2026-09-18T03:00:00.000Z"),
    ev("00000000-0000-4000-a000-000000000006", "committed", "commit", "2026-09-18T12:00:00.000Z"),
  ];
  const rollup = computeStoryRollup("acme", "checkout-retry", events);
  assert.equal(rollup.d08_total, 1);
  assert.equal(rollup.d08_spec_lock, 1);
  assert.equal(rollup.first_lock_pass, 1);
  assert.ok(rollup.cycle_time_ms != null);
  assert.equal(rollup.status, "committed");
});

test("idempotent event_id shape and unknown name rejected", () => {
  const good = validateEnvelope({
    event_id: "8f1c2a10-9c3e-4b7a-9d2e-0a1b2c3d4e5f",
    schema_version: 1,
    occurred_at: "2026-09-20T08:15:03.120Z",
    story_id: "checkout-retry",
    session_id: "abc",
    name: "story_received",
    stage: "intake",
    payload: { ready: true },
  });
  assert.equal(good.ok, true);
  const bad = validateEnvelope({
    event_id: "8f1c2a10-9c3e-4b7a-9d2e-0a1b2c3d4e5f",
    schema_version: 1,
    occurred_at: "2026-09-20T08:15:03.120Z",
    story_id: "checkout-retry",
    session_id: "abc",
    name: "not_a_metric",
    stage: "intake",
    payload: {},
  });
  assert.equal(bad.ok, false);
});
