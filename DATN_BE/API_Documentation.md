# **📚 API DOCUMENTATION - MODULE QUẢN LÝ THỰC ĐƠN**

## **🔧 Setup & Configuration**

### **Base URL:** `http://localhost:5000/api`

### **Environment Variables cho Postman:**
```javascript
{
  "base_url": "http://localhost:5000/api",
  "access_token": "your_jwt_access_token_here",
  "refresh_token": "your_refresh_token_here",
  "meal_plan_id": "meal_plan_object_id_here",
  "schedule_id": "schedule_object_id_here",
  "meal_item_id": "meal_item_object_id_here",
  "recipe_id": "507f1f77bcf86cd799439011"
}
```

---

## **🔐 AUTHENTICATION APIs**

### **1. Đăng ký tài khoản**
```http
POST {{base_url}}/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "user@example.com",
  "password": "Password123!",
  "full_name": "Nguyen Van A"
}

Response:
{
  "message": "Đăng ký thành công",
  "result": {
    "user_id": "507f1f77bcf86cd799439011",
    "username": "testuser",
    "email": "user@example.com"
  }
}
```

### **2. Đăng nhập**
```http
POST {{base_url}}/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123!"
}

Response:
{
  "message": "Đăng nhập thành công",
  "result": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "username": "testuser",
      "email": "user@example.com"
    }
  }
}
```

### **3. Làm mới token**
```http
POST {{base_url}}/auth/refresh-token
Content-Type: application/json

{
  "refresh_token": "{{refresh_token}}"
}
```

### **4. Đăng xuất**
```http
POST {{base_url}}/auth/logout
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "refresh_token": "{{refresh_token}}"
}
```

---

## **🍽️ MEAL PLAN APIs (16 endpoints)**

### **📖 Xem & Tìm kiếm thực đơn**

#### **1. Lấy danh sách thực đơn công khai**
```http
GET {{base_url}}/meal-plans?page=1&limit=10&category=1&search=giảm%20cân&sort=popular
Authorization: Bearer {{access_token}} (optional)

Query Parameters:
- page: số trang (default: 1)
- limit: số lượng/trang (default: 10)
- category: loại thực đơn (1=loseWeight, 2=gainWeight, 3=healthy...)
- search: từ khóa tìm kiếm
- sort: sắp xếp (popular, newest, rating)

Response:
{
  "message": "Lấy danh sách thực đơn thành công",
  "result": {
    "meal_plans": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "total_pages": 5
    }
  }
}
```

#### **2. Chi tiết thực đơn**
```http
GET {{base_url}}/meal-plans/{{meal_plan_id}}
Authorization: Bearer {{access_token}} (optional)

Response:
{
  "message": "Lấy chi tiết thực đơn thành công",
  "result": {
    "_id": "{{meal_plan_id}}",
    "name": "Thực đơn giảm cân 7 ngày",
    "description": "Thực đơn lành mạnh...",
    "author": {
      "_id": "507f1f77bcf86cd799439011",
      "username": "chef_anna"
    },
    "category": 1,
    "total_days": 7,
    "target_calories": 1500,
    "difficulty_level": 1,
    "total_likes": 45,
    "total_bookmarks": 12,
    "total_comments": 8,
    "is_liked": true,
    "is_bookmarked": false,
    "days": [
      {
        "day_number": 1,
        "meals": [...]
      }
    ]
  }
}
```

#### **3. Lấy bình luận thực đơn**
```http
GET {{base_url}}/meal-plans/{{meal_plan_id}}/comments?page=1&limit=10
Authorization: Bearer {{access_token}} (optional)

Response:
{
  "message": "Lấy bình luận thành công",
  "result": {
    "comments": [
      {
        "_id": "comment_id",
        "content": "Thực đơn rất hay!",
        "author": {
          "username": "user123",
          "avatar": "..."
        },
        "created_at": "2024-01-15T10:30:00Z",
        "replies": [...]
      }
    ]
  }
}
```

### **✍️ Quản lý thực đơn cá nhân**

