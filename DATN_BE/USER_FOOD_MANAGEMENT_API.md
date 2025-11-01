# User Food Management APIs

Tài liệu này mô tả các API cho phép user thêm và quản lý món ăn/nguyên liệu.

## 1. Ingredient Management APIs

### 1.1. Tạo nguyên liệu mới
```
POST /api/ingredients
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Cà chua bi",
  "category": "Rau củ",
  "calories_per_100g": 18,
  "protein_per_100g": 0.9,
  "carbs_per_100g": 3.9,
  "fat_per_100g": 0.2,
  "fiber_per_100g": 1.2,
  "sugar_per_100g": 2.6,
  "sodium_per_100g": 5,
  "image": "path/to/image.jpg"
}
```

### 1.2. Cập nhật nguyên liệu
```
PUT /api/ingredients/:id
Authorization: Bearer <token>
```

### 1.3. Xóa nguyên liệu
```
DELETE /api/ingredients/:id
Authorization: Bearer <token>
```

## 2. Recipe Management APIs (LowDB)

### 2.1. Tạo công thức mới
```
POST /api/lowdb-recipes
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Salad cà chua bi",
  "description": "Salad tươi mát cho mùa hè",
  "category": "Salad",
  "cuisine": "Việt Nam",
  "prep_time": 15,
  "cook_time": 0,
  "servings": 2,
  "difficulty": "Easy",
  "ingredients": [
    {
      "name": "Cà chua bi",
      "amount": 200,
      "unit": "gram"
    },
    {
      "name": "Rau xà lách",
      "amount": 100,
      "unit": "gram"
    }
  ],
  "instructions": [
    "Rửa sạch cà chua bi và rau xà lách",
    "Cắt cà chua bi thành từng miếng",
    "Trộn tất cả với dressing"
  ],
  "image": "path/to/recipe-image.jpg",
  "tags": ["healthy", "vegetarian", "summer"]
}
```

### 2.2. Cập nhật công thức
```
PUT /api/lowdb-recipes/:id
Authorization: Bearer <token>
```

### 2.3. Xóa công thức
```
DELETE /api/lowdb-recipes/:id
Authorization: Bearer <token>
```

### 2.4. Lấy tất cả công thức
```
GET /api/lowdb-recipes?page=1&limit=10&category=Salad&cuisine=Vietnamese
```

### 2.5. Tìm kiếm công thức
```
GET /api/lowdb-recipes/search?q=salad&category=Salad
```

### 2.6. Tính toán dinh dưỡng
```
POST /api/lowdb-recipes/calculate-nutrition
Content-Type: application/json
```

**Request Body:**
```json
{
  "ingredients": [
    {
      "name": "Cà chua bi",
      "amount": 200,
      "unit": "gram"
    }
  ]
}
```

## 3. Nutrition Analysis APIs

### 3.1. Tính toán dinh dưỡng từ nguyên liệu
```
POST /api/nutrition/calculate
Content-Type: application/json
```

**Request Body:**
```json
{
  "ingredients": [
    {
      "ingredient_id": "ingredient_id_here",
      "amount": 100
    }
  ]
}
```

## 4. Frontend Integration

### 4.1. Form tạo nguyên liệu
- Upload ảnh nguyên liệu
- Nhập thông tin dinh dưỡng
- Chọn category

### 4.2. Form tạo công thức
- Upload ảnh món ăn
- Thêm danh sách nguyên liệu với số lượng
- Nhập hướng dẫn từng bước
- Tự động tính dinh dưỡng

### 4.3. Tính năng tìm kiếm
- Tìm theo tên
- Lọc theo category/cuisine
- Sắp xếp theo độ khó, thời gian

## 5. Database Structure

### 5.1. Ingredients (LowDB)
```json
{
  "id": "unique_id",
  "name": "Ingredient Name",
  "category": "Category",
  "calories_per_100g": 0,
  "protein_per_100g": 0,
  "carbs_per_100g": 0,
  "fat_per_100g": 0,
  "created_by": "user_id",
  "created_at": "timestamp"
}
```

### 5.2. Recipes (LowDB)
```json
{
  "id": "unique_id",
  "name": "Recipe Name", 
  "author": "User Name",
  "ingredients": [...],
  "instructions": [...],
  "nutrition": {
    "total_calories": 0,
    "total_protein": 0
  },
  "created_at": "timestamp"
}
```

## Note
- Tất cả API tạo/sửa/xóa đều yêu cầu authentication
- Image upload được xử lý qua multer middleware
- Nutrition được tính tự động dựa trên ingredients
- Data được lưu trong LowDB files cho performance tốt hơn
