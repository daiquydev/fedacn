# Khả năng Check-in Trễ Giờ (Late Check-in) & Quản Lý Tiến Độ

## 1. Overview
Hệ thống hiện block hoàn toàn người dùng khỏi việc check-in ngoài `time_window` quy định của thử thách (đặc biệt là thử thách dinh dưỡng/nhịn ăn).
Dựa trên Option A, chúng ta sẽ cho phép người dùng vẫn được lưu lại log (`ChallengeProgress`) bất kỳ lúc nào để không mất nhật ký sinh hoạt. Tuy nhiên, nếu thời điểm ghi nhận nằm ngoài `time_window`, bản ghi sẽ được drop cờ `validation_status: 'invalid_time'`, đồng nghĩa với việc sẽ KHÔNG cộng điểm tích lũy vào `ChallengeParticipant.current_value`.

## 2. Project Type
**WEB + BACKEND**

## 3. Success Criteria
1. Dữ liệu check-in (hình ảnh, calo tính toán...) vẫn lưu bình thường vào DB.
2. Người dùng nộp ảnh trễ giờ KHÔNG bị hệ thống chặn.
3. Tiến độ (`current_value`) và Active Days (`active_days`) của Participant KHÔNG tăng nếu cờ `validation_status` là 'invalid_time'.
4. Giao diện Frontend hiển thị cảnh báo khi check-in khác giờ, hoặc lịch sử hoạt động xuất hiện badge `Check-in Trễ`.

## 4. Tech Stack
- Mongoose/MongoDB (Validation, Aggregation logic)
- Express.js/Node.js (Controllers, Services)
- React.js / Vite / Tailwind (Frontend Alert / UI Logic)

## 5. File Structure Affected
```
DATN_BE/
  ├─ src/models/schemas/challengeProgress.schema.ts
  ├─ src/services/userServices/challenge.services.ts
  ├─ src/controllers/userControllers/challenge.controller.ts
DATN_FE/
  ├─ src/components/CreateChallengeActivityModal.jsx (hoặc tương đương)
  ├─ src/components/ChallengeActivityPreviewCard.jsx (hoặc tương đương)
```

## 6. Task Breakdown

### Task 1: Cập nhật Schema & Backend Logic
- **Agent**: `backend-specialist`
- **Skill**: `database-design`, `api-patterns`
- **INPUT**: `challengeProgress.schema.ts`
- **OUTPUT**:
  - `challengeProgress.schema.ts` thêm `validation_status: { type: String, enum: ['valid', 'invalid_time', 'invalid_content'], default: 'valid' }`.
  - Service lưu check-in sẽ so sánh thời gian hiện tại với `time_window_start / end`. Nếu ngoài giờ, gán `validation_status = 'invalid_time'`.
  - Bỏ error chặn ném ra (`400 Bad Request`) khi check-in trễ.
  - Logic tính điểm `Participant` chỉ update nếu `validation_status === 'valid'`.
- **VERIFY**: Check-in qua API Postman/Frontend lúc 20:00 (Yêu cầu 08:00->13:00) => Thành công, DB có record `invalid_time`, Participant current_value giữ nguyên.

### Task 2: Cập nhật Frontend - Cảnh báo Check-in Trễ & Validation Modal
- **Agent**: `frontend-specialist`
- **Skill**: `react-best-practices`, `frontend-design`
- **INPUT**: Form checkin sự kiện
- **OUTPUT**:
  - Gỡ bỏ Rule chặn Submit khi sai giờ.
  - Render khối `<Alert variant="warning">` cảnh báo: "Bạn đang nộp bằng chứng ngoài khung giờ quy định. Hệ thống vẫn ghi nhận nhưng không cộng điểm vào tiến độ tổng!" nếu user mở popup lúc quá giờ.
- **VERIFY**: Nút Submit vẫn nhấn được. Hiển thị thông báo màu vàng đậm để rành mạch về UX.

### Task 3: Cập nhật UI Hiển thị Lịch sử (PreviewCard/Calendar)
- **Agent**: `frontend-specialist`
- **Skill**: `react-best-practices`
- **INPUT**: Feed hiển thị / Calendar hiển thị.
- **OUTPUT**: Các thẻ báo cáo checkin nếu trả về `validation_status === 'invalid_time'` thì mờ đi hoặc có 1 badge 'Trễ giờ' (Late).
- **VERIFY**: Mở danh sách Challenge Activities trên Feed, nhìn thấy badge nổi bật ở activity được xác định là Late.

## 7. Phase X: Verification (Definition of Done)
- [ ] Schema `ChallengeProgress` compile và migrate thành công.
- [ ] API Test với POST `check-in` nộp trễ giờ: Status Code 200, DB có document được cờ.
- [ ] Tiến độ (`current_value`, `active_days`) tổng không bị update sai lịch.
- [ ] `npm run lint` pass.
- [ ] Giao diện có Alert cảnh báo cho việc sai / trễ giờ.
