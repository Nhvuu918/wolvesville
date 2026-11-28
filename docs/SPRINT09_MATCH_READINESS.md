# Sprint 09 — Ma trận cấu hình và hai chỉ số độc lập

| Bộ vai thực tế | Người | Ban ngày | Phiếu được ghi/lưu | Vote Resolution | Loại theo phiếu | GAME_COMPLETED | SQLite restart/replay | Browser | PostgreSQL | Quyết định |
|---|---:|---|---|---|---|---|---|---|---|---|
| `#8 + #25` | 2 | Không cần, kết thúc đêm đầu | N/A | N/A | N/A | **Có** (#8 sống cuối) | PASS kế thừa | PASS kế thừa | PENDING | GO — Restricted early-night full match |
| `#8 + #28` | 2 | Không cần, kết thúc đêm đầu | N/A | N/A | N/A | **Có** (#8 sống cuối) | PASS kế thừa | PASS kế thừa | PENDING | GO — Restricted early-night full match |
| `#25 + #74` | 2 | Có trong test mode | Có | **Chưa có quy tắc treo** | Không | Không | PASS kế thừa | PASS kế thừa | PENDING | PARTIAL |
| `#20 + #25 + #74` | 3 | Có trong test mode | Chỉ nếu flow mở vote | Chưa chốt | Không | Không | PASS kế thừa | PASS kế thừa | PENDING | PARTIAL |
| `#25 + #74 + #79` | 3 | Có | Có, **hủy PH-02** | **Có outcome không loại vì hủy**; không phải phân giải treo | Không | Không | PASS kế thừa | PASS kế thừa | PENDING | GO — Restricted vote cancellation, **B=0** |
| `#9 + #25 + #31 + #34 + #74` | 5 | Có | Chưa đủ chốt treo | Chưa chốt | Không | Không | PASS kế thừa | PASS kế thừa | PENDING | GO — Restricted night-skill test, không phải full match |
| `#25 + #33 + #74` | 3 | **Có** | **Có; phiếu cuối biến đổi theo #33** | **PARTIAL** — audit đã chốt, kết luận treo chưa xác nhận | Không | Không | **PASS Sprint 09** | **PASS Sprint 09** | PENDING | GO — Restricted vote-manipulation test, **B=0** |

**Metric A = 2** (chỉ các bộ có commit người thắng thật); **Metric B = 0** (không có đường Voting→Elimination→Victory được xác minh). Bất kỳ batch nào chỉ chứng thực vote cancellation, vote audit hay early-night win đều **không** tăng B.

**Nhân vật có ít nhất một nhánh kỹ năng/gameplay executable theo registry:** **9** (`#8`, `#9`, `#20`, `#25`, `#31`, `#33`, `#34`, `#74`, `#79`). `#28` có victory fact giới hạn, không tính như Skill Adapter mới. **0/97 nhân vật** được chứng nhận đủ toàn bộ tính năng competitive.
