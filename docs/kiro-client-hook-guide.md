# Hướng dẫn: hook Kiro client đẩy metric lên KiroTracking

File này dành cho người **build collector trên máy Kiro** (CLI + Agent Hook). Dashboard KiroTracking **chỉ vẽ**; không enroll máy, không cài hook, không tính catalog lúc nhận event.

Đường thu thập: hook `command` → CLI local → `POST /v1/ingest/events`. **Không dùng MCP** làm đường chính (model có thể quên gọi tool).

Thiết kế gốc: `kiro-metric-ingestion.md`. Catalog: `kiro-developer-metrics.md`.

---

## 1. Việc cần build (không nằm trong dashboard)

Ba thứ, cài **một lần theo máy**, không commit vào từng repo:

| Thành phần | Chỗ để | Việc |
| --- | --- | --- |
| CLI `kirotrack` | `$PATH` | Đọc stdin hook, map event, ghi queue, flush HTTPS |
| Hook | `~/.kiro/hooks/kirotrack.json` | Kiro tự chạy; mọi trigger gọi `kirotrack hook` |
| Token | `~/.kirotrack/credentials` (mode `600`) | Bearer ingest; **không** git |

Quy tắc an toàn: hook **luôn `exit 0`**. Thiếu CLI / timeout / API chết **không được** chặn agent.

---

## 2. API đang chạy (contract thật)

```
POST {KIROTRACK_URL}/v1/ingest/events
Authorization: Bearer <token>
Idempotency-Key: <key>
Content-Type: application/json
```

Local MVP: `http://127.0.0.1:43123`. Body:

```json
{
  "sent_at": "2026-09-20T08:16:00.000Z",
  "events": [ { "...envelope" } ]
}
```

Giới hạn: ≤ 100 event / request, ≤ 256 KB → 413 (cắt batch, **giữ nguyên** `event_id`).

Identity: server lấy `org_id` + `developer_id` **từ token**. Field `assignee` trên client **bị bỏ qua**.

Token demo (local):

| Token | developer_id |
| --- | --- |
| `kt_dev_lan` | lan |
| `kt_dev_minh` | minh |
| `kt_dev_hoa` | hoa |
| `kt_dev_khang` | khang |

HTTP:

| Status | Client làm gì |
| --- | --- |
| 202 `{ accepted, duplicate, rejected }` | Xóa queue các `event_id` accepted **và** duplicate. `rejected[]` → dead-letter |
| 400 | Dead-letter cả batch (JSON hỏng) |
| 401 / 403 | **Giữ queue**, dừng flush, bắt login lại |
| 413 | Cắt nhỏ batch |
| 429 / 5xx | Backoff, giữ queue |

Retry **cùng** `event_id` (UUID). Server `INSERT OR IGNORE` — không nhân đôi story / D-08.

---

## 3. Envelope mỗi event

```json
{
  "event_id": "8f1c2a10-9c3e-4b7a-9d2e-0a1b2c3d4e5f",
  "schema_version": 1,
  "occurred_at": "2026-09-20T08:15:03.120Z",
  "story_id": "checkout-retry",
  "session_id": "abc123-def456",
  "repo": { "remote": "git@github.com:acme/shop.git", "branch": "feat/checkout-retry" },
  "name": "story_received",
  "stage": "intake",
  "payload": { "ready": true }
}
```

Bắt buộc: `event_id` UUID, `schema_version: 1`, `occurred_at` ISO, `story_id`, `session_id`, `name` trong whitelist, `stage` một trong 8 bước, `payload` object (có thể `{}`).

`story_id` = tên thư mục `.kiro/specs/<story_id>/`. `session_id` lấy từ stdin hook của Kiro.

### `name` hợp lệ

`story_received` · `ready` · `spec_gen_started` · `spec_gen_round` · `spec_submitted_for_lock` · `spec_locked` · `spec_returned` · `testcase_gen_started` · `testcase_gen_completed` · `testcase_gen_round` · `implement_started` · `implement_completed` · `implement_round` · `test_started` · `test_run_completed` · `test_passed` · `test_failed` · `review_started` · `review_round_completed` · `review_passed` · `review_failed` · `refine_with_human_started` · `refine_with_human_resumed` · `committed` · `blocked` · `unblocked` · `human_intervention` · `cancelled`

Tên lạ → **chỉ event đó** vào `rejected` (HTTP vẫn 202).

### `stage` hợp lệ

`intake` · `spec_gen` · `spec_lock` · `testcase` · `implement` · `test` · `review` · `commit`

### Payload server validate (thiếu là reject)

