# Thiết kế ứng dụng KiroTracking

KiroTracking là **dashboard trực quan hóa** sức khỏe vòng lặp kỹ thuật Kiro — tám bước đến commit — cho một org khoảng **300 developer**.

**Khung sản phẩm:** Kiro trên máy dev **đẩy event** vào hệ thống (hook + CLI). App này **không** là UI thu thập, enroll, cài hook, hay “bác sĩ collector”. UI **chỉ đọc rollup** đã tính: sức khỏe loop, phễu 8 bước, timeline story, D-08, rework, cổng first-pass. Người xem số loop; máy Kiro mới là nơi sinh sự kiện.

App **không** sinh metric trên máy, **không** tin agent “nhớ” gọi API, và **không** tính catalog lúc nhận event.

Vòng lặp (cố định):

1. Người nhập user story  
2. Gen spec (so code hiện có + user story trước; refine US)  
3. Người khóa tài liệu kỹ thuật  
4. Gen testcase  
5. Implement  
6. Test  
7. Review loop  
8. Commit  

Câu hỏi MVP của UI: *story có ra commit không; chậm ở bước nào; phải làm lại vì trả spec / test fail / review fail không; AI dừng refine với người bao nhiêu lần — bao nhiêu ở khóa spec, bao nhiêu ở review.*

Catalog metric: [kiro-developer-metrics.md](./kiro-developer-metrics.md).  
Đường đẩy event từ máy Kiro: [kiro-metric-ingestion.md](./kiro-metric-ingestion.md).

Tài liệu này là thiết kế app. Chưa implement.

---

## 1. Bề mặt sản phẩm — dashboard visualization

Toàn bộ nav chính là **xem số đã rollup**. Không có màn cài máy, login token, hàng đợi local, hay danh sách hook.

### 1.1 Ai dùng UI

Hai vai chính, một dashboard. Vận hành pipeline **không** ngồi trên nav sản phẩm (mục 4).

| Vai | Việc trên dashboard | Không làm trên UI này |
| --- | --- | --- |
| **Lead kỹ thuật / EM** | Loop org: thông lượng commit, cycle time, nút thắt 8 bước, rework, D-08, phễu, story | So sánh cá nhân khi mẫu nhỏ; KPI theo LOC; cài collector hộ team |
| **Developer** | Cùng các hình đó, phạm vi story / người của mình: timeline 8 bước, D-08, rework | Sửa event; enroll máy; xem token; “máy tôi im lặng” |

Identity trên số liệu = `developer_id` gắn ingest token phía server, không phải `assignee` client gửi ([ingestion §6](./kiro-metric-ingestion.md)). Dashboard đăng nhập **session đọc rollup** — tách khỏi token đẩy event.

### 1.2 Khung chung (desktop + mobile)

**Desktop (≥1024px):** sidebar trái chỉ visualization — **Tổng quan**, **Phễu 8 bước**, **Story**, **Theo người**. Thanh trên: org, kỳ (`Hôm nay` / `7 ngày` / `30 ngày`), bộ lọc team (Sau). Không mục Thu thập / Cài đặt hook.

**Mobile:** tab dưới — Tổng quan, Story, Tôi. Phễu gộp vào Tổng quan (cuộn dọc). Bảng Story thành danh sách thẻ.

Kỳ mặc định: **7 ngày**. Mọi tỷ lệ tính trên story trong kỳ, trừ khi màn ghi chú khác (đúng catalog).

Nếu pipeline ingest/rollup hỏng, **một banner** trên dashboard (không đổi nav): số có thể cũ. Chi tiết tín hiệu nằm ở lớp ops (mục 4), không trộn vào layout chính.

### 1.3 Màn visualization

#### A. Tổng quan loop — mặc định

Mục đích: một màn trả lời sức khỏe loop, không phải gallery chart, không phải trạng thái collector.

**Hàng KPI (4 thẻ, luôn cùng thứ tự):**

1. **Đã commit** — H-05. Phụ: số story vào loop (US-01) cùng kỳ.  
2. **Cycle time** — H-01 trung vị + p90. Không hiện trung bình làm số chính.  
3. **Rework** — H-03: % story phải quay bước trước, kèm trung vị số vòng.  
4. **Refine với người** — D-08: trung vị số lần / story đã commit (hoặc đang mở nếu đang lọc WIP). Phụ: tách `spec_lock` / `review`.

