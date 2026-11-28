# Sprint 04 — Architecture & Changelog

## Delta trên Sprint 03 v0.5.1

**Không thay thế Game Engine.** Tất cả API/WS, Auth, Demo, SQLite/PG schema, frontend Dark Fantasy, Codex 97 và migrations cũ được kế thừa.

1. `scripts/build-rule-knowledge.mjs`: tạo **Knowledge Base** từ nguồn địa phương, có test bảo toàn SHA.
2. `backend/src/rule-intelligence/knowledge-base.ts`: registry read-only cho developer; bảo vệ 118/97/4.656, trả defensive copies, không có public API.
3. `scripts/query-rules.mjs`: truy vấn rule/character/pair/inference có evidence, không ghi game state.
4. `backend/src/official/reactive-rules.ts`: kỹ năng phản ứng chính thức của #20 trong deck giới hạn, không tự suy diễn hành động bắn.
5. `backend/src/official/inspection-rules.ts`: chấp nhận cặp #25/#74 hoặc bộ ba #20/#25/#74; giữ nguyên ID rule pack cũ cho replay/backward compatibility.
6. `backend/src/engine/validate.ts`: kiểm tra chấn thương đêm N+1 ở **submit** và **resolve**, không sửa quy tắc PH-01 về actor chết sau khi nộp lệnh.
7. `backend/src/engine/service.ts`: ghi phản ứng #20 vào cùng transaction Event Log/State; event nội bộ, không leak cause.
8. `backend/src/game/coordinator.ts`: không cho deck nào ngoài cấu hình đã kiểm chứng; HTTP/WS vẫn authoritative.
9. `tests/official-reactive.test.mjs`: HTTP/SQLite game thật, passive next-night, duplicate action, restart, replay, privacy, unauthorized skill, pack gating.
10. `tests/rule-knowledge.test.mjs` + `tests/rule-intelligence-runtime.test.mjs`: nguồn 97/118/145/207, cặp và luật suy luận, CLI/API developer read-only.
11. `reference/official_rule_sources_v1_3_1/`: bản sao nguồn được phép đọc để tái kiểm toán.
12. `package.json`: bổ sung lệnh tạo KB và chạy regression Sprint 04.

## Luồng tương tác #20

`#25/#74 submit → validator → action queue → official inspection adapter → private ROLE_OBSERVED → reactive trigger (#20) → internal status expiresAtRound=N+1 → same transaction commit → replay; next NIGHT_COLLECT guard rejects skill → N+2 automatically no longer locked.`

Sự kiện `OFFICIAL_INJURY_SCHEDULED` chứa metadata tối thiểu và **visibility=SERVER_INTERNAL**. `projectState` không xuất toàn bộ status nội bộ, `projectEvents` chỉ xuất các event đã được cấp ACL. Nếu resolver ném lỗi trước commit, cả state và event đều rollback theo transaction hiện có.

## Không thay đổi

- `character.json` gốc; 118 luật và 207 spec; 107 ảnh/thiết kế tham chiếu.
- Authentication, Demo, Room Marker, Codex Wheel/Grid, Universal Feedback và các phiên bản migration `002/004/005/006`.
- Điều kiện thắng và Competitive: vẫn khóa.
