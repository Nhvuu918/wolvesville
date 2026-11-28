# Victory Condition Coverage — Wolvesville v1.3.1

Nguồn sổ luật có **9** quyết định đề cập đến thắng/kết thúc trận (theo quét từ khóa, không phải danh sách predicate đầy đủ). Ví dụ: VH03 yêu cầu khép toàn bộ event chain rồi xét đồng thắng; VH58 tính các phe độc lập còn sống; Q13-05 quy định người ngủ đông vẫn tính quân số phe.

Các vai có điều kiện thắng đặc biệt ngay trong `character.json` (ví dụ #8, #13, #28, #30, #40, #62, #90) cần predicate cụ thể theo đội thắng và thời điểm xét, không thể dùng một hàm “còn N người” chung cho toàn bộ.

| Thành phần | Trạng thái | Bằng chứng |
|---|---|---|
| Source capture 97 role descriptions | CONFIRMED_SOURCE | character.json + checksum |
| Source decision register | CONFIRMED | 118 quyết định |
| Victory pipeline design | PARTIAL | VH03/VH58 và tài liệu kiến trúc |
| General Victory Resolver chạy thật | **NOT_IMPLEMENTED** | Engine cố ý trả RULE_UNRESOLVED khi cố game complete |
| Win-group / tie / cult / seed lifecycle | UNRESOLVED_INTEGRATION | Chưa có bài test chuỗi hoàn chỉnh |
| Competitive 97 | **NO-GO** | Không có đầy đủ predicate + interaction gating |

**Không mở competitive:** restricted test pack #25/#74 hoặc #20/#25/#74 **không xét người thắng**, không cộng điểm, không đại diện một ván multiplayer hoàn chỉnh. Việc không có Victory Resolver là chốt chặn an toàn có chủ ý, không phải bài test thiếu đi.