**Nút thắt:** một hàng 8 cột = 8 bước. Mỗi cột: thời gian **làm** + thời gian **chờ** (H-02; chờ khóa spec = LK-01). Cột tô đậm nếu trung vị chờ của bước đó ≥ 40% cycle time trung vị. Caption dưới hàng: *“Cycle time dài mà chờ khóa spec chiếm phần lớn thì đừng tối ưu implement.”*

**Cổng chất lượng (3 chỉ số cạnh nhau, không trộn D-08 vào đây):**

- Khóa spec lần đầu (LK-02)  
- Test xanh lần đầu (TE-01)  
- Review đạt lần đầu (RV-01)  

**D-08 theo cổng:** stacked bar `spec_lock` vs `review` vs `khác` (testcase / implement / …). Happy path **phải** có ≥ 1 lần `spec_lock`. Caption: *“Cao ở khóa spec = US/spec chưa chốt. Cao ở review = implement/test chưa đạt spec đã khóa. Không gộp với takeover.”*

**Takeover (D-03):** một dòng nhỏ dưới D-08 — % story có cờ người làm hộ. Nếu D-03 ≈ 100% và cycle time thấp: *“Người đang gánh loop, không phải loop tự chạy.”*

Copy thẻ (ví dụ số khi đã có rollup):  
`32 story commit · 41 vào loop`  
`Trung vị 11 giờ · p90 1,8 ngày`  
`28% story rework · trung vị 1 vòng`  
`D-08 trung vị 3 lần · 2 khóa spec · 1 review`

#### B. Phễu 8 bước

Cùng cohort: story `story_received` trong kỳ (không phải chỉ story đã commit — tránh phễu “đẹp” vì bỏ story treo).

Mỗi bậc: số story **đã vào bậc**, số **đang đứng**, trung vị thời gian bậc, tỷ lệ đi tiếp. Bậc 3 (khóa spec) hiện thêm LK-03 (trung vị số lần trả spec). Bậc 7 hiện thêm RV-02 (trung vị blocker + major).

Click một bậc → danh sách story đang đứng đó (mobile: sheet kéo lên).

#### C. Story

Bảng (desktop) / thẻ (mobile): `story_id`, người, stage hiện tại, tuổi, D-08 (tổng + icon hai cổng), rework (có/không + nhánh), trạng thái `đang mở | committed | cancelled`.

Lọc: stage, người, chỉ story già (tuổi > p90 H-01 kỳ trước — Sau, ẩn ở MVP nếu chưa có H-07), chỉ story có rework, chỉ story D-08 `spec_lock` ≥ 3.

**Không** cột LOC, không số commit lẻ, không “score”, không cột “event cuối / hook”.

#### D. Chi tiết story

Timeline dọc 8 bước, mỗi bước: started / completed (hoặc “đang chờ người”), số vòng, kết quả pass/fail/returned. Trên timeline, mỗi chấm D-08 ghi `stage` — cổng khóa spec luôn hiện, kể cả lần khóa thành công.

Khối bên: first-pass lock/test/review của **đúng story này**; nhánh rework; cờ takeover; blocker ngoài cổng (H-04) tách khỏi D-08.

Lead có thể mở **nhật ký bước** (tên event catalog đã rollup thành timeline) — vẫn là đọc visualization, không phải debugger ingest.

#### E. Theo người / agent

D-01 (số commit), D-02 (trung vị cycle time), D-03, D-08, D-04 (khóa spec rồi commit). Sắp mặc định theo **số story**, không theo “điểm”.

Banner cố định khi kỳ có < 8 story / người: *“Mẫu còn nhỏ — xem xu hướng loop, chưa xếp hạng người.”* Ẩn sort “tệ nhất / giỏi nhất”. Không cột máy / last flush.

#### F. Tôi (developer)

Cùng hình Tổng quan + Story, **lọc sẵn người đăng nhập**: story mở, story committed kỳ này, cycle time của tôi, D-08 (tách `spec_lock` / `review`), rework. Danh sách story của tôi dẫn tới timeline.

Không đèn collector, không `kirotrack login`, không copy hook.