#### **4. Tạo thực đơn mới**
```http
POST {{base_url}}/meal-plans
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "name": "Thực đơn giảm cân 7 ngày",
  "description": "Thực đơn dành cho người muốn giảm cân",
  "category": 1,
  "total_days": 7,
  "target_calories": 1500,
  "difficulty_level": 1,
  "image": "https://example.com/meal-plan.jpg",
  "is_public": true,
  "price_range": "budget",
  "suitable_for": ["diabetes"],
  "tags": ["healthy", "quick"],
  "days": [
    {
      "day_number": 1,
      "date": "2024-01-15",
      "meals": [
        {
          "meal_type": 1,
          "recipe_id": "507f1f77bcf86cd799439011",
          "servings": 1.5,
          "meal_order": 1,
          "is_optional": false,
          "notes": "Tăng khẩu phần lên 1.5"
        },
        {
          "meal_type": 1,
          "name": "Cháo gà tự làm",
          "description": "Cháo gà bổ dưỡng",
          "ingredients": [
            {
              "name": "Thịt gà",
              "quantity": 200,
              "unit": "gram",
              "calories": 165
            },
            {
              "name": "Gạo tẻ",
              "quantity": 50,
              "unit": "gram",
              "calories": 180
            }
          ],
          "instructions": "1. Nấu gạo thành cháo\\n2. Thêm thịt gà đã luộc\\n3. Nêm nếm vừa ăn",
          "prep_time": 15,
          "cook_time": 30,
          "calories": 345,
          "protein": 25,
          "carbs": 35,
          "fat": 8,
          "meal_order": 2,
          "is_optional": false
        }
      ]
    }
  ]
}

Response:
{
  "message": "Tạo thực đơn thành công",
  "result": {
    "_id": "{{meal_plan_id}}",
    "name": "Thực đơn giảm cân 7 ngày",
    "...": "..."
  }
}
```

#### **5. Lấy thực đơn của tôi**
```http
GET {{base_url}}/meal-plans/my?page=1&limit=10&status=2
Authorization: Bearer {{access_token}}

Response:
{
  "message": "Lấy thực đơn của tôi thành công",
  "result": {
    "meal_plans": [...],
    "pagination": {...}
  }
}
```

#### **6. Cập nhật thực đơn**
```http
PUT {{base_url}}/meal-plans/{{meal_plan_id}}
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "name": "Thực đơn giảm cân 7 ngày (Updated)",
  "description": "Mô tả đã cập nhật",
  "target_calories": 1400,
  "is_public": false
}
```

#### **7. Xóa thực đơn**
```http
DELETE {{base_url}}/meal-plans/{{meal_plan_id}}
Authorization: Bearer {{access_token}}

Response:
{
  "message": "Xóa thực đơn thành công"
}
```

### **❤️ Tương tác với thực đơn**

#### **8. Thích thực đơn**
```http
POST {{base_url}}/meal-plans/{{meal_plan_id}}/like
Authorization: Bearer {{access_token}}

Response:
{
  "message": "Thích thực đơn thành công",
  "result": {
    "total_likes": 46
  }
}
```

#### **9. Bỏ thích thực đơn**
```http
DELETE {{base_url}}/meal-plans/{{meal_plan_id}}/like
Authorization: Bearer {{access_token}}

Response:
{
  "message": "Bỏ thích thực đơn thành công",
  "result": {
    "total_likes": 45
  }
}
```

#### **10. Bookmark thực đơn**
```http
POST {{base_url}}/meal-plans/{{meal_plan_id}}/bookmark
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "folder_name": "Thực đơn giảm cân",
  "notes": "Dành cho tháng 4"
}

Response:
{
  "message": "Lưu thực đơn thành công"
}
```

#### **11. Bỏ bookmark thực đơn**
```http
DELETE {{base_url}}/meal-plans/{{meal_plan_id}}/bookmark
Authorization: Bearer {{access_token}}

Response:
{
  "message": "Bỏ lưu thực đơn thành công"
}
```

#### **12. Lấy thực đơn đã bookmark**
```http
GET {{base_url}}/meal-plans/bookmarks?page=1&limit=10&folder_name=Giảm%20cân
Authorization: Bearer {{access_token}}

Response:
{
  "message": "Lấy thực đơn đã lưu thành công",
  "result": {
    "bookmarks": [
      {
        "meal_plan": {...},
        "folder_name": "Thực đơn giảm cân",
        "bookmarked_at": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

#### **13. Bình luận thực đơn**
```http
POST {{base_url}}/meal-plans/{{meal_plan_id}}/comment
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "content": "Thực đơn này rất hay, tôi đã giảm được 2kg!",
  "parent_comment_id": null
}

