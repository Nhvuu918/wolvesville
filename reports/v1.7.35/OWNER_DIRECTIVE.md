# WOLVESVILLE — v1.7.35 VISUAL INTEGRATION & FULL GAMEPLAY BREAKTHROUGH
## GRAPHICS HANDOFF INTEGRATION · PROFESSIONAL UI/UX · FULL ROLE CLOSURE · REAL PRODUCT SCREENSHOTS

**PROJECT OWNER DIRECTIVE — CONTINUE DIRECTLY FROM FULL SOURCE v1.7.34**

**ACTIVE RULESET:** `wolvesville-official-v1.3.3`

**CANDIDATE RULESET:** `wolvesville-official-v1.3.4`

# I. CHỈ THỊ CHIẾN LƯỢC CỦA CHỦ DỰ ÁN

Tôi đã đọc toàn bộ báo cáo v1.7.34.

Tôi ghi nhận:

- Shared Group Chat ACL đã được triển khai.
- REST, WebSocket, Replay và Frontend đã có đường tích hợp kỹ thuật cho chat nhóm.
- Backend Regression đạt 471 PASS, 0 FAIL, 11 SKIPPED.
- Browser Acceptance đạt 21 PASS, 0 FAIL, 61 INCOMPLETE.
- Toàn bộ chứng nhận kế thừa được bảo toàn.

Tuy nhiên:

**F VẪN BẰNG 1/97.**

R, A, B, Playable C, Atomic Coverage và Normal Gameplay đều chưa tăng.

Tôi không muốn tiếp tục phát triển theo phương pháp mỗi phiên bản chỉ bổ sung một thành phần kỹ thuật, thêm một vài bài kiểm thử nhưng sản phẩm thực tế vẫn chưa hoàn thiện.

Ngoài ra, tôi vừa bổ sung vào nguồn dữ liệu của Project một file ZIP mới do bên đồ họa gửi:

**`wolfville.zip`**

Tôi yêu cầu bạn đọc trực tiếp toàn bộ file này, phân tích, đối chiếu và tích hợp các thành phần đồ họa phù hợp vào Full Source v1.7.34.

Phiên bản v1.7.35 phải đồng thời đạt hai mục tiêu:

**TRACK A — FULL ROLE & GAMEPLAY BREAKTHROUGH.**

**TRACK B — PROFESSIONAL GRAPHICS & FRONTEND INTEGRATION.**

Không được vì tích hợp giao diện mà tiếp tục trì hoãn gameplay.

Không được vì phát triển gameplay mà bỏ qua chất lượng giao diện.

Tôi muốn nhìn thấy một sản phẩm thực tế thống nhất, có thể sử dụng, có thể chơi và có chất lượng trình bày chuyên nghiệp.

# II. SOURCE BASELINE & SOURCE AUTHORITY

Nguồn phát triển chính:

`Wolvesville_v1.7.34_Full_Role_Factory_Full_Source.zip`

Baseline SHA-256 theo báo cáo:

`2b77938cea4b53c8bb37ae46eeee62a51166134bb4e8355457222c2afa5f72d6`

Nguồn đồ họa mới:

`wolfville.zip`

SHA-256 của ZIP đồ họa:

`f2f9df3287ca3b5b3f2cba05a2ced0d642177cb3362a6e5f73cdc3e2e2fee140`

Bắt buộc xác minh lại source thực tế trước khi triển khai.

Nguyên tắc phân cấp:

1. Full Source v1.7.34 là nền tảng chính của hệ thống.
2. Official Rules ACTIVE và Owner Decisions là nguồn luật có thẩm quyền.
3. wolfville.zip là nguồn đồ họa, UI/UX, artwork, animation, âm thanh và tài liệu handoff.
4. Backend cũ bên trong wolfville.zip chỉ được sử dụng để tham khảo cách tích hợp.
5. Design Preview không phải Normal Gameplay.
6. Các chức năng demo không được ghi đè lên chức năng thực tế.

Không merge toàn bộ hai source một cách cơ học.

Không downgrade Game Engine.

Không downgrade Database Schema.

Không downgrade Official Rules.

Không khởi tạo một dự án mới tách khỏi source hiện tại.

Không tự thay đổi luật để phù hợp với giao diện đồ họa.

# III. GRAPHICS SOURCE AUDIT

Đọc trực tiếp và phân tích toàn bộ ba nhóm nguồn trong wolfville.zip.

## SOURCE A — GRAPHICS FRONTEND

`wolfville/wolvesville-main 2/`

Kiểm tra:

- index.html.
- style.css.
- app.js.
- character.json.
- assets.
- portraits.
- Hệ thống 16 themes.
- Các màn hình và chức năng hiện có.
- Animation và interaction.
- Responsive layout.
- Local state, demo state và dữ liệu giả.

Đây là nguồn tham khảo thiết kế giao diện do bên đồ họa cung cấp.

## SOURCE B — OLD INTEGRATED FRONTEND

`wolfville/Wolvesville_Sprint_07_Full_Match_Integration_Full_Source/`

Nguồn này thuộc Sprint 07, v0.9.0 và Official Rules v1.3.1.

Kiểm tra các thành phần:

- frontend/index.html.
- frontend/style.css.
- frontend/app.js.
- frontend/integration.js.
- frontend/integration.css.
- animation-dispatcher.js.
- animation-dispatcher.css.
- sfx-engine.js.
- player-ux.js.
- player-ux.css.
- codex-data.js.
- codex.css.
- assets.
- reference/approved_frontend_original.
- Các ảnh và Browser Evidence cũ.

Chỉ sử dụng những thành phần phù hợp để tích hợp vào v1.7.34.

Tuyệt đối không dùng backend Sprint 07 thay thế backend hiện tại.

## SOURCE C — GAMEPLAY FLOW HANDOFF

`wolfville/gameplay-flow-handoff/`

Đọc toàn bộ tài liệu, đặc biệt:

- 01_GAMEPLAY_STATE_DIAGRAM.md.
- 02_MATCH_LIFECYCLE_DIAGRAM.md.
- 03_DAY_NIGHT_FLOW.md.
- 04_PLAYER_ACTION_FLOW.md.
- 05_VOTING_FLOW.md.
- 06_SKILL_RESOLUTION_FLOW.md.
- 07_DEATH_ELIMINATION_FLOW.md.
- 08_ENDGAME_FLOW.md.
- 09_UI_STATE_INVENTORY.md.
- 10_SCREEN_TRANSITIONS.md.
- 11_EVENT_ANIMATION_CONTRACT.md.
- 12_AUTHORIZED_INFORMATION.md.
- 13_SPRINT07_VERIFIED_EARLY_ENDGAME.md.
- 14_SPRINT07_ANIMATION_ACL_CONTRACT.md.
- 15_SPRINT07_SCREEN_TRANSITIONS.md.
- frontend_gameplay_event_catalog.json.
- DESIGN_PREVIEW.html.

Đối chiếu toàn bộ handoff với Game Session và các event thực tế của v1.7.34.

Các trạng thái BLOCKED, PARTIAL hoặc DESIGNED ONLY trong tài liệu Sprint 07 phải được kiểm tra lại theo source hiện tại, không mặc định rằng chúng vẫn chưa được triển khai.

Không sử dụng DESIGN_PREVIEW.html làm giao diện gameplay chính.

# IV. PROFESSIONAL SOURCE MERGE STRATEGY

Tôi yêu cầu tích hợp theo phương pháp có kiểm soát.

Đối với từng component hoặc file từ nguồn đồ họa, phân loại:

- ADOPT: có thể sử dụng trực tiếp.
- ADAPT: cần điều chỉnh để tương thích hệ thống.
- MERGE: cần kết hợp với implementation hiện tại.
- REFERENCE ONLY: chỉ tham khảo.
- REJECT: không phù hợp hoặc gây regression.

Xây dựng Graphics Integration Matrix gồm:

| Thành phần đồ họa | File nguồn | Thành phần hiện tại | Phương án | API/Event phụ thuộc | Kết quả |
|---|---|---|---|---|---|

Không dừng công việc ở việc lập bảng này. Sau khi xác định phương án, phải triển khai code thực tế.

Tổ chức Frontend Integration Layer để kết nối giao diện mới với:

- Authentication API.
- Account/Profile API.
- Room API.
- Game Session API.
- Character Registry.
- Action Capabilities.
- Voting API.
- Authorized Feedback.
- Group Chat ACL.
- Realtime WebSocket.
- Replay.
- History.
- Game Results.

Giữ server là nguồn chân lý duy nhất.

Không sử dụng localStorage, mock data hoặc frontend state để quyết định:

- Vai trò được phân.
- Phe hiện tại.
- Ai được sử dụng kỹ năng.
- Ai đã chết.
- Ai bị câm.
- Ai được bảo vệ.
- Ai thắng.
- Khi nào chuyển pha.
- Kết quả soi.
- Quyền chat.

Frontend chỉ hiển thị và gửi yêu cầu theo contract mà server cung cấp.

Loại bỏ hoặc cô lập các cơ chế demo xung đột với runtime thật.

# V. VISUAL DESIGN SYSTEM

Tôi không muốn chỉ chép CSS cũ vào source mới rồi gọi đó là tích hợp đồ họa.

Hãy thực hiện với tiêu chuẩn của một đội ngũ Product Design và Frontend Engineering chuyên nghiệp.

Giữ bản sắc đồ họa Dark Fantasy và Sân Khấu Cổ Tích Đen từ nguồn đã được thiết kế.

Bảo toàn những artwork, portrait, bản đồ làng và phong cách đặc trưng có giá trị.

Chuẩn hóa hệ thống:

- Color tokens.
- Typography.
- Spacing.
- Grid system.
- Border.
- Shadow.
- Button.
- Input.
- Select.
- Checkbox.
- Modal.
- Tooltip.
- Dropdown.
- Notification.
- Player Card.
- Character Card.
- Room Card.
- Chat Box.
- Sidebar.
- Navigation.
- Loading State.
- Empty State.
- Error State.
- Disabled State.

Toàn bộ các box phải có quy chuẩn thống nhất.

Không để mỗi màn hình sử dụng một kiểu nút, một kiểu khoảng cách hoặc một kiểu kích thước khác nhau.