| `name` | Payload |
| --- | --- |
| `story_received` | `ready` boolean |
| `test_run_completed` | `result`: `"pass"` \| `"fail"` |
| `review_round_completed` | `result`: `"pass"` \| `"fail"`; `findings: { blocker: number, major: number }` |
| `refine_with_human_started` | `stage`: `spec_gen` \| `spec_lock` \| `testcase` \| `implement` \| `test` \| `review` \| `commit` |
| `blocked` / `unblocked` | `reason` string khác rỗng |
| `cancelled` | `payload.stage` một trong 8 bước |

Các name khác: `payload` object, thường `{}`. Optional hữu ích: `committed.commit_sha`, `spec_returned.reason`, `review_failed.rework_to`.

### D-08 (AI dừng để chốt)

- Đếm **`refine_with_human_started` thôi**. Không cộng `spec_submitted_for_lock`.
- Lúc trình khóa: gửi **cả hai** (cùng `occurred_at`, `event_id` khác nhau):
  - `spec_submitted_for_lock` `stage=spec_lock`
  - `refine_with_human_started` `payload.stage=spec_lock`
- Khi người khóa (`tasks.md` lần đầu): `spec_locked` + `refine_with_human_resumed`.
- **Không** emit `blocked` khi đang chờ khóa spec.

---

## 4. File hook Kiro

Đặt `~/.kiro/hooks/kirotrack.json` (hoặc copy `examples/kirotrack.hook.json`). Một lệnh, matcher chỉ để bớt nhiễu:

```json
{
  "version": "v1",
  "hooks": [
    {
      "name": "kirotrack-session",
      "trigger": "SessionStart",
      "action": { "type": "command", "command": "kirotrack hook", "timeout": 5 }
    },
    {
      "name": "kirotrack-prompt",
      "trigger": "UserPromptSubmit",
      "action": { "type": "command", "command": "kirotrack hook", "timeout": 5 }
    },
    {
      "name": "kirotrack-spec-files",
      "trigger": "PostFileCreate",
      "matcher": "\\.kiro/specs/",
      "action": { "type": "command", "command": "kirotrack hook", "timeout": 5 }
    },
    {
      "name": "kirotrack-spec-save",
      "trigger": "PostFileSave",
      "matcher": "\\.kiro/specs/",
      "action": { "type": "command", "command": "kirotrack hook", "timeout": 5 }
    },
    {
      "name": "kirotrack-pre-task",
      "trigger": "PreTaskExec",
      "action": { "type": "command", "command": "kirotrack hook", "timeout": 5 }
    },
    {
      "name": "kirotrack-post-task",
      "trigger": "PostTaskExec",
      "action": { "type": "command", "command": "kirotrack hook", "timeout": 5 }
    },
    {
      "name": "kirotrack-tools",
      "trigger": "PostToolUse",
      "matcher": "shell|executeBash|execute_bash",
      "action": { "type": "command", "command": "kirotrack hook", "timeout": 5 }
    },
    {
      "name": "kirotrack-stop",
      "trigger": "Stop",
      "action": { "type": "command", "command": "kirotrack hook", "timeout": 5 }
    }
  ]
}
```

Stdin hook (Kiro): JSON có `cwd`, `session_id`, và tùy trigger `tool_name` / `tool_input` / đường file. CLI đọc stdin, không hỏi model.

Timeout 5s. Collector ghi disk rồi return; flush mạng chạy nền hoặc lần `SessionStart` sau.

---

## 5. Map artifact Kiro → event

Một user story = một Feature Spec = một vòng 8 bước.

| Event | Khi nào trên máy |
| --- | --- |
| `story_received` | `PostFileCreate` `.kiro/specs/<id>/requirements.md`. `ready=true` nếu có user story + AC |
| `ready` / `spec_gen_started` | Lần đầu `design.md` được tạo |
| `spec_gen_round` | Mỗi vòng gen design trước lần trình khóa đầu |
| `spec_submitted_for_lock` + `refine_with_human_started` | `Stop` khi đã có `design.md`, **chưa** có `tasks.md` |
| `spec_locked` + `refine_with_human_resumed` | `PostFileCreate` `tasks.md` **lần đầu** (người đã confirm design) |
| `spec_returned` | CLI `kirotrack return`, hoặc `design.md` ghi lại sau khi đã trình khóa mà chưa lock |
| `testcase_gen_started` / `completed` | `PreTaskExec` task đầu / `PostTaskExec` task cuối section `## testcase` |
| `implement_started` / `completed` | Tương tự section `## implement` |
| `test_started` / `test_run_completed` | `PostToolUse` lệnh test (`npm test`, `pytest`, …); parse exit code → `result` |
| `test_passed` / `test_failed` | Suite liên quan xanh / fail |
| `review_*` | Artifact `.kiro/specs/<id>/.kirotrack/review-round.json` hoặc CLI `kirotrack review …` |
| `committed` | `PostToolUse` `git commit` exit 0 |

