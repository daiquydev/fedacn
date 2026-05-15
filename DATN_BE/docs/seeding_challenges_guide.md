# Hướng dẫn tạo dữ liệu mẫu cho Thử thách (Challenges Seeding Guide)

Tài liệu này ghi lại quy trình và các quy tắc chuẩn để tạo dữ liệu mẫu cho hệ thống thử thách, đảm bảo dữ liệu hiển thị đẹp, thực tế và không bị lỗi làm tròn trên UI.

## 1. Danh sách người dùng mục tiêu (Target Users)
Khi seeding dữ liệu cho các kịch bản demo/kiểm thử, luôn ưu tiên thực hiện cho nhóm 14 tài khoản sau:
- `phangiabao10@gmail.com`
- `dominhnhat09@gmail.com`
- `vukhanhly08@gmail.com`
- `buithanhlong07@gmail.com`
- `dangtuankiet06@gmail.com`
- `hoanggiahan05@gmail.com`
- `phamquocdung04@gmail.com`
- `leminhchau03@gmail.com`
- `tranthibinh02@gmail.com`
- `nguyenvanan01@gmail.com`
- `quy.tranquil@hcmut.edu.vn`
- `quy.tranquil@gmail.com`
- `user2@gmail.com`
- `user1@gmail.com`

## 2. Quy trình Seeding chuẩn
1.  **Đăng ký tham gia (Auto-Join)**:
    - Phải đảm bảo tất cả 14 người dùng trên đều có bản ghi trong `challenge_participants` cho mỗi thử thách.
    - **Quan trọng**: Sau khi thêm người tham gia, phải cập nhật trường `participants_count` trong document của `Challenge` để UI hiển thị đúng số lượng người.
2.  **Tạo tiến độ hàng ngày (Daily Progress)**:
    - Thực hiện ghi nhận từ ngày bắt đầu thử thách (`start_date`) đến ngày hiện tại.
    - Mỗi ngày nên có từ 1-2 hoạt động để dữ liệu trông tự nhiên.
    - Đảm bảo tổng thành tích các hoạt động trong ngày $\ge$ mục tiêu hàng ngày của thử thách.

## 3. Quy tắc theo loại thử thách
### A. Thử thách ngoài trời (Outdoor Activity)
- **Bản đồ**: Sử dụng dữ liệu từ `master_route_thong_nhat.json`. Tuyệt đối không vẽ đường chim bay xuyên tòa nhà.
- **Tọa độ**: Nội suy các điểm dọc theo cung đường thực tế dựa trên quãng đường cần chạy.
- **Tính toán**: Sử dụng `config` vận tốc trung bình và calo/km tương ứng với từng loại (Chạy bộ, Đạp xe, Đi bộ).
- **Liên kết**: Mỗi bản ghi `ChallengeProgress` phải đi kèm một bản ghi `ActivityTracking` có `gpsRoute`.

### B. Thử thách dinh dưỡng (Nutrition)
- **Hoạt động**: Log 3 bữa ăn (Sáng, Trưa, Tối) mỗi ngày.
- **Minh chứng**: Sử dụng URL ảnh món ăn thực tế từ Cloudinary. Đặt trạng thái `ai_review_valid: true`.

### C. Thử thách thể hình (Fitness/Strength)
- **Hoạt động**: Log các buổi tập workout.
- **Chi tiết**: Hoàn thành đầy đủ danh sách bài tập (`completed_exercises`) được định nghĩa trong thử thách.

## 4. Quy tắc làm tròn số (Rounding Rules)
Để tránh lỗi hiển thị số lẻ dài (vd: `9.120000000000001`) trên UI:
- Tất cả các trường số (`value`, `distance`, `calories`, `duration_minutes`) phải được làm tròn trước khi lưu.
- Công thức chuẩn: `Number(value.toFixed(2))`
- Áp dụng cho cả bảng `ChallengeProgress`, `ActivityTracking` và khi cập nhật `current_value` trong `ChallengeParticipant`.

## 5. Script tham chiếu
File script hoàn chỉnh nhất hiện tại: `src/scripts/seedAllChallengesForTargetUsers.ts`.
