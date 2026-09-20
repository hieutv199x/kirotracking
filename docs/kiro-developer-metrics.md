# Catalog metric KiroTracking

Catalog này đề xuất **metric cần đo** cho vòng lặp kỹ thuật Kiro. Mục tiêu là biết loop có chạy được không, chậm ở đâu, chất lượng ra sao — không phải thiết kế app hay thêm tính năng sản phẩm.

Vòng lặp **theo thứ tự**:

1. Người nhập user story
2. Gen spec — tài liệu kỹ thuật (so với code hiện có và các user story trước; refine lại US)
3. Người ký / khóa tài liệu kỹ thuật
4. Gen testcase
5. Implement
6. Test
7. Review loop
8. Commit

Mỗi metric gồm: định nghĩa, vì sao quan trọng, cách thu thập từ loop, phạm vi **MVP** hoặc **Sau**.

---

## Cách đọc

| Ký hiệu | Ý nghĩa |
| --- | --- |
| **MVP** | Cần có ngay. Timestamp từng giai đoạn + kết quả pass/fail/lock + đếm vòng lặp + đếm lần AI dừng refine với người. |
| **Sau** | Khi loop đã ổn định, hoặc cần tín hiệu thêm (coverage, so khớp spec với code cũ, defect sau commit). |

**Nguyên tắc MVP:** đo thời gian từng stage, thông lượng đến **commit**, rework, blocker, pass/lock lần đầu, và **số lần AI dừng để refine với người (D-08)**. Tránh vanity metric (số dòng code, số commit lẻ) ở vòng đầu.

Đơn vị khuyến nghị: **một vòng loop = một user story**. Story hoàn tất = đã **commit**. Mọi tỷ lệ tính theo story trong kỳ, trừ khi ghi chú khác.

Hai cổng người thiết kế sẵn trong loop:

- **Khóa spec (bước 3):** AI dừng để người chốt tài liệu kỹ thuật. Đây là một refine gate — tính vào D-08 (`stage=spec_lock`).
- **Review loop (bước 7):** có thể có thêm nhiều lần AI dừng để người refine. Mỗi lần cũng tính vào D-08 (`stage=review`).

---

## 1. Giai đoạn vòng lặp

### 1.1 Người nhập user story

#### US-01. Số story vào loop
- **Định nghĩa:** Số user story được nhập vào loop trong kỳ (ngày/tuần).
- **Vì sao:** Mẫu số cho thông lượng và backlog. Không có thì không biết loop đang đói việc hay quá tải.
- **Thu thập:** Event `story_received` (id story, thời điểm, developer/agent).
- **Phạm vi:** **MVP**

#### US-02. Tỷ lệ story đủ để gen spec
- **Định nghĩa:** Tỷ lệ story vào loop đã có mô tả + phạm vi/AC (hoặc tương đương) đủ để bắt đầu gen spec — không cần hỏi lại ngay ở bước 1.
- **Vì sao:** Đầu vào yếu làm spec gen và khóa spec phình vòng. Đây là chất lượng intake, không phải năng suất cá nhân. Refine US *trong* spec gen là việc của bước 2, không tính ở đây.
- **Thu thập:** Checklist sẵn sàng trên story lúc `story_received`. Đếm story bị trả người nhập trước `spec_gen_started`.
- **Phạm vi:** **MVP**

#### US-03. Thời gian chờ trước spec gen
- **Định nghĩa:** Thời gian từ story vào (`story_received` hoặc `ready`) đến lúc bắt đầu gen spec.
- **Vì sao:** Tách **chờ việc** khỏi **làm spec**. Cycle time dài thường bắt đầu từ hàng đợi, không từ gen tài liệu.
- **Thu thập:** `ready_at` − `spec_gen_started_at`.
- **Phạm vi:** **MVP**

#### US-04. Số lần user story đổi trước khi khóa spec
- **Định nghĩa:** Số lần nội dung US bị sửa trong spec gen (trước `spec_locked`), so với bản nhập ban đầu.
- **Vì sao:** Spec gen có nhiệm vụ so code/US cũ và refine US. Đếm được mức “story vào khác story khóa”.
- **Thu thập:** Version US tại `story_received` vs mỗi lần cập nhật đến `spec_locked`.
- **Phạm vi:** **Sau**

---

