# Hướng dẫn Tính năng Tạo & Quản lý Sự kiện Thể thao

## 📋 Tổng quan

Đã triển khai hoàn chỉnh tính năng **Tạo sự kiện mới** và **Quản lý sự kiện thể thao** cho cả Frontend và Backend.

---

## 🔧 BACKEND

### 1. **Database Schema** (`sportEvent.schema.ts`)

```typescript
interface SportEvent {
  name: string              // Tên sự kiện
  description: string       // Mô tả chi tiết
  category: string          // Danh mục (Chạy bộ, Đạp xe, Bơi lội, Fitness, Bóng rổ, ...)
  startDate: Date          // Ngày bắt đầu
  endDate: Date            // Ngày kết thúc
  location: string         // Địa điểm hoặc nền tảng
  maxParticipants: number  // Số người tham gia tối đa
  participants: number     // Số người tham gia hiện tại
  image: string            // URL hình ảnh bìa
  createdBy: ObjectId      // ID người tạo
  eventType: 'online' | 'offline'  // Loại sự kiện
  participants_ids: ObjectId[]      // Danh sách ID người tham gia
  timestamps: true         // createdAt, updatedAt
}
```

**Location**: `src/models/schemas/sportEvent.schema.ts`

### 2. **Service Layer** (`sportEvent.services.ts`)

Các hàm chính:
- `getAllSportEventsService()` - Lấy danh sách sự kiện (hỗ trợ tìm kiếm, lọc, sắp xếp)
- `getSportEventService()` - Lấy chi tiết 1 sự kiện
- `createSportEventService()` - Tạo sự kiện mới
- `updateSportEventService()` - Cập nhật sự kiện
- `deleteSportEventService()` - Xóa sự kiện
- `joinSportEventService()` - Tham gia sự kiện
- `leaveSportEventService()` - Rời khỏi sự kiện
- `getMyEventsService()` - Lấy sự kiện do người dùng tạo
- `getJoinedEventsService()` - Lấy sự kiện đã tham gia

**Location**: `src/services/userServices/sportEvent.services.ts`

### 3. **Controller Layer** (`sportEvent.controller.ts`)

Các endpoint handler:
- `getAllSportEventsController` - GET /sport-events
- `getSportEventController` - GET /sport-events/:id
- `createSportEventController` - POST /sport-events
- `updateSportEventController` - PUT /sport-events/:id
- `deleteSportEventController` - DELETE /sport-events/:id
- `joinSportEventController` - POST /sport-events/:id/join
- `leaveSportEventController` - POST /sport-events/:id/leave
- `getMyEventsController` - GET /sport-events/user/my-events
- `getJoinedEventsController` - GET /sport-events/user/joined-events

**Location**: `src/controllers/userControllers/sportEvent.controller.ts`

### 4. **Routes** (`sportEvent.routes.ts`)

```typescript
// Public routes
GET    /api/sport-events                     // Lấy danh sách sự kiện
GET    /api/sport-events/:id                 // Lấy chi tiết sự kiện

// Protected routes (require token)
POST   /api/sport-events                     // Tạo sự kiện mới
PUT    /api/sport-events/:id                 // Cập nhật sự kiện
DELETE /api/sport-events/:id                 // Xóa sự kiện
POST   /api/sport-events/:id/join            // Tham gia sự kiện
POST   /api/sport-events/:id/leave           // Rời khỏi sự kiện
GET    /api/sport-events/user/my-events      // Lấy sự kiện của tôi
GET    /api/sport-events/user/joined-events  // Lấy sự kiện đã tham gia
```

**Location**: `src/routes/userRoutes/sportEvent.routes.ts`

### 5. **Đăng ký Route trong App**

Thêm vào `src/index.ts`:
```typescript
import sportEventRouter from './routes/userRoutes/sportEvent.routes'
app.use('/api/sport-events', sportEventRouter)
```

---

## 🎨 FRONTEND

### 1. **API Service** (`sportEventApi.js`)

```javascript
// Get functions
getAllSportEvents(params)      // Danh sách tất cả sự kiện
getSportEvent(id)              // Chi tiết sự kiện
getMyEvents(params)            // Sự kiện của tôi
getJoinedEvents(params)        // Sự kiện đã tham gia

// POST functions
createSportEvent(data)         // Tạo sự kiện
joinSportEvent(id)             // Tham gia sự kiện
leaveSportEvent(id)            // Rời khỏi sự kiện

// Modify functions
updateSportEvent(id, data)     // Cập nhật sự kiện
deleteSportEvent(id)           // Xóa sự kiện
```

**Location**: `src/apis/sportEventApi.js`

### 2. **Page: CreateSportEvent** 

Tính năng:
- ✅ Form tạo sự kiện với validation đầy đủ
- ✅ Hỗ trợ 2 loại sự kiện: Trực tiếp (offline) & Trực tuyến (online)
- ✅ Chọn danh mục thể thao (6 danh mục)
- ✅ Nhập ngày giờ bắt đầu & kết thúc
- ✅ Upload/nhập URL hình ảnh với preview
- ✅ Validation lỗi thời gian thực
- ✅ Loading state khi submit
- ✅ Toast notification (thành công/thất bại)

**Location**: `src/pages/SportEvent/CreateSportEvent.jsx`

**Routes**: 
- `GET  /sport-event/create` - Trang tạo sự kiện mới

### 3. **Page: MySportEvents**

Tính năng:
- ✅ Danh sách sự kiện do tôi tạo
- ✅ Pagination (10 sự kiện/trang)
- ✅ Inline editing - chỉnh sửa trực tiếp trong danh sách
- ✅ Xóa sự kiện với xác nhận
- ✅ Hiển thị thông tin: ngày giờ, địa điểm, số người tham gia
- ✅ Nút quay lại & tạo sự kiện mới
- ✅ Toast notification

