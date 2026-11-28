# V02 / V03 — quyết định còn thiếu và Developer Sandbox (Sprint 10)

**Status: `BLOCKED BY RULE` for official competitive.** Không tự phê duyệt. Tiếp nối `docs/VOTING_RULE_DECISION_PACKAGE.md` của Sprint 09.

## Nguồn và mức bằng chứng

- `reference/VH01_VH85_original_source_reference.md`, mục V02/V03, ghi **chưa có câu trả lời trong cột Excel**. Trong workbook nguồn `Ma_Soi_Bang_Cau_Hoi_Chua_Ro_100_Char.xlsx`, cả hai không phải kết luận chính thức được xác nhận.
- `character.json#33` mô tả quyền ép phiếu Sói Lừa Gạt; #23 cấm Xạ Thủ Linh Hồn vote **sau chết**; #79 hủy biểu quyết. Chúng chỉ chứng minh các trường hợp cục bộ, không chứng minh logic treo cổ tổng quát.
- Quy tắc **VH01**: ≥2 lá phiếu cuối cho một điều kiện **Kẻ Chết Thay**. Không được tự chuyển thành ngưỡng treo cổ chung.
- Thứ tự `vô hiệu → ép → Huyết Ấn` và hòa thì không treo xuất hiện trong phần **đề xuất** của tài liệu vận hành, không phải quyết định V02/V03 cuối.

## Hai quyết định cần chủ dự án chốt

**V02 — Phiếu bị xóa có được khôi phục bởi hiệu ứng ép/Huyết Ấn không?**

| Chọn | Ngữ nghĩa cần ký duyệt | Hậu quả |
|---|---|---|
| **V02-A** | Xử lý `xóa → ép → Huyết Ấn`, các modifier sau **có thể ghi đè phiếu đã bị xóa** | Một phiếu bị xóa có thể trở lại hợp lệ; cần quy định các hiệu ứng cùng ưu tiên và đích không hợp lệ |
| **V02-B** | Xử lý theo thứ tự trên, nhưng **xóa phiếu là trạng thái cuối** | Phiếu bị vô hiệu không được khôi phục trong vòng đó; kết quả và quorum có thể khác A |
| Khác | Nêu thứ tự/ưu tiên cụ thể | Viết chính sách và test riêng trước khi dùng chính thức |

**V03 — Khi khóa phiếu, điều kiện nào cho phép treo?**

| Trường hợp | Lựa chọn cần quyết định |
|---|---|
| Dẫn đầu duy nhất | Treo người nhiều phiếu cuối nhất, hay cần quorum/ngưỡng |
| Hòa ở mức cao nhất | Không treo / mở thêm vòng / tie-break theo quy tắc riêng |
| Không có phiếu hợp lệ | Không treo / xử lý khác |
| Chỉ 1 phiếu hợp lệ | Có đủ để treo không |
| Quorum | Không yêu cầu / đa số người có quyền / ngưỡng khác |
| Phiếu trắng và người không vote | Được phép, có tính quorum không |
| Người bị câm | Quy tắc VH57 chặn **chat công khai**; có cấm vote hay không phải chốt riêng |
| Đổi phiếu trước khi khóa | Có được sửa và lấy phiếu cuối không; thứ tự revision thế nào |

**Cách trả lời ngắn:** `V02-B; V03: dẫn đầu duy nhất treo, hòa không treo, không phiếu không treo, 1 phiếu đủ, không quorum, cho phép bỏ phiếu trắng, người câm được vote, được đổi phiếu trước khóa` **hoặc** ghi quyết định khác. Đây chỉ là **ví dụ câu trả lời**, không phải phương án đã mặc định bật.

## Code có sẵn nhưng cách ly

`backend/src/engine/vote-policy-sandbox.ts` cung cấp `SANDBOX_POLICIES.A` và `.B`, mỗi bản có `version`, bảy cụm `eligibility`, `modification`, `effectiveBallot`, `tie`, `quorum`, `hanging`, `postVote`. Bản A/B là **thí nghiệm minh họa**, không được hiểu như toàn bộ lựa chọn trong bảng trên đã được chốt. `evaluateVoteSandbox()` từ chối mọi request không đồng thời thỏa:

`environment=developer_sandbox`, `separateTestStorage=true`, `explicitOptIn=true`, `competitive=false`, và policy khớp nguyên bản đã đăng ký. Kết quả luôn có `status=UNAPPROVED_RULE_EXPERIMENT` và `stateCommitted=false`, `deathAuthorized=false`, `competitiveMetricEligible=false`. Code này **không đăng ký** vào Game Coordinator/API production, **không ghi** official game state, **không phát** `ELIMINATION_AUTHORIZED`.

Khi V02/V03 được duyệt: đưa policy version được phê duyệt vào server-side registry, test conflict/lock/concurrency, nối authorization cho elimination theo từng restricted pack có thể kiểm chứng, sau đó xét post-death + victory. **Metric B vẫn = 0** trước khi chuỗi này được chứng minh bằng code + browser test.