Không lạm dụng viền, hiệu ứng sáng, blur, gradient và animation làm giảm khả năng đọc.

Giao diện phải tạo cảm giác đây là một game hoàn chỉnh, có bản sắc riêng, không phải một website CRUD được trang trí lại.

## THEME ENGINE

Kiểm tra toàn bộ 16 theme trong nguồn đồ họa.

Phải giữ Dark Fantasy làm trải nghiệm mặc định, phù hợp bản sắc hiện có.

Tích hợp các theme bổ sung nếu tương thích và không phá vỡ nguyên tắc UX đã thống nhất.

Không dùng theme chỉ để đổi màu nền nhưng bỏ sót modal, chat, sidebar, input, button, trạng thái chết hoặc hiệu ứng ngày đêm.

Các theme phải đồng bộ xuyên suốt toàn bộ ứng dụng.

Nếu theme nào không đủ điều kiện tích hợp, ghi rõ lý do. Không tuyên bố đã hỗ trợ đầy đủ 16 theme nếu chưa được nghiệm thu.

# VI. OUT-OF-GAME EXPERIENCE

Tích hợp và hoàn thiện những màn hình ngoài ván chơi thuộc phạm vi sản phẩm hiện tại.

## 01. TITLE SCREEN & LANDING PAGE

- Giữ artwork và phong cách Sân Khấu Cổ Tích Đen.
- Thống nhất tên sản phẩm và nhận diện thương hiệu.
- CTA rõ ràng.
- Chuyển cảnh hợp lý.
- Không để hiệu ứng làm người dùng phải chờ quá lâu mới có thể thao tác.

## 02. ĐĂNG NHẬP / ĐĂNG KÝ

- Giao diện đăng nhập.
- Giao diện đăng ký.
- Xác nhận mật khẩu.
- Loading và Validation.
- Hiển thị lỗi từ server bằng tiếng Việt.
- Quản lý phiên.
- Khôi phục mật khẩu nếu backend đã hỗ trợ.

Không dùng đăng nhập giả của source đồ họa thay cho Authentication hiện tại.

Demo mode chỉ được xuất hiện trong môi trường phát triển được cấp quyền.

## 03. TRANG CHỦ VÀ SẢNH LÀNG

- Bản đồ làng.
- Marker phòng chơi.
- Danh sách phòng công khai.
- Tìm kiếm và lọc phòng.
- Thông tin số người.
- Trạng thái phòng.
- Xem trước thông tin trước khi tham gia.
- Phản hồi realtime khi phòng thay đổi.

Không tự tạo phòng giả để giao diện trông đông người.

## 04. TẠO PHÒNG / PHÒNG CHỜ

Chuẩn hóa:

- Tạo phòng.
- Nhập số lượng người chơi theo giới hạn backend.
- Số chỗ còn lại.
- Chọn chế độ chơi đã được hỗ trợ.
- Danh sách thành viên.
- Quyền quản trò.
- Chat phòng chờ.
- Cấu hình nhân vật.
- Kiểm tra điều kiện bắt đầu.
- Trạng thái Ready/Waiting/Locked.
- Nút bắt đầu ván.

Các tùy chọn số lượng người chơi hoặc cấu hình vai không được vượt qua validation của server.

Không hardcode toàn bộ phòng chơi thành 16 người.

Không cho phép người chơi bắt đầu những cấu hình không hợp lệ chỉ vì frontend có giao diện tương ứng.

## 05. BÁCH KHOA NHÂN VẬT

Tích hợp artwork, portraits và thiết kế Codex từ nguồn đồ họa.

Giữ:

- Wheel View.
- Grid View.
- Tìm kiếm nhân vật.
- Lọc theo phe và phân loại hợp lệ.
- Chi tiết kỹ năng.
- Portrait.
- Mô tả chức năng.
- Điều kiện thắng.

Bảo toàn 97 Character IDs.

Nội dung hiển thị phải lấy từ registry và mô tả luật có hiệu lực, không ghi đè bằng mô tả đã cũ từ Sprint 07.

Không nhầm trạng thái có trong Bách khoa với trạng thái đã hoàn thiện gameplay.

## 06. HỒ SƠ, THỐNG KÊ VÀ LỊCH SỬ

Tích hợp các màn hình được hỗ trợ bởi source hiện tại:

- Hồ sơ cá nhân.
- Lịch sử ván.
- Thống kê.
- Danh hiệu.
- Bạn bè.
- Quan hệ người chơi.
- Replay.

Nếu backend chưa hỗ trợ đầy đủ, hiển thị trạng thái trung thực hoặc giữ chức năng chưa mở.

Không tạo tỷ lệ thắng, danh hiệu, lịch sử hoặc dữ liệu người chơi giả làm dữ liệu thật.

# VII. IN-GAME EXPERIENCE — ROOM PLAYING DESIGN

Tôi yêu cầu đặc biệt chú trọng giao diện bên trong room chơi.

Đây là trung tâm trải nghiệm của Wolvesville.

Không sử dụng giao diện quản trị kỹ thuật, debug panel hoặc QA controls làm giao diện người chơi thông thường.

## 01. GAME HUD

