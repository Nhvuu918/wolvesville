# Sprint 06 — Source, Coverage & Rule Gaps

## Nguồn đã đọc và bảo toàn

- `data/character.json`: 97 nhân vật; SHA256 được `npm run verify:source` xác minh.
- `data/rules/official_merged_118.json`: 118 quyết định, không chỉnh sửa.
- `data/rules/tests_207.json`: 207 **test specifications** (không phải test đã chạy).
- `data/rule-intelligence/`: Rule Knowledge Base Sprint 04–05, interactions và coverage.
- `backend/src/engine/` + `backend/src/official/` + `backend/src/game/`: Engine + 6 nhân vật Sprint 05.
- `docs/VICTORY_CONDITION_COVERAGE.md` và `docs/SPRINT05_*`: nguồn ghi nhận tình trạng victory.
- Tất cả 107 file frontend tham chiếu; bản runtime kế thừa đúng hai entrypoint đã được duyệt.
- Không sử dụng tư liệu LPTV, không dùng fixture để chứng minh luật chính thức.

## Nhánh phát triển Sprint 06

| Căn cứ | Cơ chế | Triển khai | Giới hạn |
|---|---|---|---|
| `PH-02`, `character.json#79` | #79 tiết lộ vai và hủy lượt bỏ phiếu; 1 lần/trận | `peace-rules.ts`, `EngineService.resolve`, 3-seat test deck | Một Sói duy nhất trong bộ bài thử; không suy ra kỹ năng của các Sói khác |
| `Q13-05` | Người ngủ đông không bỏ phiếu | `submitVoteIntent()` | Đầu vào restricted; chưa có finalVote |
| `VH01` | Nhiệm vụ Kẻ Chết Thay phụ thuộc 2 phiếu *cuối cùng* | Đánh dấu blocker | Không suy phiếu raw là phiếu cuối |
| `character.json#8` + VH03/VH06/Q13-05 | Miễn treo khi còn Sói; một mình sống sót là winning fact | Pure predicates | Không có sự kiện treo chính thức để gọi trong live match |
| `character.json#28`, VH03 | Khi bị treo hợp lệ là partial winning fact | Giữ từ Sprint 05 | Không tự kết thúc game |
| `VH03`, `VH58` | Xét thắng sau kết chuỗi, người độc lập tranh thắng | Ghi trong pipeline đề xuất | Không có full chain + competing predicate resolver |

## Gameplay readiness — số liệu không lẫn khái niệm

- **97/97** nhân vật trong dữ liệu và Bách khoa, **7** nhân vật có ít nhất một nhánh gameplay thực thi: `#9,#20,#25,#31,#34,#74,#79`.
- **6** kỹ năng chủ động (#9/#25/#31/#34/#74/#79), **1** phản ứng bị động (#20). Không vai nào đủ mọi tương tác để mở competitive toàn diện.
- **145** nhánh được kiểm kê trong Sprint 04; số nhánh adapter/code cụ thể cần phân loại theo độ hạt khác nhau. **Không tự đưa 7/145 thành tỷ lệ độ phủ chính xác** khi một nhánh inspection/protection chứa nhiều exception.
- **4.656** cặp tương tác sàng lọc, **12 cặp có bằng chứng kiểm thử giới hạn kế thừa**; Sprint 06 thêm test tương tác #79 với vote intent. Không tuyên bố full interaction coverage.
- **2** loại Winning Fact có mã kiểm thử: #28 bị treo và #8 sole survivor. **0** official match-finalizing Victory Resolver.
- **1** vote-intent ledger + `PH-02` cancellation. **0** official tally→hanging execution.
- `NIGHT_COLLECT/NIGHT_RESOLVE/NIGHT_FINALIZE/DAY_DISCUSS/DAY_VOTE_COLLECT/DAY_RESOLVE` có logic trong test pack; `GAME_COMPLETED` bảo vệ không cho hoàn tất khi thiếu luật.
- **GO:** tài khoản/phòng/Engine và restricted gameplay; **PARTIAL:** voting/lifecycle/victory; **NO-GO:** full competitive match.

## Các blocker thực sự không nên suy diễn

1. Tie/no-vote/threshold/blank ballot và quyền sửa phiếu; vote manipulations của #33/#91 trước finalVote.
2. Nạn nhân bị treo và thứ tự death chain/rescue/passive/hanging immunity.
3. Đòn tấn công của các vai và từng loại bảo vệ không mặc định chặn mọi sát thương.
4. Thứ tự đồng thắng phe và special victory đầy đủ theo VH03/VH58; endgame projection.
5. Sau death/hanging, role/faction transformations và hồi sinh tương ứng.
6. #79 khi có nhiều Sói: phải xác minh và kiểm thử faction-scoped audience lịch sử trước khi mở bộ bài nhiều Sói (không ảnh hưởng bộ 3 hiện có).

Các điều kiện chưa rõ cần quyết định có dẫn nguồn, không được thay bằng luật Ma Sói thông thường.
