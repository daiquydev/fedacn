# Kế hoạch Refactor Trang Quản lý Thử thách (Admin)

## MỤC TIÊU
Thực hiện Option A + Option B để đồng bộ tính năng và giao diện của trang `AdminChallenge` tương xứng với trải nghiệm bên góc nhìn User và ngang hàng với tính năng Quản lý Sự kiện (`AdminSportEvent`).
Cung cấp cho quản trị viên cái nhìn toàn diện: Thanh tiến độ tổng thể của thử thách, các bộ lọc chuyên sâu (Category list) và cái nhìn chi tiết (UI Modal) cho những tham số cấu hình riêng của từng loại thử thách.

## PHÂN RÃ CÔNG VIỆC (TASK BREAKDOWN)

### Phase 1: Nâng cấp Backend Aggregation & Data Mapping 
**Agent:** `backend-specialist`
- **Mục tiêu:** Tính toán được `% hoàn thành` (Progress Rate) của toàn bộ challenge cho Admin để có thể vẽ thanh Progress Bar ngoại màn hình chính.
- **Thực hiện:**
  1. Trong API `getAll` challenges của Admin, bổ sung pipeline aggregation để tính số user đã hoàn thành thử thách chia cho tổng số tham gia, kết quả trả về `progressPercent` (giống như bên `AdminSportEvent`).
  2. Bổ sung trả về chi tiết exercises hoặc rules vào payload nếu chưa đủ để phục vụ cho Phase 3.

### Phase 2: Cập nhật Cột Tiến độ và Bộ Lọc Danh mục động (Frontend - Option A)
**Agent:** `frontend-specialist`, `orchestrator`
- **Mục tiêu:** Cắt ghép UI cho khớp chuẩn Option A.
- **Thực hiện:**
  1. **Bổ sung cột "Tiến độ":** Áp dụng thanh Progress Bar nằm ở màn hình chính trong `AdminChallenge.jsx`. Nhận thông tin `progressPercent` trung bình để hiển thị màu sắc tương ứng.
  2. **Nâng cấp Bộ Lọc nâng cao:** Fetch mảng danh mục từ `sportCategoryApi`. Tại dropdown "Bộ lọc / Filter", thêm filter "Danh mục" (Category) và cấu hình React trạng thái `activeType` (nếu chọn Ngoài trời thì chỉ xổ dropdown các môn chuyên Ngoài trời) - làm y hệt UX bên `Challenge.jsx` của user.

### Phase 3: Nâng cấp Command Center Modal cho Admin (Frontend - Option B)
**Agent:** `frontend-specialist`, `orchestrator`
- **Mục tiêu:** Hiển thị trọn vẹn đặc trưng các challenge.
- **Thực hiện:**
  1. **Nâng cấp `ParticipantsModal`** (hoặc Modal hiện tại của tab "Mắt" ViewDetail) chứa 2 tab con: "Chi tiết" và "Người tham gia".
  2. Trong Tab "Chi tiết", bổ sung các block UI giống `ChallengeDetail.jsx`:
     - Nếu challenge là Nutrition + Time window: hiện "Khung giờ quy định" và icon phù hợp.
     - Nếu challenge là Fitness: Khai triển danh sách bài tập bắt buộc, số reps, số sets.
  3. Cải tiến thẩm mỹ phần Stats nhỏ để tạo độ tập trung (Ví dụ: % user hoàn thành, Số ngày đã chạy, v.v..).

## TIÊU CHÍ NGHIỆM THU (VERIFICATION CHECKLIST)
- [ ] Bảng `AdminChallenge` mới có dải màu Progress Bar Aggregate chuẩn xác.
- [ ] Chọn Filter "Ngoài trời" hoặc "Thể dục" -> Filter phụ "Danh mục" xổ đúng danh sách sport categories thuộc ngữ cảnh đó; data bảng cập nhật động.
- [ ] Icon con mắt (Preview) hiện lên Modal mới chứa thông tin phân mảnh giữa "Điều kiện/Bài tập" và "Ranking người đóng góp".
- [ ] Chạy check UX audit và Lint thành công.
