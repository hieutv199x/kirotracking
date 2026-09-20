# Đẩy metric từ Kiro trên máy dev lên KiroTracking

Câu trả lời ngắn: **không nhờ agent “nhớ” gọi API**. Trên máy dev, **Kiro hook** (loại `command`) gọi một CLI local `kirotrack`. CLI ghi event vào bộ đệm trên đĩa, rồi đẩy HTTPS lên ingest API khi có mạng. KiroTracking **không tính metric lúc nhận** — nó lưu event log theo story; dashboard suy ra catalog ở [kiro-developer-metrics.md](./kiro-developer-metrics.md).

Tài liệu này là thiết kế đường thu thập. Chưa implement app.

---

## 1. Chọn gì trên máy Kiro — và vì sao chỉ một thứ

**Chọn: Agent Hooks, `action.type: "command"`.** Một file hook, mọi trigger gọi cùng lệnh `kirotrack hook`. CLI đọc JSON từ stdin, nhìn artifact spec, ghi event.

Đây là bề mặt Kiro đã có sẵn cho đúng việc này: hook chạy **tự động**, không tốn credit agent, cùng schema IDE và CLI, stdin có `cwd` + `session_id` (+ `tool_name` / `tool_input` với tool). Tài liệu Kiro ghi rõ Pre/Post Task Execution dùng để *log task start* và *notify external systems*.

**Không dùng MCP làm đường chính.** MCP cần model chọn tool. Metric sẽ thiếu im lặng khi agent quên, và tốn credit. MCP (nếu có sau) chỉ là lệnh tay kiểu “khóa spec giúp tôi”, không thay hook.

**Không viết plugin/IDE extension.** Hook đã là điểm mở của Kiro. Plugin trùng việc, thêm bước cài, không chạy trên CLI.

**Không file-watcher làm nguồn sự kiện.** Hook file của Kiro **chỉ** bắt thay đổi do agent. Watcher bắt cả sửa tay — hữu ích sau cho takeover — nhưng MVP không cần process nền.

Cổng người (khóa spec, trả spec, takeover, blocker, hủy) mà hook không thấy thì developer gọi **cùng CLI** `kirotrack …`. Không thêm kênh thứ hai.

---

## 2. Cài trên máy dev

Ba thứ, một lần theo máy (không copy vào từng repo):

| Thành phần | Chỗ để | Việc |
| --- | --- | --- |
| CLI `kirotrack` | `$PATH` | Nhận hook stdin, ghi queue, flush API |
| Hook | `~/.kiro/hooks/kirotrack.json` | Kiro tự chạy khi session bắt đầu |
| Credential | `~/.kirotrack/credentials` (mode `600`) | Token ingest; không đưa vào git |

Repo chỉ cần **quy ước spec** (mục 4). Artifact chấm công nằm ngoài git: `~/.kirotrack/` và `.kiro/specs/<story>/.kirotrack/` (gitignore).

Developer enroll một lần:

```bash
kirotrack login --token <ingest-token>
```

Token do KiroTracking cấp, **gắn sẵn** `org_id` + `developer_id`. Server lấy identity từ token, không tin `assignee` client gửi.

Hook tối thiểu — mọi trigger cùng một lệnh, matcher chỉ để bớt nhiễu:

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

Quy tắc an toàn: hook **luôn exit 0**. Thiếu CLI, timeout, hay API chết **không được** chặn agent (exit 2 chỉ dùng khi cố ý chặn tool). Collector ghi queue rồi return; flush chạy nền / lần SessionStart sau.

---

## 3. Đường đi của một event

```
Kiro IDE / CLI
  → hook command (stdin JSON: event, cwd, session_id, …)
  → kirotrack hook
       1. Suy story_id + stage từ .kiro/specs/ và state local
       2. Map sang tên event trong catalog (không invent metric)
       3. Ghi JSONL vào ~/.kirotrack/queue/  (durable trước khi mạng)
       4. Best-effort flush HTTPS
KiroTracking  POST /v1/ingest/events
  → lưu event (idempotent theo event_id)
  → job sau tính US-01, LK-02, H-01, D-08, …
```

