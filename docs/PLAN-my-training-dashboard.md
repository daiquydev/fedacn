# Cấu Trúc Kế Hoạch: Option A (Command Center Dashboard)

Tiếp cận theo dạng "Bảng Điều Khiển" (Dashboard) tương tự trang quản trị hoặc trang `Training.jsx`, giúp trang Lịch Sử (MyTraining) trở nên chuyên nghiệp, rực rỡ và thể hiện được thành quả luyện tập tổng quan của người dùng.

## Nhận Định & Câu Hỏi Dành Cho Người Dùng (Socratic Gate)
> [!IMPORTANT]
> Trước khi thực thi, xin hãy xác nhận các quyết định sau:
> 1. **Dữ liệu Thống Kê Tổng (Stats)**: Bạn muốn tính tổng lịch sử tập luyện (Kcal, Thời gian, Quãng đường, Số buổi) theo **Tất cả thời gian (All-time)** hay chỉ trong **Tháng hiện tại/Tuần này**?
> 2. **Kiểu dáng Tab**: Chúng ta sẽ chuyển 2 tab "Thể Hình" và "Ngoài Trời" thành dạng thẻ lớn bấm được (Gradient Cards - giống như bước chọn Mode ở `Training.jsx`). Thiết kế lưới 2 cột được chứ?
> 3. **API endpoint**: API thống kê tổng mới sẽ được viết vào trong `personalDashboard.controller.ts` hay tạo riêng một Router mới?

---

## Các Thay Đổi Đề Xuất (Proposed Changes)

### 1. Database & Backend API
Bổ sung một endpoint mới để trả về thống kê tổng quát dữ liệu tập luyện của user.

#### [MODIFY] `DATN_BE/src/routes/userRoutes/personalDashboard.routes.ts`
- Thêm route: `GET /personal-dashboard/training-summary`

#### [MODIFY] `DATN_BE/src/controllers/userControllers/personalDashboard.controller.ts`
- Thêm controller `getTrainingSummaryController`.
- Controller này gọi 2 database model là `WorkoutSession` (Thể hình) và `PersonalActivity` (Ngoài trời) của User hiện tại để tính tổng số buổi, tổng minutes, tổng Calories và tổng khoảng cách (distance).

---

### 2. Frontend API Services
Cập nhật layer gọi API cho React Query.

#### [MODIFY] `DATN_FE/src/apis/personalDashboardApi.js` (hoặc tạo mới nếu chưa có hàm/tệp)
- Bổ sung hàm `getTrainingSummary()` gọi `GET /personal-dashboard/training-summary`.

---

### 3. Giao diện (Frontend UI) - `MyTraining.jsx`
Nâng cấp toàn bộ trải nghiệm hình ảnh, gắn kết ngôn ngữ thiết kế với `Training.jsx`.

#### [MODIFY] `DATN_FE/src/pages/Training/MyTraining.jsx`
- **Tích hợp React Query**: Thêm `useQuery` gọi API `getTrainingSummary()`.
- **Top Summary Cards (Mới)**:
  - Thêm một hàng "Stat Cards" bo góc tròn (`rounded-2xl`, glassmorphism) nằm phía dưới Header chính.
  - Các chỉ số: Tổng quan Kcal (Thẻ lửa `bg-orange-50`), Tổng thời gian (Thẻ đồng hồ `bg-blue-50`), Số lần tập/Quãng đường, v.v.
- **Thiết kế lại Tabs**: 
  - Đổi các nút text/button hiện tại thành 2 khối vuông vức (Cards) tương tác mạnh mẽ. Áp dụng hiệu ứng gradient hover giống Mode Selection (ví dụ: `hover:border-blue-500 hover:shadow-xl transition-all`).
- **Nâng cấp ListView**: 
  - Cải thiện `SessionCard` và `PersonalActivityCard` tinh xảo hơn.
  - Dùng thẻ Badge (ví dụ: màu tím cho AI, màu cam cho hoạt động hủy...) để làm nổi bật dòng thời gian lịch sử.

---

## 4. Kiểm Thử Hệ Thống (Verification Plan)
- Đảm bảo Backend API tổng hợp đúng dữ liệu của User và **không chậm trễ** (thời gian response < 500ms).
- Kiểm tra tính toán tổng (`$sum` trong MongoDB) hoạt động đúng logic cho `completed` status của exercises/sets.
- Kiểm tra Responsive: Giao diện thẻ "Thống kê" và "Tab lệnh" không bị vỡ bố cục trên Mobile.
