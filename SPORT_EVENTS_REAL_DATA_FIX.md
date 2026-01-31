# Sport Events - Fix Real Data Implementation

## Vấn đề
Khi tạo sự kiện thể thao (Sport Event) mới, event không hiển thị trên danh sách sự kiện. Lý do là frontend đang sử dụng **mock data tĩnh** thay vì gọi API thực tế để lấy dữ liệu từ database.

## Giải pháp

### 1. **Backend - Thêm Seed Data**
- **File:** `src/config/seedSportEvents.ts`
- Tạo 8 sự kiện thể thao mẫu để seed vào database
- Tự động chạy khi khởi động server (chỉ chạy nếu collection trống)

**Seed events bao gồm:**
- Chạy bộ 10K - Công viên Tây Hồ
- Yoga online - Buổi sáng
- Đạp xe phượt - Mộc Châu
- Bơi lội 50m - Bể bơi Quốc gia
- Fitness Group - Gold Gym
- Bóng rổ giao hữu
- Cầu lông buổi chiều
- Marathon Hà Nội 2025

### 2. **Frontend - Loại bỏ Mock Data và Sử dụng API Thực**

#### a) **SportEvent.jsx** - Danh sách sự kiện chính
- ❌ Xóa: `import { allSportEvents } from '../../data/sportEvents'`
- ✅ Thêm: `import { getAllSportEvents } from '../../apis/sportEventApi'`
- Fetch dữ liệu từ API thực tế thay vì mock data
- Hỗ trợ pagination, sorting, filtering

#### b) **CreateSportEvent.jsx** - Tạo sự kiện
- Đã sử dụng API `createSportEvent()` 
- Không cần thay đổi (đã hoạt động đúng)

#### c) **MySportEvents.jsx** - Sự kiện của tôi
- Cập nhật cách xử lý API response
- Hỗ trợ format response từ API: `{ result: { events, total, totalPage }, message }`

#### d) **JoinedEvents.jsx** - Sự kiện đã tham gia
- ❌ Xóa: `import { allSportEvents } from '../../../data/sportEvents'`
- ✅ Thêm: `import { getJoinedEvents } from '../../../apis/sportEventApi'`
- Fetch danh sách sự kiện đã tham gia từ API

#### e) **EventDetail.jsx** - Chi tiết sự kiện
- ❌ Xóa: Mock events data
- ✅ Thêm: Fetch từ API `getSportEvent(id)`
- Hỗ trợ join/leave event thực tế qua API

#### f) **SportEventCard.jsx** - Card component
- Cập nhật để sử dụng `_id` thay vì `id` (MongoDB ObjectId)
- Sử dụng `participants_ids` từ API thay vì mock participants
- Sử dụng `startDate` thay vì `date`

### 3. **Routes API**
```
GET    /api/sport-events                    - Lấy tất cả sự kiện (public)
GET    /api/sport-events/:id                - Lấy chi tiết sự kiện (public)
POST   /api/sport-events                    - Tạo sự kiện (protected)
PUT    /api/sport-events/:id                - Cập nhật sự kiện (protected, chỉ creator)
DELETE /api/sport-events/:id                - Xóa sự kiện (protected, chỉ creator)
POST   /api/sport-events/:id/join           - Tham gia sự kiện (protected)
POST   /api/sport-events/:id/leave          - Rời khỏi sự kiện (protected)
GET    /api/sport-events/user/my-events     - Sự kiện của tôi (protected)
GET    /api/sport-events/user/joined-events - Sự kiện đã tham gia (protected)
```

## Cách Kiểm Tra

### 1. **Khởi động Backend**
```bash
cd DATN_BE
npm run dev
```

Backend sẽ:
- Kết nối tới MongoDB
- Seed 8 sự kiện thể thao vào collection `sport_events`
- Khởi động server trên port 5000

### 2. **Khởi động Frontend**
```bash
cd DATN_FE
npm run dev
```

### 3. **Test Flow**
1. Truy cập `http://localhost:5173/sport-event`
2. Xem danh sách 8 sự kiện mẫu đã được seed
3. Tạo sự kiện mới: Click "Tạo sự kiện mới"
4. Điền thông tin và submit
5. **Quay trở lại danh sách sự kiện** - sự kiện mới sẽ hiển thị ngay lập tức
6. Click vào sự kiện để xem chi tiết
7. Click "Tham gia ngay" để join
8. Xem tại "Sự kiện của tôi" hoặc "Sự kiện đã tham gia"

## Dữ Liệu API Response Format

### getAllSportEvents Response
```json
{
  "result": {
    "events": [
      {
        "_id": "ObjectId",
        "name": "Event Name",
        "description": "Event description",
        "category": "Running",
        "startDate": "2025-06-01T06:00:00Z",
        "endDate": "2025-06-01T08:00:00Z",
        "location": "Location",
        "maxParticipants": 500,
        "participants": 0,
        "image": "image-url",
        "eventType": "offline",
        "createdBy": {
          "_id": "UserId",
          "name": "Creator Name",
          "avatar": "avatar-url"
        },
        "participants_ids": [],
        "createdAt": "2025-01-31T...",
        "updatedAt": "2025-01-31T..."
      }
    ],
    "total": 8,
    "totalPage": 1,
    "page": 1,
    "limit": 10
  },
  "message": "Get all sport events successfully"
}
```

## Files Thay Đổi

### Backend
- ✅ `src/config/seedSportEvents.ts` - NEW
- ✅ `src/config/initDatabase.ts` - UPDATED
- ✅ `src/index.ts` - UPDATED (await initializeDatabase)

### Frontend
- ✅ `src/pages/SportEvent/SportEvent.jsx` - UPDATED
- ✅ `src/pages/SportEvent/CreateSportEvent.jsx` - No change needed
- ✅ `src/pages/SportEvent/MySportEvents.jsx` - UPDATED
- ✅ `src/pages/SportEvent/JoinedEvents/JoinedEvents.jsx` - UPDATED
- ✅ `src/pages/SportEvent/EventDetail/EventDetail.jsx` - UPDATED
- ✅ `src/pages/SportEvent/components/SportEventCard.jsx` - UPDATED

## Benefits

✅ **Real-time Updates** - Sự kiện mới được thêm ngay lập tức
✅ **Database Backed** - Dữ liệu lưu trữ trong MongoDB
✅ **Scalable** - Hỗ trợ hàng nghìn sự kiện
✅ **No Mock Data** - Tất cả dữ liệu từ API thực tế
✅ **Initial Data** - 8 sự kiện mẫu sẵn sàng khi khởi động