### 1.2 Gen spec (tài liệu kỹ thuật)

#### SG-01. Thời gian gen spec
- **Định nghĩa:** Thời gian active gen spec, từ `spec_gen_started` đến lần trình khóa đầu tiên (`spec_submitted_for_lock`) — không gồm chờ người khóa.
- **Vì sao:** Cho biết bước so code / US cũ / viết tài liệu chiếm bao nhiêu. Chờ chữ ký nằm ở LK, không gộp vào đây.
- **Thu thập:** Timestamp gen spec. Nếu bị trả về từ lock (H-03), cộng các đoạn gen lại.
- **Phạm vi:** **MVP**

#### SG-02. Số vòng gen spec trước lần trình khóa đầu
- **Định nghĩa:** Số lần agent chạy gen spec trên story trước khi trình tài liệu cho người khóa lần đầu.
- **Vì sao:** Nhiều vòng nội bộ = context thiếu, so khớp code/US cũ khó, hoặc agent không hội tụ. Khác số lần người trả spec (LK-03).
- **Thu thập:** Đếm session/lần chạy spec gen đến `spec_submitted_for_lock` lần đầu.
- **Phạm vi:** **MVP**

#### SG-03. Spec có đối chiếu code hiện có và US trước
- **Định nghĩa:** Cờ (hoặc checklist) cho biết bản spec trình khóa đã tham chiếu codebase hiện tại và các user story liên quan trước đó.
- **Vì sao:** Đây là việc bắt buộc của bước 2. Thiếu đối chiếu thì lock vẫn “đạt” nhưng implement sẽ lệch hệ thống.
- **Thu thập:** Artifact spec (danh sách file/US tham chiếu) lúc trình khóa.
- **Phạm vi:** **Sau**

---

### 1.3 Người ký / khóa tài liệu kỹ thuật

Cổng người **bắt buộc**. Mỗi lần AI trình spec để người chốt là một lần refine-with-human — cộng vào **D-08**, `stage=spec_lock`. Không tính là takeover (D-03).

#### LK-01. Thời gian chờ khóa spec
- **Định nghĩa:** Thời gian từ lúc trình spec (`spec_submitted_for_lock`) đến `spec_locked` hoặc `spec_returned` (người trả về để gen lại).
- **Vì sao:** Nút thắt thường gặp: tài liệu xong nhưng chờ người. Không gộp vào blocker (H-04) và không gộp vào SG-01.
- **Thu thập:** Timestamp trình khóa / khóa / trả về. Nếu nhiều vòng, cộng các đoạn chờ người.
- **Phạm vi:** **MVP**

#### LK-02. Tỷ lệ khóa spec lần đầu
- **Định nghĩa:** Tỷ lệ story được người khóa ngay lần trình đầu, không trả về gen spec lại.
- **Vì sao:** Tín hiệu chất lượng spec và chất lượng refine US. Fail cổng này thì testcase/implement đang xây trên nền chưa chốt.
- **Thu thập:** Kết quả lần trình khóa đầu (`locked` / `returned`).
- **Phạm vi:** **MVP**

#### LK-03. Số vòng trả spec
- **Định nghĩa:** Số lần người từ chối khóa và gửi spec về gen lại, trên một story, trước khi `spec_locked`.
- **Vì sao:** Bổ sung LK-02: trả 1 lần khác trả 6 lần. Mỗi lần trình (kể cả lần đầu) vẫn đếm vào D-08.
- **Thu thập:** Đếm `spec_returned` trước `spec_locked`.
- **Phạm vi:** **MVP**

---

### 1.4 Gen testcase

Chỉ chạy **sau** `spec_locked`. Testcase bám spec đã khóa, không bám US gốc nếu US đã bị refine.

#### TC-01. Thời gian gen testcase
- **Định nghĩa:** Thời gian từ `testcase_gen_started` đến `testcase_gen_completed` (bộ test sẵn sàng cho implement).
- **Vì sao:** Tách bước sinh test khỏi implement. Kéo dài có thể do spec khóa vẫn mơ hồ.
- **Thu thập:** Timestamp giai đoạn gen testcase. Cộng các lần gen lại nếu review/test đẩy về.
- **Phạm vi:** **MVP**

