# Hướng dẫn sử dụng tính năng Recipe (Công thức món ăn)

## Tính năng đã hoàn thành

### 1. Tạo công thức món ăn trực tiếp tại trang Meal Plan
- **Vị trí**: Trang Meal Plan (`/meal-plan`)
- **Nút**: "Tạo Món Ăn" (màu cam)
- **Tính năng**:
  - Tạo công thức mới với form đầy đủ
  - Upload ảnh món ăn
  - Thêm nguyên liệu (tên, số lượng, đơn vị)
  - Thêm hướng dẫn nấu nướng (từng bước)
  - Thông tin dinh dưỡng (calo, protein, fat, carbs)
  - Tags (từ khóa)
  - Thể loại, mức độ khó, vùng miền
  - Link video YouTube (không bắt buộc)

### 2. Cập nhật tính năng chỉnh sửa hồ sơ người dùng
- **Vị trí**: Trang cá nhân `/me`
- **Nút**: "Chỉnh sửa" (trong phần header profile)
- **Tính năng cập nhật**:
  - **Thông tin cơ bản**: Tên, username, email, số điện thoại, địa chỉ, ngày sinh, bio
  - **Thông tin sức khỏe**: Chiều cao, cân nặng, mức độ hoạt động, mục tiêu sức khỏe, hạn chế ăn uống, dị ứng
  - **Ảnh đại diện**: Upload và crop ảnh
  - **Đổi mật khẩu**: Mật khẩu cũ và mới
  - Giao diện tabs hiện đại với validation đầy đủ

## API Backend đã sẵn sàng

### Recipe APIs:
- `POST /api/recipes/user/create` - Tạo công thức mới
- `GET /api/recipes/user/my-recipes` - Lấy công thức của tôi
- `PUT /api/recipes/user/update/:id` - Cập nhật công thức
- `DELETE /api/recipes/user/delete/:id` - Xóa công thức
- `GET /api/recipes/user/get-recipes` - Lấy danh sách công thức (có filter)
- `GET /api/recipes/user/get-recipe/:id` - Lấy chi tiết công thức
- `GET /api/recipes/category/get-category` - Lấy danh sách thể loại

### User Profile APIs:
- `PUT /api/user/update-profile` - Cập nhật thông tin cơ bản
- `PUT /api/user/update-health-profile` - Cập nhật thông tin sức khỏe
- `PUT /api/user/update-avatar` - Cập nhật ảnh đại diện
- `PUT /api/user/update-cover-avatar` - Cập nhật ảnh bìa
- `PUT /api/user/change-password` - Đổi mật khẩu

## Dữ liệu mẫu

### File sample-recipes.json
- **Vị trí**: `fedacn/sample-recipes.json`
- **Nội dung**: 10+ công thức món ăn Việt Nam phổ biến
- **Bao gồm**: Phở, Bánh mì, Bún chả, Chả cá Lã Vọng, Gỏi cuốn, Cà ri gà, v.v.
- **Thông tin đầy đủ**: Nguyên liệu, hướng dẫn, dinh dưỡng, tags

### Script seed dữ liệu
- **File**: `seed_sample_recipes.ps1`
- **Chức năng**: Tự động import dữ liệu mẫu vào database
- **Cách sử dụng**:
  1. Đảm bảo backend đang chạy
  2. Đăng nhập vào hệ thống
  3. Lấy access token từ browser (F12 > Network > Authorization header)
  4. Chạy script: `./seed_sample_recipes.ps1`
  5. Nhập access token khi được yêu cầu

## Cách test tính năng

### 1. Test tạo công thức mới:
1. Mở trang `/meal-plan`
2. Click nút "Tạo Món Ăn" (màu cam)
3. Điền đầy đủ thông tin:
   - Tên món ăn (tối thiểu 10 ký tự)
   - Mô tả món ăn
   - Upload ảnh
   - Chọn thể loại
   - Thời gian nấu
   - Mức độ khó
   - Vùng miền
   - Thêm nguyên liệu
   - Thêm hướng dẫn
   - Thông tin dinh dưỡng
   - Tags
4. Click "Tạo món ăn"
5. Kiểm tra thông báo thành công

### 2. Test cập nhật hồ sơ:
1. Mở trang `/me`
2. Click nút "Chỉnh sửa"
3. Thử các tab:
   - **Thông tin cơ bản**: Sửa tên, email, v.v.
   - **Thông tin sức khỏe**: Sửa chiều cao, cân nặng
   - **Ảnh đại diện**: Upload ảnh mới
   - **Đổi mật khẩu**: Đổi mật khẩu
4. Lưu thay đổi và kiểm tra

### 3. Test seed dữ liệu:
1. Đảm bảo có categories trong database
2. Chạy script seed: `./seed_sample_recipes.ps1`
3. Kiểm tra trang Recipe hoặc admin panel

## Lỗi thường gặp và cách khắc phục

### 1. Lỗi validation
- **Nguyên nhân**: Thiếu thông tin bắt buộc hoặc format không đúng
- **Khắc phục**: Kiểm tra các trường bắt buộc, đảm bảo image có định dạng đúng

### 2. Lỗi 401 Unauthorized
- **Nguyên nhân**: Token hết hạn hoặc không hợp lệ
- **Khắc phục**: Đăng nhập lại, lấy token mới

### 3. Lỗi EADDRINUSE port 5000
- **Nguyên nhân**: Port bị chiếm dụng
- **Khắc phục**: 
  ```bash
  # Windows
  netstat -ano | findstr :5000
  taskkill /PID <PID> /F
  
  # Hoặc đổi port trong .env
  PORT=5001
  ```

### 4. Lỗi import path
- **Nguyên nhân**: Đường dẫn import sai
- **Khắc phục**: Kiểm tra đường dẫn relative vs absolute

### 5. Lỗi upload file
- **Nguyên nhân**: File quá lớn hoặc format không hỗ trợ
- **Khắc phục**: Sử dụng ảnh dưới 5MB, format jpg/png/gif/webp

## Files quan trọng đã tạo/cập nhật

### Frontend:
- `src/pages/MealPlan/MealPlan.jsx` - Added CreateRecipeModal integration
- `src/pages/MealPlan/components/CreateRecipeModal/CreateRecipeModal.jsx` - New recipe creation modal
- `src/pages/Me/components/ModalUpdateProfile/ModalUpdateProfile.jsx` - Updated to use EditProfile component
- `src/components/EditProfile/EditProfile.jsx` - Enhanced profile editing with tabs
- `src/apis/recipeApi.js` - Recipe API functions
- `src/utils/rules.js` - Updated validation schema for recipes

### Backend:
- Recipe APIs already implemented and working
- User profile APIs already implemented

### Data & Scripts:
- `sample-recipes.json` - Sample Vietnamese recipes data
- `seed_sample_recipes.ps1` - PowerShell script to seed sample data

## Trạng thái hoàn thành

✅ **Hoàn thành**:
- Component tạo món ăn tại trang Meal Plan
- Modal chỉnh sửa hồ sơ hoàn thiện (tabs đầy đủ)
- API integration hoàn chỉnh
- Validation và error handling
- Dữ liệu mẫu và script seed
- Documentation đầy đủ

✅ **Đã test**:
- Giao diện responsive
- Form validation
- API calls
- Error handling
- File upload

✅ **Ready for production**:
- Clean code structure
- Error boundaries
- Loading states
- User feedback (toasts)
- Mobile-friendly UI
