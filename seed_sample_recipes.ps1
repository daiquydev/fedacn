# Script để seed dữ liệu mẫu recipes vào database
# Chạy script này sau khi đăng nhập vào hệ thống

$baseUrl = "http://localhost:5000"
$sampleRecipesFile = "sample-recipes.json"

# Đọc dữ liệu mẫu
if (-not (Test-Path $sampleRecipesFile)) {
    Write-Host "❌ Không tìm thấy file $sampleRecipesFile" -ForegroundColor Red
    exit 1
}

$recipes = Get-Content $sampleRecipesFile | ConvertFrom-Json

# Function để gọi API
function Invoke-RecipeAPI {
    param(
        [string]$Method,
        [string]$Endpoint,
        [object]$Body = $null,
        [string]$AccessToken
    )
    
    $headers = @{
        "Content-Type" = "application/json"
        "Accept" = "application/json"
    }
    
    if ($AccessToken) {
        $headers["Authorization"] = "Bearer $AccessToken"
    }
    
    try {
        if ($Body) {
            $bodyJson = $Body | ConvertTo-Json -Depth 10
            $response = Invoke-RestMethod -Uri "$baseUrl$Endpoint" -Method $Method -Headers $headers -Body $bodyJson
        } else {
            $response = Invoke-RestMethod -Uri "$baseUrl$Endpoint" -Method $Method -Headers $headers
        }
        return $response
    } catch {
        Write-Host "❌ Lỗi API call: $_" -ForegroundColor Red
        return $null
    }
}

# Hướng dẫn sử dụng
Write-Host "🍳 SCRIPT SEED DỮ LIỆU MẪU RECIPES" -ForegroundColor Yellow
Write-Host "=================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Hướng dẫn sử dụng:" -ForegroundColor Cyan
Write-Host "1. Đảm bảo backend đang chạy tại $baseUrl" -ForegroundColor White
Write-Host "2. Đăng nhập vào hệ thống và lấy access token" -ForegroundColor White
Write-Host "3. Nhập access token khi được yêu cầu" -ForegroundColor White
Write-Host ""

# Kiểm tra kết nối backend
Write-Host "🔍 Kiểm tra kết nối backend..." -ForegroundColor Yellow
try {
    $healthCheck = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET -TimeoutSec 5
    Write-Host "✅ Backend đang hoạt động" -ForegroundColor Green
} catch {
    Write-Host "❌ Không thể kết nối tới backend tại $baseUrl" -ForegroundColor Red
    Write-Host "Vui lòng kiểm tra:" -ForegroundColor Yellow
    Write-Host "- Backend có đang chạy không?" -ForegroundColor White
    Write-Host "- Port có đúng không?" -ForegroundColor White
    exit 1
}

# Yêu cầu access token
$accessToken = Read-Host "Nhập access token của bạn"
if (-not $accessToken) {
    Write-Host "❌ Access token là bắt buộc!" -ForegroundColor Red
    exit 1
}

# Test access token
Write-Host "🔐 Kiểm tra access token..." -ForegroundColor Yellow
$userInfo = Invoke-RecipeAPI -Method "GET" -Endpoint "/api/user/me" -AccessToken $accessToken
if (-not $userInfo) {
    Write-Host "❌ Access token không hợp lệ!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Access token hợp lệ. Xin chào $($userInfo.data.result.name)!" -ForegroundColor Green

# Lấy danh sách categories
Write-Host "📋 Lấy danh sách categories..." -ForegroundColor Yellow
$categories = Invoke-RecipeAPI -Method "GET" -Endpoint "/api/recipes/category/get-category"
if (-not $categories -or $categories.data.Count -eq 0) {
    Write-Host "❌ Không thể lấy danh sách categories hoặc chưa có category nào!" -ForegroundColor Red
    Write-Host "Vui lòng tạo categories trước khi seed recipes." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Tìm thấy $($categories.data.Count) categories:" -ForegroundColor Green
foreach ($cat in $categories.data) {
    Write-Host "  - $($cat.category_recipe_name) (ID: $($cat._id))" -ForegroundColor Gray
}

# Gán category mặc định (lấy category đầu tiên)
$defaultCategoryId = $categories.data[0]._id
Write-Host "🏷️ Sử dụng category mặc định: $($categories.data[0].category_recipe_name)" -ForegroundColor Cyan

# Seed recipes
Write-Host ""
Write-Host "🌱 Bắt đầu seed $($recipes.Count) recipes..." -ForegroundColor Yellow
$successCount = 0
$errorCount = 0

foreach ($recipe in $recipes) {
    Write-Host "📝 Đang tạo recipe: $($recipe.title)" -ForegroundColor Cyan
    
    # Chuẩn bị dữ liệu
    $recipeData = @{
        title = $recipe.title
        description = $recipe.description
        category_recipe_id = $defaultCategoryId
        content = $recipe.content
        video = $recipe.video
        time = $recipe.time
        difficult_level = $recipe.difficult_level
        region = $recipe.region
        processing_food = $recipe.processing_food
        energy = $recipe.energy
        protein = $recipe.protein
        fat = $recipe.fat
        carbohydrate = $recipe.carbohydrate
        ingredients = $recipe.ingredients | ConvertTo-Json
        instructions = $recipe.instructions | ConvertTo-Json
        tags = $recipe.tags | ConvertTo-Json
    }
    
    # Gọi API tạo recipe
    $result = Invoke-RecipeAPI -Method "POST" -Endpoint "/api/recipes/user/create" -Body $recipeData -AccessToken $accessToken
    
    if ($result) {
        Write-Host "  ✅ Tạo thành công!" -ForegroundColor Green
        $successCount++
    } else {
        Write-Host "  ❌ Tạo thất bại!" -ForegroundColor Red
        $errorCount++
    }
    
    # Delay ngắn để tránh spam API
    Start-Sleep -Milliseconds 500
}

# Kết quả
Write-Host ""
Write-Host "🎉 HOÀN THÀNH SEED DỮ LIỆU!" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green
Write-Host "✅ Thành công: $successCount recipes" -ForegroundColor Green
Write-Host "❌ Thất bại: $errorCount recipes" -ForegroundColor Red
Write-Host "📊 Tổng cộng: $($recipes.Count) recipes" -ForegroundColor Cyan

if ($errorCount -gt 0) {
    Write-Host ""
    Write-Host "⚠️ Có một số lỗi trong quá trình seed." -ForegroundColor Yellow
    Write-Host "Có thể do:" -ForegroundColor Yellow
    Write-Host "- Dữ liệu không hợp lệ" -ForegroundColor White
    Write-Host "- Thiếu thông tin bắt buộc" -ForegroundColor White
    Write-Host "- Lỗi kết nối API" -ForegroundColor White
}

Write-Host ""
Write-Host "🔗 Bạn có thể kiểm tra kết quả tại:" -ForegroundColor Cyan
Write-Host "- Frontend: http://localhost:3000/meal-plan" -ForegroundColor White
Write-Host "- Admin: http://localhost:3001/admin/recipes" -ForegroundColor White

pause