#### TC-02. Số vòng gen testcase trước implement
- **Định nghĩa:** Số lần chạy gen testcase trước khi `implement_started` lần đầu.
- **Vì sao:** Nhiều vòng = spec khó chuyển thành test, hoặc AI dừng refine với người ở bước này (cũng đếm D-08, `stage=testcase`).
- **Thu thập:** Đếm lần chạy gen testcase đến `implement_started` lần đầu.
- **Phạm vi:** **MVP**

#### TC-03. Số testcase sinh ra / ánh xạ về spec
- **Định nghĩa:** Số testcase (và tỷ lệ mục spec/AC có ít nhất một testcase) khi bước 4 xong.
- **Vì sao:** Implement thiếu test gắn spec thì bước test/review sẽ hụt. Không dùng số testcase làm KPI năng suất.
- **Thu thập:** Artifact bộ test + map về mục spec lúc `testcase_gen_completed`.
- **Phạm vi:** **Sau**

---

### 1.5 Implement

#### IM-01. Thời gian implement
- **Định nghĩa:** Thời gian từ `implement_started` đến `implement_completed` (code sẵn sàng đưa sang test), không gồm chờ trước đó.
- **Vì sao:** Cho biết viết/sửa code chiếm bao nhiêu sau khi spec và testcase đã có.
- **Thu thập:** Timestamp implement. Nếu review/test đẩy về implement (H-03), cộng các đoạn active.
- **Phạm vi:** **MVP**

#### IM-02. Số vòng implement trước test lần đầu
- **Định nghĩa:** Số lần agent/developer chạy implement trước khi nộp sang test lần đầu.
- **Vì sao:** Nhiều vòng nội bộ = spec/testcase khó, hoặc agent không hội tụ. Khác rework sau test/review.
- **Thu thập:** Đếm lần chạy implement đến `test_started` lần đầu.
- **Phạm vi:** **MVP**

#### IM-03. Tỷ lệ hoàn tất implement không cần takeover
- **Định nghĩa:** Tỷ lệ story implement xong mà không có người chiếm việc (sửa tay, dừng agent, làm hộ). Cổng khóa spec và pause refine (D-08) **không** tính là takeover.
- **Vì sao:** Đo mức implement tự chạy được trên spec đã khóa.
- **Thu thập:** Flag `human_takeover` trên giai đoạn implement.
- **Phạm vi:** **Sau** (MVP dùng D-03 trên cả loop)

#### IM-04. Quy mô thay đổi
- **Định nghĩa:** Số file chạm tới và/hoặc dòng thêm/sửa/xóa khi implement xong (và lúc commit).
- **Vì sao:** Context cho thời gian và chất lượng. Story nhỏ mà chậm khác story lớn mà chậm.
- **Thu thập:** Diff lúc `implement_completed` / `committed`.
- **Phạm vi:** **Sau** — không dùng làm KPI năng suất.

---

### 1.6 Test

Chạy bộ test đã gen ở bước 4 (cộng test hiện có của repo, nếu loop dùng).

#### TE-01. Tỷ lệ test xanh lần đầu
- **Định nghĩa:** Tỷ lệ story mà lần chạy test **đầu tiên** sau implement đều pass.
- **Vì sao:** Tín hiệu chất lượng implement trên spec+testcase đã khóa. Fail lần đầu rồi xanh sau vài vòng là bình thường; fail mãi là không hội tụ.
- **Thu thập:** Kết quả run test đầu tiên (`pass` / `fail`).
- **Phạm vi:** **MVP**

#### TE-02. Thời gian test
- **Định nghĩa:** Thời gian từ `test_started` đến `test_passed` (hoặc bỏ dở).
- **Vì sao:** Tách chạy/sửa test khỏi implement. Kéo dài có thể do flaky, môi trường, hoặc testcase gen không chạy được.
- **Thu thập:** Timestamp giai đoạn test + số lần chạy.
- **Phạm vi:** **MVP**

#### TE-03. Số lần chạy test đến khi xanh
- **Định nghĩa:** Số test run trên story đến khi suite liên quan pass — hoặc story bị dừng.
- **Vì sao:** Bổ sung TE-01: fail 1 lần rồi xanh khác fail 12 lần.
- **Thu thập:** Đếm `test_run_completed` đến `test_passed`.
- **Phạm vi:** **MVP**

