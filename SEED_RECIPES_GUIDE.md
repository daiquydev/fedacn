# HƯỚNG DẪN SEED 10 RECIPES MẪU

## 📋 Tổng Quan

Đã tạo **10 recipes Việt Nam** để test hệ thống với các đặc điểm:

### ✅ Recipes Được Tạo:
1. **Phở Bò Hà Nội** - Món chính, Miền Bắc, Khó (180 phút)
2. **Bún Chả Hà Nội** - Món chính, Miền Bắc, Trung bình (60 phút)
3. **Cơm Tấm Sườn Bì Chả** - Món chính, Miền Nam, Trung bình (50 phút)
4. **Gỏi Cuốn Tôm Thịt** - Món phụ, Miền Nam, Dễ (30 phút)
5. **Canh Chua Cá** - Canh/Súp, Miền Nam, Dễ (40 phút)
6. **Bánh Xèo Miền Tây** - Món chính, Miền Nam, Trung bình (45 phút)
7. **Chè Đậu Xanh** - Tráng miệng, Miền Bắc, Dễ (60 phút)
8. **Gà Xào Sả Ớt** - Món xào, Miền Trung, Dễ (30 phút)
9. **Cá Kho Tộ** - Món chính, Miền Nam, Trung bình (50 phút)
10. **Rau Muống Xào Tỏi** - Món phụ, Miền Bắc, Dễ (10 phút)

### 🎯 Đặc Điểm Cấu Trúc:
- ✅ **User ID**: `691c0521752805e9ab312e03` (từ sample của bạn)
- ✅ **Category IDs**: Sử dụng categories có sẵn trong DB
- ✅ **Status**: `1` (accepted) - recipes sẵn sàng hiển thị
- ✅ **Type**: `0` (chef)
- ✅ **Images**: Placeholder từ placehold.co (KHÔNG phải ảnh thật)
- ✅ **Nutrition**: Có đầy đủ calories, protein, fat, carbs
- ✅ **Ingredients**: Mỗi ingredient có thông tin dinh dưỡng
- ✅ **Instructions**: Chi tiết từng bước

---

## 🚀 CÁCH CHẠY SEED

### Bước 1: Build Backend
```bash
cd "d:\242\DACN\Source 2\fedacn\DATN_BE"
npm run build
```

### Bước 2: Chạy Seed Script
```bash
npm run seed:recipes
```

### Kết Quả Mong Đợi:
```
✅ Connected to MongoDB
🗑️  Deleted X existing seed recipes
✅ Successfully inserted 10 recipes:
   1. Phở Bò Hà Nội (6xxxxx...)
   2. Bún Chả Hà Nội (6xxxxx...)
   ...
   10. Rau Muống Xào Tỏi (6xxxxx...)

📊 Summary:
   Total recipes: 10
   Categories used: 5
   Regions: 0, 0, 2, 2, 2, 2, 0, 1, 2, 0

✨ Recipe seeding completed successfully!
```

---

## 📁 Files Đã Tạo

1. **`fedacn/data/recipes.seed.json`**  
   - Chứa 10 recipes dạng JSON
   - Có thể edit để thêm/sửa recipes

2. **`fedacn/DATN_BE/scripts/seedRecipes.ts`**  
   - Script TypeScript import recipes vào MongoDB
   - Tự động convert ObjectId
   - Xóa recipes cũ trước khi insert mới

3. **`fedacn/DATN_BE/package.json`**  
   - Thêm script `seed:recipes`

---

## ⚠️ LƯU Ý QUAN TRỌNG

### Về Ảnh (Images):
❌ **https://placehold.co KHÔNG phải ảnh thật**
- Đây là dịch vụ tạo ảnh placeholder tự động
- Format: `placehold.co/800x600/màu/text_color?text=Tên+Món`
- Ảnh sẽ hiện text tên món trên nền màu emerald

### Để Có Ảnh Thật:
**Option 1**: Upload lên Cloud Storage
```bash
# Upload ảnh lên Cloudinary/ImgBB/Firebase Storage
# Sau đó thay URL trong recipes.seed.json
```

**Option 2**: Sử dụng ảnh từ nguồn miễn phí
- Unsplash: https://unsplash.com/s/photos/vietnamese-food
- Pexels: https://www.pexels.com/search/vietnamese%20food/
- Pixabay: https://pixabay.com/images/search/vietnamese food/

**Option 3**: Giữ nguyên placeholder cho testing
- Phù hợp cho giai đoạn development/testing
- Sau này có thể replace hàng loạt bằng script

### Về User ID:
- Hiện dùng: `691c0521752805e9ab312e03`
- Nếu user này không tồn tại, recipes sẽ bị orphan
- Kiểm tra user trước khi seed:
```javascript
db.users.findOne({_id: ObjectId("691c0521752805e9ab312e03")})
```

---

## 🔧 TROUBLESHOOTING

### Lỗi "Cannot connect to MongoDB":
```bash
# Check connection string trong .env
DB_URI=mongodb+srv://...
```

### Lỗi "User not found":
```bash
# Tạo user mới hoặc dùng user có sẵn
# Update user_id trong recipes.seed.json
```

### Lỗi "Category not found":
```bash
# Check categories trong DB:
db.recipe_categories.find()
# Update category_recipe_id trong recipes.seed.json
```

---

## 📊 KIỂM TRA KẾT QUẢ

### Trong MongoDB:
```javascript
// Đếm recipes vừa seed
db.recipes.countDocuments({user_id: ObjectId("691c0521752805e9ab312e03")})

// Xem recipes
db.recipes.find({user_id: ObjectId("691c0521752805e9ab312e03")}).limit(5)

// Check theo category
db.recipes.aggregate([
  {$group: {_id: "$category_recipe_id", count: {$sum: 1}}}
])
```

### Test API:
```bash
# Get all recipes
GET http://localhost:5000/api/recipes

# Get recipe by ID
GET http://localhost:5000/api/recipes/{recipe_id}

# Search recipes
GET http://localhost:5000/api/recipes?search=phở
```

---

## 🎉 HOÀN TẤT!

Bạn đã có **10 recipes mẫu** để test hệ thống. Các bước tiếp theo:

1. ✅ Chạy seed script
2. ✅ Verify trong MongoDB
3. ✅ Test APIs
4. ✅ Kiểm tra giao diện frontend
5. 📝 Thêm recipes thật với ảnh thật (nếu cần)

Nếu cần thêm recipes, chỉ cần:
- Thêm vào `recipes.seed.json`
- Chạy lại `npm run seed:recipes`
