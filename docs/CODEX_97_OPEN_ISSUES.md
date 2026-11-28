# Ranh giới / yêu cầu chưa kiểm chứng

1. **PostgreSQL live**: Môi trường hiện tại không có `DATABASE_URL` và không có PostgreSQL runtime. Các bài PG trong suite tổng hợp bị SKIPPED; acceptance bắt buộc nếu thiếu URL trả FAIL exit 1. Phải chạy `npm run test:pg:demo` + `npm run test:pg:03` trên Mac.
2. **Browser E2E trực tiếp localhost trên Mac M5**: Đã kiểm tra Chromium bằng Python transport bridge tới backend thật, không mock data. Cần kiểm tra `WV_E2E_DIRECT=1` trên Mac.
3. **Competitive 97 nhân vật**: vẫn NO-GO, chưa có đầy đủ Official Rule Adapters và Victory Resolver. Codex đủ 97 là UI tra cứu, không phải bảo đảm gameplay.
4. **Các tính năng chưa có API**: chat công khai/nhóm, voting đầy đủ, ranking competitive, nhiều kỹ năng 95 vai còn lại tiếp tục bị khóa theo nguồn kế thừa.
5. **Artwork**: Hình SVG gốc có mã số được phê duyệt từ prototype; chỉ mask số ở phần chân trong Codex, không đổi byte artwork. Nếu muốn loại số trong mọi bối cảnh, cần một yêu cầu riêng cho asset presentation ngoài Codex.
6. **Cài npm sạch trong sandbox không có mạng**: ZIP loại `node_modules` theo chuẩn. Đã test bằng dependency đã có; npm install hoàn toàn sạch cần kiểm tra trên Mac kết nối registry.

Không có quyết định luật nghiệp vụ mới được tạo trong Sprint này.
