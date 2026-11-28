# Sprint 08 — Mandatory Master Prompt Addendum (XVI–XXI)

**Ngày:** 2026-11-24. **Baseline kế thừa duy nhất:** `Wolvesville_Sprint_07_Full_Match_Integration_Full_Source` v0.9.0.

Tài liệu này đưa các mục XVI–XXI do người dùng bổ sung thành **acceptance contract bắt buộc cho Sprint 08 và mọi lần nghiệm thu tiếp theo**, không tự tạo gameplay, không thay đổi 97 nhân vật / 118 quyết định / 207 legacy test specs.

## XVI. Kiểm thử khả năng chơi thực tế

**Metric A — Completed Official Match Configurations:** Đếm mỗi tập vai duy nhất **một lần** nếu và chỉ nếu test backend thực đã đi đến `GAME_COMPLETED`, commit `MATCH_COMPLETED` với người thắng đúng luật, kiểm tra Event Log, Replay, privacy và restart. Không dùng mock, preview, số lượng test hay đếm skill làm bằng chứng.

**Metric B — Vote-to-Elimination Match Configurations:** Đếm mỗi tập vai duy nhất **một lần** nếu và chỉ nếu test backend thật đã đi qua `Night → Day → Voting → Vote Resolution → Elimination → Victory Check` theo quy tắc có nguồn xác minh, có Event Log/Replay/ACL. **B độc lập A**: chưa bắt buộc `GAME_COMPLETED`, vì định nghĩa gốc yêu cầu *Victory Check*, không phải bắt buộc kết thúc trận; nhưng nếu không có phân giải phiếu hoặc người bị loại thì B=0. Trận kết thúc đêm đầu không tính vào B.

Không tăng A/B khi chỉ có unit test, đóng nhận phiếu, hủy vote, generic UI mockup hoặc Engine predicate chưa commit.

## XVII. Match Readiness Matrix

Mỗi bộ vai: Character IDs (developer-only), số người, adapters, tương tác, Night, Day, Voting, Vote Resolution, Elimination, Victory Check, `GAME_COMPLETED`, restart/replay, Browser E2E, PostgreSQL acceptance và GO/PARTIAL/BLOCKED. Khi thiếu bằng chứng: `NOT_EXECUTED` / `PENDING`, không suy đoán PASS. Danh sách nguồn và mốc kiểm chứng phải đi cùng file máy đọc được.

**Executable entrypoint:** `npm run test:08:match-readiness` sinh `reports/S08_MATCH_READINESS.json` và `.md` từ HTTP requests thật. Công cụ không chạy browser/PostgreSQL, vì thế các cột này phải ghi rõ không kiểm thử trong lệnh này.

## XVIII. Graphics Handoff Readiness

`docs/gameplay-flow-handoff/S08_GRAPHICS_READY_CONTRACT.json` là bản hợp đồng máy đọc được, gồm 19 trạng thái. Mỗi state cung cấp: screen, status, trigger, event thực hay chưa triển khai, nguồn payload theo ACL, animation hook, transition, loading/error, reconnect, reduced motion và asset placeholder. Không yêu cầu đội đồ họa tự suy nghĩ luật từ screenshot.

**Backwards compatibility:** giữ nguyên hợp đồng Sprint 06–07; v2.0 chỉ làm rõ rằng event `PLAYER_ELIMINATED` và `MATCH_COMPLETED` đã có trong bộ đóng [8,25], trong khi `VOTE_RESOLVED`/generic hanging vẫn không được phát. Nội dung chữ phải hiện ngay, không typewriter. Server authoritative.

## XIX. Player-first Gameplay Acceptance

`docs/S08_PLAYER_FIRST_ACCEPTANCE.md` đánh giá đủ 12 câu hỏi của người mới, nêu bằng chứng và trạng thái scope. Không hiển thị internal Character ID, Event ID, Adapter ID, JSON hoặc secrets trên player-facing UI. Không đưa Design Preview vào gameplay thực.

## XX. Autonomous Continuation Policy

Chu trình `IMPLEMENT → TEST → FIX → REASSESS → CONTINUE` trong cùng phiên làm việc, không hứa làm việc nền. Các chức năng độc lập được triển khai nếu đủ luật, không nâng suy luận DERIVED thành CONFIRMED và không bịa người thắng để ép chỉ số. Nếu môi trường không có PostgreSQL/Chromium, ghi PENDING và chỉ bàn giao phần đã chạy thực tế.

## XXI. Final Acceptance Summary

Cuối Sprint báo đủ: 97 nhân vật, số có skill runtime/hoàn chỉnh, Metric A, Metric B, browser passes, PostgreSQL PASS/FAIL/PENDING, Graphics Handoff, Full Competitive Readiness. Nhấn mạnh **chỉ số A/B không được thay thế bằng tổng số test**, và B không tự động tăng do A tăng.

## Những điều kiện nghiêm ngặt cần giữ

- Không sửa `character.json`, 118 rule decisions, 207 legacy specs hoặc artwork 107 frontend tham chiếu.
- SQLite dev không cần DATABASE_URL; PostgreSQL acceptance thiếu DATABASE_URL phải FAIL, không tính SKIPPED là PASS.
- Game event visibility lấy từ server authorized projection, không phát secret qua WS/replay.
- Bộ vai GO phải có test riêng. Một số đầu mục đồ họa có thể là Design Preview nhưng không tính gameplay.
