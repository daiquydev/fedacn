# Test meal plan APIs - PowerShell Script
$ErrorActionPreference = "Stop"

# Configuration
$BASE_URL = "http://localhost:5000/api"
$ACCESS_TOKEN = ""  # Update this with a valid token

Write-Host "=== Testing Meal Plan APIs ===" -ForegroundColor Green

# Function to make API requests
function Invoke-ApiRequest {
    param(
        [string]$Method,
        [string]$Url,
        [hashtable]$Headers = @{},
        [object]$Body = $null
    )
    
    try {
        $params = @{
            Method = $Method
            Uri = $Url
            Headers = $Headers
            ContentType = "application/json"
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
        }
        
        $response = Invoke-RestMethod @params
        return @{
            Success = $true
            Data = $response
        }
    }
    catch {
        return @{
            Success = $false
            Error = $_.Exception.Message
            Response = $_.Exception.Response
        }
    }
}

# Test 1: Get public meal plans
Write-Host "`n1. Testing GET /meal-plans/public" -ForegroundColor Yellow
$result = Invoke-ApiRequest -Method "GET" -Url "$BASE_URL/meal-plans/public?page=1`&limit=5"
if ($result.Success) {
    Write-Host "✓ Success: Retrieved public meal plans" -ForegroundColor Green
    Write-Host "   Total items: $($result.Data.result.pagination.total_items)" -ForegroundColor Cyan
} else {
    Write-Host "✗ Failed: $($result.Error)" -ForegroundColor Red
}

# Test 2: Get featured meal plans
Write-Host "`n2. Testing GET /meal-plans/featured" -ForegroundColor Yellow
$result = Invoke-ApiRequest -Method "GET" -Url "$BASE_URL/meal-plans/featured?limit=3"
if ($result.Success) {
    Write-Host "✓ Success: Retrieved featured meal plans" -ForegroundColor Green
} else {
    Write-Host "✗ Failed: $($result.Error)" -ForegroundColor Red
}

# Test 3: Get trending meal plans
Write-Host "`n3. Testing GET /meal-plans/trending" -ForegroundColor Yellow
$result = Invoke-ApiRequest -Method "GET" -Url "$BASE_URL/meal-plans/trending?limit=3`&days=7"
if ($result.Success) {
    Write-Host "✓ Success: Retrieved trending meal plans" -ForegroundColor Green
} else {
    Write-Host "✗ Failed: $($result.Error)" -ForegroundColor Red
}

