#!/usr/bin/env pwsh

# Test tạo sport event và xem danh sách

$baseUrl = "http://localhost:3000/api"

# Trước tiên, lấy token (giả sử đã đăng nhập)
$loginData = @{
    email = "user@example.com"
    password = "password123"
} | ConvertTo-Json

Write-Host "🔐 Logging in..." -ForegroundColor Yellow

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/users/login" -Method Post -ContentType "application/json" -Body $loginData
    $token = $loginResponse.result.access_token
    Write.Host "✅ Login successful. Token: $($token.Substring(0, 20))..." -ForegroundColor Green
} catch {
    Write-Host "❌ Login failed: $_" -ForegroundColor Red
    exit 1
}

# Tạo headers với token
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Test 1: Lấy danh sách sport events
Write-Host "`n📋 Getting all sport events..." -ForegroundColor Yellow
try {
    $eventsResponse = Invoke-RestMethod -Uri "$baseUrl/sport-events?page=1&limit=10" -Method Get
    Write-Host "✅ Got $($eventsResponse.result.events.Count) events" -ForegroundColor Green
    $eventsResponse.result.events | ForEach-Object {
        Write-Host "  - $($_.name) (Participants: $($_.participants)/$($_.maxParticipants))"
    }
} catch {
    Write-Host "❌ Error getting events: $_" -ForegroundColor Red
}

# Test 2: Tạo một sport event mới
Write-Host "`n➕ Creating a new sport event..." -ForegroundColor Yellow

$newEventData = @{
    name = "Chạy bộ tối qua công viên"
    description = "Chạy bộ nhàn nhã vào buổi tối qua công viên. Ai cũng có thể tham gia."
    category = "Chạy bộ"
    startDate = "2025-06-15T17:00:00Z"
    endDate = "2025-06-15T18:30:00Z"
    location = "Công viên Hòa Bình, Hà Nội"
    maxParticipants = 50
    image = "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=500&h=400"
    eventType = "offline"
} | ConvertTo-Json

try {
    $createResponse = Invoke-RestMethod -Uri "$baseUrl/sport-events" -Method Post -Headers $headers -Body $newEventData
    Write-Host "✅ Event created successfully!" -ForegroundColor Green
    Write-Host "   Event ID: $($createResponse.result._id)"
    Write-Host "   Event Name: $($createResponse.result.name)"
} catch {
    Write-Host "❌ Error creating event: $_" -ForegroundColor Red
}

# Test 3: Lấy danh sách events sau khi tạo
Write-Host "`n📋 Getting updated list of sport events..." -ForegroundColor Yellow
try {
    $eventsResponse = Invoke-RestMethod -Uri "$baseUrl/sport-events?page=1&limit=10" -Method Get
    Write-Host "✅ Now got $($eventsResponse.result.events.Count) events" -ForegroundColor Green
    $eventsResponse.result.events | ForEach-Object {
        Write-Host "  - $($_.name)"
    }
} catch {
    Write-Host "❌ Error getting events: $_" -ForegroundColor Red
}

# Test 4: Lấy my events (sự kiện của tôi)
Write-Host "`n📋 Getting my sport events..." -ForegroundColor Yellow
try {
    $myEventsResponse = Invoke-RestMethod -Uri "$baseUrl/sport-events/user/my-events?page=1&limit=10" -Method Get -Headers $headers
    Write-Host "✅ Got $($myEventsResponse.result.events.Count) my events" -ForegroundColor Green
    $myEventsResponse.result.events | ForEach-Object {
        Write-Host "  - $($_.name)"
    }
} catch {
    Write-Host "❌ Error getting my events: $_" -ForegroundColor Red
}

Write-Host "`n✅ Test completed!" -ForegroundColor Green
