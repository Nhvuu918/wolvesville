# ĐẶC TẢ BỔ SUNG GAME ENGINE v1.3.1 (KHÔNG CÓ MÃ)

Đây là **delta specification** nối vào v1.3, không thay thế toàn bộ state machine của v1.3. Không viết Game Engine khi người dùng chưa yêu cầu.

## 1. Action Validator & AFK

- `getMandatoryAction(state, actor, skill)` chạy trước khi tính timeout. Nếu trigger không xảy ra, hành động đó không tồn tại và không tính AFK (PH-04/Q13-02).
- Khi đã có hành động phải làm và hết hạn, lấy `eligibleTargets = livingParticipants ∩ targetGuards(skill, currentSnapshot)` **không lọc theo team** nếu kỹ năng không yêu cầu lọc team. Bộ chọn chỉ rút từ danh sách đã qua kiểm tra Q13-02.
- Bộ đếm AFK tích lũy theo PH-03. Lần 2 áp chính sách tự sát cũ theo điều kiện của hành động bắt buộc, không tự hồi sinh hoặc đổi thứ tự.
- Khi không có mục tiêu hợp lệ, trả `DEADLINE_NO_OBLIGATION` thay vì tăng count AFK. Server log `eligibleSetSnapshot` và nguồn guard.

## 2. Resource & Buff Resolver

- Buff x2 thuộc đêm kích hoạt; một kỹ năng không được dùng trong đêm không hưởng buff. X2 từ nhiều nguồn không thành x4 (SK-01, SK-02, Q13-01).
- Số lượt thực sự được thực thi `min(baselineCapacity * multiplier, remainingCharges, perPhaseLimit, skillSpecificLimit)` là **mô hình kỹ thuật** nếu skill dùng charge từng lượt. Không được nhân kho charge. VH05 Phù Thủy cứu bằng một bình tối đa hai lượt là ngoại lệ nguồn.
- Không buộc nhân vật dùng kỹ năng nếu thiếu mục tiêu hợp lệ hoặc kỹ năng không phát sinh; không cộng x2 “dư” sang đêm sau.
- Ghi `skillUsed`, `buffApplied`, `chargeDebited`, `chargeSource` để replay không trừ trùng.

## 3. Link & Cult Resolver

- `activeLinks` tách `suspendedLinks`/`chatMemberships`; link cũ vẫn có quyền chat đã chốt theo REL-02.
- Khi cần khôi phục từ nhiều suspended candidates: loại link không hợp lệ; áp ưu tiên loại đã xác nhận; cuối cùng chọn link gần nhất trong lịch sử (Q13-03). Đây là arbitration **khôi phục**, không thay luật tạo link cùng cấp VH04.
- Khi Giáo Chủ kết nạp, kiểm tra winGroup độc lập trước khi gây đổi phe/chat; nếu đã có winGroup độc lập thì từ chối (Q13-08), trừ trường hợp có luật ưu tiên mới được xác nhận trực tiếp.

## 4. Role Assignment

- `initialRoleId` duy nhất theo mỗi slot khi role-lock. Sau ván bắt đầu, `currentRoleId` có thể trùng vì biến đổi hợp lệ (Q13-04); không thay `initialRoleId`, `playerId`, `slotId`. Sói Biến Hình sao chép skill nhưng vẫn phe Sói (VH71).
- 97 vai không trùng ⇒ ở thời điểm khóa bộ vai chỉ gán tối đa 97 slot; UI 1–100 chỗ không cho start khi cần hơn số role IDs đang có.

## 5. Tầng điều tra có kiểu dữ liệu và RNG