# Tests that require authentication
if ($ACCESS_TOKEN) {
    $authHeaders = @{
        "Authorization" = $ACCESS_TOKEN
    }
    
    # Test 4: Get my meal plans
    Write-Host "`n4. Testing GET /meal-plans/my" -ForegroundColor Yellow
    $result = Invoke-ApiRequest -Method "GET" -Url "$BASE_URL/meal-plans/my?page=1`&limit=5" -Headers $authHeaders
    if ($result.Success) {
        Write-Host "✓ Success: Retrieved my meal plans" -ForegroundColor Green
        Write-Host "   Total items: $($result.Data.result.pagination.total_items)" -ForegroundColor Cyan
    } else {
        Write-Host "✗ Failed: $($result.Error)" -ForegroundColor Red
    }
    
    # Test 5: Get bookmarked meal plans
    Write-Host "`n5. Testing GET /meal-plans/bookmarked" -ForegroundColor Yellow
    $result = Invoke-ApiRequest -Method "GET" -Url "$BASE_URL/meal-plans/bookmarked?page=1`&limit=5" -Headers $authHeaders
    if ($result.Success) {
        Write-Host "✓ Success: Retrieved bookmarked meal plans" -ForegroundColor Green
        Write-Host "   Total items: $($result.Data.result.pagination.total_items)" -ForegroundColor Cyan
        
        # Store first meal plan ID for further tests
        if ($result.Data.result.meal_plans -and $result.Data.result.meal_plans.Count -gt 0) {
            $global:MEAL_PLAN_ID = $result.Data.result.meal_plans[0]._id
            Write-Host "   First meal plan ID: $global:MEAL_PLAN_ID" -ForegroundColor Cyan
        }
    } else {
        Write-Host "✗ Failed: $($result.Error)" -ForegroundColor Red
    }
    
    # Test 6: Get meal plan detail (if we have an ID)
    if ($global:MEAL_PLAN_ID) {
        Write-Host "`n6. Testing GET /meal-plans/$global:MEAL_PLAN_ID" -ForegroundColor Yellow
        $result = Invoke-ApiRequest -Method "GET" -Url "$BASE_URL/meal-plans/$global:MEAL_PLAN_ID" -Headers $authHeaders
        if ($result.Success) {
            Write-Host "✓ Success: Retrieved meal plan detail" -ForegroundColor Green
            Write-Host "   Title: $($result.Data.result.title)" -ForegroundColor Cyan
            Write-Host "   Duration: $($result.Data.result.duration) days" -ForegroundColor Cyan
        } else {
            Write-Host "✗ Failed: $($result.Error)" -ForegroundColor Red
        }
        
        # Test 7: Test bookmark/unbookmark actions
        Write-Host "`n7. Testing POST /meal-plans/actions/bookmark" -ForegroundColor Yellow
        $bookmarkBody = @{
            meal_plan_id = $global:MEAL_PLAN_ID
            folder_name = "Test Folder"
            notes = "Test bookmark from PowerShell"
        }
        $result = Invoke-ApiRequest -Method "POST" -Url "$BASE_URL/meal-plans/actions/bookmark" -Headers $authHeaders -Body $bookmarkBody
        if ($result.Success) {
            Write-Host "✓ Success: Bookmarked meal plan" -ForegroundColor Green
        } else {
            Write-Host "✗ Failed: $($result.Error)" -ForegroundColor Red
        }
        
        # Test 8: Test unbookmark
        Write-Host "`n8. Testing POST /meal-plans/actions/unbookmark" -ForegroundColor Yellow
        $unbookmarkBody = @{
            meal_plan_id = $global:MEAL_PLAN_ID
        }
        $result = Invoke-ApiRequest -Method "POST" -Url "$BASE_URL/meal-plans/actions/unbookmark" -Headers $authHeaders -Body $unbookmarkBody
        if ($result.Success) {
            Write-Host "✓ Success: Unbookmarked meal plan" -ForegroundColor Green
        } else {
            Write-Host "✗ Failed: $($result.Error)" -ForegroundColor Red
        }
        
        # Test 9: Test like action
        Write-Host "`n9. Testing POST /meal-plans/actions/like" -ForegroundColor Yellow
        $likeBody = @{
            meal_plan_id = $global:MEAL_PLAN_ID
        }
        $result = Invoke-ApiRequest -Method "POST" -Url "$BASE_URL/meal-plans/actions/like" -Headers $authHeaders -Body $likeBody
        if ($result.Success) {
            Write-Host "✓ Success: Liked meal plan" -ForegroundColor Green
        } else {
            Write-Host "✗ Failed: $($result.Error)" -ForegroundColor Red
        }
        
        # Test 10: Test apply meal plan
        Write-Host "`n10. Testing POST /meal-plans/actions/apply" -ForegroundColor Yellow
        $applyBody = @{
            meal_plan_id = $global:MEAL_PLAN_ID
            title = "Test Applied Meal Plan"
            start_date = (Get-Date).ToString("yyyy-MM-dd")
            notes = "Applied from PowerShell test"
        }
        $result = Invoke-ApiRequest -Method "POST" -Url "$BASE_URL/meal-plans/actions/apply" -Headers $authHeaders -Body $applyBody
        if ($result.Success) {
            Write-Host "✓ Success: Applied meal plan" -ForegroundColor Green
        } else {
            Write-Host "✗ Failed: $($result.Error)" -ForegroundColor Red
        }
    }
    
} else {
    Write-Host "`nSkipping authenticated tests - No ACCESS_TOKEN provided" -ForegroundColor Yellow
    Write-Host "To test authenticated endpoints, update ACCESS_TOKEN variable with a valid token" -ForegroundColor Yellow
}

Write-Host "`n=== Meal Plan API Tests Completed ===" -ForegroundColor Green
Write-Host "Note: Make sure the backend server is running on http://localhost:5000" -ForegroundColor Cyan
