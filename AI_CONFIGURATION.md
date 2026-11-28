# Người Giữ Luật — AI cấu hình

SOURCE_LOOKUP vẫn hoạt động không cần API key. Có adapter OpenAI-compatible ở backend; không phải đã nghiệm thu provider live. Effective Knowledge Index và xử lý superseded đầy đủ còn thiếu, không dùng trả lời AI làm nguồn luật chính thức.

Trong shell local riêng hoặc Railway app Variables (không đưa vào frontend):
- WV_AI_ENABLED=1
- WV_AI_MODEL: tên model hợp lệ của provider
- WV_AI_API_KEY: secret riêng, tuyệt đối không gửi qua chat hoặc GitHub
- WV_AI_BASE_URL=https://api.openai.com/v1 hoặc base URL HTTPS tương thích thực sự

Restart app; kiểm tra câu hỏi luật có căn cứ, timeout, lỗi credentials và fallback. Không nhập hidden role, private game data, password hoặc token vào câu hỏi. Không đưa raw GameState vào context. Kiểm tra quota/rate limit và chi phí provider trước khi bật công khai. Live provider, evaluation superseded/prompt injection và giới hạn chi phí đầy đủ vẫn PENDING.
