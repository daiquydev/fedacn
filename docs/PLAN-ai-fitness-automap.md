# Project Plan: AI Fitness Challenge Auto-Map

## 1. Context & Objective
Mục tiêu là cập nhật logic "AI tự điền thử thách" trong giao diện tạo Thử thách (`CreateChallengeModal.jsx`) cho loại hình **Thể dục** (Fitness). 
Thay vì AI sinh ra `goal_value` (tổng kcal) vô nghĩa và không tương thích với UI (bắt buộc chọn bài tập thực tế), AI sẽ sinh ra một mảng gợi ý tên các bài tập `suggested_exercises`. Giao diện sau đó sẽ tự động dò tìm các bài tập này trong cơ sở dữ liệu (`allExercises`) và điền tự động vào danh sách `selectedExercises` cho người dùng.

## 2. Các thay đổi chính

### 2.1. Cập nhật `buildAIPrompt`
- Đổi rule trong prompt AI của nhánh `'fitness'`.
- Thay vì trả về `goal_value`, yêu cầu AI trả về một mảng `suggested_exercises` chứa tên tiếng Việt của 2-4 bài tập phù hợp với mô tả.
- Lược bỏ trường `goal_value` trong cấu trúc JSON mẫu của fitness.

### 2.2. Xử lý logic tại `handleAIFill`
- Sau khi parse dữ liệu AI gửi về (JSON).
- Nếu `aiType === 'fitness'` và có mảng `parsed.suggested_exercises`:
  - Reset `selectedExercises` cũ (tùy chọn).
  - Lặp qua từng tên bài tập do AI gợi ý.
  - Sử dụng chuỗi tìm kiếm (chuyển sang chữ thường, loại bỏ dấu nếu cần) để dò trong mảng `allExercises` (so sánh với `name` hoặc `name_vi`).
  - Nếu tìm thấy bài tập match (Lấy kết quả đầu tiên match):
    - Khởi tạo object bài tập theo đúng format thêm vào mảng.
    - Cập nhật state `setSelectedExercises`.
- Bổ sung thông báo Toast nhỏ (ví dụ: *AI đã tìm thấy X/Y bài tập phù hợp*).

## 3. Socratic Gate (Edge Cases cần xác nhận)
Trước khi bắt đầu code, cần người dùng xác nhận các luồng xử lý ngoại lệ sau:
1. **Xử lý khi không tìm thấy (No match found):** Nếu AI gợi ý "Yoga bay" nhưng trong DB không có bài tập nào tương tự, ta có thể đơn giản tiến hành bỏ qua (ignore) và thông báo lên Toast: "Không tìm thấy một số bài tập AI gợi ý". Bạn có đồng ý với cách skip này không?
2. **Xóa hay Giữ bài tập cũ:** Khi bấm "AI điền ngay", nếu user đã lỡ tay auto-fill hoặc chọn tay 1-2 bài trước đó, ta nên **XÓA TRẮNG** (`selectedExercises = []`) rồi mới add bài AI gợi ý vào, hay **CỘNG DỒN**? Đề xuất: XÓA TRẮNG để đảm bảo challenge nhất quán.

## 4. Verification Checklist (Tiêu chí nghiệm thu)
- [ ] Mở modal, chọn type "Thể dục"
- [ ] Bật AI, ghi mô tả "Tôi muốn tạo một thử thách tập cơ ngực và bụng trong 30 ngày, mỗi ngày 3 bài tập".
- [ ] Nhấn Điền, chờ AI phản hồi.
- [ ] Giao diện tự động thêm 2-3 bài tập (ví dụ Plank, Gập bụng, Trào ngược...) vào danh sách đã chọn.
- [ ] Người dùng bấm "Tạo thử thách" trực tiếp mà không bị báo lỗi "Vui lòng chọn ít nhất 1 bài tập...". Tỉ lệ báo lỗi chỉ xảy ra nếu DB hoàn toàn không có bài nào khớp.
