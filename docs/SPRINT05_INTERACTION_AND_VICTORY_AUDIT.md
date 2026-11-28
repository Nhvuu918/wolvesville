# Sprint 05 — Interaction Resolution, Victory Registry, Rule Gaps

## Interaction pairs

Registry `data/rule-intelligence-s05/interaction_pairs_4656.json` vẫn bao gồm **4.656 cặp nhân vật**. Trong số này, **12 cặp** có `currentInteractionStatus=EXECUTABLE_RESTRICTED_SCOPE` theo các kịch bản/test hẹp. Các cặp còn lại chỉ là sàng lọc nguồn, không có nghĩa đã tính được kết quả.

Các bằng chứng mới gồm cặp (9,34) lock bảo vệ đang chờ; (25,34) miễn khóa; (31,34) miễn khóa; (34,74) khóa soi; (9,74), (31,74), (9,25), (9,31), (25,31) đặt lớp bảo vệ/mục tiêu. Ba cặp cũ kế thừa từ Sprint 04 bao gồm nhánh soi và phản ứng #20. Cột `currentTestEvidence` chỉ đến bài test **thực thi**; không suy rộng đến các hiệu ứng khác giữa cùng hai vai.

## Partial victory predicates

`backend/src/official/victory-predicates.ts`:

- `WV_CHAR_28_HANGED_WIN`: từ `character.json#28` và VH03, khi nhận **sự kiện HANGING_FINALIZED đã commit từ một adjudicator hợp lệ**, trả `CONDITION_MET_PENDING_END_OF_CHAIN`. Hiện chưa có adjudicator treo cổ chính thức trong pack nên **không được phát thắng/thua hoặc tự kết thúc trận**.
- `countsTowardFaction`: trạng thái ngủ đông được tính quân số theo Q13-05; `PENDING_REVIVAL` thuộc phe Dân tính theo VH06/VH82. Đây chỉ là dữ liệu đầu vào để xây victory resolver trong tương lai, **không phải predicate thắng toàn cục**.

**Số predicate fact có căn cứ trong module: 1. Số predicate hoàn chỉnh được nối vào thắng/thua competitive: 0.** Test thuần cho 2 nhánh đã PASS; victory E2E chính thức **chưa có**.

## Unresolved rule register — cô lập, không tạo vòng hỏi luật vô hạn

| Nhánh | Tình trạng | Ảnh hưởng / cách khóa |
|---|---|---|
| Khả năng hấp thụ và tiêu hao nhiều lớp bảo vệ #9/#31, thứ tự tấn công đồng thời | Chưa có cặp attack resolver đủ luật trong restricted deck | Chỉ ghi lớp và provenance; không sinh kết quả chết |
| Sói Gai Độc #20 bị bắn | Chưa có official attack adapter tích hợp | Chỉ kích hoạt nhánh **bị soi** |
| Kỹ năng nhân vật ngoài ba test decks | Thiếu resolver/điều kiện/victory đầy đủ | `RULE_UNRESOLVED`, không đưa vào test pack |
| Bẫy Sói Kỹ Sư không có giả hợp lệ | Q13-06/Q13-11 không quyết định empty pool | Trả trạng thái chưa xác định, không random ngoài pool |
| Phù Thủy cứu trước khi hạt Thần Thảo phát tác | Q13-12 chưa rõ tài nguyên/hạt còn hay mất | Không tự quyết định tiêu hao hạt |
| Kẻ Vu Khống khi vote bị hủy | Q13-09 chỉ quyết định *Kẻ Chết Thay*; không áp dụng analog | Vote interaction bị khóa |
| Quyền chat ẩn danh Người Lái Đò #51 | JSON và giới hạn chat 1–1 trong spec có phạm vi chưa đồng nhất | Chưa mở quyền chat cho #51 |
| Tiên Tri #25 bị diễn giải thành soi hào quang trong test kế thừa | Test `T-MC-04`, `T-MC-33`, `T-COV-03` sai khác nguồn JSON soi vai | Giữ test cũ bất biến; adapter xem vai thật |
| Kết thúc trận, nhiều phe đồng thắng, liên kết, dead chain | VH03, VH58 và tình huống khác quy định một phần, chưa đủ registry cuối chuỗi | Không auto-complete competitive |

Không suy luận từ fixture hoặc UI. Các quyết định đã xác nhận vẫn có ưu tiên; suy luận `DERIVED` vẫn khác `CONFIRMED`.