Offline: bước 4 fail, queue giữ nguyên. Có mạng: SessionStart, Stop, hoặc timer local đẩy lại. Retry không tạo event mới — cùng `event_id`.

---

## 4. Story trên Kiro = một Feature Spec

Đơn vị catalog: **một user story = một vòng loop = một Feature Spec**.

| Ý niệm KiroTracking | Chỗ lấy trên máy |
| --- | --- |
| `story_id` | Tên thư mục `.kiro/specs/<story_id>/` — ổn định, không đổi khi refine US |
| Intake (bước 1) | Tạo spec → `requirements.md` |
| Gen spec (bước 2) | Kiro viết/sửa `design.md` (so code hiện có + US trước, refine US trong `requirements.md`) |
| Khóa tài liệu (bước 3) | Người **confirm design** trong Kiro. Tín hiệu bền: `tasks.md` **được tạo lần đầu** → `spec_locked`. Trả về: người không confirm, bảo gen lại `design.md` |
| Gen testcase (bước 4) | Task trong `tasks.md` thuộc section `testcase` — **trước** implement |
| Implement (bước 5) | `PreTaskExec` / `PostTaskExec` task section `implement` |
| Test (bước 6) | Shell test (`pytest`, `npm test`, …) qua `PostToolUse` |
| Review (bước 7) | Artifact `.kiro/specs/<id>/.kirotrack/review-round.json` + prompt người lúc stage=review |
| Commit (bước 8) | `git commit` thành công qua `PostToolUse` |

`tasks.md` **bắt buộc** hai section theo thứ tự (steering luôn bật nhắc agent). Không có section thì collector không đoán — không emit `testcase_*` / `implement_*` cho đến khi có:

```markdown
## testcase
- [ ] Sinh test từ spec đã khóa (map từng AC)

## implement
- [ ] …
```

Cổng người **bắt buộc** (khóa spec) dùng checkpoint native của Kiro: confirm `design.md` rồi mới ra `tasks.md`. Không invent nút lock riêng ở MVP.

Lệnh tay — chỉ khi hook không thấy:

```bash
kirotrack return --reason "..."     # spec_returned (người từ chối khóa)
kirotrack blocked --reason "env"
kirotrack unblocked
kirotrack takeover                  # D-03: người làm hộ, không trả AI
kirotrack refine start --stage ...  # D-08 ad-hoc (không phải cổng lock)
kirotrack refine resume
kirotrack review fail --blockers N --majors N
kirotrack review pass
kirotrack cancel --stage ...
```

`spec_submitted_for_lock` **chính là** `refine_with_human_started` (`stage=spec_lock`). Không gọi thêm `refine start` lúc trình khóa.

---

## 5. Event loop được emit

Tên event = catalog. Collector không gửi “metric đã tính”.

### MVP — đủ timestamp 8 bước, pass/fail/lock, vòng lặp, D-08

