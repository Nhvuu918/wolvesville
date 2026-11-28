# Giới hạn và Sprint tiếp theo

1. **PostgreSQL trực tiếp trên Mac:** 5 test trong workspace hiện tại SKIPPED; chạy test bắt buộc và browser native trước khi công bố release PASS toàn phần.
2. **Competitive & Victory Resolver:** chưa có cơ sở thực thi và test cho toàn bộ 97 vai; không bật.
3. **Official Skill Pack:** hai vai #25/#74 trong cấu hình thử nghiệm hai người. Không mở vai khác chỉ vì Codex có thể xem 97 vai.
4. **Lịch sử trận độc lập / bảng xếp hạng:** backend chưa có thống kê công khai đầy đủ. Navigation đã ẩn, không hiện mock data.
5. **Chat / vote / bot AI:** chưa hoàn thành; sân khấu hiển thị thông điệp trung thực, không gửi tin nhắn giả.
6. **Live lobby events:** backend 02A chỉ gửi room updates cho thành viên đăng ký; hiện đã có polling phòng trên màn sảnh. Khi backend hỗ trợ lobby broadcast có thể thay polling.
7. **Thông tin account/session:** sử dụng sessionStorage trong tab, refresh giữ phiên, đóng tab mới sẽ yêu cầu đăng nhập trở lại nếu không còn sessionStorage. Không tự thay thành lưu token lâu dài.
8. **Khả năng truy cập:** đã kiểm thử responsive/phím Bách khoa/reduced motion; chưa kiểm toán đầy đủ keyboard flow cho mọi modal.
9. **Vấn đề luật:** giữ nguyên các blockers trong `docs/SPRINT03_FEATURE_STATUS_AND_RULE_GAPS.md`, không tự suy ra kết quả.
10. **Bảo toàn UX:** tiếp tục cải thiện loading và skeleton trong khu vực có thao tác, không thay artwork, Wheel/Grid hoặc dữ liệu 97 vai.

Đề xuất sau khi hoàn tất kiểm thử trên Mac: (1) close PostgreSQL acceptance; (2) kiểm chứng native Browser E2E; (3) chọn module gameplay có luật READY và test, không tạo vòng hỏi luật mới; (4) bổ sung chat/vote chỉ khi luật và ACL hoàn chỉnh.
