# Player Action Flow

```mermaid
flowchart TD
  A[UI chọn mục tiêu] --> B[POST /api/games/id/actions]
  B --> C{Auth + Participant + Phase + Rule Registry}
  C -->|Reject| D[UI lỗi tiếng Việt, không tạo effect]
  C -->|Accept| E[ACTION_ACCEPTED: internal]
  E --> F[Đợi chủ phòng đóng lượt / engine resolve]
  F --> G{Rule Resolver}
  G -->|Lock hợp lệ| H[ACTION_CANCELLED]
  G -->|Unresolved| I[Rollback; chờ căn cứ]
  G -->|Success| J[STATE_COMMITTED + Event hash + Replay]
  J --> K[Authorized Projection đến từng client]
  K --> L[Hiện kết quả tức thì]
```

**IMPLEMENTED & TESTED:** auth, server actor, action/idempotency, queue, resolution, locked cancellation, replay, feedback #20/#25/#74/#9/#31/#34/#79. **PARTIAL:** xử lý combat, group-scoped actor outcomes ngoài test decks. **Không dùng:** frontend tính role/priority/RNG/actual result, hoặc `ACCEPTED` như `RESOLVED`.
