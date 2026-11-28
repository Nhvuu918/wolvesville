# Gameplay State Diagram

```mermaid
stateDiagram-v2
    [*] --> ROLE_LOCKED: server khởi tạo trận
    ROLE_LOCKED --> ROLE_ASSIGNED: server phân vai
    ROLE_ASSIGNED --> NIGHT_COLLECT: server bắt đầu đêm 1
    NIGHT_COLLECT --> NIGHT_RESOLVE: chủ phòng cho phân giải đêm (restricted test)
    NIGHT_RESOLVE --> NIGHT_FINALIZE: Engine commit
    NIGHT_FINALIZE --> DAY_DISCUSS: mở ngày
    DAY_DISCUSS --> NIGHT_COLLECT: test-only bỏ qua vote
    DAY_DISCUSS --> DAY_VOTE_COLLECT: host mở ghi nhận phiếu
    DAY_VOTE_COLLECT --> DAY_RESOLVE: host khóa phiếu hoặc xử lý #79
    DAY_RESOLVE --> NIGHT_COLLECT: CHỈ KHI #79 hủy vote hợp lệ (PH-02)
    DAY_RESOLVE --> GAME_COMPLETED: BLOCKED BY RULE
```

| Trạng thái | Kết quả | Ghi chú |
|---|---|---|
| `ROLE_LOCKED`, `ROLE_ASSIGNED`, `NIGHT_COLLECT` | IMPLEMENTED & TESTED | Backend phân vai bằng RNG, chưa có full match |
| `NIGHT_RESOLVE`, `NIGHT_FINALIZE`, `DAY_DISCUSS` | IMPLEMENTED & TESTED | Night resolution và feedback đúng ACL |
| `DAY_VOTE_COLLECT` | IMPLEMENTED & TESTED | Tiếp nhận phiếu riêng tư, chỉ 1 lần/người trong bộ test |
| `DAY_RESOLVE` | PARTIAL | Chốt phiếu chỉ có kết quả PH-02; không mặc định treo cổ |
| `GAME_COMPLETED` | BLOCKED BY RULE | No legitimate automatic ending; Engine bảo vệ transition |

`DAY_VOTE_COLLECT` được thêm dưới dạng Phase chính thức trong types, nhưng **quyền thu phiếu chỉ bật trong Restricted Official Test**; đây là một giai đoạn kỹ thuật cho flow, không tuyên bố đã hoàn thiện luật biểu quyết.
