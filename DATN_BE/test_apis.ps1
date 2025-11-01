# PowerShell script để test các API LowDB
# Usage: .\test_apis.ps1

$BASE_URL = "http://localhost:5000"

Write-Host "=== Testing LowDB APIs ===" -ForegroundColor Green

Write-Host "`n1. Testing Ingredients API..." -ForegroundColor Yellow
Write-Host "GET /api/ingredients"
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/ingredients" -Method Get
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host "`n2. Get ingredient categories..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/ingredients/categories" -Method Get
    $response | ConvertTo-Json
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host "`n3. Search ingredients..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/ingredients/search?q=thịt" -Method Get
    $response | ConvertTo-Json
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host "`n4. Testing Recipes API..." -ForegroundColor Yellow
Write-Host "GET /api/lowdb-recipes"
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/lowdb-recipes" -Method Get
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host "`n5. Get featured recipes..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/lowdb-recipes/featured?limit=3" -Method Get
    $response | ConvertTo-Json
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host "`n6. Get recipe categories..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/lowdb-recipes/categories" -Method Get
    $response | ConvertTo-Json
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host "`n7. Search recipes..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/lowdb-recipes/search?q=phở" -Method Get
    $response | ConvertTo-Json
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host "`n8. Testing Nutrition API..." -ForegroundColor Yellow

Write-Host "POST /api/nutrition/calculate-bmi"
try {
    $body = @{
        weight = 70
        height = 175
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/nutrition/calculate-bmi" -Method Post -Body $body -ContentType "application/json"
    $response | ConvertTo-Json
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host "`n9. Get nutrition recommendation..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/nutrition/recommendation?age=25&gender=male&weight=70&height=175&activityLevel=moderate&goal=maintain" -Method Get
    $response | ConvertTo-Json
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host "`n10. Calculate daily nutrition..." -ForegroundColor Yellow
try {
    $body = @{
        age = 25
        gender = "male"
        weight = 70
        height = 175
        activityLevel = "moderate"
        goal = "maintain"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/nutrition/calculate-daily" -Method Post -Body $body -ContentType "application/json"
    $response | ConvertTo-Json
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host "`n=== Testing completed ===" -ForegroundColor Green
