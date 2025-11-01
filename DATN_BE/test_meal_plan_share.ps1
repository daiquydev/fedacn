# Test API chia sẻ meal plan lên post

Write-Host "Testing Meal Plan Share APIs..." -ForegroundColor Green

# Base URL
$baseUrl = "http://localhost:5000"

# Test data - you need to replace these with actual IDs from your database
$testMealPlanId = "6751234567890abcdef12345"  # Replace with actual meal plan ID
$testToken = "your_access_token_here"         # Replace with actual access token

Write-Host "`n1. Testing Share Meal Plan to Post..." -ForegroundColor Yellow

try {
    $shareBody = @{
        meal_plan_id = $testMealPlanId
        privacy = "0"
        content = "Chia sẻ thực đơn tuyệt vời này cho mọi người! #healthy #mealplan"
    } | ConvertTo-Json

    $shareResponse = Invoke-RestMethod -Uri "$baseUrl/api/posts/actions/share-meal-plan" `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $testToken"
            "Content-Type" = "application/json"
        } `
        -Body $shareBody

    Write-Host "✅ Share Meal Plan Response:" -ForegroundColor Green
    $shareResponse | ConvertTo-Json -Depth 3
}
catch {
    Write-Host "❌ Share Meal Plan Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Red
}

Write-Host "`n2. Testing Get Posts with Meal Plans..." -ForegroundColor Yellow

try {
    $listResponse = Invoke-RestMethod -Uri "$baseUrl/api/posts/meal-plans/list?page=1&limit=5" `
        -Method GET `
        -Headers @{
            "Authorization" = "Bearer $testToken"
        }

    Write-Host "✅ Get Posts with Meal Plans Response:" -ForegroundColor Green
    $listResponse | ConvertTo-Json -Depth 4
}
catch {
    Write-Host "❌ Get Posts with Meal Plans Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Red
}

Write-Host "`n3. Testing Get Regular Posts (to compare)..." -ForegroundColor Yellow

try {
    $regularPostsResponse = Invoke-RestMethod -Uri "$baseUrl/api/posts/newfeeds?page=1&limit=3" `
        -Method GET `
        -Headers @{
            "Authorization" = "Bearer $testToken"
        }

    Write-Host "✅ Regular Posts Response:" -ForegroundColor Green
    $regularPostsResponse | ConvertTo-Json -Depth 4
}
catch {
    Write-Host "❌ Regular Posts Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nTest completed!" -ForegroundColor Green
Write-Host "Note: Make sure to replace testMealPlanId and testToken with actual values" -ForegroundColor Cyan
