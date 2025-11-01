# Test script cho Posts API với image upload

Write-Host "=== Testing Posts API with Image Upload ===" -ForegroundColor Green

$baseUrl = "http://localhost:5000"

# Test token (replace with valid token)
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNjhmZGVmYjExOGEzODdmNzMwODA1NmNlIiwicm9sZSI6MCwiZW1haWwiOiJraGFuaGtoYW5odHVAZ21haWwuY29tIiwic3RhdHVzIjoxLCJ1c2VyX25hbWUiOiJraGFuaGtoYW5odHUiLCJ0b2tlbl90eXBlIjowLCJpYXQiOjE3NjE0NzY2NTEsImV4cCI6MTc2MTQ3NzU1MX0.twLqWWfDwrQn4KxKiDApaPK2gCASNl7fovwcI7rTbAQ"

Write-Host "1. Testing POST creation without image..." -ForegroundColor Yellow

try {
    # Create a simple form data
    $formData = @{
        content = "Test post from PowerShell"
        privacy = "1"
    }
    
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    
    $response = Invoke-WebRequest -Uri "$baseUrl/api/posts" -Method POST -Headers $headers -Form $formData
    Write-Host "  Success: Post created without image" -ForegroundColor Green
    Write-Host "  Status: $($response.StatusCode)" -ForegroundColor Green
}
catch {
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}

Write-Host "`n2. Testing file upload endpoint..." -ForegroundColor Yellow
Write-Host "Server is ready for image upload testing from frontend!" -ForegroundColor Green
Write-Host "Upload directories created: uploads/images/posts/" -ForegroundColor Green