### 1.4 Empty, loading, lỗi — copy visualization

Copy nói về **chưa có số loop để vẽ**, không hướng dẫn cài máy. Cài hook/CLI thuộc tài liệu ingestion, không phải CTA dashboard.

| Trạng thái | Khi nào | Copy |
| --- | --- | --- |
| **Org trống** | Chưa có rollup story nào | **Chưa có story để hiển thị.** Khi vòng Kiro trên máy đã đẩy event và job đã cộng, tổng quan sẽ hiện thông lượng, cycle time, phễu 8 bước. |
| **Kỳ trống** | Có lịch sử, kỳ đang chọn không có story | **Không có story trong 7 ngày này.** Đổi kỳ để xem vòng đã commit trước đó. |
| **Phễu trống** | Có story nhưng chưa đủ timestamp 8 bước | **Chưa dựng được phễu đủ 8 bước.** Story chưa qua khóa spec / chưa có stage — đợi loop chạy tiếp, không nhập tay trên dashboard. |
| **Story của tôi trống** | Dev đã vào dashboard, kỳ này không có story gắn mình | **Bạn chưa có story trong kỳ này.** Story của team vẫn xem được trên Tổng quan (nếu đúng quyền). |
| **Loading** | Rollup kỳ chưa sẵn | Skeleton KPI. Dòng: **Đang tải số loop 7 ngày…** Không hiện `0` giả. |
| **Lỗi đọc dashboard** | API rollup 5xx / timeout | **Không tải được tổng quan.** Thử lại. Event trên máy không mất — chỉ UI. |
| **Số chậm** (banner, không phải màn) | Job rollup trễ (ops biết qua mục 4) | **Số liệu có thể chậm vài phút.** Đang xem bản rollup gần nhất. |

Không CTA `Cài hook`, `kirotrack login`, `Xem Thu thập` trên các màn visualization.

### 1.5 UX — nguyên tắc đọc số

1. **Bộ, không lẻ.** Thông lượng cao + LK-02/RV-01 thấp + H-03 tăng = đang đẩy rác. Cycle time thấp + D-03 100% = người gánh.  
2. **Tách chờ / làm / refine.** H-02 và LK-01 cạnh H-01. D-08 không phải blocker (H-04), không phải takeover (D-03).  
3. **Hai cổng người khác nhau.** D-08 tổng; luôn cho tách `spec_lock` vs `review`.  
4. **Không vanity.** Không LOC, không streak commit, không leaderboard.  
5. **Dashboard chỉ vẽ loop.** Thiếu số ≠ “vào màn collector”. Im lặng phía máy là việc ops/ingestion, không kết luận người lười trên Tổng quan.

---

## 2. Kiro đẩy event — UI chỉ vẽ rollup

Chi tiết máy dev, hook JSON, envelope, mã HTTP: **không lặp** — xem [kiro-metric-ingestion.md](./kiro-metric-ingestion.md). UI không tham gia đường này.

### 2.1 Đường đã chọn (một đường, phía sau UI)

```
Kiro IDE / CLI
  → hook `command` (stdin JSON)
  → CLI `kirotrack` (ghi JSONL `~/.kirotrack/queue/`, rồi flush)
  → POST /v1/ingest/events   ← biên giới backend app
  → lưu event log theo story (idempotent `event_id`)
  → job rollup
  → dashboard Next.js CHỈ đọc bảng cộng
```

Không MCP làm đường chính. Không plugin IDE. Không file-watcher MVP. Cổng người mà hook không thấy: **cùng CLI** trên máy (`kirotrack return | blocked | takeover | refine | review | cancel`) — **không** có form tương đương trên web.

### 2.2 Backend nhận `POST /v1/ingest/events`

Một endpoint ingest (đúng ingestion §7). Body = batch envelope; **không** nhận H-01/D-08 đã tính. **Không** có màn web bọc endpoint này.

Ingest **phải**: TLS + Bearer → `org_id` + `developer_id`; ≤ 100 event / 256 KB (413 nếu lớn); validate từng `name` whitelist MVP; upsert `event_id` + `Idempotency-Key`; ghi `received_at`; 202 `{ accepted, duplicate, rejected[] }`; D-08 đếm `refine_with_human_started` (không cộng thêm `spec_submitted_for_lock`).

