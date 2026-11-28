# Match Lifecycle / Lobby → Room → Match

```mermaid
flowchart TD
 A[Đăng nhập/Demo] --> B[Sảnh làng, phòng từ backend]
 B --> C[Chọn bảng tên phòng]
 C --> D[Xem thông tin phòng]
 D --> E[Tham gia phòng bằng HTTP]
 E --> F[Chủ phòng khóa danh sách]
 F --> G[Chọn bộ vai thử nghiệm được hỗ trợ]
 G --> H[Server phân vai duy nhất, lưu RNG/Event Log]
 H --> I[Chỉ gửi vai cho chính người chơi]
 I --> J[Đêm: kỹ năng được nhận/giải quyết]
 J --> K[Ngày: thảo luận, lượt nhận phiếu]
 K --> L{Quy tắc hủy vote PH-02?}
 L -->|Có, #79 hợp lệ| M[Hủy vote, sang đêm kế]
 L -->|Không| N[BLOCKED: chốt treo cổ]
 M --> J
 N --> O[Design only: Elimination + Victory]
```

- **IMPLEMENTED & TESTED:** A→M (riêng đường PH-02) và các gameplay test pack trước.
- **PARTIAL:** K (bỏ phiếu chỉ ghi nhận, không có finalVote chung).
- **BLOCKED BY RULE:** N/O; không dùng mock death/winner ở runtime.
- **Thiết kế giữ nguyên:** sân khấu Dark Fantasy, map, vòng bài Bách khoa, kết quả text instant; chỉ bổ sung khu vực voting.
