# Sprint 09 — GÓI CHỐT LUẬT BIỂU QUYẾT (V02 / V03)

> **Phạm vi:** Chỉ các quyết định thực sự còn thiếu cho việc chuyển từ phiếu cuối sang treo cổ chính thức. Không yêu cầu xác nhận lại 118 quyết định. Không dùng gói này như luật đã phê duyệt.

## 1. Kiểm toán nguồn và thứ tự bằng chứng

| Nguồn đã kiểm tra | Chứng cứ có thật | Ý nghĩa và giới hạn |
|---|---|---|
| `reference/VH01_VH85_original_source_reference.md` §3.4 | Đề xuất thứ tự vô hiệu phiếu → ép phiếu → Huyết Ấn; hòa số phiếu cao nhất không treo | Đây là **đặc tả đề xuất**, không phải xác nhận ở cột trả lời V02/V03 |
| Cùng file, mục `V02 — Vote` | Câu hỏi thứ tự khi Sói Truyền Thông/Huyết Ấn/Sói Lừa Gạt cùng tác động; **“Trả lời Excel: Chưa ghi trong cột trả lời”** | Chưa được chốt tổng quát |
| Cùng file, mục `V03 — Vote` | Hỏi về hòa, phiếu không hợp lệ và người câm; **“Trả lời Excel: Chưa ghi trong cột trả lời”** | Chưa thể áp dụng rule tie/hanging tổng quát |
| `data/rules/official_merged_118.json` `VH01` | Ngưỡng 2 **phiếu hợp lệ cuối cùng** cho một điều kiện riêng | **Không** phải ngưỡng treo cổ thông thường |
| `data/character.json` `#33` | Sói Lừa Gạt ép một người bỏ phiếu theo mình, một lần/ván | Cho phép triển khai **biến đổi phiếu** trong bộ vai cô lập đã test; **không** cho phép chốt treo |
| `data/character.json` `#23` | Xạ Thủ Linh Hồn không được bỏ phiếu **sau khi chết** | Còn sống được bỏ phiếu; sau chết bị chặn, không quyết định kết quả treo |
| `data/rules/official_merged_118.json` `PH-02`, `Q13-09`; `character.json#79` | Sói Hòa Bình hủy giai đoạn biểu quyết hợp lệ | Engine có thể ghi `CANCELLED_NO_ELIMINATION`, không thể gọi đó là một lần treo cổ |
| `data/rules/tests_207.json` | Các *đặc tả* ca thao túng phiếu, tình huống liên quan #33/#91 | Là test specification cũ; **không tự chứng minh** một luật chính thức |

Sổ 118 quyết định và 207 đặc tả vẫn giữ nguyên byte. Không sửa fixture/test để chốt luật giùm người dùng.

## 2. Câu hỏi cần quyết định (có thể trả lời trong một lần)

### V02 — Nhiều hiệu ứng tranh nhau một lá phiếu

**Ví dụ:** Người A đã bỏ phiếu X; #33 điều khiển A đi theo lựa chọn Y của #33; đồng thời có hiệu ứng xóa phiếu hoặc Huyết Ấn. Kết quả **phiếu hợp lệ cuối** của A là gì?

- **Phương án V02-A (đúng thứ tự được đề xuất trong mục 3.4 của bản đặc tả):** Vô hiệu → ép phiếu → Huyết Ấn. Cần xác nhận ngữ nghĩa trong trường hợp phiếu đã bị vô hiệu rồi bị ép và cách cộng/trừ sau Huyết Ấn.
- **Phương án V02-B:** Vô hiệu phiếu là kết quả cuối, các hiệu ứng sau không khôi phục phiếu; nếu áp dụng hiệu ứng khác vào phiếu không hợp lệ thì không tính.
- **Phương án V02-C:** Kết quả theo priority khác, cần chỉ rõ thứ tự và trường hợp hòa priority.

**Đề xuất để xác nhận:** Chọn A **chỉ nếu** chủ dự án xác nhận đầy đủ thứ tự và ngữ nghĩa khôi phục phiếu; hiện tại A **chưa phải** luật đã chốt. Kết quả chọn sẽ quyết định chính sách `VoteModifierRegistry`, test nhiều hiệu ứng chung đích và tính phiếu cuối cùng.

### V03 — Cách quyết định treo cổ từ phiếu cuối

**Ví dụ:** Với ba người hợp lệ, phiếu cuối dành cho X/Y là `2/1`, `1/1`, `0/0`, hoặc một phiếu duy nhất; có một phiếu không hợp lệ, người câm hoặc người không bỏ phiếu.

| Trường hợp | Phương án 1 | Phương án 2 | Hiện trạng |
|---|---|---|---|
| X=2, Y=1 (dẫn đầu duy nhất) | Treo X ngay | Cần ngưỡng tham gia/quorum riêng | **UNRESOLVED** |
| X=1, Y=1 (hòa cao nhất) | Không treo | Biểu quyết lại/tie-break có điều kiện | **UNRESOLVED** |
| Không ai bỏ phiếu | Không treo | Quy tắc đặc biệt khác | **UNRESOLVED** |
| Chỉ một phiếu hợp lệ | Có thể treo nếu dẫn đầu duy nhất | Không treo nếu chưa đạt ngưỡng | **UNRESOLVED** |
| Phiếu người câm hoặc phiếu vô hiệu | Tính nếu được quyền | Không tính nếu quy tắc cấm | **UNRESOLVED** |
| Đổi phiếu trước khi khóa | Lấy phiếu hợp lệ cuối | Không được đổi | **UNRESOLVED** |

**Đề xuất kiểm chứng:** Thảo luận phương án “độc nhất cao nhất → treo; hòa cao nhất → không treo” vì nó xuất hiện trong đoạn đặc tả đề xuất, nhưng **không tự nhận là quyết định luật**. Cần xác nhận thêm quy tắc quorum, phiếu trắng, phiếu không hợp lệ, quyền của người câm và đổi phiếu. Không được áp ngưỡng 2 phiếu của VH01 sang treo cổ tổng quát.

### Sau khi treo — nhánh phụ thuộc vào bộ vai

Khi V02/V03 đã được chốt: chỉ bật `ELIMINATION_AUTHORIZED` cho **bộ vai đã rà soát** miễn nhiễm treo, chết thay, phản đòn, các hiệu ứng sau chết, thắng đồng thời và nhân vật ngủ đông/chờ hồi sinh. Bộ kiểm soát này vẫn fail-closed cho các bộ vai khác; không ngầm mở full competitive.

## 3. Ảnh hưởng đến Metric B và những test cần mở khóa

**Metric A = 2**, **Metric B = 0** ở Sprint 09. Với nhánh #33 bộ `[25,33,74]`, Engine đã tính **phiếu hiệu lực** theo chứng cứ `character.json#33` và khóa/replay được. Tuy nhiên, việc chọn đối tượng treo chưa có quyết định V03: không có `ELIMINATION_AUTHORIZED` và không tăng Metric B.

Khi V02/V03 được chốt, thêm test cho: (1) 3 phiếu 2–1; (2) hòa 1–1; (3) 0 phiếu; (4) một phiếu duy nhất; (5) phiếu trắng; (6) người không đủ quyền; (7) chồng nhiều modifier; (8) đổi phiếu trước/sau khóa; (9) trường hợp không ai bị loại; (10) treo thành công → hậu loại → Victory Evaluation; (11) rollback, restart, replay, idempotency, ACL; (12) multi-client Browser E2E.

**Không cần bổ sung 97 mô tả nhân vật để trả lời hai câu này.**