Ingest **cấm**: tính cycle time, cập nhật KPI dashboard, parse `design.md`, chờ rollup rồi mới 202.

401/403, 429/5xx, 400 từng event: hành vi client/queue/dead-letter như ingestion — **ops** nhìn (mục 4), developer **không** bị đẩy vào wizard sửa máy từ dashboard.

### 2.3 Từ event tới hình trên UI

Dashboard **không** query bảng event cho KPI kỳ. Luồng:

1. Event append (không qua UI).  
2. Worker gom theo `story_id` → `story_rollups` + `org_period_rollups`.  
3. Tổng quan / Phễu / Theo người / Tôi: `SELECT` rollup.  
4. Chi tiết story: rollup một `story_id` (+ event hẹp nếu cần dựng timeline).

| Màn visualization | ID |
| --- | --- |
| Tổng quan KPI | H-05, US-01, H-01, H-03, D-08, D-03 |
| Nút thắt 8 cột | H-02, LK-01 |
| Cổng | LK-02, TE-01, RV-01 |
| Phễu | US-01 → … → CM-02; LK-03; RV-02 |
| Story / chi tiết | timestamp 8 bước, H-03 nhánh, D-08 theo stage, H-04, D-03 |
| Theo người / Tôi | D-01, D-02, D-03, D-08, D-04 |

H-06 (WIP theo stage) trên Tổng quan khi org đã có hàng đợi thật — catalog cho phép MVP lúc đó; chưa có thì ẩn thẻ WIP.

---

## 3. Kiến trúc cho ~300 developer đẩy liên tục

Một stack, sized cho tải này — không Kafka, không lake, không multi-region. UI visualization và ingest **tách process**: spike SSR không được làm chậm POST.

### 3.1 Stack chọn

| Lớp | Chọn | Vì sao vừa tải |
| --- | --- | --- |
| Dashboard + API đọc rollup | **Next.js** (App Router, TypeScript), Tailwind, shadcn/ui | Chỉ visualization; không nằm hot path ingest |
| Ingest HTTP | Process **Hono** (Node 22), **2 replica** sau reverse proxy | 202 nhanh; deploy UI không restart nhận event |
| Hàng đợi job | **Redis 7** + **BullMQ** | Rollup, không dùng Redis làm SoT event |
| Sự thật event + rollup | **PostgreSQL 16** | ~10⁶–10⁷ event/năm vẫn nhỏ; unique `event_id` |
| Auth | PAT ingest (máy); session dashboard đọc (SSO Sau) | Token đẩy event **không** mở UI |
| Host | 1 VM Postgres 2–4 vCPU / 8 GB; 1 VM Redis nhỏ; 2× ingest (1 vCPU); 1× worker; 1× Next.js | 300 client HTTPS, không hyperscale |

Cùng repo TypeScript. Runtime: `ingest` (Hono), `web` (Next.js đọc rollup), worker rollup (cùng image, command khác).

### 3.2 Tải thiết kế

- ~300 developer; ~150–300 session Kiro/ngày.  
- Hook bắn nhiều; CLI **chỉ enqueue event catalog**. Một story ~20–80 event MVP.  
- 300 người × ~4 story/ngày × ~50 event ≈ **60k event/ngày** ≈ **< 1 event/s** trung bình.  
- Đỉnh: cả org mở Kiro 9:00 hoặc flush sau offline — 300 POST đồng thời, batch ≤ 100 event / 256 KB.  
- Ingest: **p95 xử lý < 100 ms**, 202 trước rollup. UI: đọc bảng rollup, không quét 60k event/ngày mỗi page view.

Nếu đo thực tế > 5×, tăng replica ingest và connection Postgres — **chưa** đổi mô hình.

### 3.3 Đường ingest (backend, không UI)

```
POST /v1/ingest/events
  → rate limit (Redis, theo token): 10 req/s, burst 30
  → parse JSON; 413 nếu lớn
  → resolve token (cache Redis TTL 60s; nguồn Postgres `ingest_tokens`)
  → với mỗi event: validate → INSERT … ON CONFLICT (event_id) DO NOTHING
  → ghi ingest_rejects cho dòng 400
  → BullMQ `story_dirty` (story_id) — không block 202
  → 202
```