**Location**: `src/pages/SportEvent/MySportEvents.jsx`

**Routes**:
- `GET  /sport-event/my-events` - Danh sách sự kiện của tôi

### 4. **Updated SportEvent Page**

Thêm 2 nút:
- 🔵 "Sự kiện của tôi" -> `/sport-event/my-events`
- 🟢 "Tạo sự kiện mới" -> `/sport-event/create`

---

## 📡 API Endpoints

### Danh sách sự kiện
```bash
GET /api/sport-events?page=1&limit=10&search=marathon&category=Chạy bộ&sortBy=popular
```

### Tạo sự kiện
```bash
POST /api/sport-events
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Marathon Sài Gòn 2026",
  "description": "Cuộc chạy marathon hàng năm...",
  "category": "Chạy bộ",
  "startDate": "2026-03-15T06:00:00Z",
  "endDate": "2026-03-15T12:00:00Z",
  "location": "Công viên Tao Đàn",
  "maxParticipants": 500,
  "image": "https://...",
  "eventType": "offline"
}
```

### Lấy sự kiện của tôi
```bash
GET /api/sport-events/user/my-events?page=1&limit=10
Authorization: Bearer <token>
```

### Cập nhật sự kiện
```bash
PUT /api/sport-events/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Marathon Sài Gòn 2026 - Updated",
  "maxParticipants": 600,
  ...
}
```

### Tham gia sự kiện
```bash
POST /api/sport-events/:id/join
Authorization: Bearer <token>
```

### Xóa sự kiện
```bash
DELETE /api/sport-events/:id
Authorization: Bearer <token>
```

---

## 🔐 Authentication

- ✅ Tất cả tính năng đều yêu cầu token (except GET danh sách)
- ✅ Token được lấy từ header Authorization
- ✅ Chỉ chủ sở hữu sự kiện mới được cập nhật/xóa
- ✅ Kiểm tra số người tối đa khi tham gia

---

## 🎯 Danh mục thể thao

1. Chạy bộ
2. Đạp xe
3. Bơi lội
4. Fitness
5. Bóng rổ
6. Yoga
7. Cầu lông

---

## 📝 Notes

### Backend
- Sử dụng MongoDB với Mongoose
- Service layer + Controller layer pattern
- Middleware authentication: `verifyToken`
- Error handling đầy đủ
- Populate references (createdBy, participants_ids)

### Frontend
- React functional components với hooks
- React Query hoạt động với API layer
- Moment.js để format ngày giờ
- React Hot Toast cho thông báo
- React Router v6 cho navigation
- TailwindCSS cho styling
- Dark mode support

### Validation
- **Frontend**: Validation before submit
- **Backend**: Validation in controller
- Error messages in Vietnamese
- Required fields: name, category, date, time, location, maxParticipants, image, description

---

## 🚀 Cách sử dụng

### Tạo sự kiện
1. Vào trang Sự kiện thể thao
2. Click "Tạo sự kiện mới" -> `/sport-event/create`
3. Điền form đầy đủ
4. Click "Tạo sự kiện"

### Quản lý sự kiện
1. Vào trang Sự kiện thể thao
2. Click "Sự kiện của tôi" -> `/sport-event/my-events`
3. Chỉnh sửa inline hoặc xóa sự kiện

### Tham gia sự kiện
1. Xem danh sách sự kiện
2. Click "Tham gia ngay" trên card sự kiện

---

## 📊 Response Examples

### Danh sách sự kiện
```json
{
  "result": {
    "events": [...],
    "totalPage": 5,
    "page": 1,
    "limit": 10,
    "total": 50
  },
  "message": "Get all sport events successfully"
}
```

### Chi tiết sự kiện
```json
{
  "result": {
    "_id": "...",
    "name": "Marathon Sài Gòn",
    "category": "Chạy bộ",
    "startDate": "2026-03-15T06:00:00Z",
    "endDate": "2026-03-15T12:00:00Z",
    "location": "Công viên Tao Đàn",
    "maxParticipants": 500,
    "participants": 150,
    "image": "...",
    "eventType": "offline",
    "createdBy": {
      "_id": "...",
      "name": "Hoàng Anh",
      "avatar": "..."
    },
    "participants_ids": [...],
    "createdAt": "...",
    "updatedAt": "..."
  },
  "message": "Get sport event successfully"
}
```

---

## ✅ Checklist

- ✅ Backend Schema Model
- ✅ Backend Service Layer
- ✅ Backend Controller Layer
- ✅ Backend Routes
- ✅ Route registered in app
- ✅ Frontend API Service
- ✅ CreateSportEvent Page
- ✅ MySportEvents Page
- ✅ Routes Updated in useRouteElement
- ✅ Links in SportEvent Page
- ✅ Error Handling
- ✅ Validation
- ✅ Authentication/Authorization
- ✅ Pagination
- ✅ Inline Editing
- ✅ Delete with confirmation
- ✅ Toast notifications
- ✅ Dark mode support
- ✅ Responsive design
- ✅ Loading states

---

## 🐛 Troubleshooting

### Lỗi 401 Unauthorized
- Kiểm tra token có hợp lệ không
- Đảm bảo user đã login

### Lỗi 403 Forbidden
- Chỉ chủ sở hữu mới được sửa/xóa
- Kiểm tra createdBy

### Lỗi Validation
- Điền đầy đủ tất cả field bắt buộc
- Kiểm tra format ngày giờ
- URL hình ảnh phải hợp lệ (http/https)

### Event không hiển thị
- Kiểm tra database có dữ liệu không
- Restart server
- Clear cache/localStorage

---

Tính năng đã hoàn thành 100% ✅
