# Sprint 09 — Engine, luật, source traceability và phạm vi thực thi

## Thay đổi code thực thi (không phải chỉ tài liệu)

| File | Nhiệm vụ | Nguồn và giới hạn |
|---|---|---|
| `backend/src/official/vote-control-rules.ts` | Adapter chính thức #33, mục tiêu hợp lệ, 1 lần/ván, chỉ bộ `[25,33,74]` | `character.json#33`; không hỗ trợ chồng nhiều kiểm soát |
| `backend/src/engine/vote-control-review.ts` | Tính phiếu cuối có kiểm chứng từ lựa chọn của người điều khiển; fail-closed khi thiếu một phiếu | Quy tắc #33, không quyết định người treo |
| `backend/src/engine/service.ts` | Thu, kiểm tra và phân giải action ngày trong đợt bỏ phiếu; xác thực #23 **không được vote sau khi chết** (nhưng được vote khi còn sống); giữ Event Log và revision | `character.json#33,#23`; 118 quyết định không bị sửa |
| `backend/src/engine/vote-adjudicator.ts` | Nối phiếu có biến đổi với việc khóa kiểm phiếu; hủy PH-02 vẫn có outcome riêng | `PH-02`, `Q13-09`, V02/V03 chưa chốt |
| `backend/src/engine/vote-review.ts` | Mở rộng kiểu kết quả kiểm toán private | Không mở phiếu bí mật qua Public Projection |
| `backend/src/game/coordinator.ts` | Điều phối action ngày đúng phase, xử lý retry và transition, bảo vệ path QA-only kế thừa | Không biến QA day-advance thành luật chính thức |
| `backend/src/game/archive.ts`, `backend/src/official/capabilities.ts`, `backend/src/official/inspection-rules.ts` | Đăng ký adapter / capability server / whitelist bộ vai đã được test | Gameplay giới hạn, server authoritative |
| `shared/contracts/index.ts` | Cấu trúc `VoteDirective`, trường private audit và registry | Không tự cấp quyền client |
| `frontend/integration.js` | Từ UI gửi skill #33, chọn bộ vai, giải thích pending bằng ngôn ngữ người chơi; giấu nút QA day-advance | Artwork, Bách khoa và bản đồ giữ nguyên |
| `tests/sprint09-voting.test.mjs`, `tests/postgres-s09.test.mjs`, `tests/browser_s09_e2e.py` | Engine/HTTP/replay/ACL, PostgreSQL schema riêng, Chromium đa phiên | Tests mới, không đụng 207 đặc tả nguồn |

## Chuỗi thực thi đã chạy

1. Người chơi vào sảnh bằng session riêng → tạo phòng 3 người và chọn whitelist `[25,33,74]`.
2. Engine phân vai kín → kết thúc đêm theo luật pack đang hỗ trợ → ngày → mở biểu quyết.
3. #33 chọn người cần điều khiển; action kiểm tra ở server, được ACCEPTED và phân giải trước khi khóa phiếu.
4. Cả ba người gửi phiếu riêng. Engine khóa, tính lại `effectiveCounts` theo phiếu của #33 nếu đủ input và không có modifier xung đột.
5. Vote outcome là `ADJUDICATION_UNRESOLVED` vì V02/V03 chung chưa được phê duyệt: **không có người bị treo và không có người thắng giả**.
6. Event Log, SQLite archive và Replay giữ nhất quán; HTTP/WS chỉ phát Authorized Projection, không phát private directive.

## Dữ liệu nguồn được giữ nguyên

- 97/97 `character.json`, ID và artwork.
- 118 quyết định ở `data/rules/official_merged_118.json`.
- 207 legacy specifications ở `data/rules/tests_207.json` (không phải 207 executable tests).
- 107 frontend reference files; frontend runtime chỉ điều chỉnh integration UI kỹ thuật.
- Migrations PostgreSQL 002/004/005/006 và các bước đã chốt trước đây.

## Lỗi tìm thấy và cách xử lý

1. **Thiếu hệ thống ép phiếu có execution**: trước đây hệ thống chỉ kiểm phiếu nguyên bản → thêm adapter có provenance và private final ballot audit.
2. **Lỗi ưu tiên action ngày khi bỏ phiếu**: action #33 cần được phân giải trước khi chốt, không bỏ lại action đã ACCEPTED → sửa phase gating và conflict tests.
3. **Đổi hành vi QA-only `DAY_DISCUSS`** gây fail 5 test hiệu ứng kéo dài của #20/#9/#31 → bảo toàn đường kiểm thử ở backend, ẩn khỏi player-facing UI, không coi là gameplay chính thức.
4. **Test trình duyệt có race condition khi DOM dựng lại sân chơi**: chờ seat mapping có dữ liệu trước khi tương tác ở `browser_s08_gameplay_e2e.py`. Không thay assertion về luật.
5. **Chưa có chính sách treo cổ tổng quát được xác nhận**: không kích hoạt `ELIMINATION_AUTHORIZED` từ số phiếu thô; tài liệu V02/V03 nêu lựa chọn cần chốt.

## Những gì chưa triển khai trong Sprint 09

- Không có Vote→Hanging→Elimination đã chốt luật; Metric B bằng 0.
- Không có victory predicate tổng quát, không có thắng giả cho vote.
- Không tự triển khai nhiều hiệu ứng tranh nhau lá phiếu (Sói Truyền Thông/Huyết Ấn) vì V02 chưa chốt.
- Không dùng fixture/preview hoặc đường QA-only để quảng cáo full match.

## Hai sửa lỗi phát hiện trong vòng kiểm tra cuối

- **Đính chính source `character.json#23`**: mô tả nguyên văn nói *không thể vote sau khi đã chết*, không cấm khi còn sống. Một điều kiện cấm mọi lá phiếu #23 đã bị loại bỏ. Test S09-06 kiểm chứng **alive accepted / dead rejected**, và yêu cầu bị từ chối không tăng revision/Event Log. Test tạo trạng thái chết bằng **fixture thuần để kiểm tra quyền**, không ngụy tạo một chuỗi elimination chính thức.
- **Form tạo phòng bị thay trong background resync**: `frontend/integration.js` giữ nguyên form đang mở khi WebSocket/HTTP nạp lại danh sách. Lỗi thật có thể làm mất ô tên phòng hoặc sự kiện submit khi người dùng đang gõ. Browser UX giờ thực hiện `resyncAfterReconnect()` khi form có nội dung, assert giá trị còn nguyên và tạo phòng thật thành công.