Pool Postgres ingest: ~15 kết nối / replica, statement timeout 2s. Hết pool hoặc Postgres chậm → **429** để CLI backoff (ingestion §6).

Idempotency: `PRIMARY KEY (event_id)`; `Idempotency-Key` Redis SET NX TTL 24h. Rollup sort `occurred_at` — không FIFO HTTP.

### 3.4 Buffer

| Buffer | Chỗ | Việc |
| --- | --- | --- |
| JSONL máy dev | `~/.kirotrack/queue/` | Sống khi mất mạng; dashboard **không** đọc |
| Bảng `events` | Postgres append-only | SoT; không UPDATE payload |
| `story_dirty` | Redis / BullMQ | Id story cần tính lại |

Không buffer “metric đã cộng” trên ingest node. Dashboard không đọc JSONL máy.

### 3.5 Backpressure

1. Per-token 429 + `Retry-After`.  
2. Global 429 khi depth `story_dirty` > 50k, Postgres connections > 80%, hoặc p95 xử lý ingest > 2s.  
3. Không drop silently — CLI giữ queue.  
4. Không ram-queue trên ingest process. Event chưa commit Postgres thì chưa accepted.

### 3.6 Storage vs compute rollup

**Lưu lúc ingest:** envelope + `org_id` / `developer_id` / `received_at`. Index `(org_id, story_id, occurred_at)`, `(org_id, received_at)`, `(developer_id, received_at)`.

**Không lưu lúc ingest:** H-01, % first-pass, D-08 tổng, phễu.

**Worker (story dirty, debounce 5s):** đọc event của story → `story_rollups`. Refresh `org_period_rollups` (hôm nay / 7 ngày / 30 ngày) từ `story_rollups` — **không** full-scan `events` mỗi request UI.

Event đến trễ (offline overnight): tính lại story; cycle time đúng vì `occurred_at`. UI luôn vẽ bản rollup, không “live tail” hook.

### 3.7 Cấm làm lúc ingest

- Tính / cache KPI màn Tổng quan trên request ingest.  
- Join Git, đọc spec, gọi Slack.  
- Chặn 202 đợi worker.  
- Mở form web để người “gửi metric”.  
- Tin thứ tự HTTP để đếm US-01 / D-08 / H-05.

---

## 4. Quan sát pipeline — lớp ops, không phải sản phẩm

Pipeline (ingest lag, queue rollup, 429/5xx, dead-letter, máy im) là **việc vận hành**, để tin được số trên dashboard. **Không** đưa vào sidebar visualization, **không** trộn empty-state loop với wizard collector.

MVP: metric + log + alert trên process ingest/worker. Không bắt một “app Thu thập” cho lead/developer. Có thể một route nội bộ `/internal/ops` (không link từ nav) hoặc Grafana sau — cùng tín hiệu dưới đây.

### 4.1 Tín hiệu bắt buộc (MVP)

| Tín hiệu | Định nghĩa | Xanh | Vàng | Đỏ |
| --- | --- | --- | --- | --- |
| **Ingest lag** | p90 `received_at − time_request` (thuần server); p90 `received_at − occurred_at` **giờ làm việc** (gồm offline máy — tách cuối tuần) | server p90 < 200 ms | server p90 > 1 s hoặc event-lag giờ làm > 15 phút | 5xx hoặc không nhận > 2 phút khi client còn đẩy |
| **Hàng đợi rollup** | BullMQ waiting + delayed; tuổi job già nhất | < 1k, tuổi < 1 phút | > 5k hoặc tuổi > 5 phút | worker chết / tuổi > 15 phút |
| **202 / 429 / 5xx** | tỷ lệ 1 phút | 429 < 1%, 5xx = 0 | 429 1–10% | 5xx > 0,5% hoặc 429 > 10% bền |
| **Dead-letter** | số `ingest_rejects` | 0 mới / giờ | tăng đều (schema lệch) | spike map sai hàng loạt |
| **Máy im lặng** | `developer_id` từng 202, không `received_at` trong 4 giờ làm việc | < 5% | 5–20% | > 20% — nghi hook/token hàng loạt |
| **Duplicate ratio** | `duplicate` / (`accepted`+`duplicate`) | bình thường khi retry | — | ~100% + accepted=0: kẹt lặp hoặc unique hỏng |

