# Sprint 05 — Skill Adapter Implementation & Traceability

Bằng chứng ở cấp **nhánh đang chạy**, không phải chứng chỉ toàn bộ nhân vật PLAYABLE. Mọi bài test nêu ở đây là test tự động thực tế (khác 207 test specification legacy).

| Nhân vật, nhánh | Rule source | Validation và resource | Effect / Visibility | Test/code |
|---|---|---|---|---|
| #25 Tiên Tri `official.25.inspect-role` | character.json#25 | Ban đêm, người khác còn sống, 1 lần/đêm, deck whitelist | Chính người soi biết `currentCharacterId`, sau commit; không tiết lộ cho room | `inspection-rules.ts`, `official-rules.test.mjs` |
| #74 Tiên Tri Huyền Bí `official.74.inspect-role` | character.json#74 | Tương tự, soi chính xác vai | Private ROLE_INFORMATION, sau commit | `inspection-rules.ts`, `official-rules.test.mjs` |
| #20 Sói Gai Độc, passive inspection injury | character.json#20 | Kích hoạt khi #25 hoặc #74 soi trong whitelist | Người soi mất chức năng **đêm tiếp theo**; internal event/status, không broadcast source | `reactive-rules.ts`, `official-reactive.test.mjs` |
| #34 Sói Mộng Du `official.34.night-block` | character.json#34; VH08, VH10, VH24, PH-01 | Mỗi đêm 1 mục tiêu, chỉ dân làng chịu khóa; Tiên Tri #25 và Bảo Vệ #31 miễn nhiễm được nêu cụ thể. #74 **không** miễn nhiễm theo tên chung | BLOCK trong đêm hiện tại, hủy accepted skill đang chờ của đối tượng đủ điều kiện, không leak private cause | `support-rules.ts`, `official-support.test.mjs` |
| #31 Bảo Vệ `official.31.guard` | character.json#31 | 1 đêm 1 người, không lặp cùng người **hai đêm liên tiếp**; return after intervening night allowed | Ghi phòng hộ với `sourceId` và `expiresAtRound=current`; chưa tự triệt tiêu attack | `support-rules.ts`, `official-support.test.mjs` |
| #9 Thiên Sứ Tuyết `official.9.snow-protection` | character.json#9 | Mỗi đêm 1 mục tiêu; tối đa **3 người khác nhau trong ván**; không bảo vệ một người hai lần | Ghi lớp bảo vệ kéo dài 2 đêm, hiệu lực tồn tại kể cả actor chết; chưa áp quy tắc absorb attack | `support-rules.ts`, `official-support.test.mjs` |

### Interaction priority and authorized scope

- #34 khóa tác động trên #9/#74 trong bộ 5 vai: resolver xử lý theo dependency/priority kỹ thuật đã test, không dùng request arrival order làm kết quả.
- #34 không khóa #25 hoặc #31 (ngoại lệ nêu ở VH24); không tự mở rộng miễn nhiễm sang các vai có tên tương tự.
- #20 phản ứng khi bị #25/#74 soi; tình huống #20 bị **bắn** chưa có adapter tương ứng.
- #31 và #9 có thể đặt nhiều lớp bảo vệ, nhưng engine hiện chỉ ghi lớp; **không xác nhận** thứ tự hấp thụ hay trừ lớp khi có tấn công.
- Trong cấu hình giới hạn: `[#25,#74]`, `[#20,#25,#74]`, `[#9,#25,#31,#34,#74]`. Deck không nằm trong danh sách phải bị từ chối.
- UI chỉ nhận skill contract từ `ownCapabilities`, không bao giờ tự suy ra role/skill từ tên artwork.

### Không tự lấp khoảng trống

Source `character.json` không mô tả toàn bộ priority tổng quát, immunities khác, relative damage, cả logic thắng chồng lấn hoặc rule pack của mọi faction. Kỹ năng trong Codex khác với **kỹ năng executable**. Không gọi các adapter này là đủ toàn bộ competitive.