`tasks.md` **bắt buộc** hai section theo thứ tự. Không có section → **không đoán**, không emit `testcase_*` / `implement_*`:

```markdown
## testcase
- [ ] Sinh test từ spec đã khóa (map từng AC)

## implement
- [ ] …
```

State chống double-emit: `~/.kirotrack/state/<story_id>.json` (đã khóa spec chưa, số vòng, stage hiện tại).

Lệnh tay — chỉ khi hook không thấy:

```bash
kirotrack return --reason "..."
kirotrack blocked --reason "env"
kirotrack unblocked
kirotrack takeover
kirotrack refine start --stage review
kirotrack refine resume
kirotrack review fail --blockers N --majors N
kirotrack review pass
kirotrack cancel --stage implement
```

`spec_submitted_for_lock` **đã là** refine lúc khóa spec. Không gọi thêm `refine start` lúc trình khóa.

---

## 6. Queue local rồi mới mạng

```
~/.kirotrack/
  credentials          # token, chmod 600
  queue/YYYY-MM-DD.jsonl
  state/<story_id>.json
  dead-letter/
```

1. Gán `event_id` UUID **trước** lần flush đầu.
2. Append JSONL + `fsync` **trước** khi hook exit.
3. Best-effort `POST` batch.
4. 202 accepted/duplicate → xóa dòng. rejected → dead-letter. 5xx/429 → giữ, backoff 1s → 5s → 30s → 5 phút.
5. SessionStart và Stop luôn flush.

Tin `occurred_at` trên event, không tin thứ tự gói đến.

---

## 7. Skeleton CLI (`kirotrack hook`)

Ý: đọc stdin, suy `story_id` từ `.kiro/specs/` gần `cwd`, map trigger → event, ghi queue, flush.

```bash
#!/usr/bin/env bash
set -eu
# Luôn exit 0 với Kiro — bọc toàn bộ trong trap
trap 'exit 0' EXIT

KIROTRACK_URL="${KIROTRACK_URL:-http://127.0.0.1:43123}"
TOKEN=$(cat "${HOME}/.kirotrack/credentials" 2>/dev/null || true)
[ -n "$TOKEN" ] || exit 0

stdin=$(cat)
# parse session_id, cwd, trigger từ $stdin — dùng jq trong bản thật

# Ví dụ emit một event (thay bằng mapper):
event_id=$(uuidgen | tr '[:upper:]' '[:lower:]')
# ghi ~/.kirotrack/queue/… rồi:

curl -sS -X POST "${KIROTRACK_URL}/v1/ingest/events" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: ${event_id}" \
  --max-time 3 \
  -d "{\"sent_at\":\"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)\",\"events\":[...]}" \
  || true
```

Smoke test không cần hook (dashboard local đang chạy):

```bash
curl -sS -X POST http://127.0.0.1:43123/v1/ingest/events \
  -H "Authorization: Bearer kt_dev_lan" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: hook-smoke-1" \
  -d '{
    "sent_at": "2026-09-20T10:00:00.000Z",
    "events": [{
      "event_id": "aaaaaaaa-0000-4000-8000-000000000001",
      "schema_version": 1,
      "occurred_at": "2026-09-20T09:59:00.000Z",
      "story_id": "hook-smoke",
      "session_id": "sess-hook",
      "repo": { "remote": "git@github.com:acme/shop.git", "branch": "feat/hook-smoke" },
      "name": "story_received",
      "stage": "intake",
      "payload": { "ready": true }
    }]
  }'
```

Kỳ vọng `{"accepted":1,"duplicate":0,"rejected":[]}`. Gửi lại cùng `event_id` → `duplicate: 1`.

---

## 8. Checklist happy path

1. Tạo Feature Spec → queue có `story_received`.
2. Gen `design.md` → `spec_gen_started`.
3. Agent dừng chờ confirm → `spec_submitted_for_lock` + `refine_with_human_started` (`spec_lock`).
4. Confirm, `tasks.md` ra → `spec_locked` + `refine_with_human_resumed`.
5. Task `testcase` rồi `implement` → `*_started` / `*_completed`.
6. Test xanh → `test_passed`; review pass; `git commit` → `committed`.
7. Tắt mạng ở bước 3, bật lại, SessionStart → **cùng** `event_id` lên server một lần.
8. Dashboard: story vào vòng, thời gian xong khi đã commit, AI dừng ≥ 1 lúc khóa spec.

Không làm ở collector MVP: MCP, plugin IDE, file-watcher, tính H-01/D-08 trên máy (server rollup), chặn `git commit`.
