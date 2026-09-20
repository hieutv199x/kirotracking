import {
  EVENT_NAME_SET,
  MAX_BODY_BYTES,
  MAX_EVENTS_PER_BATCH,
  RATE_LIMIT_BURST,
  RATE_LIMIT_PER_SEC,
  REFINE_STAGES,
  STAGE_SET,
  UUID_RE,
  type EventName,
  type LoopStage,
} from "./catalog";
import { getDb, lookupToken, setMeta, type TokenRow } from "./db";
import { markStoriesDirty } from "./queue";

export type Envelope = {
  event_id?: unknown;
  schema_version?: unknown;
  occurred_at?: unknown;
  story_id?: unknown;
  session_id?: unknown;
  repo?: unknown;
  name?: unknown;
  stage?: unknown;
  payload?: unknown;
  assignee?: unknown;
};

export type IngestRejected = { event_id: string | null; error: string };

export type IngestResult = {
  accepted: number;
  duplicate: number;
  rejected: IngestRejected[];
};

const tokenCache = new Map<string, { row: TokenRow; expires: number }>();

function resolveToken(bearer: string | undefined): TokenRow | "missing" | "invalid" {
  if (!bearer) return "missing";
  const match = /^Bearer\s+(.+)$/i.exec(bearer.trim());
  if (!match) return "missing";
  const token = match[1].trim();
  if (!token) return "missing";
  const cached = tokenCache.get(token);
  const now = Date.now();
  if (cached && cached.expires > now) return cached.row;
  const row = lookupToken(token);
  if (!row) return "invalid";
  tokenCache.set(token, { row, expires: now + 60_000 });
  return row;
}

type Bucket = { tokens: number; last: number };
const buckets = new Map<string, Bucket>();

function takeRateLimit(tokenHash: string): boolean {
  const now = Date.now();
  let b = buckets.get(tokenHash);
  if (!b) {
    b = { tokens: RATE_LIMIT_BURST, last: now };
    buckets.set(tokenHash, b);
  }
  const elapsed = (now - b.last) / 1000;
  b.tokens = Math.min(RATE_LIMIT_BURST, b.tokens + elapsed * RATE_LIMIT_PER_SEC);
  b.last = now;
  if (b.tokens < 1) return false;
  b.tokens -= 1;
  return true;
}

function isIsoDate(value: string) {
  const t = Date.parse(value);
  return !Number.isNaN(t);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value == null) return {};
  if (typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function validatePayload(name: EventName, payload: Record<string, unknown>): string | null {
  switch (name) {
    case "story_received":
      if (typeof payload.ready !== "boolean") return "payload.ready phải là boolean";
      break;
    case "test_run_completed":
      if (payload.result !== "pass" && payload.result !== "fail") {
        return "payload.result phải là pass|fail";
      }
      break;
    case "review_round_completed": {
      if (payload.result !== "pass" && payload.result !== "fail") {
        return "payload.result phải là pass|fail";
      }
      const findings = payload.findings;
      if (
        findings == null ||
        typeof findings !== "object" ||
        Array.isArray(findings)
      ) {
        return "payload.findings bắt buộc";
      }
      const f = findings as Record<string, unknown>;
      if (typeof f.blocker !== "number" || typeof f.major !== "number") {
        return "payload.findings.blocker và major phải là number";
      }
      break;
    }
    case "refine_with_human_started": {
      if (typeof payload.stage !== "string" || !REFINE_STAGES.includes(payload.stage as never)) {
        return "payload.stage refine không hợp lệ";
      }
      break;
    }
    case "blocked":
    case "unblocked":
      if (typeof payload.reason !== "string" || !payload.reason.trim()) {
        return "payload.reason bắt buộc";
      }
      break;
    case "cancelled":
      if (typeof payload.stage !== "string" || !STAGE_SET.has(payload.stage)) {
        return "payload.stage cancelled không hợp lệ";
      }
      break;
    default:
      break;
  }
  return null;
}

export function validateEnvelope(raw: Envelope): { ok: true; event: ValidEvent } | { ok: false; event_id: string | null; error: string } {
  const eventId = typeof raw.event_id === "string" ? raw.event_id : null;
  if (!eventId || !UUID_RE.test(eventId)) {
    return { ok: false, event_id: eventId, error: "event_id phải là UUID" };
  }
  if (raw.schema_version !== 1) {
    return { ok: false, event_id: eventId, error: "schema_version phải là 1" };
  }
  if (typeof raw.occurred_at !== "string" || !isIsoDate(raw.occurred_at)) {
    return { ok: false, event_id: eventId, error: "occurred_at không hợp lệ" };
  }
  if (typeof raw.story_id !== "string" || !raw.story_id.trim()) {
    return { ok: false, event_id: eventId, error: "story_id bắt buộc" };
  }
  if (typeof raw.session_id !== "string" || !raw.session_id.trim()) {
    return { ok: false, event_id: eventId, error: "session_id bắt buộc" };
  }
  if (typeof raw.name !== "string" || !EVENT_NAME_SET.has(raw.name)) {
    return { ok: false, event_id: eventId, error: "name không nằm trong whitelist MVP" };
  }
  if (typeof raw.stage !== "string" || !STAGE_SET.has(raw.stage)) {
    return { ok: false, event_id: eventId, error: "stage không hợp lệ" };
  }
  const payload = asRecord(raw.payload);
  if (!payload) return { ok: false, event_id: eventId, error: "payload phải là object" };
  const payloadError = validatePayload(raw.name as EventName, payload);
  if (payloadError) return { ok: false, event_id: eventId, error: payloadError };

  let repoRemote: string | null = null;
  let repoBranch: string | null = null;
  if (raw.repo != null) {
    const repo = asRecord(raw.repo);
    if (!repo) return { ok: false, event_id: eventId, error: "repo phải là object" };
    if (typeof repo.remote === "string") repoRemote = repo.remote;
    if (typeof repo.branch === "string") repoBranch = repo.branch;
  }

  return {
    ok: true,
    event: {
      event_id: eventId,
      schema_version: 1,
      occurred_at: raw.occurred_at,
      story_id: raw.story_id.trim(),
      session_id: raw.session_id,
      name: raw.name as EventName,
      stage: raw.stage as LoopStage,
      payload,
      repo_remote: repoRemote,
      repo_branch: repoBranch,
    },
  };
}

export type ValidEvent = {
  event_id: string;
  schema_version: 1;
  occurred_at: string;
  story_id: string;
  session_id: string;
  name: EventName;
  stage: LoopStage;
  payload: Record<string, unknown>;
  repo_remote: string | null;
  repo_branch: string | null;
};

export type IngestHttpResult =
  | { status: 202; body: IngestResult }
  | { status: 400 | 401 | 403 | 413 | 429; body: { error: string }; retryAfter?: number };

export function ingestHttpRequest(input: {
  authorization?: string;
  idempotencyKey?: string | null;
  contentLength?: number | null;
  rawBody: string;
  skipRateLimit?: boolean;
}): IngestHttpResult {
  if (input.contentLength != null && input.contentLength > MAX_BODY_BYTES) {
    return { status: 413, body: { error: "Batch vượt 256 KB" } };
  }
  const byteLength = Buffer.byteLength(input.rawBody, "utf8");
  if (byteLength > MAX_BODY_BYTES) {
    return { status: 413, body: { error: "Batch vượt 256 KB" } };
  }

  const token = resolveToken(input.authorization);
  if (token === "missing") {
    return { status: 401, body: { error: "Thiếu Bearer token" } };
  }
  if (token === "invalid") {
    return { status: 403, body: { error: "Token không hợp lệ" } };
  }

  if (!input.skipRateLimit && !takeRateLimit(token.token_hash)) {
    return { status: 429, body: { error: "Rate limit" }, retryAfter: 1 };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(input.rawBody);
  } catch {
    return { status: 400, body: { error: "JSON không hợp lệ" } };
  }
  if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { status: 400, body: { error: "Body phải là object batch" } };
  }
  const batch = parsed as { sent_at?: unknown; events?: unknown };
  if (!Array.isArray(batch.events)) {
    return { status: 400, body: { error: "events phải là mảng" } };
  }
  if (batch.events.length === 0) {
    return { status: 400, body: { error: "events không được rỗng" } };
  }
  if (batch.events.length > MAX_EVENTS_PER_BATCH) {
    return { status: 413, body: { error: "Vượt 100 event / request" } };
  }

  if (input.idempotencyKey) {
    getDb()
      .prepare(
        `INSERT OR IGNORE INTO idempotency_keys (key, org_id, created_at) VALUES (?, ?, ?)`,
      )
      .run(input.idempotencyKey, token.org_id, new Date().toISOString());
  }

  const result = persistEvents(token, batch.events as Envelope[]);
  return { status: 202, body: result };
}

