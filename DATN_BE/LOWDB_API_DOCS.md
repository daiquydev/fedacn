# LowDB Integration - API Documentation

## Overview
Hệ thống đã được tích hợp với LowDB để quản lý nguyên liệu, công thức nấu ăn và tính toán dinh dưỡng. Các API mới sử dụng file JSON local thay vì MongoDB cho một số chức năng cụ thể.

## Database Structure
Database được lưu tại: `data/fileStorage.json`

### Collections:
- `files`: Quản lý metadata của file upload
- `ingredients`: Danh sách nguyên liệu với thông tin dinh dưỡng
- `recipes`: Công thức nấu ăn với thông tin chi tiết

## API Endpoints

### 1. Ingredients API (`/api/ingredients`)

#### GET /api/ingredients
Lấy danh sách nguyên liệu với pagination và filter
```
Query params:
- page: số trang (default: 1)
- limit: số item per page (default: 10) 
- search: tìm kiếm theo tên
- ingredient_category_ID: filter theo category
```

#### GET /api/ingredients/categories
Lấy danh sách categories của nguyên liệu

#### GET /api/ingredients/search?q=keyword
Tìm kiếm nguyên liệu theo keyword

#### GET /api/ingredients/:id
Lấy chi tiết một nguyên liệu

#### POST /api/ingredients (Protected)
Tạo nguyên liệu mới
```json
{
  "name": "Tên nguyên liệu",
  "category": "Danh mục",
  "season": "all|spring|summer|fall|winter",
  "price": 50000,
  "unit": "kg",
  "nutrition": {
    "calories": 100,
    "protein": 20,
    "carbs": 10,
    "fat": 5,
    "fiber": 2,
    "sugar": 1,
    "sodium": 100,
    "potassium": 200,
    "vitaminC": 50,
    "calcium": 100,
    "iron": 5
  },
  "description": "Mô tả nguyên liệu"
}
```
- Có thể upload ảnh bằng form-data với field "image"

#### PUT /api/ingredients/:id (Protected)
Cập nhật nguyên liệu

#### DELETE /api/ingredients/:id (Protected)  
Xóa nguyên liệu

### 2. Recipes API (`/api/lowdb-recipes`)

#### GET /api/lowdb-recipes
Lấy danh sách công thức với filter và pagination
```
Query params:
- page, limit: pagination
- search: tìm kiếm
- category: filter theo danh mục
- cuisine: filter theo ẩm thực
- difficulty: filter theo độ khó
- maxPrepTime: filter theo thời gian chuẩn bị
- author: filter theo tác giả
```

#### GET /api/lowdb-recipes/featured?limit=6
Lấy công thức nổi bật

#### GET /api/lowdb-recipes/categories
Lấy danh sách categories

#### GET /api/lowdb-recipes/cuisines
Lấy danh sách ẩm thực

#### GET /api/lowdb-recipes/search?q=keyword
Tìm kiếm công thức

#### GET /api/lowdb-recipes/category/:category
Lấy công thức theo category

#### GET /api/lowdb-recipes/author/:author
Lấy công thức theo tác giả

#### GET /api/lowdb-recipes/:id
Lấy chi tiết một công thức

#### POST /api/lowdb-recipes (Protected)
Tạo công thức mới
```json
{
  "name": "Tên món ăn",
  "description": "Mô tả món ăn",
  "servings": 4,
  "prepTime": 30,
  "cookTime": 60,
  "difficulty": "easy|medium|hard",
  "cuisine": "vietnamese",
  "category": "Món chính",
  "tags": ["thịt bò", "nước dùng"],
  "ingredients": [
    {
      "ingredientId": "ingredient_id",
      "quantity": 500,
      "unit": "g"
    }
  ],
  "instructions": [
    {
      "step": 1,
      "instruction": "Hướng dẫn bước 1",
      "time": 10
    }
  ],
  "author": "admin"
}
```
- Có thể upload ảnh bằng form-data với field "image"
- Nutrition sẽ được tự động tính toán từ ingredients

#### PUT /api/lowdb-recipes/:id (Protected)
Cập nhật công thức

#### DELETE /api/lowdb-recipes/:id (Protected)
Xóa công thức

#### POST /api/lowdb-recipes/calculate-nutrition
Tính toán dinh dưỡng cho danh sách nguyên liệu
```json
{
  "ingredients": [
    {
      "ingredientId": "ingredient_id",
      "quantity": 100,
      "unit": "g"
    }
  ]
}
```

