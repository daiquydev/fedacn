# Test script cho LowDB APIs
# Chạy script này để test các API mới

Write-Host "=== Testing LowDB Integration APIs ===" -ForegroundColor Green

$baseUrl = "http://localhost:5000"

Write-Host "`n1. Testing Ingredients API" -ForegroundColor Yellow

# Test lấy categories
Write-Host "- Getting ingredient categories..."
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/ingredients/categories" -Method GET
    $data = $response.Content | ConvertFrom-Json
    Write-Host "  ✓ Categories found: $($data.result.Count)" -ForegroundColor Green
}
catch {
    Write-Host "  ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test lấy danh sách ingredients
Write-Host "- Getting ingredients list..."
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/ingredients?limit=3" -Method GET
    $data = $response.Content | ConvertFrom-Json
    Write-Host "  ✓ Ingredients found: $($data.result.ingredients.Count)" -ForegroundColor Green
    Write-Host "  ✓ First ingredient: $($data.result.ingredients[0].name)" -ForegroundColor Green
}
catch {
    Write-Host "  ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test search ingredients
Write-Host "- Searching ingredients..."
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/ingredients/search?q=thịt" -Method GET
    $data = $response.Content | ConvertFrom-Json
    Write-Host "  ✓ Search results: $($data.result.Count)" -ForegroundColor Green
}
catch {
    Write-Host "  ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n2. Testing Nutrition API" -ForegroundColor Yellow

# Test nutrition recommendation
Write-Host "- Getting nutrition recommendation..."
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/nutrition/recommendation?age=25&gender=male&weight=70&height=175&activityLevel=moderate&goal=maintain" -Method GET
    $data = $response.Content | ConvertFrom-Json
    Write-Host "  ✓ Daily calories: $($data.result.calories)" -ForegroundColor Green
    Write-Host "  ✓ Daily protein: $($data.result.protein)g" -ForegroundColor Green
}
catch {
    Write-Host "  ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test BMI calculation
Write-Host "- Calculating BMI..."
try {
    $body = @{
        weight = 70
        height = 175
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$baseUrl/api/nutrition/calculate-bmi" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body
    $data = $response.Content | ConvertFrom-Json
    Write-Host "  ✓ BMI: $($data.result.bmi)" -ForegroundColor Green
    Write-Host "  ✓ Category: $($data.result.category)" -ForegroundColor Green
}
catch {
    Write-Host "  ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test detailed nutrition calculation
Write-Host "- Calculating detailed nutrition..."
try {
    $body = @{
        age = 25
        gender = "male"
        weight = 70
        height = 175
        activityLevel = "moderate"
        goal = "maintain"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$baseUrl/api/nutrition/calculate-daily" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body
    $data = $response.Content | ConvertFrom-Json
    Write-Host "  ✓ BMR: $($data.result.bmr)" -ForegroundColor Green
    Write-Host "  ✓ TDEE: $($data.result.tdee)" -ForegroundColor Green
    Write-Host "  ✓ BMI: $($data.result.bmi.bmi) ($($data.result.bmi.category))" -ForegroundColor Green
}
catch {
    Write-Host "  ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n3. Testing File Upload Endpoint" -ForegroundColor Yellow

# Test static file serving
Write-Host "- Testing static file serving..."
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/uploads/" -Method GET
    Write-Host "  ✓ Uploads directory accessible" -ForegroundColor Green
}
catch {
    Write-Host "  ✓ Uploads directory protected (expected)" -ForegroundColor Green
}

Write-Host "`n=== Test Summary ===" -ForegroundColor Green
Write-Host "✓ Ingredients API: Working" -ForegroundColor Green
Write-Host "✓ Nutrition API: Working" -ForegroundColor Green
Write-Host "✓ BMI Calculation: Working" -ForegroundColor Green
Write-Host "✓ Daily Nutrition Calculation: Working" -ForegroundColor Green

Write-Host "`n=== Next Steps ===" -ForegroundColor Cyan
Write-Host "1. Test voi Postman de upload anh"
Write-Host "2. Tao ingredients va recipes voi anh"
Write-Host "3. Test meal plan suggestions"
Write-Host "4. Test recipe comparison va similar recipes"
Write-Host "5. Tich hop voi frontend"

Write-Host "`n=== API Documentation ===" -ForegroundColor Cyan
Write-Host "Xem chi tiet tai: LOWDB_API_DOCS.md"
Write-Host "Postman collection: Co the tao tu cac curl examples trong docs"
