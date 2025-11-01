# API Chia sẻ Meal Plan lên Post

## 1. Chia sẻ Meal Plan lên Post
**POST** `/api/posts/actions/share-meal-plan`

### Headers:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Request Body:
```json
{
  "meal_plan_id": "507f1f77bcf86cd799439011",
  "privacy": "0",
  "content": "Chia sẻ thực đơn giảm cân hiệu quả này cho mọi người!"
}
```

### Response:
```json
{
  "message": "Chia sẻ thực đơn thành công",
  "result": {
    "_id": "507f1f77bcf86cd799439012",
    "content": "Chia sẻ thực đơn giảm cân hiệu quả này cho mọi người!",
    "user_id": "507f1f77bcf86cd799439010",
    "meal_plan_id": "507f1f77bcf86cd799439011",
    "status": 0,
    "type": 2,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## 2. Lấy danh sách Posts có Meal Plan
**GET** `/api/posts/meal-plans/list?page=1&limit=10`

### Headers:
```
Authorization: Bearer <access_token>
```

### Query Parameters:
- `page`: Số trang (mặc định: 1)
- `limit`: Số lượng bản ghi mỗi trang (mặc định: 10)

### Response:
```json
{
  "message": "Lấy danh sách posts có meal plan thành công",
  "result": {
    "posts": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "content": "Chia sẻ thực đơn giảm cân hiệu quả này cho mọi người!",
        "user_id": "507f1f77bcf86cd799439010",
        "meal_plan_id": "507f1f77bcf86cd799439011",
        "status": 0,
        "type": 2,
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z",
        "like_count": 5,
        "comment_count": 2,
        "is_liked": false,
        "user": {
          "_id": "507f1f77bcf86cd799439010",
          "username": "john_doe",
          "avatar": "/uploads/avatars/avatar.jpg",
          "name": "John Doe"
        },
        "meal_plan": {
          "_id": "507f1f77bcf86cd799439011",
          "title": "Thực đơn giảm cân 7 ngày",
          "description": "Thực đơn khoa học giúp giảm cân hiệu quả",
          "image": "/uploads/images/meal-plans/plan.jpg",
          "images": ["/uploads/images/meal-plans/plan1.jpg"],
          "duration": 7,
          "category": 0,
          "target_calories": 1500,
          "difficulty_level": 1,
          "rating": 4.5,
          "applied_count": 25
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

## Test Commands (PowerShell)

### 1. Test chia sẻ meal plan:
```powershell
# Lấy access token trước
$token = "your_access_token_here"

# Chia sẻ meal plan
$body = @{
    meal_plan_id = "507f1f77bcf86cd799439011"
    privacy = "0"
    content = "Chia sẻ thực đơn tuyệt vời này!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/posts/actions/share-meal-plan" `
    -Method POST `
    -Headers @{Authorization="Bearer $token"; "Content-Type"="application/json"} `
    -Body $body
```

### 2. Test lấy danh sách posts với meal plan:
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/posts/meal-plans/list?page=1&limit=5" `
    -Method GET `
    -Headers @{Authorization="Bearer $token"}
```

## Notes:
- `privacy`: 0 = công khai, 1 = bạn bè, 2 = riêng tư
- `type`: 2 = shareMealPlan (enum PostTypes.shareMealPlan)
- API sẽ tự động tăng `applied_count` của meal plan khi được chia sẻ
- Sẽ tạo notification cho tác giả meal plan nếu không phải chính họ chia sẻ