#### TE-04. Tỷ lệ test không ổn định (flaky)
- **Định nghĩa:** Tỷ lệ test run fail rồi pass lại **không** kèm thay đổi code.
- **Vì sao:** Flaky làm cycle time và rework giả.
- **Thu thập:** `test_failed` → `test_passed` với diff rỗng giữa hai run.
- **Phạm vi:** **Sau**

#### TE-05. Test chạy đủ bộ testcase đã gen
- **Định nghĩa:** Tỷ lệ testcase bước 4 thực sự được chạy (và pass) ở bước 6.
- **Vì sao:** Test “xanh” nhưng bỏ sót testcase đã gen thì review/commit đang tin nhầm.
- **Thu thập:** Đối chiếu artifact testcase gen với báo cáo run.
- **Phạm vi:** **Sau**

---

### 1.7 Review loop

Cổng chất lượng trước commit. Review có thể lặp: fail → về implement / test / (hiếm) spec. Mỗi lần AI **dừng để người refine** trong review cộng vào **D-08**, `stage=review`. Review thuần AI, không dừng người, thì không tăng D-08.

#### RV-01. Tỷ lệ review đạt lần đầu
- **Định nghĩa:** Tỷ lệ story pass review ngay vòng đầu, không phải quay lại implement/test/spec.
- **Vì sao:** Test xanh chưa đủ nếu review fail. Đây là cổng chất lượng cuối trước commit.
- **Thu thập:** Kết quả review đầu tiên (`pass` / `fail`).
- **Phạm vi:** **MVP**

#### RV-02. Số phát hiện theo mức nghiêm trọng
- **Định nghĩa:** Số finding trên mỗi story, nhóm blocker / major / minor — hoặc theo loại: lệch spec đã khóa, bảo mật, regression, test thiếu.
- **Vì sao:** Một blocker khác mười warning style.
- **Thu thập:** Artifact review (finding + severity) mỗi vòng `review_completed`.
- **Phạm vi:** **MVP** (ít nhất: số blocker + số major)

#### RV-03. Thời gian review
- **Định nghĩa:** Tổng thời gian các vòng review, từ `review_started` đến `review_passed` (không gồm thời gian implement/test lại ở giữa).
- **Vì sao:** Nếu review chiếm phần lớn cycle time, nút thắt nằm ở review/chờ người, không phải code.
- **Thu thập:** Timestamp từng vòng review; cộng các đoạn active review.
- **Phạm vi:** **MVP**

#### RV-04. Số vòng review đến khi pass
- **Định nghĩa:** Số vòng review trên story đến `review_passed` (hoặc hủy).
- **Vì sao:** Bổ sung RV-01. Mỗi vòng có thể kèm refine-with-human (D-08) hoặc chỉ AI.
- **Thu thập:** Đếm `review_round_completed` đến `review_passed`.
- **Phạm vi:** **MVP**

#### RV-05. Tỷ lệ finding được sửa trước commit
- **Định nghĩa:** Trong finding phải sửa, tỷ lệ đóng trước `committed` — so với bỏ qua / giảm severity / để lại.
- **Vì sao:** Review không có giá trị nếu finding không được xử lý trước khi commit.
- **Thu thập:** Trạng thái từng finding (`fixed` / `wontfix` / `deferred`) trước `committed`.
- **Phạm vi:** **Sau**

---

### 1.8 Commit

Story **hoàn tất loop** khi commit thành công.

#### CM-01. Thời gian từ review pass đến commit
- **Định nghĩa:** Thời gian từ `review_passed` đến `committed`.
- **Vì sao:** Tách khâu đóng loop (hook, CI, quyền, conflict) khỏi review. Chờ commit lâu là nút thắt riêng.
- **Thu thập:** `committed_at` − `review_passed_at`.
- **Phạm vi:** **MVP**

#### CM-02. Tỷ lệ story commit
- **Định nghĩa:** Tỷ lệ story đã khóa spec (`spec_locked`) đi đến `committed` trong kỳ — không hủy giữa testcase/implement/test/review.
- **Vì sao:** Spec đã khóa mà không ra commit = lãng phí cả đầu loop. Cặp với US-01 và H-05.
- **Thu thập:** Đếm `committed` / đếm `spec_locked` (cùng cohort story).
- **Phạm vi:** **MVP**

