# Chạy 1 lần trên VPS (PowerShell Admin):
#   cd C:\fedacn\DATN_BE
#   powershell -ExecutionPolicy Bypass -File .\deploy\START_VPS.ps1

$APP = "C:\fedacn\DATN_BE"
Set-Location $APP

Write-Host "=== PM2: stop all ===" -ForegroundColor Cyan
pm2 delete all 2>$null

if (-not (Test-Path "$APP\dist\index.js")) {
    Write-Host "Build backend..." -ForegroundColor Yellow
    npm install --legacy-peer-deps
    npm run build
}

Write-Host "=== PM2: start DATN_BE + cloudflared ===" -ForegroundColor Cyan
pm2 start deploy\ecosystem.config.js
pm2 save

Start-Sleep -Seconds 15
pm2 status
Write-Host ""
Write-Host "=== URL tunnel (copy vao Vercel VITE_API_URL) ===" -ForegroundColor Green
pm2 logs cloudflared --lines 40 --nostream
