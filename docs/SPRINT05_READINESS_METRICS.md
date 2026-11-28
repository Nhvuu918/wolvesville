# Wolvesville Sprint 05 — Gameplay Coverage & Readiness

| Chỉ số | Giá trị | Ý nghĩa |
|---|---:|---|
| Nhân vật trong Codex / inventory | 97/97 | Nguồn dữ liệu hiển thị; không phải executable |
| Quyết định chính thức giữ nguyên | 118 | 85 VH + 21 v1.2 + 12 Q13 |
| Nhánh kỹ năng/hiệu ứng từng được kiểm kê | 145 | Audit branches, không phải 145 adapter |
| Nhân vật có ít nhất một nhánh executable | **6** | #9, #20, #25, #31, #34, #74 |
| Nhân vật đủ mọi nhánh và chiến thắng competitive | **0/97** | Không gọi 6 vai trên là fully playable |
| Bộ xử lý active trong restricted official pack | **5** | #9,#25,#31,#34,#74 |
| Phản ứng bị động trong pack | **1** | #20 khi bị soi |
| “Nhánh/145” theo audit | **Không so sánh 1:1** | 145 audit branches không có stable one-to-one mapping với active/passive adapters; công bố `6 executable ability paths / 145 audited branches` chỉ là tỷ lệ tham khảo, không phải coverage chuẩn hóa |
| Cặp tương tác được sàng lọc | 4.656 | Không có mặc định kết quả |
| Cặp có bằng chứng executable hẹp | **12/4.656** | Có scenario/test, **không** cover mọi tổ hợp tương tác của cặp |
| Cơ chế gameplay reuse đã thực thi giới hạn | **5 nhóm** | exact-role inspection, inspected passive injury, current-night lock, round-bound guard layer, two-night snow protection layer |
| Fact predicate thắng có nguồn được test thuần | **1** | #28 bị treo cổ, `PENDING_END_OF_CHAIN` |
| Full Victory Predicate Registry liên kết game-end | **0** | Không có auto-completion |
| Auto competitive game-end | **0** | Cấm bật |
| Automated tests | **138 PASS, 0 FAIL, 6 SKIPPED** | Không tính 207 legacy test specs |
| Browser suites có lượt PASS | **6/6** | Có lượt gộp exit 0; replay xác minh lại sau chỉnh sửa |
| PostgreSQL live acceptance | **PENDING** | Thiếu `DATABASE_URL` ở runtime này |

## Khả năng sử dụng

- **GO — Development Demo:** Auth/Room/UI/WS/SQLite đã vượt regression.
- **GO — Restricted Official Test:** Chỉ với 3 deck whitelist `[25,74]`, `[20,25,74]`, `[9,25,31,34,74]`, không xét kết quả thắng cạnh tranh.
- **PARTIAL — Skill, interaction, protection & victory:** Nhiều nhánh được code nhưng chưa có damage+win resolver.
- **NO-GO — Full Competitive 97:** Chưa đủ điều kiện nhất quán trên toàn role set.

Danh sách `data/rule-intelligence-s05/characters_97.json` chứa bảng 97 nhân vật và trạng thái triển khai; `data/rule-intelligence-s05/implemented_adapters.json` cung cấp source & test IDs; `interaction_pairs_4656.json` giúp lọc bằng máy.
