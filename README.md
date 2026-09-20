# KiroTracking

Dashboard visualization for the Kiro engineering loop — eight steps to commit — plus the metric ingest API that Kiro machines push to.

This app **only draws rolled-up loop health**. It does not enroll machines, install hooks, or compute catalog metrics at ingest time.

Loop: story → spec gen → human lock → testcase → implement → test → review → commit.

## Run locally

Requires Node 22+. Postgres/Redis are optional; the default store is SQLite at `data/kirotrack.sqlite` so the app starts without credentials.

```bash
npm install
npm run dev
```

- Dashboard: [http://127.0.0.1:43123](http://127.0.0.1:43123)
- Ingest (same process): `POST http://127.0.0.1:43123/v1/ingest/events`

Optional standalone ingest process (Hono):

```bash
npm run ingest
```

Listens on `http://127.0.0.1:43124`. Demo seed data is written on first boot so Overview is not empty.

```bash
npm test
npm run build
```

## Kiro integration (docs)

| Doc | What it covers |
| --- | --- |
| **[docs/kiro-client-hook-guide.md](docs/kiro-client-hook-guide.md)** | **Build the machine-side collector**: CLI `kirotrack` + Agent Hook → `POST /v1/ingest/events`. Sample hook: [`examples/kirotrack.hook.json`](examples/kirotrack.hook.json) |
| [docs/kiro-metric-ingestion.md](docs/kiro-metric-ingestion.md) | Ingest contract, identity from token, queue/retry, rollup timing |
| [docs/kiro-developer-metrics.md](docs/kiro-developer-metrics.md) | Metric catalog (H-*, D-*, gates) and event → metric mapping |
| [docs/kirotracking-app-design.md](docs/kirotracking-app-design.md) | Product / dashboard design (visualization only) |

Same guide also available as [`docs/kiro-client-hook.md`](docs/kiro-client-hook.md).

**Quick start (collector on the Kiro machine):**

1. Copy `examples/kirotrack.hook.json` → `~/.kiro/hooks/kirotrack.json`
2. Build CLI `kirotrack` per the hook guide (always `exit 0`; never block the agent)
3. Store Bearer token in `~/.kirotrack/credentials` (mode `600`) — demo: `kt_dev_lan`
4. Point `KIROTRACK_URL` at your ingest base (local MVP: `http://127.0.0.1:43123`)

## POST events

Contract matches `POST /v1/ingest/events`: Bearer token, batch envelope, idempotent `event_id`, `202` with `{ accepted, duplicate, rejected }`. Catalog metrics are **not** computed on this request; a debounce rollup job updates dashboard tables afterwards.

Demo tokens (bound to `org_id=acme` + `developer_id` on the server — client `assignee` is ignored):

| Token | Developer |
| --- | --- |
| `kt_dev_lan` | Lan Nguyen |
| `kt_dev_minh` | Minh Tran |
| `kt_dev_hoa` | Hoa Pham |
| `kt_dev_khang` | Khang Le |

```bash
curl -sS -X POST http://127.0.0.1:43123/v1/ingest/events \
  -H "Authorization: Bearer kt_dev_lan" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: demo-batch-1" \
  -d '{
    "sent_at": "2026-09-20T08:16:00.000Z",
    "events": [
      {
        "event_id": "8f1c2a10-9c3e-4b7a-9d2e-0a1b2c3d4e5f",
        "schema_version": 1,
        "occurred_at": "2026-09-20T08:15:03.120Z",
        "story_id": "live-demo",
        "session_id": "abc123-def456",
        "repo": { "remote": "git@github.com:acme/shop.git", "branch": "feat/live-demo" },
        "name": "story_received",
        "stage": "intake",
        "payload": { "ready": true }
      }
    ]
  }'
```

Retry the same `event_id` — `duplicate` increments, the story is not counted twice. Unknown `name` rejects that row only (HTTP still 202). Over 100 events or 256 KB → 413.

## UI

English visualization: **Overview**, **8-step funnel**, **Stories** (+ timeline), **By person**, **Me**. Switch period (Today / 7 days / 30 days) and viewer (lead vs developer) in the header. There are no collector, enroll, or hook-setup screens.

## Layout

| Path | Role |
| --- | --- |
| `src/app/v1/ingest/events` | Next.js Route Handler wrapping the Hono ingest app (`POST /v1/ingest/events`) |
| `src/ingest` | Hono app + optional standalone server |
| `src/lib/ingest.ts` | Validate + append-only SQLite `events` |
| `src/lib/rollup.ts` | Dirty-story job → `story_rollups` / `org_period_rollups` |
| `src/app/(dashboard)` | Visualization pages |
| `docs/` | Kiro integration + product design docs |
| `examples/kirotrack.hook.json` | Sample Kiro Agent Hook |
