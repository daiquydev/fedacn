# Test script cho Recipe APIs
# Run this to test recipe creation functionality

$baseUrl = "http://localhost:5000"

Write-Host "🧪 TESTING RECIPE APIs" -ForegroundColor Yellow
Write-Host "=====================" -ForegroundColor Yellow

# Test 1: Check if backend is running
Write-Host "`n1. Testing backend connection..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$baseUrl" -Method GET -TimeoutSec 5
    Write-Host "✅ Backend is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend is not accessible at $baseUrl" -ForegroundColor Red
    Write-Host "Please start the backend first" -ForegroundColor Yellow
    exit 1
}

# Test 2: Get recipe categories (no auth needed)
Write-Host "`n2. Testing get recipe categories..." -ForegroundColor Cyan
try {
    $categories = Invoke-RestMethod -Uri "$baseUrl/api/recipes/category/get-category" -Method GET
    Write-Host "✅ Categories API working. Found $($categories.data.Count) categories:" -ForegroundColor Green
    foreach ($cat in $categories.data) {
        Write-Host "   - $($cat.category_recipe_name)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Failed to get categories: $_" -ForegroundColor Red
}

# Test 3: Get public recipes (auth required)
Write-Host "`n3. Testing get recipes API..." -ForegroundColor Cyan
$token = Read-Host "Enter your access token (or press Enter to skip auth tests)"

if ($token) {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    try {
        $recipes = Invoke-RestMethod -Uri "$baseUrl/api/recipes/user/get-recipes" -Method GET -Headers $headers
        Write-Host "✅ Get recipes API working. Found $($recipes.data.length) recipes" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to get recipes: $_" -ForegroundColor Red
        Write-Host "Check if token is valid" -ForegroundColor Yellow
    }
    
    # Test 4: Get my recipes
    Write-Host "`n4. Testing get my recipes..." -ForegroundColor Cyan
    try {
        $myRecipes = Invoke-RestMethod -Uri "$baseUrl/api/recipes/user/my-recipes" -Method GET -Headers $headers
        Write-Host "✅ My recipes API working. Found $($myRecipes.data.data.length) recipes" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to get my recipes: $_" -ForegroundColor Red
    }
    
    # Test 5: Test recipe creation (with sample data)
    Write-Host "`n5. Testing recipe creation..." -ForegroundColor Cyan
    if ($categories.data.Count -gt 0) {
        $sampleRecipe = @{
            title = "Món ăn test từ PowerShell - $(Get-Date -Format 'HH:mm:ss')"
            description = "Đây là mô tả món ăn test được tạo bởi PowerShell script"
            category_recipe_id = $categories.data[0]._id
            content = "Nội dung hướng dẫn nấu món ăn test này rất đơn giản và dễ làm"
            time = 30
            difficult_level = 0
            region = 0
            processing_food = "Nướng"
            energy = 200
            protein = 15
            fat = 10
            carbohydrate = 25
            ingredients = '[{"name":"Thịt","amount":"500","unit":"g"},{"name":"Gia vị","amount":"1","unit":"thìa"}]'
            instructions = '["Chuẩn bị nguyên liệu","Ướp thịt với gia vị","Nướng trong 20 phút"]'
            tags = '["test","powershell","easy"]'
            video = "https://www.youtube.com/watch?v=example"
        }
        
        try {
            $newRecipe = Invoke-RestMethod -Uri "$baseUrl/api/recipes/user/create" -Method POST -Headers $headers -Body ($sampleRecipe | ConvertTo-Json)
            Write-Host "✅ Recipe creation successful! Recipe ID: $($newRecipe.data._id)" -ForegroundColor Green
            
            # Test 6: Get the created recipe
            Write-Host "`n6. Testing get single recipe..." -ForegroundColor Cyan
            try {
                $recipe = Invoke-RestMethod -Uri "$baseUrl/api/recipes/user/get-recipe/$($newRecipe.data._id)" -Method GET -Headers $headers
                Write-Host "✅ Get single recipe working: $($recipe.data.title)" -ForegroundColor Green
            } catch {
                Write-Host "❌ Failed to get single recipe: $_" -ForegroundColor Red
            }
            
        } catch {
            Write-Host "❌ Failed to create recipe: $_" -ForegroundColor Red
            Write-Host "Error details: $($_.Exception.Response)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️ No categories found, skipping recipe creation test" -ForegroundColor Yellow
    }
} else {
    Write-Host "⏩ Skipping auth-required tests" -ForegroundColor Yellow
}

Write-Host "`n🏁 Test completed!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green

Write-Host "`nTo get your access token:" -ForegroundColor Cyan
Write-Host "1. Login to the frontend (http://localhost:3000)" -ForegroundColor White
Write-Host "2. Open Developer Tools (F12)" -ForegroundColor White
Write-Host "3. Go to Network tab" -ForegroundColor White
Write-Host "4. Make any API request" -ForegroundColor White
Write-Host "5. Look for Authorization header in the request" -ForegroundColor White
Write-Host "6. Copy the token after 'Bearer '" -ForegroundColor White

pause
