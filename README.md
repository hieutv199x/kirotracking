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

## POST events

Contract matches `POST /v1/ingest/events`: Bearer token, batch envelope, idempotent `event_id`, `202` with `{ accepted, duplicate, rejected }`. Catalog metrics are **not** computed on this request; a debounce rollup job updates dashboard tables afterwards.

Demo tokens (bound to `org_id=acme` + `developer_id` on the server — client `assignee` is ignored):

| Token | Developer |
| --- | --- |
| `kt_dev_lan` | Lan Nguyễn |
| `kt_dev_minh` | Minh Trần |
| `kt_dev_hoa` | Hoa Phạm |
| `kt_dev_khang` | Khang Lê |

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

Vietnamese visualization only: **Tổng quan**, **Phễu 8 bước**, **Story** (+ timeline), **Theo người**, **Tôi**. Switch period (Hôm nay / 7 ngày / 30 ngày) and viewer (lead vs developer) in the header. There are no collector, enroll, or hook-setup screens.

## Layout

| Path | Role |
| --- | --- |
| `src/app/v1/ingest/events` | Next.js Route Handler wrapping the Hono ingest app (`POST /v1/ingest/events`) |
| `src/ingest` | Hono app + optional standalone server |
| `src/lib/ingest.ts` | Validate + append-only SQLite `events` |
| `src/lib/rollup.ts` | Dirty-story job → `story_rollups` / `org_period_rollups` |
| `src/app/(dashboard)` | Visualization pages |