Tổ chức rõ ràng:

- Giai đoạn hiện tại.
- Đêm/Ngày thứ bao nhiêu.
- Thời gian còn lại.
- Danh sách người chơi.
- Trạng thái sống/chết công khai.
- Khu vực kỹ năng.
- Khu vực chat.
- Khu vực thông báo.
- Khu vực bỏ phiếu.
- Nút và trạng thái chờ hành động.
- Reconnect indicator.

Ưu tiên thông tin quan trọng nhất trong mỗi giai đoạn.

Không để người chơi phải cuộn qua nhiều màn hình mới tìm được nút sử dụng kỹ năng.

## 02. PRIVATE ROLE REVEAL

Tích hợp hiệu ứng lật thẻ hoặc reveal nhân vật từ source đồ họa.

Hiển thị:

- Portrait của bản thân.
- Tên nhân vật.
- Phe của bản thân nếu được quyền biết.
- Kỹ năng hiện tại.
- Điều kiện thắng.
- Tài nguyên được phép biết.

Chỉ hiển thị vai trò từ authorized self projection.

Không nhận toàn bộ role assignment của phòng về client rồi dùng CSS để ẩn.

## 03. NIGHT GAMEPLAY

Tích hợp không gian ban đêm.

Thiết kế rõ:

- Kỹ năng có thể sử dụng.
- Mục tiêu hợp lệ.
- Số lượt còn lại.
- Chọn và xác nhận mục tiêu.
- Hủy hoặc thay đổi lựa chọn nếu luật cho phép.
- Đã nộp hành động.
- Đang chờ người khác.
- Chờ phân giải.
- Kỹ năng bị khóa.
- Hết lượt.
- Kết quả riêng tư.

Các nút kỹ năng phải lấy từ Action Capabilities thực tế.

Không hardcode riêng nút theo từng Character ID nếu có thể dùng component và contract chung.

## 04. DAY GAMEPLAY

Tích hợp:

- Chuyển cảnh bình minh.
- Thông báo diễn biến ban đêm.
- Chat thảo luận.
- Kỹ năng ban ngày.
- Thời gian thảo luận.
- Bỏ phiếu.
- Trạng thái phiếu.
- Kết quả xử lý được phép công bố.

Không tự tiết lộ vai trò hoặc nguyên nhân chết.

Thông tin công khai và thông tin riêng phải có cách trình bày khác nhau rõ ràng.

## 05. GROUP CHAT EXPERIENCE

Tích hợp Shared Group Chat ACL v1.7.34 vào giao diện mới.

Không làm mất implementation trong frontend/integration.js.

Giao diện phải phân biệt:

- Chat chung.
- Chat nhóm được cấp quyền.
- Chat chức năng.
- Chat ẩn danh theo kỹ năng nếu được hỗ trợ.
- Thông báo hệ thống.
- Kết quả kỹ năng riêng tư.

Chỉ hiển thị tab nhóm khi server cấp quyền hợp lệ.

Người bị câm chỉ bị hạn chế đúng quyền theo luật.

Không tự cho phép người chơi tạo nhóm hoặc DM trong ván.

Không để lộ nhóm bí mật thông qua số lượng tab, unread count, notification, DOM hoặc WebSocket payload cho người ngoài nhóm.

## 06. VOTE & ELIMINATION

Tích hợp giao diện bỏ phiếu theo luật hiện hành.

Phải phân biệt:

- Đã mở vote.
- Chưa bỏ phiếu.
- Đã ghi nhận phiếu.
- Chờ phân giải.
- Vote bị hủy.
- Kết quả vote hợp lệ.
- Người bị loại.

Không tự tính final vote hoặc chọn người bị treo cổ từ frontend.

Không sử dụng animation như một cơ chế quyết định kết quả.

## 07. ENDGAME & REPLAY

Tích hợp màn hình kết thúc ván từ kết quả thực tế của Game Engine.

Hiển thị đúng:

- Thắng.
- Thua.
- Đồng thắng.
- Ván bị hủy hoặc chưa hoàn tất.
- Phe thắng.
- Danh sách người thắng theo quyền.
- Thống kê hợp lệ.
- Lịch sử và Replay.
- Quay lại sảnh.

Không tạo banner chiến thắng khi engine chưa commit kết quả.

# VIII. ANIMATION & SOUND INTEGRATION

Đọc và tích hợp animation-dispatcher và sfx-engine từ nguồn đồ họa nếu tương thích.

Xây dựng Event-to-Animation Mapping dựa trên event thật của v1.7.34 trở lên.

Ví dụ:

- ROLE_ASSIGNED → Private Role Reveal.
- PHASE_CHANGED → Day/Night Transition.
- ACTION_ACCEPTED → Pending Feedback.
- ROLE_OBSERVED → Private Investigation Result.
- VOTING_OPENED → Voting Interface.
- VOTING_CANCELLED → Vote Cancellation.
- PLAYER_ELIMINATED → Authorized Elimination Effect.
- MATCH_COMPLETED → Endgame Presentation.

Tên event và payload phải được đối chiếu với implementation hiện hành; không tự giả định các event cũ vẫn tồn tại nguyên trạng.

Yêu cầu:

