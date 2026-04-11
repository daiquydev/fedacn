## 🧠 PLAN: Tích hợp Lọc Status Động & Thống kê Tách biệt (Option B)

### Context
Triển khai bộ lọc trạng thái (status: tất cả, đang diễn ra, sắp diễn ra, đã kết thúc) cho cả Sự kiện Đã tạo và Đã tham gia. Số liệu trên 4 thẻ chức năng đầu trang phải hiển thị chính xác theo tab hiện hành và click vào phải lọc được danh sách bên dưới mà không bị lỗi logic đếm liên quan đến Pagination (Phân trang).

---

### Phase 1: Mở rộng API và Logic Backend 

**1. Mở rộng controller và service có sẵn:**
- `getMyEventsController`: Thêm xử lý `param` `status` và `search` (tương tự như `getJoinedEventsController` đang có).
- `getMyEventsService`: Tích hợp logic tìm kiếm và filter status cho các sự kiện do người dùng tạo (kiểm tra so sánh `startDate`, `endDate` với `now()`).

**2. Viết thêm Endpoint Thống kê độc lập (Tránh rủi ro tính toán sai do Pagination):**
- Thêm Route: `GET /user/my-events/stats` (Tính toán 4 state: total, ongoing, upcoming, ended cho Created Events).
- Thêm Route: `GET /user/joined-events/stats` (Tính toán 4 state: total, ongoing, upcoming, ended cho Joined Events). 
- *Hoặc có thể gộp chung thành `GET /user/events/stats?type=created/joined`.*

---

### Phase 2: Nâng cấp Frontend (API Client)

- `sportEventApi.js`: Bổ sung thêm API Fetch mới `getEventStats`.
- `sportEventApi.js`: Update param query cho `getMyEvents` (hỗ trợ search và status).

---

### Phase 3: Nâng cấp UI/UX MySportEvents.jsx

**1. Quản lý State Controller:**
- Thêm State `statusFilter` dùng chung hoặc dùng tách cho 2 tab.
- Gọi API `getEventStats` độc lập với API hiển thị Event list. Khi `activeTab` đổi giữa *Created* và *Joined*, query `getEventStats` tương ứng cho thẻ thống kê.

**2. Giao diện (Làm đẹp và Hợp lý):**
- Làm cho 4 thẻ Thống kê phía trên (Tổng, Đang diễn ra, Sắp diễn ra, Đã kết thúc) **Clickable** (có hiệu ứng hover chuột chuyển thành Pointer, v.v).
- Thêm hiệu ứng *Active State*: Khi user click chọn "Đang diễn ra", thẻ này sẽ nổi bật (Sáng hơn hoặc có viền Shadow mạnh hơn), các thẻ khác mờ đi nhẹ.
- Thêm nút "Xóa Bộ Lọc" (Clear filter) nhỏ bên cạnh danh sách nếu đang có bộ lọc.
- Tái sử dụng component phân trang hoặc logic hiển thị giữa 2 trạng thái lọc để mượt mà nhất.

---

### Verification (Cách kiểm tra sau triển khai)
- Mở `/sport-event/my-events`, đảm bảo 4 ô trên đầu trang load bằng API Count thay vì tính toán Front-end.
- Click chuyển sang tab "Đã tham gia", dữ liệu trên 4 ô phải khớp với đúng người đang đăng nhập.
- Bấm vào một ô (VD "Đang diễn ra"), danh sách bên dưới phải hiển thị loading và trả ra danh sách có Filter = Ongoing của backend. Status ở Pagination phải tính đúng.
- Load mượt mà, không gặp lỗi Race Condition giữa Pagination vs Stat Card Count.