| Event | Khi nào trên máy Kiro | Catalog |
| --- | --- | --- |
| `story_received` | `PostFileCreate` `requirements.md` | US-01, H-01, H-05 |
| (cùng event, field `ready`) | Checklist: có user story + AC/EARS trong `requirements.md`? `returned_for_intake` nếu người bị hỏi lại trước `spec_gen_started` | US-02 |
| `ready` / `spec_gen_started` | Lần đầu `design.md` được tạo, hoặc agent bắt đầu design sau khi requirements có | US-03, SG-01 |
| `spec_gen_round` | Mỗi session gen design trước lần trình khóa đầu | SG-02 |
| `spec_submitted_for_lock` | `Stop` khi `design.md` đã có, `tasks.md` chưa có — AI chờ người chốt. **Luôn** kèm `refine_with_human_started` `stage=spec_lock` | LK-01, D-08 |
| `spec_locked` | `PostFileCreate` `tasks.md` lần đầu (người đã confirm design) → `refine_with_human_resumed` | LK-02, CM-02, D-04 |
| `spec_returned` | `kirotrack return`, hoặc `design.md` ghi lại sau khi đã trình khóa mà chưa lock | LK-03, H-03 |
| `testcase_gen_started` / `completed` | `PreTaskExec` task đầu / `PostTaskExec` task cuối section `testcase` | TC-01, TC-02 |
| `implement_started` / `completed` | Task đầu / xong hết section `implement` | IM-01, IM-02 |
| `test_started` | Lần đầu matcher lệnh test sau `implement_completed` | TE-02 |
| `test_run_completed` | Mỗi `PostToolUse` test; `result`: `pass` \| `fail` | TE-01, TE-03 |
| `test_passed` / `test_failed` | Suite liên quan xanh / fail (fail không kết thúc story) | TE-* |
| `review_started` | Sau `test_passed`, khi file review-round được tạo hoặc agent Stop chuyển review | RV-03 |
| `review_round_completed` | Ghi `review-round.json` hoặc `kirotrack review …`; `result`: `pass` \| `fail`; `findings.blocker` + `findings.major` | RV-01, RV-02, RV-04 |
| `review_passed` / `review_failed` | Kết quả vòng; fail có `rework_to`: `implement` \| `test` \| `spec_gen` | RV-01, H-03 |
| `refine_with_human_started` / `resumed` | Cổng lock (tự); review khi người prompt lúc stage=review; ad-hoc qua CLI | D-08 |
| `committed` | `PostToolUse` `git commit` exit 0 | CM-01, CM-02, D-01, H-01, H-05 |
| `blocked` / `unblocked` | CLI; **không** dùng lúc chờ khóa spec / refine | H-04 |
| `human_intervention` | `kirotrack takeover` — cờ có/không trên story, **không** gồm lock/D-08 | D-03 |
| `cancelled` | CLI + `stage` | H-07/H-08 (field sẵn; báo cáo Sau) |

Mọi event MVP mang: `occurred_at`, `story_id`, `session_id` (Kiro), `stage` hiện tại. Server gắn `developer_id` từ token.

### Sau — không chặn ingest MVP

| Event / field | Hook / nguồn | Catalog |
| --- | --- | --- |
| Version `requirements.md` mỗi lần save đến lúc lock | `PostFileSave` | US-04 |
| Danh sách file/US tham chiếu trong `design.md` lúc trình khóa | parse artifact | SG-03 |
| Số testcase + map AC lúc `testcase_gen_completed` | artifact test | TC-03 |
| `human_takeover` riêng giai đoạn implement | CLI + (sau) watcher file tay | IM-03 |
| Diff file/dòng lúc implement xong và lúc commit | `git diff` | IM-04 |
| `test_failed` → `test_passed` với diff rỗng | so commit/worktree | TE-04 |
| Đối chiếu testcase gen vs báo cáo run | JUnit/JSON reporter | TE-05 |
| Trạng thái từng finding `fixed` / `wontfix` / `deferred` | review artifact | RV-05 |
| `commit_failed` | `PostToolUse` git commit / hook CI fail | CM-03 |
| Session người vs agent theo stage | `UserPromptSubmit` + `Stop` duration | D-05 |
| Defect/hotfix, revert gắn `story_id` | ticket + `git revert` | D-06, D-07 |
| Snapshot WIP theo stage | server, không cần máy dev | H-06 |

---

## 6. Auth, bộ đệm local, retry

### Auth

1. Org cấp **ingest token** (MVP: PAT; sau: OIDC/SSO).
2. `kirotrack login` ghi `~/.kirotrack/credentials`.
3. Mỗi request: `Authorization: Bearer <token>` trên TLS.
4. Server resolve `org_id` + `developer_id`; **bỏ qua** assignee client nếu lệch token.
5. Token chỉ quyền `ingest:events`. Không đọc dashboard, không đổi token khác.

Không nhét secret vào hook JSON, không env trong repo, không log token.

### Queue

- File JSONL: `~/.kirotrack/queue/<yyyy-mm-dd>.jsonl` (append-only).
- Mỗi dòng = một envelope đã có `event_id` (UUIDv4) **trước** lần flush đầu.
- Durable: `fsync` trước khi hook exit.
- State story: `~/.kirotrack/state/<story_id>.json` (stage, lần trình khóa, số vòng) — để không emit hai lần `spec_locked`.

