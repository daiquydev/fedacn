## 🧠 Kế hoạch: Refactor MyChallenge Sync theo Option A

### Mối tương quan 
Trang Quản lý Sự kiện (`MySportEvents.jsx`) có giao diện và tính năng xử lí server-side khá ổn định. `MyChallenge.jsx` đang cần được refactor lại hệ thống Stats Card, API Lọc để đảm bảo dữ liệu chạy đúng luồng tương đương.

---

### Phase 1: Backend Update (API for Stats & Filtering)
- **Tạo Endpoint API Mới:** Xây dựng route `GET /api/v1/challenges/stats`.
- **Cập nhật Logic Lấy Danh Sách:** Modifier lại 2 hàm trong controller chính dùng trả dữ liệu Challenge được tạo/được Join bao gồm logic lọc event có `status` == 'ongoing', 'upcoming', 'ended'. Đảm bảo phân trang không tác động lên Query đếm gốc.

### Phase 2: Frontend API Integration
- Trong `challengeApi.js`: Thêm mới `getChallengeStats(params)` function hook vào endpoint ở trên. Xử lý truyền params cho API `getMyChallenges`.

### Phase 3: MyChallenge Component Refactor
- Khởi tạo local state `statusFilter: 'all'` để lọc dữ liệu. Nâng cấp các Thẻ Thống kê (Stat Cards) ở Header: khi nhấn vào (Tổng/Ongoing/Upcoming/Ended) sẽ kích hoạt `statusFilter`, lập tức điều hướng cả API và UI hiển thị chính xác các danh sách thử thách tương ứng.
- Đồng bộ hiển thị Text linh động: Chuyển "Tổng đã tạo" thành "Tổng đã tham gia" khi đổi Tab.
- Tab "Thử thách đã tạo": Bổ sung logic Fixed Custom Scrollbar (`overflow-y-auto max-h-[600px] scrollbar-thin`) cho cột Sidebar danh sách thử thách đã tạo.
- Tab "Đã tham gia": Triển khai logic Phân trang (Pagination) chuẩn xác tương đương module `JoinedTabContent` của Sự kiện (`MySportEvents.jsx`), đảm bảo gọi dataset Backend hiển thị đúng trang `joinedPage`.

### ✅ Checklist Bàn Giao (Verification)
- Đảm bảo thẻ báo cáo (Total/Ongoing/Upcoming/Ended) số lượng đúng sau khi check các user khác nhau.
- Các tính năng cũ trên thẻ Overview/Leaderboard trong Split view vẫn chạy đúng mà không bị hư layout do Refactor API.
