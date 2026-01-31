# Test Create Sport Event API

$BASE_URL = "http://localhost:5000/api"

# Prepare test data with future date
$startDate = (Get-Date).AddDays(5).ToUniversalTime().ToString("o")
$endDate = (Get-Date).AddDays(6).ToUniversalTime().ToString("o")

$eventData = @{
    name = "Test Marathon"
    description = "Test description for marathon"
    category = "Chạy bộ"
    startDate = $startDate
    endDate = $endDate
    location = "Test Park"
    maxParticipants = 100
    image = "https://www.shutterstock.com/image-photo/jogging-by-water-city-friends-600nw-2712916585.jpg"
    eventType = "offline"
} | ConvertTo-Json

Write-Host "========== TEST CREATE SPORT EVENT API ==========" -ForegroundColor Cyan
Write-Host "Event Data:" -ForegroundColor Yellow
Write-Host $eventData -ForegroundColor White

# First, login to get access token
Write-Host "`nStep 1: Login to get access token..." -ForegroundColor Cyan

$loginData = @{
    email = "user@example.com"
    password = "password123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest -Uri "$BASE_URL/auth/users/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginData `
        -ErrorAction Stop
    
    $loginResult = $loginResponse.Content | ConvertFrom-Json
    $accessToken = $loginResult.result.access_token
    
    Write-Host "✅ Login successful" -ForegroundColor Green
    Write-Host "Access Token: $($accessToken.substring(0, 50))..." -ForegroundColor White
} catch {
    Write-Host "❌ Login failed: $_" -ForegroundColor Red
    exit 1
}

# Now create sport event
Write-Host "`nStep 2: Create sport event..." -ForegroundColor Cyan

try {
    $headers = @{
        "Authorization" = $accessToken
        "Content-Type" = "application/json"
    }
    
    $response = Invoke-WebRequest -Uri "$BASE_URL/sport-events" `
        -Method POST `
        -Headers $headers `
        -Body $eventData `
        -ErrorAction Stop
    
    $result = $response.Content | ConvertFrom-Json
    
    Write-Host "✅ Sport event created successfully!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Yellow
    Write-Host ($result | ConvertTo-Json -Depth 3) -ForegroundColor White
    
    Write-Host "`n========== SUCCESS ==========" -ForegroundColor Green
} catch {
    Write-Host "❌ Create sport event failed" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
    
    try {
        $streamReader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorContent = $streamReader.ReadToEnd()
        $streamReader.Close()
        Write-Host "Error Response: $errorContent" -ForegroundColor White
    } catch {
        Write-Host "Could not read error response" -ForegroundColor White
    }
    
    Write-Host "`n========== FAILED ==========" -ForegroundColor Red
    exit 1
}