### 3. Nutrition API (`/api/nutrition`)

#### GET /api/nutrition/recommendation
Lấy khuyến nghị dinh dưỡng hàng ngày
```
Query params:
- age: tuổi
- gender: male|female
- weight: cân nặng (kg)
- height: chiều cao (cm)
- activityLevel: sedentary|light|moderate|active|very_active
- goal: maintain|lose|gain
```

#### POST /api/nutrition/calculate-daily
Tính toán dinh dưỡng hàng ngày chi tiết
```json
{
  "age": 25,
  "gender": "male",
  "weight": 70,
  "height": 175,
  "activityLevel": "moderate",
  "goal": "maintain"
}
```

#### POST /api/nutrition/calculate-bmi
Tính chỉ số BMI
```json
{
  "weight": 70,
  "height": 175
}
```

#### POST /api/nutrition/analyze-meal
Phân tích dinh dưỡng của một bữa ăn
```json
{
  "recipeIds": ["recipe_id_1", "recipe_id_2"],
  "servingSizes": [1, 0.5]
}
```

#### POST /api/nutrition/suggest-meal-plan
Đề xuất thực đơn dựa trên mục tiêu dinh dưỡng
```json
{
  "targetNutrition": {
    "calories": 2000,
    "protein": 150,
    "carbs": 250,
    "fat": 67,
    "fiber": 25
  },
  "mealsPerDay": 3
}
```

#### POST /api/nutrition/compare-recipes
So sánh dinh dưỡng giữa các công thức
```json
{
  "recipeIds": ["recipe_id_1", "recipe_id_2", "recipe_id_3"]
}
```

#### GET /api/nutrition/ingredient/:id
Lấy thông tin dinh dưỡng của một nguyên liệu

#### GET /api/nutrition/similar-recipes/:id?limit=5
Tìm công thức có dinh dưỡng tương tự

## File Upload

### Supported formats
- Images: JPG, PNG, GIF, WEBP
- Max file size: 5MB

### Upload process
1. File được upload qua multipart/form-data với field name "image"
2. File được xử lý bằng Sharp: resize, optimize, convert to WebP
3. File được lưu trong thư mục `uploads/images/recipes/` hoặc `uploads/images/ingredients/`
4. Metadata được lưu trong database
5. URL trả về dạng: `/uploads/images/recipes/filename.webp`

## Authentication

Các endpoint có đánh dấu "(Protected)" yêu cầu:
- Header: `Authorization: Bearer <access_token>`

## Error Handling

Tất cả API trả về format:
```json
{
  "success": true/false,
  "result": {}, // data khi success
  "message": "Message",
  "error": "Error details" // khi có lỗi
}
```

## Example Usage

### Tạo nguyên liệu mới với ảnh:
```bash
curl -X POST http://localhost:5000/api/ingredients \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=Thịt bò" \
  -F "category=Thịt" \
  -F "season=all" \
  -F "price=300000" \
  -F "unit=kg" \
  -F "description=Thịt bò tươi ngon" \
  -F "nutrition[calories]=250" \
  -F "nutrition[protein]=26" \
  -F "nutrition[carbs]=0" \
  -F "nutrition[fat]=15" \
  -F "nutrition[fiber]=0" \
  -F "nutrition[sugar]=0" \
  -F "nutrition[sodium]=72" \
  -F "nutrition[potassium]=318" \
  -F "nutrition[vitaminC]=0" \
  -F "nutrition[calcium]=18" \
  -F "nutrition[iron]=2.6" \
  -F "image=@/path/to/image.jpg"
```

### Tạo công thức mới:
```bash
curl -X POST http://localhost:5000/api/lowdb-recipes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Phở Bò",
    "description": "Món phở bò truyền thống",
    "servings": 4,
    "prepTime": 30,
    "cookTime": 180,
    "difficulty": "medium",
    "cuisine": "vietnamese",
    "category": "Món chính",
    "tags": ["phở", "bò"],
    "ingredients": [
      {"ingredientId": "ingredient_id", "quantity": 500, "unit": "g"}
    ],
    "instructions": [
      {"step": 1, "instruction": "Làm sạch nguyên liệu", "time": 15}
    ],
    "author": "admin"
  }'
```

## Development Notes

- Database sẽ được tự động khởi tạo và seed data khi start server
- Upload files được lưu tại thư mục `uploads/`
- Có thể truy cập file qua URL: `http://localhost:5000/uploads/path/to/file`
- API có thể chạy song song với MongoDB APIs hiện tại
