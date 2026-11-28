# Hồ sơ quyết định còn thiếu — v1.7.36

Tất cả đề xuất dưới đây đều **PENDING — không phải luật đã phê duyệt**. Active v1.3.3 không đổi, candidate v1.3.4 chưa ACTIVE, 18 Owner Choices kế thừa nguyên vẹn. Không yêu cầu xác nhận lại VH50, VH55, VH57, VH59, VH78, Q13-08, VH11, Q13-06, VH84, hoặc quyết định DC-PACK-KEEP=A. Mỗi lựa chọn có thể được chốt độc lập; số hợp đồng ảnh hưởng là tối thiểu xác định được, không phải số FULL sẽ tự động cấp.

## 1. DC-CULT-WIN-01 — Điều kiện thắng / nhóm thắng
- Nguồn: `data/character.json#90`; `data/rules/skills.json` WV-CH90-S01/S02 (BLOCKED_BY_RULE); VH03, VH58, Q13-08; `phan_tich_97_nhan_vat_LPTV.md` mục 90.
- Khoảng trống: chưa có predicate thắng riêng, danh sách đồng thắng, quan hệ phe hiện tại và nhóm thắng khi đã kết nạp. Ví dụ Giáo Chủ và hai tín đồ sống cùng hai Dân chưa kết nạp.
- A: Giáo Chủ còn sống, toàn bộ người còn sống là Giáo Chủ/tín đồ, không còn claimant độc lập có thể tranh thắng; mọi tín đồ đã kết nạp chưa bị thu hồi hợp lệ (kể cả người chết) cùng thắng. Thành viên thuộc nhóm thắng giáo phái thay cho nhóm thắng gốc từ thời điểm kết nạp; xét đồng thắng theo VH03, không tự dừng khi VH58 cấm.
- B: Giáo Chủ còn sống, giáo phái có đa số tuyệt đối trong số người sống, không còn Sói hoặc claimant độc lập có thể tranh thắng; cùng quy tắc thành viên thắng như A.
- C: Owner chỉ định predicate và điều kiện đồng thắng khác, đặc biệt nếu tín đồ vẫn được giữ nhóm thắng gốc.
- Đề xuất A (điều kiện đóng rõ, ít phát sinh kết thúc sớm); không suy ra từ mô tả. Ảnh hưởng trực tiếp ít nhất #90 và #84; `victory-resolver.ts`, `victory-predicates.ts`, `engine/service.ts`, `winLinks`/faction transitions, death closure, admission.

## 2. DC-CULT-RIGHTS-01 — Quyền kỹ năng, tài nguyên sau kết nạp
- Nguồn: #90 nói giữ vai ban đầu; Q13-08 loại trừ người đã có liên kết/nhóm thắng độc lập; tài liệu phân tích mục 90 còn hỏi quyền chức năng gốc.
- Ví dụ Giáo Chủ kết nạp Bảo Vệ đã bảo vệ A đêm trước hoặc Pháp Sư còn một cầu lửa. Vai trò không đổi, nhưng runtime chưa biết quyền dùng, ràng buộc phe, resource/cooldown.
- A: giữ kỹ năng gốc, tài nguyên đã tiêu và cooldown; kiểm tra điều kiện hợp lệ theo trạng thái mới, không cấp lại lượt; giữ nguyên vai hiển thị. Không tự cấp kỹ năng mới.
- B: giữ vai hiển thị và ledger cũ nhưng vô hiệu hóa kỹ năng chủ động phụ thuộc phe gốc; kỹ năng không phụ thuộc phe giữ nguyên. Cần danh mục phụ thuộc phe được chốt.
- C: giữ vai hiển thị, vô hiệu hóa toàn bộ kỹ năng chủ động gốc, chỉ giữ các phản ứng bắt buộc đã được xác định.
- Đề xuất A; ít nhất #90, #84 và các hợp đồng của vai được tuyển; `capabilities.ts`, `engine/validate.ts`, resource/cooldown and inspection. Không đồng nhất giữ vai với giữ quyền thắng gốc.

## 3. DC-CULT-FAILED-01 — NV93 tuyển nhầm
- Nguồn: NV93 ở `reference/official_rule_sources_v1_3_1/Wolvesville_Dac_ta_day_du_QA_Luong_he_thong_VH01-VH85.md` chưa trả lời; #90 cấm Sói/kẻ giết người; Q13-08 xác định không đổi nhóm hoặc cấp quyền nếu đã có nhóm thắng độc lập.
- Ví dụ chọn một Sói, kẻ giết solo hoặc người có liên kết thắng độc lập. Không cho client phân biệt lý do bí mật.
- A: attempt hợp lệ theo giao diện tiêu lượt tuyển đêm đó; chỉ Giáo Chủ nhận thông báo riêng chung “Kết nạp không thành công”, không nêu phe/vai/lý do; mục tiêu không biết. Retry không tiêu lần hai.
- B: attempt không tiêu lượt, mục tiêu không biết; được chọn lại trong đêm. Hệ quả: có thể trở thành oracle qua việc chọn lại, cần giới hạn disclosure riêng.
- C: tiêu lượt; cả hai nhận thông báo riêng thất bại (không nêu vai/phe). Hệ quả: mục tiêu biết mình bị nhắm.
- Đề xuất A, cần Owner xác nhận; ít nhất #90/#84, `validate`, `resource ledger`, feedback projection, retry and game session.

