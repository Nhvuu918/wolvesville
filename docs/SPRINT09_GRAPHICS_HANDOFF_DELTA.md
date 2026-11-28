# Sprint 09 — Graphics Handoff v2.2 (nonbreaking extension)

**Kế thừa nguyên vẹn** các hợp đồng sự kiện và màn hình Sprint 06–08 ở `docs/gameplay-flow-handoff/`. Không đổi event đã được chốt; artwork/texture/wheel/grid/room marker giữ nguyên.

| UI state | Kích hoạt / dữ liệu được nhận | Được phép xem | Animation/Graphic hook | Reconnect / reduced motion | Trạng thái |
|---|---|---|---|---|---|
| `DAY_VOTE_COLLECT` | Game authoritative projection có `phase=DAY_VOTE_COLLECT`; năng lực kỹ năng của chính người chơi | Thành viên phòng theo ACL | `vote-panel-open` | Dựng lại từ game projection; reduced motion = hiện ngay | IMPLEMENTED & TESTED |
| `VOTE_CONTROL_PENDING` | Chính người chơi #33 gửi action → API trả ACCEPTED | Chỉ người thực hiện | `skill-action-pending` | Nhận lại feedback của chính actor, không suy luận kết quả | IMPLEMENTED & TESTED |
| `VOTE_CONTROL_RESOLVED` | Action của #33 được Engine commit và server feedback theo quyền | Người thực hiện | `skill-action-resolved` | Replay private feedback; không phát thông tin mục tiêu thao túng cho người khác | IMPLEMENTED & TESTED |
| `VOTE_RECORDED_OWN` | Người chơi bỏ phiếu, projection trả `ownBallot` | Chỉ người bỏ phiếu | `own-vote-accepted` | Reconcile từ server; không dùng client local tally | IMPLEMENTED & TESTED |
| `VOTE_LOCKED_UNRESOLVED` | Server khóa phiếu, `outcome=ADJUDICATION_UNRESOLVED` | Theo phép chiếu server | `vote-locked-await-rules` (không công bố hung target) | Giữ thông báo rõ ràng sau reconnect | IMPLEMENTED & TESTED |
| `VOTE_CANCELLED_NO_ELIMINATION` | PH-02 từ #79, đã có trong Sprint 06–08 | Room audience do server cấp | `vote-cancelled` | Replay từ public event hợp lệ, không lặp visual on reconnect | INHERITED IMPLEMENTED |
| `VOTE_ELIMINATION_AUTHORIZED` | **Chưa có official outcome** | Chưa xác định | `vote-elimination` | Dùng storyboard riêng, không bind gameplay | **DESIGN PREVIEW ONLY** |
| `PLAYER_ELIMINATED` | Engine commit death (đã có cho #8 night attack) | Public projection không lộ role/attacker | `elimination-reveal` tùy nguồn được phép | Không hiển thị dữ liệu private khi reconnect | INHERITED IMPLEMENTED |
| `MATCH_COMPLETED` | Backend commit certified winner cho deck [8,25] hoặc [8,28] | Player projection, winner theo quyền | `match-result` | Hiện ngay, không typewriter; chỉ mở UI kết thúc khi backend xác nhận | INHERITED IMPLEMENTED |

### Payload boundaries

- UI **không nhận**: `VoteDirective`, `controllerId`, `effectiveCounts`, tất cả raw vote audit, `sourceActionId`, ID adapter/rule engine, vai người khác.
- UI nhận: tên người chơi được phép công khai, phase, own vote status, own capabilities, own skill feedback, outcome chung theo quyền.
- Ở tình huống đang chờ, animation chỉ xác nhận **đã nhận hành động**, không khẳng định **có người bị treo**.

### Responsive/asset placeholders

Dùng nguyên Dark Fantasy token của UI đã duyệt, không thay logo/ảnh nhân vật. Vị trí `vote-panel-open` đặt trong khung gameplay hiện hữu, trạng thái chờ vừa nội dung, touch target theo baseline 44px, desktop/laptop/tablet/mobile dùng CSS gốc; animation tôn trọng `prefers-reduced-motion`. Không có yêu cầu ảnh giả hoặc asset PNG mới. Artwork tạo ngoài Engine, trigger chỉ lấy từ Authorized Game Projection.