#### CM-03. Commit bị reject / thất bại
- **Định nghĩa:** Số lần commit fail (hook, CI, conflict) trước khi `committed` thành công.
- **Vì sao:** Review đã pass nhưng không đóng được loop.
- **Thu thập:** Event `commit_failed` đến `committed`.
- **Phạm vi:** **Sau**

---

## 2. Năng suất và chất lượng developer / agent

Gắn **người hoặc agent** chạy loop; đơn vị vẫn là story. Không xếp hạng cá nhân khi mẫu còn nhỏ.

#### D-01. Story commit trên người/agent mỗi kỳ
- **Định nghĩa:** Số story đi hết loop đến `committed` trong kỳ, theo developer hoặc agent được gán.
- **Vì sao:** Thông lượng cá nhân/agent — chỉ có nghĩa khi đi cùng cycle time và chất lượng (D-02, LK-02, RV-01).
- **Thu thập:** `committed` + identity người/agent trên story.
- **Phạm vi:** **MVP**

#### D-02. Thời gian hoàn tất trung vị theo người/agent
- **Định nghĩa:** Trung vị cycle time (H-01) của các story đã commit, theo người/agent.
- **Vì sao:** Trung vị chịu outlier tốt hơn trung bình.
- **Thu thập:** Cùng timestamp với H-01, group by assignee.
- **Phạm vi:** **MVP**

#### D-03. Tỷ lệ can thiệp thủ công (cờ takeover)
- **Định nghĩa:** Tỷ lệ story có **ít nhất một** takeover: người làm hộ, sửa tay, hoặc dừng agent rồi **không trả lại cho AI**. Cờ **có/không**, không phải số lần. **Không** gồm cổng khóa spec và các lần refine-with-human (D-08): đó là pause rồi AI chạy tiếp.
- **Vì sao:** Đo chỗ loop bị người gánh thay, khác chỗ loop **cố ý** dừng để chốt với người.
- **Thu thập:** Flag `human_intervention` (có/không); có thể kèm giai đoạn, lý do.
- **Phạm vi:** **MVP**

#### D-08. Số lần dừng refine với người
- **Định nghĩa:** Số lần trong một story mà AI **tạm dừng để refine cùng người**, rồi **AI tiếp tục**. Đếm từng lần; một story có thể nhiều lần, ở nhiều stage. **Không** gộp với D-03 (takeover) hay H-04 (blocker bên ngoài).
- **Ánh xạ lên loop Kiro:**
  - **Khóa spec:** mỗi lần trình tài liệu cho người chốt (`spec_submitted_for_lock`) tính **1**, `stage=spec_lock` — kể cả lần khóa thành công đầu tiên (cổng refine bắt buộc). Trả spec rồi trình lại: +1 mỗi lần trình.
  - **Review loop:** mỗi lần AI dừng để người chốt/refine trong review tính **1**, `stage=review`. Vòng review chỉ AI, không dừng người, không tính.
  - **Khác:** pause ad-hoc lúc gen spec, gen testcase, implement, test, hoặc trước commit — vẫn đếm, ghi `stage` tương ứng.
- **Vì sao:** Cờ takeover không nói tần suất. Happy path cũng có ít nhất một lần (khóa spec); review có thể thêm. Số lần cao ở `spec_lock` = spec/US chưa chốt được; cao ở `review` = implement/test chưa đạt spec đã khóa.
- **Thu thập:** Mỗi lần dừng: `refine_with_human_started` → `refine_with_human_resumed`, kèm `stage` (`spec_gen` | `spec_lock` | `testcase` | `implement` | `test` | `review` | `commit`). Với cổng lock: `spec_submitted_for_lock` **chính là** một `refine_with_human_started` (`stage=spec_lock`); `spec_locked` hoặc `spec_returned` rồi gen tiếp = resumed. Metric = số lần started trên story. MVP bắt buộc **tổng số lần**; tách theo `stage` (nhất là spec_lock vs review) suy ra từ cùng log.
- **Phạm vi:** **MVP**

#### D-04. Tỷ lệ story khóa spec rồi được commit
- **Định nghĩa:** Trong các story đã `spec_locked`, tỷ lệ đi đến `committed` (trùng CM-02; giữ ID này ở nhóm người/agent khi group by assignee).
- **Vì sao:** Người đã chốt spec — loop có đưa được thay đổi vào repo không, theo từng developer/agent.
- **Thu thập:** `committed` / `spec_locked` theo assignee.
- **Phạm vi:** **MVP**