### Flush và offline

- Sau mỗi event: thử POST batch (tối đa ~100 event hoặc 256 KB).
- Fail mạng / 5xx / 429: giữ queue, exponential backoff 1s → 5s → 30s → 5 phút, trần 5 phút; `Retry-After` nếu có.
- 401/403: **ngừng flush**, giữ queue, báo developer login lại — không xoá event.
- 400 validation: tách event lỗi ra `~/.kirotrack/dead-letter/` (kèm body lỗi), các event còn lại vẫn đẩy. Không retry mãi payload sai.
- SessionStart và Stop luôn flush. Máy ngủ dậy: lần hook tới tiếp tục.
- Tắt máy giữa chừng: JSONL còn trên đĩa; không mất story.

Idempotency: client gửi `event_id` + header `Idempotency-Key` (batch: hash các `event_id`). Server upsert theo `event_id`. Retry không nhân đôi US-01 / D-08 / H-05.

Thứ tự: tin `occurred_at` trên event, không tin thứ tự gói đến. Offline overnight rồi flush hàng loạt vẫn đúng cycle time.

---

## 7. Ingest API KiroTracking phải nhận

MVP **một** endpoint. Không nhận “metric đã rollup”.

```
POST /v1/ingest/events
Authorization: Bearer <token>
Idempotency-Key: <key>
Content-Type: application/json
```

### Envelope (mỗi event)

```json
{
  "event_id": "8f1c2a10-9c3e-4b7a-9d2e-0a1b2c3d4e5f",
  "schema_version": 1,
  "occurred_at": "2026-09-20T08:15:03.120Z",
  "story_id": "checkout-retry",
  "session_id": "abc123-def456",
  "repo": {
    "remote": "git@github.com:acme/shop.git",
    "branch": "feat/checkout-retry"
  },
  "name": "spec_submitted_for_lock",
  "stage": "spec_lock",
  "payload": {}
}
```

`developer_id` / `org_id` **không** bắt buộc trên body — lấy từ token. Client có thể gửi `assignee` để debug; server không dùng nếu khác token.

### Batch

```json
{
  "sent_at": "2026-09-20T08:16:00.000Z",
  "events": [ { "...": "envelope" } ]
}
```

Giới hạn MVP: ≤ 100 event / request, ≤ 256 KB. Vượt → 413, client cắt nhỏ (không đổi `event_id`).

### `name` hợp lệ (MVP)

`story_received` · `ready` · `spec_gen_started` · `spec_gen_round` · `spec_submitted_for_lock` · `spec_locked` · `spec_returned` · `testcase_gen_started` · `testcase_gen_completed` · `testcase_gen_round` · `implement_started` · `implement_completed` · `implement_round` · `test_started` · `test_run_completed` · `test_passed` · `test_failed` · `review_started` · `review_round_completed` · `review_passed` · `review_failed` · `refine_with_human_started` · `refine_with_human_resumed` · `committed` · `blocked` · `unblocked` · `human_intervention` · `cancelled`

Tên lạ → 400 cho **event đó**, không 400 cả batch.

### `payload` theo một số event

| `name` | Field cần |
| --- | --- |
| `story_received` | `ready: boolean` (US-02); optional `intake_gaps: string[]` |
| `spec_returned` | `reason?`; lần trả (server đếm cũng được) |
| `test_run_completed` | `result: pass\|fail`; `run_index` |
| `review_round_completed` | `result: pass\|fail`; `findings: { blocker: number, major: number }`; `rework_to?` |
| `refine_with_human_started` | `stage: spec_gen\|spec_lock\|testcase\|implement\|test\|review\|commit` — bắt buộc |
| `blocked` / `unblocked` | `reason`; `stage` |
| `human_intervention` | `stage?`; `reason?` — cờ story-level |
| `cancelled` | `stage` |
| `committed` | `commit_sha?` |