- Animation không làm thay đổi GameState.
- Không sử dụng timer frontend để chuyển pha.
- Không phát animation kết quả trước khi server commit.
- Không hiện chữ theo kiểu typewriter làm chậm việc đọc thông tin.
- Văn bản quan trọng xuất hiện đầy đủ ngay lập tức.
- Không chạy lại toàn bộ animation cũ khi reconnect.
- Chống phát trùng event.
- Xử lý revision và event ordering.
- Có Reduced Motion.
- Có tùy chọn tắt âm thanh.
- Có điều chỉnh âm lượng nếu tích hợp âm thanh.
- Animation không che hoặc khóa thao tác quan trọng không cần thiết.

Hiệu ứng phải phục vụ trải nghiệm chơi, không phải chỉ để trình diễn.

# IX. RESPONSIVE DESIGN & ACCESSIBILITY

Bắt buộc kiểm tra giao diện ở tối thiểu:

- Desktop: 1920 × 1080.
- Laptop: 1366 × 768.
- Tablet: 768 × 1024.
- Mobile: 390 × 844.

Yêu cầu:

- Không tràn ngang ngoài các vùng cuộn được thiết kế chủ đích.
- Không chồng lấn button.
- Không mất nội dung modal.
- Không che khu vực chat.
- Không mất nút kỹ năng.
- Không bị sidebar chiếm quá nhiều diện tích.
- Không có chữ quá nhỏ.
- Không có khoảng trống vô lý.
- Các danh sách dài có scroll phù hợp.
- Hỗ trợ bàn phím và focus state.
- Phân biệt trạng thái bằng nhiều tín hiệu, không chỉ dựa vào màu sắc.
- Kiểm tra font tiếng Việt.
- Kiểm tra contrast.
- Giữ thao tác quan trọng thuận tiện trên mobile.

Không chỉ nghiệm thu Desktop.

# X. TRACK A — FULL ROLE BREAKTHROUGH

Tích hợp đồ họa không thay thế cho yêu cầu hoàn thiện gameplay.

Baseline:

- F = 1.
- R = 52.
- A = 49.
- B = 37.
- QA C = 2.
- Playable C = 7.
- Atomic Coverage = 79/108.
- Normal Gameplay = 12.

Tôi yêu cầu tiếp tục đóng blocker của v1.7.34.

## PRIMARY — #84 PHÙ THỦY CÂM

Hoàn thiện:

- 84-03.
- 84-05.
- 84-06.
- 84-07.

Tập trung xử lý nguyên nhân gốc: Group Chat ACL đã tồn tại nhưng chưa có luồng cấp quyền từ gameplay tuyển mộ thật của #90.

Thực hiện kiểm tra và triển khai resolver tuyển mộ của #90 Giáo Chủ theo luật hiện hành VH57/VH59/VH78.

Khi tuyển mộ hợp lệ:

- Engine xác nhận kết quả.
- Cấp membership đúng đối tượng.
- Mở quyền chat giáo phái đúng pha.
- Người bị câm vẫn được chat nhóm nếu có quyền.
- Người ngoài nhóm không nhận nội dung.
- Reconnect khôi phục quyền chính xác.
- Replay giữ đúng phạm vi thông tin.

Không sử dụng trusted fixture membership làm bằng chứng gameplay hoàn chỉnh.

Không yêu cầu tôi chốt lại những luật đã được xác nhận.

Đồng thời kiểm tra tương tác câm với khóa kỹ năng, chết trước phân giải, hồi sinh và những nhóm chức năng liên quan.

Đóng toàn bộ nghĩa vụ của FULL Contract, không chỉ một nhánh chat.

## SECONDARY — #79 SÓI HÒA BÌNH

Tiếp tục giải quyết:

- 79-02: PH-02 và đa kỹ năng ban ngày.
- 79-03: phạm vi nhận thông tin của bầy Sói.
- 79-04: Q13-09, Kẻ Chết Thay và Oscar của #6.

Triển khai phần Q13-09 đã có quyết định.

Không tự kích hoạt DC-PACK-PRIVACY-BOUNDARY khi còn PENDING.

Nếu một blocker thực sự phụ thuộc quyết định Owner chưa có, tiếp tục triển khai các phần không phụ thuộc và lựa chọn ứng viên FULL thay thế.

## INVESTIGATION CLUSTER — #25 VÀ #74

Hoàn thiện Shared Investigation Resolver.

Kiểm tra:

- Phản chiếu #35.
- Chuyển vai #3.
- Nhiễu hào quang.
- Giả danh #57.
- Biến đổi #18.
- Kết quả soi sai.
- Quyền nhận kết quả.
- Các tương tác được yêu cầu trong FULL Contract.

Không đánh đồng Tiên Tri và Tiên Tri Huyền Bí.

Tận dụng một lần hoàn thiện shared mechanics để mở khóa nhiều nhân vật.

## FULL EXECUTION TARGET

- Minimum breakthrough: F ≥ 2.
- Main target: F ≥ 3.
- Stretch target: F ≥ 5.

Không dừng ngay khi đạt F = 2 nếu vẫn còn khả năng hoàn thiện tiếp.