#### D-05. Thời gian người so với agent
- **Định nghĩa:** Trong active time, phần agent chạy vs phần người làm (kèm thời gian người ở cổng lock và review).
- **Vì sao:** Hiểu loop đang “agent làm, người chốt cổng” hay “người làm phần lớn”.
- **Thu thập:** Session agent + session người trên cùng story, kèm stage.
- **Phạm vi:** **Sau**

#### D-06. Lỗi lọt sau commit
- **Định nghĩa:** Số defect gắn với story đã commit, phát hiện sau đó (hotfix, ticket lỗi).
- **Vì sao:** Đo chất lượng cổng review + testcase. Tăng = đang để lọt.
- **Thu thập:** Liên kết bug/hotfix về `story_id` đã commit.
- **Phạm vi:** **Sau**

#### D-07. Tỷ lệ revert / rollback
- **Định nghĩa:** Tỷ lệ story đã commit sau đó bị revert.
- **Vì sao:** Tín hiệu chất lượng cứng sau bước 8.
- **Thu thập:** Event revert/rollback liên kết `story_id`.
- **Phạm vi:** **Sau**

---

## 3. Sức khỏe vòng lặp

Nhóm **quan trọng nhất** cho MVP: loop có chảy đến commit không, kẹt ở cổng nào, có làm lại không.

#### H-01. Cycle time
- **Định nghĩa:** Thời gian từ story vào loop (`story_received`) đến `committed`.
- **Vì sao:** Metric sức khỏe tổng — gồm spec, khóa, testcase, implement, test, review, commit.
- **Thu thập:** Hai timestamp đầu/cuối. Báo cáo **trung vị + p90**, không chỉ trung bình.
- **Phạm vi:** **MVP**

#### H-02. Thời gian từng giai đoạn (và chờ giữa giai đoạn)
- **Định nghĩa:** Với mỗi story, thời gian 8 bước: vào/chờ, gen spec, chờ khóa spec, gen testcase, implement, test, review, chờ commit — cộng khoảng trống giữa `completed` của bước trước và `started` của bước sau.
- **Vì sao:** Chỉ ra nút thắt. Cycle time 2 ngày mà 1 ngày chờ khóa spec thì đừng tối ưu implement.
- **Thu thập:** Timestamp `*_started` / `*_completed` (và `spec_locked`, `committed`) cho đủ 8 bước. Thời gian chờ khóa spec = LK-01; chờ người lúc review nằm trong D-08 duration (Sau) nhưng **wait giữa stage** vẫn thuộc H-02.
- **Phạm vi:** **MVP**

#### H-03. Tỷ lệ rework và số vòng rework
- **Định nghĩa:**
  - **Tỷ lệ rework:** story phải quay lại bước trước sau khi đã đi tiếp.
  - **Số vòng rework:** số lần quay lại trên mỗi story.
- **Các nhánh chính:**
  - Khóa spec fail → gen spec lại (và có thể refine US)
  - Test fail → implement lại (đôi khi gen testcase lại)
  - Review fail → implement / test / (hiếm) spec
- **Vì sao:** First-pass (LK-02, TE-01, RV-01) nói “fail không”; H-03 nói “fail rồi làm lại bao nhiêu”.
- **Thu thập:** Transition `spec_returned` → `spec_gen_started`; `test_failed` → `implement_started`; `review_failed` → `implement_started` / `test_started` / `spec_gen_started`. Đếm số lần, ghi nhánh.
- **Phạm vi:** **MVP**

#### H-04. Số blocker và thời gian bị chặn
- **Định nghĩa:** Số lần story bị blocker *bên ngoài* (thiếu quyền, môi trường chết, dependency, chờ người **không** thuộc cổng lock/review), và tổng thời gian blocked.
- **Vì sao:** Tách “đứng chờ thứ không phải loop” khỏi cổng refine có chủ đích (D-08) và chờ khóa spec (LK-01). Thiếu tách này thì cycle time bị hiểu sai.
- **Thu thập:** `blocked` / `unblocked` (lý do, giai đoạn). Không dùng event `spec_submitted_for_lock` hay refine-with-human làm blocker.
- **Phạm vi:** **MVP**