export function persistEvents(token: TokenRow, envelopes: Envelope[]): IngestResult {
  const db = getDb();
  const receivedAt = new Date().toISOString();
  const rejected: IngestRejected[] = [];
  let accepted = 0;
  let duplicate = 0;
  const dirty = new Set<string>();

  const insert = db.prepare(
    `INSERT OR IGNORE INTO events (
      event_id, org_id, developer_id, story_id, session_id, name, stage,
      occurred_at, received_at, schema_version, repo_remote, repo_branch, payload
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const insertReject = db.prepare(
    `INSERT INTO ingest_rejects (org_id, event_id, error, received_at, body)
     VALUES (?, ?, ?, ?, ?)`,
  );

  const tx = db.transaction(() => {
    for (const raw of envelopes) {
      const checked = validateEnvelope(raw ?? {});
      if (!checked.ok) {
        rejected.push({ event_id: checked.event_id, error: checked.error });
        insertReject.run(
          token.org_id,
          checked.event_id,
          checked.error,
          receivedAt,
          JSON.stringify(raw ?? {}),
        );
        continue;
      }
      const ev = checked.event;
      const info = insert.run(
        ev.event_id,
        token.org_id,
        token.developer_id,
        ev.story_id,
        ev.session_id,
        ev.name,
        ev.stage,
        ev.occurred_at,
        receivedAt,
        ev.schema_version,
        ev.repo_remote,
        ev.repo_branch,
        JSON.stringify(ev.payload),
      );
      if (info.changes === 0) {
        duplicate += 1;
      } else {
        accepted += 1;
        dirty.add(ev.story_id);
      }
    }
  });
  tx();

  setMeta("last_event_received_at", receivedAt);
  if (dirty.size > 0) {
    markStoriesDirty(token.org_id, [...dirty]);
  }
  return { accepted, duplicate, rejected };
}

export function jsonResponse(
  result: IngestHttpResult,
  requestId: string,
): Response {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-request-id": requestId,
  };
  if (result.status === 429 && result.retryAfter) {
    headers["retry-after"] = String(result.retryAfter);
  }
  if (result.status === 202) {
    console.info(
      JSON.stringify({
        request_id: requestId,
        accepted: result.body.accepted,
        duplicate: result.body.duplicate,
        rejected: result.body.rejected.length,
      }),
    );
  }
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers,
  });
}