- `ObservationType`: `AURA`, `ROLE_ID`, `SKILL_CLASS`, `TEAM`, `OTHER_TYPED`.
- Trường hợp SK-05 + Q13-06: role false chọn trong `lockedRoleIds - {trueRoleId}`. Giữ bí mật tập kết quả, actor, trigger và seed; log server `RNG_DRAW`.
- Trường hợp Q13-11: false class chọn trong `validClassLabels(skill, snapshot) - {realClassLabel}`. Không biến class thành role tên hoặc aura; ngoại lệ miễn nhiễu VH84 giữ hiệu lực.
- Nếu tập không còn giá trị thay thế, không bịa kết quả; trả unresolved cho branch tương ứng khi chưa có quy tắc hiển thị cuối cùng. RNG ngẫu nhiên nhưng **kết quả tái lập từ log**.

## 6. Combat và nguồn bảo vệ

- Mỗi protection effect có `providerParticipantIds`, `protectionOriginSkill`, `protectionKind`, `effectId` độc lập với item/dog object.
- Sói Điên Cuồng #75: tập nguồn bảo vệ hợp lệ được đánh dấu là protector cho cơ chế giết theo Q13-10 (kể cả nguồn cấp chó/trang bị). Xét xuyên bảo vệ theo VH42 và trap phản sát theo SK-06; dedupe mỗi death transition.
- Không mở rộng Q13-10 thành “mọi nguồn buff đều chết” nếu đó không phải lớp bảo vệ.

## 7. Trạng thái ngủ đông, cứu và trì hoãn chết

- Sơ bộ đêm: ghi pendingDeath trước. Prompt Phù Thủy có tên người mang hạt nếu người đó nằm trong tập chết sơ bộ; có quyền cứu hợp lệ trước hạt (Q13-12). Phù Thủy không thấy vai hay nguồn chết.
- Khi được cứu: death trigger tương ứng không xảy ra. Nếu không được cứu và có hiệu ứng kéo dài sống hợp lệ, xử lý kéo dài trước; khi hết hạn mới kiểm tra hạt (Q13-07). Nếu hạt kích hoạt, chuyển HIBERNATING_PSEUDO_DEAD (LIFE-02).
- Trong HIBERNATING, vẫn tính quân số phe, không cho chat/vote/skill (Q13-05); death-link không chạy chỉ do thông báo giả chết. Ghi `publicReportedDead` khác `isDeadActually`.
- Vấn đề hạt có bị tiêu hao khi cái chết sơ bộ đã được Phù Thủy ngăn chặn: giữ trường `seedConsumptionPolicy` chưa chốt, không tự lấp bằng quy tắc suy diễn.

## 8. Vote và Oscar

- PH-02 hủy vote khi Sói Hòa Bình kích hoạt; không tạo phiếu cuối giả. Kẻ Chết Thay không đạt ≥2 phiếu hợp lệ cuối, **vẫn diễn sai và nhận Oscar theo Q13-09**.
- Q13-09 không tự định nghĩa kết quả vai diễn Kẻ Vu Khống khi vote bị hủy; dành role-specific guard.

## 9. Victory, ACL, replay và đồng thời

- Victory evaluation chỉ tại atomic checkpoints đã chốt VH03; HIBERNATING vẫn tính quân số; PENDING_REVIVAL theo VH82; các winGroup độc lập giữ nguyên.
- `RULE_UNRESOLVED` không chọn một kết quả thắng/chết tùy tiện. `acceptedCommands` / `resolvedEvents` có idempotency keys; log source rule IDs đầy đủ. Server phát projections ACL riêng tới từng participant. 
- Replay sử dụng events + snapshot cùng version; không công khai raw chat phe khác dù sau trận (PRIV-01).

## 10. Release gate

| Gate | Kết quả |
|---|---|
| Nguồn nhân vật bất biến, 85 VH + 21 v1.2 + 12 v1.3.1 | PASS nguồn / quyết định |
| 12 câu Q13 | 12/12 CONFIRMED |
| Các nhánh role-pack đặc thù / RNG rỗng / seed consumption | Cần chốt trước khi bật tác dụng tương ứng |
| Tự động thực thi test | NOT_STARTED (specifications only) |
| Game Engine v1.3.1 code | NOT_STARTED |
| Tuyên bố đủ 97 role skills | NOT_READY |
