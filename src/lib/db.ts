import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { ORG_ID } from "./catalog";

const DEFAULT_DB = path.join(process.cwd(), "data", "kirotrack.sqlite");

let db: Database.Database | null = null;
let ready = false;
let readyPromise: Promise<void> | null = null;

export function getDbPath() {
  return process.env.DATABASE_PATH
    ? path.resolve(process.env.DATABASE_PATH)
    : DEFAULT_DB;
}

export function getDb(): Database.Database {
  if (!db) {
    const file = getDbPath();
    fs.mkdirSync(path.dirname(file), { recursive: true });
    db = new Database(file);
    db.pragma("journal_mode = WAL");
    db.pragma("busy_timeout = 3000");
    db.pragma("foreign_keys = ON");
  }
  return db;
}

function migrate(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS ingest_tokens (
      token_hash TEXT PRIMARY KEY,
      org_id TEXT NOT NULL,
      developer_id TEXT NOT NULL,
      label TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS events (
      event_id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL,
      developer_id TEXT NOT NULL,
      story_id TEXT NOT NULL,
      session_id TEXT,
      name TEXT NOT NULL,
      stage TEXT,
      occurred_at TEXT NOT NULL,
      received_at TEXT NOT NULL,
      schema_version INTEGER NOT NULL,
      repo_remote TEXT,
      repo_branch TEXT,
      payload TEXT NOT NULL DEFAULT '{}'
    );

    CREATE INDEX IF NOT EXISTS idx_events_story
      ON events (org_id, story_id, occurred_at);
    CREATE INDEX IF NOT EXISTS idx_events_received
      ON events (org_id, received_at);
    CREATE INDEX IF NOT EXISTS idx_events_dev
      ON events (developer_id, received_at);

    CREATE TABLE IF NOT EXISTS ingest_rejects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      org_id TEXT,
      event_id TEXT,
      error TEXT NOT NULL,
      received_at TEXT NOT NULL,
      body TEXT
    );

    CREATE TABLE IF NOT EXISTS idempotency_keys (
      key TEXT PRIMARY KEY,
      org_id TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS story_rollups (
      org_id TEXT NOT NULL,
      story_id TEXT NOT NULL,
      developer_id TEXT NOT NULL,
      status TEXT NOT NULL,
      current_stage TEXT,
      received_at TEXT,
      committed_at TEXT,
      cancelled_at TEXT,
      cycle_time_ms INTEGER,
      first_lock_pass INTEGER,
      first_test_pass INTEGER,
      first_review_pass INTEGER,
      reached_lock INTEGER NOT NULL DEFAULT 0,
      reached_test INTEGER NOT NULL DEFAULT 0,
      reached_review INTEGER NOT NULL DEFAULT 0,
      spec_locked INTEGER NOT NULL DEFAULT 0,
      rework INTEGER NOT NULL DEFAULT 0,
      rework_rounds INTEGER NOT NULL DEFAULT 0,
      rework_branches TEXT NOT NULL DEFAULT '[]',
      d08_total INTEGER NOT NULL DEFAULT 0,
      d08_spec_lock INTEGER NOT NULL DEFAULT 0,
      d08_review INTEGER NOT NULL DEFAULT 0,
      d08_other INTEGER NOT NULL DEFAULT 0,
      takeover INTEGER NOT NULL DEFAULT 0,
      h04_count INTEGER NOT NULL DEFAULT 0,
      h04_ms INTEGER NOT NULL DEFAULT 0,
      lk03_returns INTEGER NOT NULL DEFAULT 0,
      rv02_blocker INTEGER NOT NULL DEFAULT 0,
      rv02_major INTEGER NOT NULL DEFAULT 0,
      te03_runs INTEGER NOT NULL DEFAULT 0,
      rv04_rounds INTEGER NOT NULL DEFAULT 0,
      stage_metrics TEXT NOT NULL DEFAULT '{}',
      timeline TEXT NOT NULL DEFAULT '[]',
      updated_at TEXT NOT NULL,
      PRIMARY KEY (org_id, story_id)
    );

    CREATE TABLE IF NOT EXISTS org_period_rollups (
      org_id TEXT NOT NULL,
      period TEXT NOT NULL,
      computed_at TEXT NOT NULL,
      payload TEXT NOT NULL,
      PRIMARY KEY (org_id, period)
    );

    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

export type TokenRow = {
  token_hash: string;
  org_id: string;
  developer_id: string;
  label: string | null;
};

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

const DEFAULT_TOKENS: { token: string; org_id: string; developer_id: string; label: string }[] =
  [
    { token: "kt_dev_lan", org_id: ORG_ID, developer_id: "lan", label: "Lan Nguyễn" },
    { token: "kt_dev_minh", org_id: ORG_ID, developer_id: "minh", label: "Minh Trần" },
    { token: "kt_dev_hoa", org_id: ORG_ID, developer_id: "hoa", label: "Hoa Phạm" },
    { token: "kt_dev_khang", org_id: ORG_ID, developer_id: "khang", label: "Khang Lê" },
  ];

function seedTokens(database: Database.Database) {
  const insert = database.prepare(
    `INSERT OR IGNORE INTO ingest_tokens (token_hash, org_id, developer_id, label, created_at)
     VALUES (?, ?, ?, ?, ?)`,
  );
  const now = new Date().toISOString();
  for (const t of DEFAULT_TOKENS) {
    insert.run(hashToken(t.token), t.org_id, t.developer_id, t.label, now);
  }
}

export function lookupToken(token: string): TokenRow | undefined {
  const row = getDb()
    .prepare(
      `SELECT token_hash, org_id, developer_id, label
       FROM ingest_tokens WHERE token_hash = ?`,
    )
    .get(hashToken(token)) as TokenRow | undefined;
  return row;
}

export function setMeta(key: string, value: string) {
  getDb()
    .prepare(
      `INSERT INTO meta (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    )
    .run(key, value);
}

export function getMeta(key: string): string | undefined {
  const row = getDb()
    .prepare(`SELECT value FROM meta WHERE key = ?`)
    .get(key) as { value: string } | undefined;
  return row?.value;
}

export async function ensureReady() {
  if (ready) return;
  if (readyPromise) return readyPromise;
  readyPromise = (async () => {
    const database = getDb();
    migrate(database);
    seedTokens(database);
    const { seedIfEmpty } = await import("./seed");
    seedIfEmpty();
    ready = true;
  })();
  return readyPromise;
}
