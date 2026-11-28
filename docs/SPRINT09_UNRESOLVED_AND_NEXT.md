# Sprint 09 — Những điều kiện chưa được chốt và hướng tiếp tục

## Chính xác vì sao Metric B = 0

1. **V03 (hanging adjudication):** nguồn có mô tả dự kiến “hòa số phiếu cao nhất không treo”, nhưng chưa được xác nhận ở cột trả lời. Thiếu quyết định về kết quả người dẫn đầu duy nhất, quorum, zero ballot, người câm và phiếu không hợp lệ. Engine không được tạo `ELIMINATION_AUTHORIZED` từ raw tally.
2. **V02 (conflicting vote modifiers):** mô tả có thứ tự dự kiến, nhưng luật về Sói Truyền Thông/Huyết Ấn/Sói Lừa Gạt cùng lá phiếu chưa chốt. Engine chỉ triển khai #33 trong bộ vai **không có modifier tranh chấp**, giữ `ADJUDICATION_UNRESOLVED` ở kết quả treo.
3. **Death chain and team victory generalization:** nhiều vai có phản đòn, chết thay, chuyển phe, hồi sinh, co-winner. Pipeline #8 early-night hiện chỉ chứng minh bộ vai đóng; không thể mở rộng mặc định cho 97 vai.

**Gói giải quyết quyết định duy nhất:** `docs/VOTING_RULE_DECISION_PACKAGE.md` với bảng input/output và phương án có cân nhắc; không yêu cầu nhập lại 118 quyết định.

## Nhiệm vụ tiếp theo sau khi V02/V03 được xác nhận

- Viết `FinalVotePolicy` versioned từ quyết định nguồn, bộ test kể cả tie/no vote/one vote/forced/cancelled.
- Gắn `ELIMINATION_AUTHORIZED` với mã luật và chứng minh từ final tally.
- Chuyển tới `PostEliminationChain` đã có và kết thúc khi các effect quan trọng được giải quyết.
- Mở một cấu hình nhiều người phù hợp rồi chạy từ night→day→vote→hanging→victory / next night, gồm SQLite restart, Replay, privacy, Browser E2E và PostgreSQL live.
- Chỉ tăng Metric B sau khi test thật; chỉ mở rộng bộ vai và competitive khi mọi dependency liên quan đã chốt.

## Hạn chế môi trường kiểm thử

- PostgreSQL live vẫn PENDING — không có server/DB URL trong workspace. Strict test khi URL thiếu chủ động FAIL, không bị tính là PASS.
- Browser trong Linux sandbox dùng cầu nối HTTP/WebSocket tới backend thật vì giới hạn localhost của Chromium; native Mac cần chạy lại để nghiệm thu riêng.