#### H-05. Thông lượng loop
- **Định nghĩa:** Số story `committed` trong kỳ.
- **Vì sao:** Cặp với H-01: thông lượng thấp + cycle time dài + WIP cao = tắc. Xem cùng US-01 (vào) và số story đang kẹt ở khóa spec.
- **Thu thập:** Đếm `committed` theo kỳ.
- **Phạm vi:** **MVP**

#### H-06. WIP — số story đang trong loop
- **Định nghĩa:** Số story đã vào nhưng chưa `committed` / chưa hủy, tại một thời điểm. Nên cắt theo stage hiện tại (đặc biệt: chờ khóa spec, review).
- **Vì sao:** WIP cao làm cycle time phình; kẹt ở lock khác kẹt ở implement.
- **Thu thập:** Snapshot story trạng thái khác `committed` / `cancelled`, kèm stage.
- **Phạm vi:** **Sau** nếu chỉ chạy vài story một lúc; **MVP** khi đã có hàng đợi thật.

#### H-07. Loop già / bị bỏ dở
- **Định nghĩa:** Số (và tỷ lệ) story vượt ngưỡng tuổi (ví dụ > p90 cycle time) hoặc `cancelled` / `abandoned` giữa loop.
- **Vì sao:** Story treo không hiện trong thông lượng, nhưng chiếm cổng lock/review.
- **Thu thập:** Tuổi = now − `story_received` với story mở; đếm `cancelled` kèm stage.
- **Phạm vi:** **Sau**

#### H-08. Tỷ lệ dừng / hủy theo giai đoạn
- **Định nghĩa:** Tỷ lệ story bị hủy ở từng bước (nhập US, spec, khóa spec, testcase, implement, test, review, commit).
- **Vì sao:** Hủy trước khóa spec = intake/spec kém. Hủy sau review = lãng phí gần như cả loop.
- **Thu thập:** Event `cancelled` + `stage`.
- **Phạm vi:** **Sau**

---

## 4. Nên làm gì ở MVP

Chỉ cần **event log theo story**. Mỗi story ghi:

```
story_id
assignee (developer hoặc agent)
story_received_at / ready_at
spec_gen_started_at / spec_submitted_for_lock_at
spec_locked_at / spec_returned_at (mỗi lần trả)
testcase_gen_started_at / testcase_gen_completed_at
implement_started_at / implement_completed_at
test_started_at / test_completed_at
review_started_at / review_completed_at (mỗi vòng)
review_passed_at
committed_at (nếu có)
kết quả: lock lần đầu, từng lần test, từng vòng review (pass | fail | returned)
số lần chạy spec gen, testcase gen, implement, test, review
blocked_at / unblocked_at + lý do
human_intervention (có/không)
refine_with_human_started_at / refine_with_human_resumed_at
  (mỗi lần dừng; kèm stage: spec_gen | spec_lock | testcase |
   implement | test | review | commit)
số lần refine_with_human
số finding blocker + major (khi review)
trạng thái cuối: committed | cancelled
```

`spec_submitted_for_lock` luôn tạo một refine-with-human (`stage=spec_lock`). D-03 và D-08 là hai field khác nhau: đừng suy số lần refine từ cờ takeover.

Không cần coverage, không cần gắn bug về story, không cần tách giờ người/agent, không cần checklist đối chiếu code/US cũ — những thứ đó là cột **Sau**.

### Bảng phạm vi