## 4. DC-CULT-KILLER-DOMAIN-01 — Miền "kẻ giết người" bị loại
- Nguồn #90, NV93 (nêu kẻ giết solo), Q13-08; không tự cấm tất cả vai Dân có kỹ năng gây chết.
- Ví dụ Kỵ Sĩ Không Đầu #8 và Kẻ Biến Hình #57 có kỹ năng giết; Thợ Săn phe Dân #88 có phản ứng gây chết. Cần xác định danh sách role/đặc tính theo trạng thái hiện tại nếu chuyển vai.
- A: loại phe Sói hiện tại, tất cả killer độc lập phe Ba còn quyền tấn công giết người, và các liên kết thắng độc lập theo Q13-08; không tự loại vai Dân chỉ có khả năng gây chết.
- B: loại mọi vai có khả năng gây chết bất kể phe (kể cả #88), cùng các loại trừ đã chốt.
- C: danh sách roleId/skill rõ ràng do Owner cung cấp, đồng thời xác định sau biến đổi dùng vai hiện tại hay vai gốc.
- Đề xuất A kèm bảng roleId theo Character Specifications để Owner xác nhận; ít nhất #90/#84, `target validator`/effective role classifications. Không mở live recruitment trước khi đủ luật.

## 5. DC-CULT-REVIVAL-01 — Vòng đời membership và hiến tế
- Nguồn #90 (Giáo Chủ chết mọi tín đồ chết theo), VH50/VH55, VH73/VH76, VH03, Q13-08. Các luật trên vẫn giữ nguyên.
- Tình huống: một tín đồ chết, Giáo Chủ tuyển người mới đủ năm tín đồ sống, Thầy Đồng hồi sinh tín đồ cũ. Hoặc Giáo Chủ chết kéo tín đồ chết rồi Giáo Chủ được hồi sinh hợp lệ.
- A: membership tín đồ tồn tại qua chết; khi hồi sinh mà vượt cap thì người vừa hồi sinh không còn membership giáo phái (giữ vai/tài nguyên theo DC-CULT-RIGHTS-01), và phải xác định lại nhóm thắng; khi Giáo Chủ chết, tất cả tín đồ còn sống chết trong một death-chain, không tự hồi sinh họ khi Giáo Chủ hồi sinh.
- B: membership bị thu hồi khi tín đồ chết, hồi sinh không tự cấp lại, vẫn không tự hồi sinh theo Giáo Chủ; Giáo Chủ có thể kết nạp lại theo luật.
- C: membership tồn tại qua chết/hồi sinh, Owner quy định chính xác cách giải quyết cap nếu vượt năm, cách xử lý khi leader hồi sinh và tương tác thắng/chain.
- Đề xuất B để tránh vượt cap, nhưng đây là lựa chọn gameplay chưa được chốt; ít nhất #90/#26/#84, revival/death ledger, group chat grant/revoke, replay. Không đảo các ngoại lệ VH76.

## 6. DC-MIRROR-MULTIVICTIM-01 — Nạn nhân phản chiếu trong lượt cắn nhiều mục tiêu
- Nguồn #35, VH11, VH74; hiện S26 chỉ có một Sói và một mục tiêu mỗi đêm. #35 nói người cuối cùng bị bầy Sói giết, chưa xác định “cuối” nếu hai mục tiêu chết cùng một group resolution.
- A: dùng thứ tự commit đòn cắn hợp lệ theo representative/order đã chốt; nạn nhân cuối thực sự chết bởi đòn cắn, không tính mục tiêu được cứu/chặn. B: lấy mục tiêu cuối trong tập mục tiêu đã khóa, nhưng nếu không chết thì giữ phản chiếu trước. C: quy tắc rõ khác cho đồng thời. Đề xuất A; #35/#25, multiwolf resolver and replay.
- Phạm vi hiện tại: #25 đếm các lần soi hào quang đã phân giải, #74 là soi chính xác vai không làm tăng bộ đếm hào quang (cách hiểu giới hạn từ #35 và Q13-06). Nếu Owner muốn mọi loại điều tra đều đếm, cần xác nhận trước khi mở rộng. Không áp dụng lựa chọn đa mục tiêu vào v1.3.3 hiện tại.

## 7. DC-INSPECTION-ORDER-01 — P05 nhiều nguồn nhiễu
- Nguồn `P05` chưa ghi trả lời; VH08 là priority chung; Q13-06 xác định random false exact-role từ deck đã khóa; VH84 miễn nhiễu phải giữ nguyên, Q13-11 kiểu phân loại không được lẫn với vai/hào quang.
- A: áp dụng phép chuyển hướng mục tiêu theo luật, tính danh tính/hào quang hiện hành, áp dụng ngụy trang/che giấu đúng loại kết quả, sau đó đảo kết quả của bẫy; miễn nhiễu theo nguồn có ưu tiên bắt buộc. B: sau chuyển hướng, bẫy phân giải trước ngụy trang, các hiệu ứng sau đó ghi đè theo priority nguồn; phải xác định trường hợp miễn nhiễu. C: Owner xác định thứ tự riêng cho từng loại kết quả. Đề xuất A để giữ kiểu dữ liệu và phân tách, chưa triển khai P05 toàn miền; ảnh hưởng ít nhất #25/#74/#35/#37/#57/#18/#10. `inspection-rules.ts`, `inspection-effects.ts`, `engineer-trap.ts`, role/faction transitions.

## Không cần hỏi lại
DC-PACK-PRIVACY-BOUNDARY vẫn PENDING như chỉ thị; không tự chọn. Q13-09 (hủy vote hợp lệ làm nhiệm vụ Kẻ Chết Thay thất bại và Oscar tương ứng của Đạo Diễn) đã có luật, thiếu implementation thực sự, không phải Owner blocker. PH-02 và recipient của bầy theo quyền được cấp cần tích hợp kỹ thuật. DC-SOUL-01/02, DC-TRAP-02, DC-PACK-KEEP=A không bị thay thế. Các lựa chọn đề xuất ở trên không chỉnh sửa registry luật hoặc activation.