Không thay đổi tiêu chuẩn FULL để đạt mục tiêu.

Không tự cấp chứng nhận giả.

Không dùng fixture, mock hoặc forced scenario thay cho nghĩa vụ Normal Gameplay.

# XI. REAL PRODUCT EXPERIENCE ACCEPTANCE

Tôi yêu cầu nghiệm thu xuyên suốt một luồng người dùng thực tế trên giao diện đã tích hợp.

Chạy hệ thống hoàn chỉnh với backend hiện tại.

Thực hiện:

1. Mở trang chủ.
2. Đăng nhập hoặc đăng ký theo chế độ được hỗ trợ.
3. Vào sảnh làng.
4. Tạo phòng.
5. Người chơi khác tham gia.
6. Cấu hình phòng và nhân vật.
7. Bắt đầu ván.
8. Server phân vai.
9. Hiện thẻ nhân vật riêng.
10. Thực hiện kỹ năng ban đêm.
11. Phân giải hành động.
12. Chuyển sang ban ngày.
13. Chat và sử dụng kỹ năng.
14. Bỏ phiếu.
15. Phân giải chết hoặc sự kiện hợp lệ.
16. Tiếp tục chu kỳ chơi.
17. Kết thúc ván bằng điều kiện thắng hợp lệ.
18. Xem kết quả và Replay.
19. Quay lại sảnh.

Chọn ít nhất một Normal Gameplay deck đã được chứng minh và một deck phục vụ FULL Role mới nếu triển khai thành công.

Đối với luồng chưa được hỗ trợ, ghi rõ giới hạn.

Không dựng một chuỗi hình ảnh giả để mô phỏng việc toàn bộ luồng đã hoạt động.

Kiểm thử bằng nhiều browser contexts độc lập tương ứng nhiều tài khoản.

Kiểm tra disconnect/reconnect trong ván.

# XII. BẮT BUỘC GỬI HÌNH ẢNH THỰC TẾ

**ĐÂY LÀ YÊU CẦU NGHIỆM THU BẮT BUỘC CỦA CHỦ DỰ ÁN.**

Sau khi hoàn thành tích hợp, tôi yêu cầu chạy source thật và chụp ảnh trực tiếp từ website đang vận hành.

Sử dụng Chromium, Playwright hoặc công cụ browser phù hợp.

Không sử dụng AI-generated mockup.

Không sử dụng ảnh thiết kế giả lập.

Không lấy ảnh cũ trong wolfville.zip làm bằng chứng cho v1.7.35.

Không chụp DESIGN_PREVIEW.html rồi báo cáo đó là giao diện đã tích hợp.

Tôi muốn nhìn thấy chính xác sản phẩm sẽ xuất hiện như thế nào khi tôi tải Full Source về và chạy.

## A. OUT-OF-GAME SCREENSHOTS

Bắt buộc có ảnh nếu màn hình đã được hỗ trợ:

1. Title Screen.
2. Landing Page.
3. Đăng nhập.
4. Đăng ký.
5. Trang chủ.
6. Bản đồ làng và danh sách phòng.
7. Tạo phòng.
8. Phòng chờ.
9. Cấu hình nhân vật.
10. Bách khoa dạng Wheel.
11. Bách khoa dạng Grid.
12. Chi tiết một nhân vật.
13. Hồ sơ hoặc lịch sử ván thực tế.

## B. IN-GAME SCREENSHOTS

1. Role Reveal.
2. Giao diện Đêm.
3. Chọn mục tiêu kỹ năng.
4. Trạng thái đã nộp hành động.
5. Kết quả kỹ năng riêng.
6. Giao diện ban ngày.
7. Chat công khai.
8. Chat nhóm hợp lệ.
9. Người bị câm và trạng thái quyền tương ứng.
10. Giao diện bỏ phiếu.
11. Kết quả loại người chơi.
12. Màn hình thắng/thua.
13. Replay.
14. Reconnect.

Nếu chưa có gameplay thật cho một trạng thái, ghi rõ NOT AVAILABLE và blocker tương ứng.

Không sử dụng fixture để chứng minh Normal Gameplay. Nếu chụp fixture nhằm chứng minh riêng kỹ thuật ACL, phải ghi rõ phạm vi ảnh.

## C. RESPONSIVE SCREENSHOTS

Cung cấp ảnh:

- Desktop.
- Laptop.
- Tablet.
- Mobile.

Ít nhất chụp sảnh làng, phòng chờ và giao diện trong ván trên các kích thước màn hình bắt buộc.

## D. THEME PREVIEW

Chụp ảnh thực tế các theme đã tích hợp.

Tạo contact sheet hoặc bảng so sánh trực quan để tôi đánh giá các theme.

Không cần tạo mockup thiết bị hoặc khung điện thoại trang trí; tôi cần xem rõ giao diện thật.

## E. BEFORE / AFTER COMPARISON

Nếu có thể chạy cả source v1.7.34 và v1.7.35, hãy cung cấp ảnh so sánh:

- Lobby.
- Phòng chờ.
- Character Codex.
- Game HUD.
- Night Action.
- Day Chat.
- Voting.

Chụp ở cùng viewport và trạng thái tương đương để đánh giá sự cải thiện.

