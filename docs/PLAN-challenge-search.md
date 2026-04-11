## 📋 Project Plan: PLAN-challenge-search

### Context
Dựa trên Brainstorm, chúng ta sẽ thực hiện **Option A**: Nâng cấp khu vực tìm kiếm và bộ lọc của trang `Thử thách` để đồng bộ giao diện 100% với `Sự kiện Thể thao`. Đồng thời, chuyển toàn bộ logic lọc và sắp xếp (Sắp xếp, Đang diễn ra, Ngày tạo, Tham gia) xuống Backend API nhằm khắc phục lỗi phân trang.  

---

### 🛑 Socratic Gate (Câu hỏi xác nhận trước khi thực thi)
Dù hướng đi chính đã rõ ràng, nhưng thiết kế giữa Thử Thách và Sự kiện có một số đặc thù riêng, cần bạn xác nhận 2 điểm sau:

1. **Dropdown Phạm Vi (Scope: Công khai / Bạn bè / Của tôi):** 
Bên `Sự kiện` không có dropdown này mà điều hướng thẳng bằng link banner "Sự kiện của tôi". Nếu đồng bộ, bạn muốn:
   - *Lựa chọn 1:* Cất dropdown Scope vào trong "Bộ lọc nâng cao".
   - *Lựa chọn 2:* Loại bỏ dropdown Scope và chỉ dùng link ở Banner "Thử thách của tôi" cho thống nhất? (Riêng mục "Bạn bè" có thể bỏ qua hoặc đưa vào bộ lọc).
2. **Thanh pill Thể loại môn (Row 3):** 
Sự kiện Thể thao dùng Row 3 để chọn "Yoga, Cardio, Đạp xe...". Thử thách có phân loại "Ăn uống". Nếu người dùng click vào tab **"Ăn uống"**, tôi sẽ ẩn Row 3 này đi vì đồ ăn không liên quan đến môn thể thao. Bạn đồng ý với UX này chứ?

---

### Task Breakdown

#### Task 1: Backend Core Refactoring
- **Mục tiêu:** Cập nhật hàm `getChallengeFeed` trong `challenge.services.ts`.
- **Chi tiết:** 
  - Thêm support lọc động qua tham số: `sortBy` (popular, newest, oldest, soonest, ongoing, joined, ended), `dateFrom`, `dateTo`, `category`.
  - Thay đổi Query Mongoose để tìm kiếm theo giới hạn thời gian (start_date, end_date) thay vì chỉ sử dụng biến client.

#### Task 2: Frontend Data Injection
- **Mục tiêu:** Đưa parameters mới xuống hook data.
- **Chi tiết:** 
  - Cập nhật `challengeApi.js` (nếu cần).
  - Cập nhật Hook `useQuery` trong `Challenge.jsx` chứa payload filter đầy đủ.

#### Task 3: Frontend UI Restructure
- **Mục tiêu:** Tái cấu trúc layout lọc trong `Challenge.jsx`.
- **Chi tiết:**
  - **Row 1:** Thanh tìm kiếm chính + Nút "Đang tham gia" + Nút "Bộ lọc". Thêm các Active Filter Chips sinh động.
  - **Row 2:** Các Tab Loại hình (Tất cả, Ăn uống, Ngoài trời, Thể dục).
  - **Row 3:** Category Pills (Tất cả Môn, Cardio, Đạp xe... được mapping từ API category) — sẽ tự ẩn khi tab không phải là Vận động/Thể dục.
  - **Collapse Panel:** Bộ lọc ngày (Từ ngày/Đến ngày), Filter Sắp xếp.

#### Task 4: Testing & Pagination Verification
- **Mục tiêu:** Đảm bảo toàn vẹn dữ liệu
- **Chi tiết:** 
  - Test phân trang kết hợp filter phức tạp (Trang 2 + Sắp diễn ra + Bạn bè).

---

### Agent Assignments
- **`backend-specialist`**: Phụ trách Task 1
- **`frontend-specialist`**: Phụ trách Task 2 & Task 3
- **`orchestrator`/`qa-tester`**: Phụ trách Task 4
