# Sprint 06 Persistence / Migration decision

Không có migration mới vì `VoteLedger` được lưu trong `GameState` của **Kernel archive hiện có**, nằm trong cùng `GameStore.withGameMutation` transaction với revision, relational `game_events` và snapshots.

SQLite và PostgreSQL dùng cùng một cấu trúc `GameCommit`; transaction rollback từ DB ghi archive+event+snapshot nhất quán. Không tạo bảng vote thứ hai song song dễ làm trạng thái bất nhất. Test trên SQLite `S06-01,02,03,05,07,08,09` đã chạy. PostgreSQL có bài `tests/postgres-s06.test.mjs` dùng schema thử nghiệm riêng, chưa được chạy trên PostgreSQL thật trong workspace này.

**Migrations 002,004,005,006 được giữ nguyên byte**. Khi triển khai vote competitive sau khi chốt luật, có thể cần migration bổ sung để truy vấn phiếu thuận tiện, nhưng không được tạo schema “final vote” khi luật chưa rõ.
