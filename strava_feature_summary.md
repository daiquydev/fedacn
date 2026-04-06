# TỔNG HỢP KIẾN TRÚC VÀ TÍNH NĂNG TÍCH HỢP STRAVA (FITCONNECT)

Tài liệu này tổng hợp toàn bộ luồng nghiệp vụ, sự thay đổi Database, Backend, Frontend và các fix lỗi liên quan đến tính năng Đồng bộ hoạt động từ nền tảng Strava vào FitConnect.

---

## 1. Cấu trúc Cơ sở dữ liệu (Database Schemas)

Để chứa được các tham số của Strava, cấu trúc MongoDB đã được nâng cấp:
- **UserModel**: Thêm các trường lưu trữ uỷ quyền an toàn: `stravaProviderId`, `stravaAccessToken`, `stravaRefreshToken`, `stravaTokenExpiresAt`.
- **SportEventProgressModel**: Thêm trường `stravaActivityId` tạo định danh khoá chính cho từng hành động gốc từ Strava, giúp đánh dấu để cản việc spam nhập cùng 1 hoạt động nhiều lần.
- **ActivityTrackingModel**: Thêm trường `source: 'strava' | 'app'` nhằm giúp hệ thống và Frontend có thể nhận diện tách biệt đâu là hoạt động được lấy từ App và đâu là do Strava.

---

## 2. Dịch vụ Backend (Strava Service & APIs)

Tất cả xử lý lõi nằm tại `DATN_BE/src/services/userServices/strava.service.ts`:
- **Auth & Disconnect**:
  - `GET /strava/auth`: Cấp phát đường link uỷ quyền OAuth2 tới người dùng.
  - `GET /strava/callback`: Xử lý luồng Callback từ Strava, trao đổi `code` lấy `access_token` và lưu giấu kín vào DB người dùng.
  - `DELETE /user-strava/disconnect`: Xoá bỏ vĩnh viễn uỷ quyền Strava từ FitConnect thông qua việc $unset token.
  
- **Interactive Sync (Đồng bộ tương tác 2 bước)**:
  - **BƯỚC 1: Quét trước (Preview)** `GET /preview-event/:eventId`: Giao tiếp với `https://www.strava.com/api/v3/athlete/activities`, lọc ra các bài chạy bộ/đạp xe/đi bộ rơi vào đúng khoảng thời gian sự kiện diễn ra. Đặc biệt: **Lọc loại bỏ ngay lập tức những bài tập nào đã từng được nhập vào Data** (Thông qua quét global `stravaActivityId`) nhằm ngăn chặn lỗi `E11000 duplicate key Mongo`.
  - **BƯỚC 2: Nhập số liệu (Import)** `POST /import-event/:eventId`: Người dùng xác nhận chọn các hoạt động muốn nhập, Backend tạo ra 2 bảng Data cùng lúc:
    1. Bảng `sport_event_progress`: Tính điểm thành tích cho sự kiện.
    2. Bảng `activity_tracking`: Lưu trữ siêu dữ liệu làm giả giống hệt dữ liệu nội bộ để phục vụ Xem chi tiết.

- **Bản đồ GPS & Polyline Decoder**: 
  - Tích hợp bộ giải thuật thuật toán tự động giải mã chuỗi `summary_polyline` của Strava thành mảng Object Toạ độ Vĩ độ/Kinh độ `[{lat, lng, timestamp, speed}]` chuẩn hệ thống Google Route. Nhờ đó FitConnect có thể Render được bản đồ màu nhiệm chạy vòng vèo!
  - Linh hoạt xử lý Vận tốc max (`maxSpeed`): Nếu Strava trả về `0`, hệ thống tự mượn tạm Vận tốc trung bình làm fallback x 3.6 đổi m/s ra km/h hiển thị màn hình con số có ý nghĩa.

---

## 3. Cập nhật Giao diện Frontend (React)

- **Trang Cá Nhân (Me.jsx)**: 
  - Tích hợp nút **"Đã kết nối Strava / Hủy kết nối"** sử dụng modal tuỳ chỉnh (`DeleteConfirmBox`) lột xác UI hoàn toàn khỏi mặc định `window.confirm`.
  - Trạng thái Invalidates Queries tự động biến nút về **"Kết nối Strava"** khi huỷ thành công.
- **Hộp thoại Đồng bộ (StravaSyncModal.jsx)**: 
  - Khung Popup có danh sách Scroll dọc thông minh (max-h-500px), chặn người dùng không tick quá 30 bài một lúc, hiển thị chi tiết (Distance, Calories, Time) của từng bài đang chờ duyệt từ hệ thống cloud của Strava.
- **Danh sách "Hoạt động gần đây" (SportEventProgress.jsx)**:
  - Để tăng tính thẩm mỹ và dễ phân biệt, danh sách hoạt động sẽ bóc tách trạng thái `source === 'strava'`. 
  - Tự động thay thế icon mặc định thành Icon Orange S (**SiStrava**) đi kèm nhãn "Bài tập từ Strava" chuyên nghiệp!

---

## 4. Các lỗi lớn đã khắc phục (Troubleshooting Record)
1. **Lỗi 500 Redirect Callback**: 
   - *Nguyên nhân:* Xưa cấu hình cho về trang gốc `/profile` chưa làm ở web mới.
   - *Cách giải quyết:* Đổi callback redirect URL trỏ về chuẩn Route `/me`.
2. **Lỗi đụng độ Strava Limit (1 Vận động viên)**: 
   - *Nguyên nhân:* API của Strava khoá rate limit cho Developer Test Mode.
   - *Cách giải quyết:* Cần Owner admin request nâng hạn mức rate limit tại developerboard của họ.
3. **Lỗi `E11000 duplicate key error` (Đụng độ mã Activity)**:
   - *Nguyên nhân:* Code cũ check điều kiện lỏng: `eventId + stravaActivityId`. Dẫn đến việc nhảy qua xem Sự kiện 2, backend vẫn show activity đó lên cho chọn -> Chọn xong Insert bị Mongo văng lỗi Duplicate.
   - *Cách giải quyết:* Sửa lệnh tồn tại, gỡ `eventId` ra thành điều kiện Global: 1 Bài tập Strava = 1 Record duy nhất.
4. **Lỗi Modal Chi Tiết Trắng Bản Đồ + Vận Tốc max 0 km/h**:
   - *Nguyên nhân:* Khi import không sinh ra File Data map cho GPS route.
   - *Cách giải quyết:* Bổ sung thuật toán `decodePolyline()`, bù tính logic giả lập interval Date.now() cho từng toạ độ của mảng GPS, pass trực tiếp vào Schema lưu xuống dưới Local.

---
Vận hành hoàn hảo, mượt mà và an toàn!