## F. SCREENSHOT EVIDENCE PACK

Lưu ảnh PNG nguyên bản tại:

`reports/v1.7.35/screenshots/`

Tổ chức thành:

- 01-landing-auth.
- 02-lobby.
- 03-room.
- 04-codex.
- 05-night-gameplay.
- 06-day-gameplay.
- 07-chat.
- 08-voting.
- 09-endgame.
- 10-replay.
- 11-responsive.
- 12-themes.
- 13-before-after.

Mỗi ảnh cần có thông tin trong manifest:

- Tên màn hình.
- File ảnh.
- Viewport.
- Source fingerprint.
- Ruleset.
- Chế độ Normal Gameplay hoặc QA.
- Scenario.
- Người xem có quyền tương ứng.
- Kết quả thực tế.

Không để lộ password, token, thông tin tài khoản thật, RNG seed hoặc dữ liệu bí mật ngoài quyền trong ảnh.

Tạo thêm:

`VISUAL_ACCEPTANCE_REPORT.html`

Đây là gallery tổng hợp ảnh chụp website thật, có chú thích để tôi xem và đánh giá từng màn hình.

**BẮT BUỘC ĐÍNH KÈM TRỰC TIẾP NHỮNG HÌNH ẢNH QUAN TRỌNG NHẤT TRONG CÂU TRẢ LỜI CUỐI.**

Ưu tiên hiển thị Title Screen, Lobby, Room, Codex, Night, Day, Voting và Endgame nếu đã hoạt động.

Không chỉ lưu ảnh trong ZIP rồi yêu cầu tôi tự giải nén để xem.

Bàn giao riêng Screenshot Pack để tôi có thể tải toàn bộ ảnh.

# XIII. PRIVACY, SECURITY & SOURCE INTEGRITY

Bảo toàn toàn bộ ranh giới bảo mật đã xây dựng.

Kiểm tra:

- Không lộ vai người khác qua HTML/DOM.
- Không lộ phe bí mật qua CSS class hoặc data attribute.
- Không lộ thông tin nhóm qua WebSocket.
- Không lộ kết quả trước khi commit.
- Không lộ hidden state qua animation.
- Không gửi raw internal Event Log cho client.
- Không mở debug controls ở Normal Gameplay.
- Không tự cho phép DM.
- Không dùng demo auth thay thế auth thật.
- Không đưa secrets vào frontend.
- Không làm suy giảm Replay ACL.

Kiểm tra SVG, HTML, JavaScript và các dependency được nhập từ source đồ họa.

Không sao chép file runtime database, SQLite WAL/SHM, thư mục __MACOSX, .DS_Store, dist cũ, secrets hoặc build cache từ wolfville.zip.

Bảo toàn:

- 97 Character IDs.
- 118 Historical Decisions.
- 207 Legacy Specifications.
- 18 Owner Choices hiện có.
- Official Rules.
- FULL #28.
- 2 QA C Certificates.
- 7 Playable C Certificates.
- 79 Atomic Certificates.

Không downgrade hoặc ghi đè chứng nhận.

# XIV. TESTING & VISUAL REGRESSION

Sau khi tích hợp, chạy:

- Source Verification.
- TypeScript Build.
- Rules Build.
- Monolithic Backend Regression.
- Existing Browser Regression.
- Required Browser Acceptance.
- Frontend Integration Tests.
- Group Chat Tests.
- Privacy Tests.
- Responsive Tests.
- Animation Tests.
- Reconnect Tests.
- Replay Tests.
- Certificate Revalidation.
- Visual Regression.

Cần kiểm tra thực tế:

- Console errors.
- Failed API requests.
- Missing assets.
- Broken portrait.
- Broken navigation.
- Duplicate event.
- Duplicate animation.
- Layout overflow.
- Invalid action submission.
- UI state không đồng bộ server.
- Rò rỉ thông tin.
- Regression trên các gameplay deck cũ.

Không thay đổi test assertions chỉ để thích nghi với lỗi mới.

Nếu selector cần cập nhật do cấu trúc UI thay đổi, phải bảo toàn ý nghĩa nghiệm thu.

Các browser suite chưa chạy phải giữ INCOMPLETE.

Human QA chưa được tôi thực hiện phải giữ PENDING.

PostgreSQL Acceptance chưa chạy thật phải giữ PENDING hoặc SKIPPED đúng thực tế.

Ảnh chụp đẹp không thay thế Functional Acceptance.

# XV. RELEASE SCORECARD

Báo cáo đầy đủ:

| Metric | v1.7.34 | v1.7.35 | Delta | Evidence |
|---|---|---|---|---|
| F | 1 | | | |
| R | 52 | | | |
| A | 49 | | | |
| B | 37 | | | |
| QA C | 2 | | | |
| Playable C | 7 | | | |
| Atomic | 79/108 | | | |
| Normal Gameplay | 12 | | | |
| Backend PASS | 471 | | | |
| Browser PASS | 21 | | | |
| Browser INCOMPLETE | 61 | | | |
| Privacy Release Gate | PARTIAL | | | |
| PostgreSQL | PENDING | | | |
| Human QA | PENDING | | | |

Bổ sung riêng:

