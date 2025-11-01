# Simple Meal Plan API Test
$BASE_URL = "http://localhost:5000/api"

Write-Host "Testing Meal Plan APIs..." -ForegroundColor Green

# Test public meal plans
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/meal-plans/public" -Method GET
    Write-Host "✓ Public meal plans API working" -ForegroundColor Green
    Write-Host "  Found $($response.result.pagination.total_items) meal plans" -ForegroundColor Cyan
} catch {
    Write-Host "✗ Public meal plans API failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test featured meal plans
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/meal-plans/featured" -Method GET
    Write-Host "✓ Featured meal plans API working" -ForegroundColor Green
} catch {
    Write-Host "✗ Featured meal plans API failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nNote: For authenticated tests, you need a valid ACCESS_TOKEN" -ForegroundColor Yellow
