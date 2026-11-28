# Sprint 07 — Rule Blocker Investigation / Audit

## Nguồn thực tế được đối chiếu

1. `data/character.json` (#8, #25, #28, #79) — canonical 97 IDs, không thay đổi.
2. `data/rules/official_merged_118.json` — mã VH01, VH03, VH06, VH58, VH82, PH-02, Q13-05 và các quyết định liên quan, không thay đổi.
3. `data/rules/tests_207.json` — 207 **specification**, có thể chứa giả định kỹ thuật chưa được xác nhận.
4. `Wolvesville_Dac_ta_day_du_QA_Luong_he_thong_VH01-VH85.md` là đặc tả luồng có đề xuất V02/V03; **V03 được ghi còn chưa có câu trả lời xác nhận**. Không lấy đề xuất tie-break làm official rule.
5. `docs/SPRINT06_SOURCE_AND_COVERAGE.md`, `docs/VICTORY_CONDITION_COVERAGE.md`, `docs/UNRESOLVED_RULES_REGISTER.md`, Rule Registry và Engine trong source.

## Kết quả truy vết theo blocker

| Blocker | Bằng chứng hiện có | Phần đã triển khai | Vẫn chưa được phép kết luận |
|---|---|---|---|
| V07-A — kết quả cuối của ballot | VH01 yêu cầu ≥2 phiếu hợp lệ **cuối cùng sau thao túng** cho một điều kiện đặc biệt; Q13-05 hạn chế người ngủ đông; Sprint06 nhận ballot | `EngineService.closeVoting()` lưu raw intents và `auditRawBallots()`, developer-only | Quy tắc hòa/không có phiếu, phiếu đã bị thay đổi, cách chốt người treo chung không suy ra từ VH01 |
| V07-B — hủy vote | PH-02 + character #79 | Đã có skill #79 và state cancellation, regression preserved | Không lấy vote đã hủy để tạo elimination |
| E07-A — tấn công đêm #8 trong bộ đóng | `character.json#8`: “Mỗi đêm, bạn có thể lấy mạng một người chơi”; #25: chỉ soi vai, không có phản ứng chết; VH03 xử lý hết chuỗi trước victory | `official.8.night-kill` → `DEATH_TRANSITION` → `DEAD_FINAL` + `PLAYER_ELIMINATED` trong đúng bộ `[8,25]` | Không phát triển tấn công chung, không mặc định bỏ qua các lớp phòng thủ/vai biến hình của bộ khác |
| E07-B — bị treo | #8 có miễn treo khi còn Sói; #28 thắng khi bị treo; VH03 chain | Giữ các victory facts và phản hồi `RULE_UNRESOLVED` khi cần kết quả vote chung | Không đủ tổng hợp điều kiện treo với hòa, immunity, hiệu ứng sau chết |
| W07-A — #8 sole-survivor victory | `character.json#8`: “Bạn thắng nếu bạn là người chơi cuối cùng”; VH03: hoàn tất chuỗi, đồng thắng; VH58: không kết thúc theo quân số khi còn độc lập cạnh tranh | `completeVerifiedKnightSolo`: chỉ khi `[8,25]`, death commit của #25 có audit, không action còn chờ, không link/hồi sinh | Không áp dụng cho nhóm có vai thứ ba hay co-winner chưa kiểm chứng |
| W07-B — thắng phe/đồng thắng | VH03, VH06, VH58, VH82 | Duy trì pending-fact evaluator và kiểm tra chain | Không có generic co-winner resolver, victory cho tất cả phe hoặc full competitive |

## Lý do bộ [8,25] có thể kết thúc sớm

Đây là *closed-world restricted test deck*, không phải giả định luật cho mọi trận. Nếu sau chuỗi đêm 1, #25 chết thật do đòn được commit của #8, #8 còn sống, không còn ai khác, không có liên kết, hồi sinh hay hành động chưa xử lý, thì điều kiện “người cuối cùng” của `character.json#8` thỏa trực tiếp. Engine ghi `MATCH_COMPLETED` sau commit rồi phát snapshot theo quyền. Nếu thiếu một tiền đề, hàm trả không hoàn tất.

## Những trường hợp không được bật

- Chốt treo khi hai người hòa phiếu hoặc số phiếu raw cao nhất: tài liệu V03 còn unanswered.
- Phân giải bất kỳ đòn #8 trong đội hình có vai bảo vệ, hồi sinh, liên kết hoặc các tương tác không được xác minh.
- Kết quả phe Sói/Dân trong bộ mở; lời giải thắng nhiều phe hoặc đồng thắng không đủ tiền đề.
- Suy diễn nhân vật chỉ từ mô tả prototype; không dùng fixture.* làm luật.