Response:
{
  "message": "Bình luận thành công",
  "result": {
    "_id": "comment_id",
    "content": "Thực đơn này rất hay...",
    "author": {...},
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

#### **14. Lấy thực đơn đã thích**
```http
GET {{base_url}}/meal-plans/liked?page=1&limit=10
Authorization: Bearer {{access_token}}

Response:
{
  "message": "Lấy thực đơn đã thích thành công",
  "result": {
    "liked_meal_plans": [...]
  }
}
```

#### **15. Lấy thực đơn phổ biến**
```http
GET {{base_url}}/meal-plans/popular?limit=10&days=7
```

#### **16. Áp dụng thực đơn vào lịch**
```http
POST {{base_url}}/meal-plans/{{meal_plan_id}}/apply
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "title": "Lịch giảm cân của tôi",
  "start_date": "2024-01-15",
  "target_weight": 60,
  "notes": "Mục tiêu giảm 5kg trong 1 tháng",
  "reminders": [
    {
      "time": "07:00",
      "enabled": true,
      "meal_type": 1
    },
    {
      "time": "12:00",
      "enabled": true,
      "meal_type": 2
    }
  ]
}

Response:
{
  "message": "Áp dụng thực đơn thành công",
  "result": {
    "_id": "{{schedule_id}}",
    "title": "Lịch giảm cân của tôi",
    "start_date": "2024-01-15T00:00:00Z",
    "end_date": "2024-01-21T23:59:59Z",
    "status": 1
  }
}
```

---

## **📅 USER MEAL SCHEDULE APIs (20 endpoints)**

### **📋 Quản lý lịch thực đơn**

#### **1. Lấy danh sách lịch thực đơn**
```http
GET {{base_url}}/user-meal-schedules?page=1&limit=10&status=1
Authorization: Bearer {{access_token}}

Response:
{
  "message": "Lấy lịch thực đơn thành công",
  "result": {
    "schedules": [
      {
        "_id": "{{schedule_id}}",
        "title": "Lịch giảm cân của tôi",
        "meal_plan": {
          "name": "Thực đơn giảm cân 7 ngày"
        },
        "start_date": "2024-01-15T00:00:00Z",
        "end_date": "2024-01-21T23:59:59Z",
        "progress": 45.5,
        "current_day": 3,
        "status": 1
      }
    ]
  }
}
```

#### **2. Chi tiết lịch thực đơn**
```http
GET {{base_url}}/user-meal-schedules/{{schedule_id}}
Authorization: Bearer {{access_token}}

Response:
{
  "message": "Lấy chi tiết lịch thành công",
  "result": {
    "_id": "{{schedule_id}}",
    "title": "Lịch giảm cân của tôi",
    "meal_plan": {...},
    "schedule_by_date": {
      "2024-01-15": [
        {
          "_id": "{{meal_item_id}}",
          "name": "Yến mạch sữa hạnh nhân",
          "meal_type": 1,
          "scheduled_time": "07:00",
          "calories": 320,
          "status": 1,
          "recipe": {...}
        }
      ]
    }
  }
}
```

#### **3. Cập nhật lịch thực đơn**
```http
PUT {{base_url}}/user-meal-schedules/{{schedule_id}}
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "title": "Lịch giảm cân mới",
  "target_weight": 58,
  "current_weight": 65,
  "notes": "Đã giảm được 2kg"
}
```

#### **4. Xóa lịch thực đơn**
```http
DELETE {{base_url}}/user-meal-schedules/{{schedule_id}}
Authorization: Bearer {{access_token}}

Response:
{
  "message": "Xóa lịch thực đơn thành công"
}
```

#### **5. Lấy tổng quan lịch**
```http
GET {{base_url}}/user-meal-schedules/{{schedule_id}}/overview
Authorization: Bearer {{access_token}}

Response:
{
  "message": "Lấy tổng quan lịch thành công",
  "result": {
    "total_days": 7,
    "completed_days": 3,
    "progress_percentage": 42.8,
    "total_meals": 21,
    "completed_meals": 9,
    "avg_daily_calories": 1420,
    "target_calories": 1500
  }
}
```

#### **6. Báo cáo tiến độ**
```http
GET {{base_url}}/user-meal-schedules/{{schedule_id}}/progress
Authorization: Bearer {{access_token}}

Response:
{
  "message": "Lấy báo cáo tiến độ thành công",
  "result": {
    "weekly_progress": [...],
    "nutrition_summary": {...},
    "weight_tracking": [...],
    "achievements": [...]
  }
}
```

#### **7. Cập nhật nhắc nhở**
```http
PUT {{base_url}}/user-meal-schedules/{{schedule_id}}/reminders
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "reminders": [
    {
      "time": "07:30",
      "enabled": true,
      "meal_type": 1
    }
  ]
}
```

### **🍴 Quản lý món ăn hàng ngày**

#### **8. Lấy món ăn theo ngày**
```http
GET {{base_url}}/user-meal-schedules/meal-items/day?schedule_id={{schedule_id}}&date=2024-01-15
Authorization: Bearer {{access_token}}

Response:
{
  "message": "Lấy món ăn theo ngày thành công",
  "result": {
    "date": "2024-01-15",
    "meals": [
      {
        "_id": "{{meal_item_id}}",
        "name": "Yến mạch sữa hạnh nhân",
        "meal_type": 1,
        "scheduled_time": "07:00",
        "calories": 320,
        "protein": 12,
        "carbs": 45,
        "fat": 10,
        "status": 0,
        "recipe": {...}
      }
    ],
    "daily_nutrition": {
      "total_calories": 1450,
      "total_protein": 95,
      "target_calories": 1500
    }
  }
}
```

#### **9. Hoàn thành món ăn**
```http
POST {{base_url}}/user-meal-schedules/meal-items/complete
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "meal_item_id": "{{meal_item_id}}",
  "actual_servings": 1.2,
  "actual_calories": 380,
  "rating": 5,
  "review": "Món này rất ngon!",
  "notes": "Đã ăn hết",
  "images": ["https://example.com/my-meal.jpg"],
  "location": "Nhà",
  "mood": "happy",
  "hunger_before": 7,
  "satisfaction_after": 9
}

Response:
{
  "message": "Hoàn thành món ăn thành công",
  "result": {
    "_id": "{{meal_item_id}}",
    "status": 1,
    "completed_at": "2024-01-15T07:30:00Z",
    "rating": 5
  }
}
```

#### **10. Bỏ qua món ăn**
```http
POST {{base_url}}/user-meal-schedules/meal-items/skip
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "meal_item_id": "{{meal_item_id}}",
  "notes": "Không đói vào buổi sáng"
}

Response:
{
  "message": "Bỏ qua món ăn thành công",
  "result": {
    "_id": "{{meal_item_id}}",
    "status": 2,
    "skipped_at": "2024-01-15T07:00:00Z"
  }
}
```

#### **11. Thay thế món ăn**
```http
POST {{base_url}}/user-meal-schedules/meal-items/substitute
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "meal_item_id": "{{meal_item_id}}",
  "substitute_recipe_id": "507f1f77bcf86cd799439011",
  "notes": "Thay bằng món cá vì không thích gà"
}

Response:
{
  "message": "Thay thế món ăn thành công",
  "result": {
    "_id": "{{meal_item_id}}",
    "original_recipe_id": "507f1f77bcf86cd799439012",
    "recipe_id": "507f1f77bcf86cd799439011",
    "substitute_reason": "Thay bằng món cá vì không thích gà",
    "substituted_at": "2024-01-15T07:00:00Z"
  }
}
```

#### **12. Đổi lịch món ăn**
```http
POST {{base_url}}/user-meal-schedules/meal-items/reschedule
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "meal_item_id": "{{meal_item_id}}",
  "new_date": "2024-01-16",
  "new_time": "08:30"
}

Response:
{
  "message": "Thay đổi lịch món ăn thành công",
  "result": {
    "_id": "{{meal_item_id}}",
    "schedule_date": "2024-01-16T00:00:00Z",
    "scheduled_time": "08:30",
    "rescheduled_at": "2024-01-15T10:00:00Z"
  }
}
```

#### **13. Hoán đổi 2 món ăn**
```http
POST {{base_url}}/user-meal-schedules/meal-items/swap
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "meal_item_id_1": "{{meal_item_id}}",
  "meal_item_id_2": "507f1f77bcf86cd799439013"
}

Response:
{
  "message": "Hoán đổi món ăn thành công"
}
```

#### **14. Thêm món vào lịch**
```http
POST {{base_url}}/user-meal-schedules/meal-items/add
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "schedule_id": "{{schedule_id}}",
  "meal_data": {
    "recipe_id": "507f1f77bcf86cd799439011",
    "meal_type": 1,
    "schedule_date": "2024-01-15",
    "scheduled_time": "07:00",
    "calories": 300,
    "protein": 15,
    "carbs": 40,
    "fat": 8
  }
}

Response:
{
  "message": "Thêm món ăn vào lịch thành công",
  "result": {
    "_id": "new_meal_item_id",
    "name": "Tên món ăn",
    "schedule_date": "2024-01-15T00:00:00Z",
    "scheduled_time": "07:00",
    "status": 0
  }
}
```

#### **15. Xóa món khỏi lịch**
```http
DELETE {{base_url}}/user-meal-schedules/meal-items/remove
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "meal_item_id": "{{meal_item_id}}"
}

Response:
{
  "message": "Xóa món ăn khỏi lịch thành công"
}
```

#### **16. Cập nhật món ăn**
```http
PUT {{base_url}}/user-meal-schedules/meal-items/update
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "meal_item_id": "{{meal_item_id}}",
  "updateData": {
    "scheduled_time": "08:00",
    "notes": "Thêm rau xanh",
    "calories": 350
  }
}

Response:
{
  "message": "Cập nhật món ăn thành công",
  "result": {
    "_id": "{{meal_item_id}}",
    "scheduled_time": "08:00",
    "notes": "Thêm rau xanh",
    "calories": 350
  }
}
```

### **📊 Thống kê & Báo cáo**

#### **17. Thống kê dinh dưỡng theo ngày**
```http
GET {{base_url}}/user-meal-schedules/nutrition/day?schedule_id={{schedule_id}}&date=2024-01-15
Authorization: Bearer {{access_token}}

Response:
{
  "message": "Lấy thống kê dinh dưỡng ngày thành công",
  "result": {
    "date": "2024-01-15",
    "total_meals": 4,
    "completed_meals": 3,
    "nutrition": {
      "calories": 1420,
      "protein": 95,
      "carbs": 180,
      "fat": 45
    },
    "targets": {
      "calories": 1500,
      "protein": 100,
      "carbs": 200,
      "fat": 50
    },
    "achievement_percentage": {
      "calories": 94.7,
      "protein": 95.0
    }
  }
}
```

#### **18. Lịch sử món ăn đã hoàn thành**
```http
GET {{base_url}}/user-meal-schedules/meal-items/completed?page=1&limit=10&date_from=2024-01-01&date_to=2024-01-31
Authorization: Bearer {{access_token}}

Response:
{
  "message": "Lấy lịch sử món ăn đã hoàn thành thành công",
  "result": {
    "completed_meals": [
      {
        "_id": "{{meal_item_id}}",
        "name": "Yến mạch sữa hạnh nhân",
        "completed_at": "2024-01-15T07:30:00Z",
        "rating": 5,
        "review": "Rất ngon",
        "actual_calories": 320,
        "schedule_date": "2024-01-15T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25
    }
  }
}
```

#### **19. Lấy lịch hiện tại**
```http
GET {{base_url}}/user-meal-schedules/current
Authorization: Bearer {{access_token}}

Response:
{
  "message": "Lấy lịch hiện tại thành công",
  "result": {
    "active_schedule": {
      "_id": "{{schedule_id}}",
      "title": "Lịch giảm cân của tôi",
      "current_day": 3,
      "today_meals": [...],
      "progress": 42.8
    }
  }
}
```

#### **20. Cập nhật meal item (general)**
```http
POST {{base_url}}/user-meal-schedules/meal-items/update-general
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "meal_item_id": "{{meal_item_id}}",
  "updateData": {
    "portion_size": 1.2,
    "notes": "Tăng khẩu phần",
    "scheduled_time": "07:30"
  }
}
```

---

## **📋 ENUM VALUES REFERENCE**

### **MealPlanCategory:**
- `1`: loseWeight (Giảm cân)
- `2`: gainWeight (Tăng cân)
- `3`: healthy (Ăn uống lành mạnh)
- `4`: muscle (Tăng cơ)
- `5`: diabetic (Tiểu đường)
- `6`: keto (Chế độ Keto)
- `7`: vegetarian (Chay)

### **MealType:**
- `1`: breakfast (Bữa sáng)
- `2`: lunch (Bữa trưa)
- `3`: dinner (Bữa tối)
- `4`: snack (Ăn vặt)

### **MealPlanStatus:**
- `1`: draft (Nháp)
- `2`: published (Đã xuất bản)
- `3`: archived (Lưu trữ)

### **ScheduleStatus:**
- `1`: active (Đang hoạt động)
- `2`: completed (Hoàn thành)
- `3`: paused (Tạm dừng)
- `4`: cancelled (Hủy)

### **MealItemStatus:**
- `0`: pending (Chờ thực hiện)
- `1`: completed (Đã hoàn thành)
- `2`: skipped (Đã bỏ qua)
- `3`: substituted (Đã thay thế)

---

## **🧪 TESTING WORKFLOW**

### **Phase 1: Authentication**
1. **Đăng ký tài khoản** → POST `/auth/register`
2. **Đăng nhập** → POST `/auth/login` → Lưu `access_token`

### **Phase 2: Khám phá thực đơn**
3. **Xem thực đơn công khai** → GET `/meal-plans`
4. **Chi tiết thực đơn** → GET `/meal-plans/{id}`
5. **Xem bình luận** → GET `/meal-plans/{id}/comments`

### **Phase 3: Tương tác**
6. **Like thực đơn** → POST `/meal-plans/{id}/like`
7. **Bookmark thực đơn** → POST `/meal-plans/{id}/bookmark`
8. **Bình luận** → POST `/meal-plans/{id}/comment`

### **Phase 4: Tạo & Quản lý**
9. **Tạo thực đơn mới** → POST `/meal-plans`
10. **Xem thực đơn của tôi** → GET `/meal-plans/my`
11. **Cập nhật thực đơn** → PUT `/meal-plans/{id}`

### **Phase 5: Áp dụng vào lịch**
12. **Áp dụng thực đơn** → POST `/meal-plans/{id}/apply`
13. **Xem lịch của tôi** → GET `/user-meal-schedules`
14. **Chi tiết lịch** → GET `/user-meal-schedules/{id}`

### **Phase 6: Tracking hàng ngày**
15. **Xem món ăn hôm nay** → GET `/user-meal-schedules/meal-items/day`
16. **Hoàn thành món ăn** → POST `/user-meal-schedules/meal-items/complete`
17. **Thay thế món ăn** → POST `/user-meal-schedules/meal-items/substitute`
18. **Đổi lịch món ăn** → POST `/user-meal-schedules/meal-items/reschedule`

### **Phase 7: Quản lý linh hoạt**
19. **Thêm món mới** → POST `/user-meal-schedules/meal-items/add`
20. **Hoán đổi món ăn** → POST `/user-meal-schedules/meal-items/swap`
21. **Xóa món không cần** → DELETE `/user-meal-schedules/meal-items/remove`

### **Phase 8: Thống kê & Báo cáo**
22. **Xem thống kê ngày** → GET `/user-meal-schedules/nutrition/day`
23. **Báo cáo tiến độ** → GET `/user-meal-schedules/{id}/progress`
24. **Lịch sử hoàn thành** → GET `/user-meal-schedules/meal-items/completed`

---

## **⚠️ LƯU Ý QUAN TRỌNG**

1. **ObjectId hợp lệ**: Sử dụng `507f1f77bcf86cd799439011` thay vì `recipe_id_here`
2. **Authorization**: Hầu hết APIs cần `Authorization: Bearer {access_token}`
3. **Content-Type**: POST/PUT requests cần `Content-Type: application/json`
4. **Server port**: Backend chạy trên port `5000`, không phải `3000`
5. **Date format**: Sử dụng ISO string format `2024-01-15T00:00:00.000Z` hoặc `2024-01-15`
6. **Meal Creation**: Hỗ trợ 2 cách - Reference Recipe (recipe_id) hoặc Custom Meal (name + details)
7. **Flexibility**: Có thể reschedule, substitute, swap, add, remove meals tự do
8. **Tracking**: Hỗ trợ tracking chi tiết calories, rating, review, ảnh thực tế

---

## **📊 TỔNG KẾT**

### **Tổng số APIs: 36**
- **Authentication**: 4 APIs
- **Meal Plans**: 16 APIs
- **User Meal Schedules**: 20 APIs (bao gồm 8 APIs quản lý meal items)

### **Tính năng nổi bật:**
✅ **Dual Meal Creation**: Reference Recipe + Custom Meal  
✅ **Social Features**: Like, Comment, Bookmark  
✅ **Flexible Scheduling**: Reschedule, Swap, Add, Remove  
✅ **Advanced Tracking**: Calories, Rating, Photos, Mood  
✅ **Comprehensive Analytics**: Daily/Weekly/Monthly reports

Module Quản lý Thực đơn đã hoàn thiện với API đầy đủ và linh hoạt! 