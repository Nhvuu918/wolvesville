# Sprint 08 — Player-first Gameplay Acceptance Checklist

**Phạm vi:** S07 [8,25] restricted early-night victory + S06 vote intake/cancel; chưa có vote-to-elimination.

| # | Tiêu chí | Trạng thái | Bằng chứng | Kỳ vọng giao diện |
|---:|---|---|---|---|
| 1 | Biết trận bắt đầu | PASS_SCOPED | Room Start → authorized role reveal; S07 browser | private role snapshot |
| 2 | Biết vai của mình | PASS_SCOPED | game.players[].self authorized, role badge no internal ID | role reveal |
| 3 | Biết lúc nào hành động | PASS_SCOPED | game.phase & capabilities | night/day indicators |
| 4 | Biết mục tiêu hợp lệ | PASS_SCOPED | Server capability & target validation | selected target + error feedback |
| 5 | Phân biệt đã gửi/đã phân giải | PASS_SCOPED | ACTION_ACCEPTED vs resolution; S07 browser | pending state |
| 6 | Biết khi mở bỏ phiếu | PASS_INTAKE_ONLY | VOTING_OPENED; S06 backend/browser | vote panel |
| 7 | Biết phiếu đã được nhận | PASS_INTAKE_ONLY | VOTE_INTENT_RECORDED own ballot | own receipt |
| 8 | Nhận kết quả bỏ phiếu đúng quyền | BLOCKED_BY_RULE | No generic VOTE_RESOLVED, S07-V02/V03 | no fabricated result |
| 9 | Biết ai bị loại khi được công khai | PASS_SCOPED_NIGHT_ONLY | PLAYER_ELIMINATED #25, payload playerId only | night elimination |
| 10 | Hiểu vì sao trận kết thúc | PASS_SCOPED | MATCH_COMPLETED after closed deck sole survivor #8 | winner panel |
| 11 | Biết bản thân thắng hay thua | PASS_SCOPED | winnerIds vs own player ID, not character ID | winner/loser state |
| 12 | Quay lại Lobby | PASS_SCOPED | Existing S07 browser navigation | return to lobby |

**Chặn nghiệm thu:** Dòng 8 chỉ được chuyển GO khi có event `VOTE_RESOLVED` chính thức, kết quả được phép công bố và Browser E2E. Dòng 9 chỉ minh chứng loại trong đêm, không dùng làm bằng chứng treo cổ.

**Đối tượng thử:** Người chơi lần đầu, người chơi quay lại/reconnect, chủ phòng; UX không phơi bày JSON, code, internal Character ID, seed hay mã rule.
