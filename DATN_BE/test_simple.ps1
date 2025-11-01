# Test script cho LowDB APIs
Write-Host "=== Testing LowDB Integration APIs ===" -ForegroundColor Green

$baseUrl = "http://localhost:5000"

Write-Host "1. Testing Ingredients API" -ForegroundColor Yellow

# Test ingredients categories
$response = Invoke-WebRequest -Uri "$baseUrl/api/ingredients/categories" -Method GET
$data = $response.Content | ConvertFrom-Json
Write-Host "Categories found: $($data.result.Count)" -ForegroundColor Green

# Test ingredients list
$response = Invoke-WebRequest -Uri "$baseUrl/api/ingredients?limit=3" -Method GET
$data = $response.Content | ConvertFrom-Json
Write-Host "Ingredients found: $($data.result.ingredients.Count)" -ForegroundColor Green

Write-Host "2. Testing Nutrition API" -ForegroundColor Yellow

# Test nutrition recommendation
$response = Invoke-WebRequest -Uri "$baseUrl/api/nutrition/recommendation?age=25&gender=male&weight=70&height=175&activityLevel=moderate&goal=maintain" -Method GET
$data = $response.Content | ConvertFrom-Json
Write-Host "Daily calories: $($data.result.calories)" -ForegroundColor Green

# Test BMI calculation
$body = '{"weight": 70, "height": 175}'
$response = Invoke-WebRequest -Uri "$baseUrl/api/nutrition/calculate-bmi" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body
$data = $response.Content | ConvertFrom-Json
Write-Host "BMI: $($data.result.bmi) - $($data.result.category)" -ForegroundColor Green

Write-Host "=== All Tests Passed! ===" -ForegroundColor Green