Banner vàng/đỏ trên **visualization** chỉ khi vàng/đỏ bền (rollup già hoặc ingest chết). Không liệt kê từng máy trên Tổng quan.

### 4.2 Hook / CLI — ops suy từ ingest

Không SSH máy. Không màn enroll. Suy từ 202/401/rejected:

- `last_received_at` theo `developer_id`  
- 401/403 theo token (không hiện token)  
- `name` lạ / thiếu `story_id` → map hook, không phải loop chậm  

SessionStart luôn flush (ingestion): dùng Kiro mà im ingest = CLI/token/hook — **ticket ops**, không hiện như KPI developer.

Không heartbeat catalog riêng ở MVP.

### 4.3 Log và alert

JSON log `request_id`, `org_id`, `accepted`, `duplicate`, `rejected`. Không log Bearer, không log raw `requirements`.

Alert (email/Slack; kênh Sau nếu chưa có): 5xx ingest 5 phút; worker liveness; dead-letter > 100/10 phút; > 20% máy im giờ làm (trừ weekend). Export Prometheus sau nếu org đã có.

---

## 5. MVP vs sau

Cắt theo **app visualization**. Catalog và ingestion giữ cột riêng.

### MVP — ship

**Backend thu thập (không UI):** hook + `kirotrack` + queue JSONL + `POST /v1/ingest/events` + PAT + 202 idempotent; Hono ingest; Postgres `events` + `ingest_rejects`; BullMQ rollup. Đúng [ingestion MVP](./kiro-metric-ingestion.md).

**UI (chỉ visualization):** Tổng quan (H-01/H-02/H-03/H-05, LK-02, TE-01, RV-01, D-03, D-08 tổng + `spec_lock`/`review`), Phễu 8 bước, Story + timeline, Theo người, Tôi (cùng hình, phạm vi người). Empty/loading/lỗi mục 1.4. Desktop đủ; mobile đọc KPI + story + timeline. Banner số chậm khi ops đỏ — không màn Thu thập trên nav.

**Quyền:** lead thấy org; developer thấy story của mình. Session dashboard ≠ ingest token. Chưa SSO.

**H-06:** trên Tổng quan nếu ≥ 20 story mở; không thì ẩn.

**Ops:** tín hiệu mục 4 trên process/alert; không product surface.

### Không làm ở MVP

- Implement app (tài liệu này không phải sprint code).  
- UI thu thập: enroll, `kirotrack login`, wizard hook, xóa queue remote, form gửi event, danh sách máy trên nav.  
- MCP, plugin, watcher.  
- Tính catalog lúc ingest.  
- Coverage, map AC, LOC, flaky, finding đóng, commit fail, giờ người vs agent, bug/revert sau commit (cột Sau catalog).  
- Xếp hạng cá nhân, gamification.  
- Kafka / lake / multi-region / KPI “real-time < 1s”.  
- Sửa event trên UI.

### Sau

- Metric / event cột Sau (US-04, SG-03, TC-03, IM-04, TE-04/05, RV-05, CM-03, D-05/06/07, H-07/H-08).  
- WIP realtime (H-06 luôn). Story già.  
- SSO đọc dashboard; rotate PAT ingest (vẫn ngoài UI visualization).  
- Team filter, saved view, export CSV kỳ.  
- Prometheus/Grafana cho ops.  
- Watcher / MCP phía máy — vẫn phụ, vẫn không thành màn web.

---

## 6. Việc không thuộc dashboard này

- Định nghĩa lại US-01…H-08 — chỉ [catalog](./kiro-developer-metrics.md).  
- Schema hook, lệnh CLI, envelope, cài máy — chỉ [ingestion](./kiro-metric-ingestion.md).  
- Chặn agent khi collector chết — hook **exit 0**.  
- Nút khóa spec / trả spec / takeover trên web.  
- UI “Thu thập” như sản phẩm ngang Tổng quan.

Khi implement: Happy path máy thật (ingestion §9) phải **hiện đúng hình** trên Tổng quan — H-01 có số, LK-02 = khóa lần đầu, D-08 ≥ 1 ở `spec_lock`, retry cùng `event_id` không nhân đôi story — không phải hiện màn cài hook.
