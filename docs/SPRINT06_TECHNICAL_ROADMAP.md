# Sprint 06 — Proposed Safe Progression

1. **Nghiệm thu thật PostgreSQL 16 trên Mac**: khép 6 bài SKIP; riêng test S05 chạy 5-player support pack, replay, restart, membership ACL trong schema thử nghiệm, không ảnh hưởng dữ liệu thật.
2. **Chuẩn hóa execution branches → 145 audit IDs**: mapping có provenance từng skill, confidence, required roles, target type, resource, test, tránh gọi 6/145 là tỷ lệ phủ chính xác.
3. **Chọn cặp attack+defense có đủ nguồn và ngoại lệ**: xây damage intent, guard layering, kill preliminary/real, death chain ở mức source-grounded; không tự áp quy tắc mặc định lên mọi shield.
4. **Victory Resolver architecture**: source-grounded predicate registry + end-of-chain coordinator, chốt phạm vi faction checks và simultaneous winners từng bước; không auto-win từ partial `#28`.
5. **Group interactions**: nối action lock #34, retained action PH-01, multi-attacker + shield, complete ability resource layer khi các nhánh tương ứng có căn cứ.
6. **Seasoned multiplayer reliability**: thử 5 người trên 2+ browser contexts + direct browser trên Mac, WS resubscribe, reconnect, client stale revision, PH-01 postdeath action.
7. **Test quality**: bổ sung true source traceability Rules → Adapter → Event → Test; phân biệt simulated fixture, SQLite integration và PG live; giữ legacy conflicts như annotations, không sửa nguồn.

Các nhánh Q13 empty candidate pool, Witch/seed resource, Kẻ Vu Khống/vote cancellation, Ferryman chat chỉ hỏi user nếu thực sự chặn một phạm vi play cụ thể; các module khác tiếp tục độc lập.