`spec_submitted_for_lock` không cần payload đặc biệt; server **bắt buộc** hiểu nó = một lần D-08 `stage=spec_lock` dù client có hoặc không gửi kèm `refine_with_human_started`. Nếu client gửi cả hai, `event_id` khác nhau, cùng `occurred_at` ≈ nhau — job D-08 **dedupe** theo story+stage+cửa sổ vài giây, hoặc quy ước client chỉ gửi một trong hai. **Quy ước MVP:** client gửi **cả hai** (catalog: submitted_for_lock *chính là* refine start). Job đếm D-08 theo `refine_with_human_started`, **không** cộng thêm từ `spec_submitted_for_lock`.

### Response

| HTTP | Nghĩa | Client |
| --- | --- | --- |
| 202 | Nhận; `{ "accepted": n, "duplicate": n, "rejected": [...] }` | Xóa khỏi queue các `event_id` accepted/duplicate |
| 400 | JSON/schema hỏng cả request | Dead-letter, không retry nguyên batch |
| 401 / 403 | Token | Giữ queue, dừng flush |
| 413 | Quá lớn | Cắt batch |
| 429 / 5xx | Tạm | Backoff, giữ queue |

`rejected[]`: `{ "event_id", "error" }` — chỉ những dòng đó vào dead-letter.

Server MVP: ghi append-only (store event). **Không** tính H-01 lúc ingest. Job đọc log theo `story_id`.

Sau (API): event tên mới (mục 5), `GET` ingest status, rotate token, reject replay quá cũ nếu cần — không đổi envelope `schema_version: 1`.

---

## 8. MVP vs sau — ranh giới thu thập

### MVP (máy dev + API)

- Hook `command` + CLI `kirotrack` + queue JSONL + `POST /v1/ingest/events`.
- Spec Kiro = story; khóa spec = confirm design (`tasks.md` ra đời); testcase vs implement = hai section trong `tasks.md`.
- Đủ event mục 5 (cột MVP) để tính: thời gian 8 bước, thông lượng commit, rework, blocker, first-pass lock/test/review, D-03, **D-08** (tổng + tách `spec_lock` vs `review`).
- Auth token gắn người; identity không do client tự khai.
- Hook không được làm hỏng loop Kiro.

### Không làm ở MVP

- MCP / plugin / daemon watcher.
- Coverage, map testcase↔AC, diff LOC, flaky, finding đóng trước commit, commit fail, giờ người vs agent, bug/revert sau commit, WIP realtime.
- Xếp hạng cá nhân trên dashboard (catalog đã cấm khi mẫu nhỏ).
- Chặn `git commit` từ hook metric (đó là việc khác).

### Sau

- Field/event cột “Sau” mục 5.
- Watcher file tay → tín hiệu takeover không cần CLI.
- SSO thay PAT.
- Snapshot H-06 phía server.
- (Tuỳ chọn) MCP `kirotrack_lock` bọc CLI — vẫn phụ, hook vẫn chính.

---

## 9. Kiểm tra đường đi (khi implement)

Một story Happy path trên máy thật:

1. Tạo Feature Spec → queue có `story_received`.
2. Gen `design.md` → `spec_gen_started`.
3. Agent dừng chờ confirm → `spec_submitted_for_lock` + `refine_with_human_started` (`spec_lock`).
4. Confirm design, `tasks.md` xuất hiện → `spec_locked`.
5. Chạy task `testcase` rồi `implement` → đủ `*_started` / `*_completed`.
6. Test xanh → `test_passed`; review pass → `review_passed`; commit → `committed`.
7. Tắt mạng ở bước 3, bật lại, SessionStart → **cùng** `event_id` lên server một lần.
8. Dashboard (khi có) ra H-01, LK-02=true, D-08≥1 ở `spec_lock`.

Thiếu `tasks.md` section `testcase` / `implement` → không bịa stage; dead-letter hoặc event `blocked` lý do `unmapped_tasks` — không im lặng gán nhầm implement.

---

Catalog metric (định nghĩa, MVP/Sau): [kiro-developer-metrics.md](./kiro-developer-metrics.md).