**VISUAL INTEGRATION SCORECARD**

- Graphics components được tích hợp.
- Số màn hình kết nối backend thật.
- Số màn hình còn thiếu.
- Theme đã tích hợp.
- Theme đã nghiệm thu.
- Animation đã tích hợp.
- Animation được xác minh bằng event thật.
- Responsive Acceptance.
- Visual Regression.
- Console errors.
- Missing assets.
- Broken UI flows.
- Screenshot Evidence.
- UI/UX blockers.

Không tạo tỷ lệ phần trăm hoàn thiện nếu không có mẫu số và tiêu chí xác định.

Phân biệt rõ:

- IMPLEMENTED.
- INTEGRATED.
- VERIFIED.
- PARTIAL.
- BLOCKED.
- NOT STARTED.

# XVI. FULL SOURCE DELIVERY

Bàn giao:

`Wolvesville_v1.7.35_Visual_Integration_Full_Gameplay_Breakthrough_Full_Source.zip`

Đây phải là một source thống nhất, không phải hai dự án nằm cạnh nhau.

Bao gồm toàn bộ:

- Frontend đã tích hợp đồ họa.
- Backend hiện tại.
- Game Engine.
- Game Session.
- Shared Resolvers.
- Character Registry.
- Official Rules.
- Graphics Assets.
- Themes.
- Animation.
- Sound Engine.
- Group Chat ACL.
- Replay.
- Tests.
- Completion Contracts.
- Certificates.
- Database Migrations.
- Visual Acceptance Report.
- Human QA Pack.
- Graphics Integration Matrix.
- Changelog.
- README Mac Apple Silicon.

Bàn giao riêng:

`Wolvesville_v1.7.35_Actual_Product_Screenshots.zip`

Và:

`Wolvesville_v1.7.35_Visual_Acceptance_Report.html`

Xác minh:

- ZIP CRC.
- SHA-256.
- Clean Extraction.
- Source Integrity.
- Build.
- Regression.
- Certificate Integrity.
- Visual Evidence.

Không chứa runtime database, node_modules, secrets hoặc .env thật.

README phải có hướng dẫn chạy dự án trên Mac Apple Silicon, cấu hình môi trường, cổng truy cập, cách mở game, tạo phòng, đổi theme và xem các tính năng mới.

# XVII. QUYỀN CHỦ ĐỘNG VÀ TIÊU CHUẨN THỰC THI

Tôi cho phép bạn chủ động đưa ra quyết định kỹ thuật và quyết định UI/UX hợp lý để tích hợp hai nguồn chuyên nghiệp hơn.

Bạn được phép:

- Refactor frontend.
- Tổ chức lại CSS.
- Chuẩn hóa component.
- Xây dựng design tokens.
- Tạo integration adapter.
- Tối ưu layout.
- Tối ưu performance.
- Điều chỉnh animation.
- Cải thiện trải nghiệm mobile.
- Loại bỏ mock logic xung đột.
- Refactor shared resolver khi cần thiết.

Không được tự thay đổi:

- Luật nhân vật.
- Điều kiện thắng.
- Quyền nhận thông tin.
- Owner Decisions.
- Tiêu chuẩn FULL.
- Định nghĩa metrics.
- Phạm vi gameplay đã được chốt.

Không yêu cầu tôi quyết định từng chi tiết màu sắc, padding, border hoặc kích thước box nếu có thể xử lý theo design system và nguồn đã duyệt.

Những thay đổi lớn về bản sắc đồ họa hoặc hành vi gameplay cần được ghi rõ.

# XVIII. MỆNH LỆNH CUỐI CÙNG

Tôi không muốn nhận thêm một phiên bản chỉ tăng số lượng test nhưng F vẫn bằng 1.

Tôi cũng không muốn nhận một giao diện đẹp nhưng không kết nối với gameplay thật.

Tôi muốn Wolvesville phát triển thành một sản phẩm hoàn chỉnh, chuyên nghiệp, thống nhất từ:

**ĐĂNG NHẬP → SẢNH LÀNG → PHÒNG CHỜ → PHÂN VAI → ĐÊM → NGÀY → BỎ PHIẾU → KẾT THÚC → REPLAY.**

Hãy sử dụng Full Source v1.7.34 làm nền tảng chính.

Đọc toàn bộ wolfville.zip.

Tích hợp các thành phần đồ họa phù hợp.

Giữ nguyên nền tảng kỹ thuật hiện có.

Đóng các Shared Dependency thực tế.

Hoàn thiện FULL Contracts.

Tăng F bằng chứng nhận hợp lệ.

Chạy hệ thống thật.

Chụp ảnh màn hình thật.

Gửi trực tiếp hình ảnh sản phẩm cho tôi đánh giá.

Bàn giao Full Source hoàn chỉnh.

**KHÔNG CHỈ PHÂN TÍCH.**

**KHÔNG CHỈ ĐƯA RA KẾ HOẠCH.**

**KHÔNG CHỈ TẠO MOCKUP.**

**KHÔNG CHỈ TẠO QA DECK.**

**AUDIT → MERGE → IMPLEMENT → PLAY → TEST → CERTIFY → SCREENSHOT → DELIVER.**