| ID | Metric | Nhóm | Phạm vi |
| --- | --- | --- | --- |
| US-01 | Số story vào loop | Nhập US | MVP |
| US-02 | Tỷ lệ story đủ để gen spec | Nhập US | MVP |
| US-03 | Thời gian chờ trước spec gen | Nhập US | MVP |
| US-04 | Số lần US đổi trước khóa spec | Nhập US | Sau |
| SG-01 | Thời gian gen spec | Gen spec | MVP |
| SG-02 | Số vòng gen spec trước trình khóa | Gen spec | MVP |
| SG-03 | Spec đối chiếu code / US trước | Gen spec | Sau |
| LK-01 | Thời gian chờ khóa spec | Khóa spec | MVP |
| LK-02 | Tỷ lệ khóa spec lần đầu | Khóa spec | MVP |
| LK-03 | Số vòng trả spec | Khóa spec | MVP |
| TC-01 | Thời gian gen testcase | Gen testcase | MVP |
| TC-02 | Số vòng gen testcase trước implement | Gen testcase | MVP |
| TC-03 | Số testcase / ánh xạ spec | Gen testcase | Sau |
| IM-01 | Thời gian implement | Implement | MVP |
| IM-02 | Số vòng implement trước test | Implement | MVP |
| IM-03 | Hoàn tất implement không takeover | Implement | Sau |
| IM-04 | Quy mô thay đổi | Implement | Sau |
| TE-01 | Test xanh lần đầu | Test | MVP |
| TE-02 | Thời gian test | Test | MVP |
| TE-03 | Số lần chạy test đến khi xanh | Test | MVP |
| TE-04 | Flaky test | Test | Sau |
| TE-05 | Test chạy đủ testcase đã gen | Test | Sau |
| RV-01 | Review đạt lần đầu | Review | MVP |
| RV-02 | Finding theo severity | Review | MVP |
| RV-03 | Thời gian review | Review | MVP |
| RV-04 | Số vòng review đến khi pass | Review | MVP |
| RV-05 | Finding sửa trước commit | Review | Sau |
| CM-01 | Thời gian review pass → commit | Commit | MVP |
| CM-02 | Tỷ lệ story commit (sau khi khóa spec) | Commit | MVP |
| CM-03 | Commit fail trước khi thành công | Commit | Sau |
| D-01 | Story commit / người / kỳ | Năng suất | MVP |
| D-02 | Trung vị thời gian hoàn tất | Năng suất | MVP |
| D-03 | Tỷ lệ takeover (cờ) | Năng suất | MVP |
| D-08 | Số lần dừng refine với người | Năng suất | MVP |
| D-04 | Khóa spec rồi được commit (theo người) | Chất lượng | MVP |
| D-05 | Thời gian người vs agent | Năng suất | Sau |
| D-06 | Lỗi lọt sau commit | Chất lượng | Sau |
| D-07 | Revert / rollback | Chất lượng | Sau |
| H-01 | Cycle time đến commit (median, p90) | Sức khỏe loop | MVP |
| H-02 | Thời gian 8 giai đoạn + wait | Sức khỏe loop | MVP |
| H-03 | Rework (spec/test/review) | Sức khỏe loop | MVP |
| H-04 | Blocker ngoài cổng refine | Sức khỏe loop | MVP |
| H-05 | Thông lượng (số commit) | Sức khỏe loop | MVP |
| H-06 | WIP theo stage | Sức khỏe loop | Sau (MVP nếu đã có queue) |
| H-07 | Loop già / bỏ dở | Sức khỏe loop | Sau |
| H-08 | Hủy theo giai đoạn | Sức khỏe loop | Sau |

---

## 5. Cách đọc chung — tránh hiểu sai

1. **Cấu trúc loop là 8 bước đến commit**, không còn mô hình chính “implement → test → audit”. Review thay audit; hoàn tất = commit; spec + khóa spec + gen testcase đứng **trước** implement.
2. **Luôn đi theo bộ.** Thông lượng commit cao nhưng LK-02/RV-01 thấp và H-03 tăng là loop đang đẩy rác. Cycle time thấp nhưng D-03 = 100% là người đang gánh, không phải loop khỏe.
3. **Tách chờ khỏi làm.** H-02, LK-01, H-04 phải đứng cạnh H-01. D-08 là chờ *có chủ đích* với người — không gộp blocker, không thay bằng cờ takeover.
4. **Hai cổng người không giống nhau.** D-08 tổng; tách `spec_lock` vs `review`: kẹt lúc chốt spec khác kẹt lúc review code.
5. **First-pass (LK-02, TE-01, RV-01) + rework (H-03) + D-08** nói về chất lượng loop hơn LOC hay số commit lẻ.
6. **Không dùng IM-04 làm KPI.** Chỉ hiệu chỉnh kỳ vọng thời gian.
7. **Mẫu nhỏ thì chưa xếp hạng người.** D-01/D-02 xem xu hướng loop trước.

Bộ MVP đủ để trả lời: *story có ra commit không; chậm ở bước nào trong 8 bước; phải làm lại vì trả spec / test fail / review fail không; và AI dừng refine với người bao nhiêu lần — trong đó bao nhiêu ở khóa spec, bao nhiêu ở review.*
