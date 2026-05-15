# ============================================================
# DATN_BE — Khởi động lại FULL: Backend + Cloudflare Tunnel
# Chạy trên VPS (PowerShell as Administrator):
#   cd C:\fedacn\DATN_BE
#   powershell -ExecutionPolicy Bypass -File .\deploy\RESTART_FULL.ps1
# ============================================================

$ErrorActionPreference = "Stop"
$APP_DIR = "C:\fedacn\DATN_BE"
$CLOUDFLARED = "C:\tools\cloudflared\cloudflared.exe"
$BAT_TUNNEL = "$APP_DIR\deploy\start-cloudflared.bat"

Write-Host ""
Write-Host "========== DATN — RESTART FULL ==========" -ForegroundColor Cyan
Write-Host ""

# --- 1. Kiểm tra thư mục ---
if (-not (Test-Path $APP_DIR)) {
    Write-Host "[XX] Khong tim thay $APP_DIR" -ForegroundColor Red
    exit 1
}
Set-Location $APP_DIR

# --- 2. Kiểm tra cloudflared ---
if (-not (Test-Path $CLOUDFLARED)) {
    Write-Host "[XX] Khong tim thay cloudflared: $CLOUDFLARED" -ForegroundColor Red
    Write-Host "     Tai: https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -ForegroundColor Yellow
    exit 1
}
Write-Host "[OK] cloudflared: $CLOUDFLARED" -ForegroundColor Green

# --- 3. PM2 ---
if (-not (Get-Command pm2 -ErrorAction SilentlyContinue)) {
    Write-Host "[>>] Cai PM2..." -ForegroundColor Yellow
    npm install -g pm2
}

# --- 4. Build backend (neu thieu dist) ---
if (-not (Test-Path ".\dist\index.js")) {
    Write-Host "[>>] Thieu dist\index.js — dang build..." -ForegroundColor Yellow
    npm install --legacy-peer-deps
    npm run build
    if (-not (Test-Path ".\dist\index.js")) {
        Write-Host "[XX] Build that bai!" -ForegroundColor Red
        exit 1
    }
}
Write-Host "[OK] dist\index.js ton tai" -ForegroundColor Green

# --- 5. Start backend ---
Write-Host "[>>] Khoi dong DATN_BE..." -ForegroundColor Yellow
pm2 stop DATN_BE 2>$null
pm2 delete DATN_BE 2>$null
pm2 start deploy\ecosystem.config.js
Start-Sleep -Seconds 3

try {
    $r = Invoke-WebRequest -Uri "http://127.0.0.1:5000" -UseBasicParsing -TimeoutSec 10
    Write-Host "[OK] Backend local: HTTP $($r.StatusCode) — $($r.Content.Substring(0, [Math]::Min(40, $r.Content.Length)))" -ForegroundColor Green
} catch {
    Write-Host "[!!] Backend chua phan hoi tren :5000 — xem: pm2 logs DATN_BE" -ForegroundColor Yellow
}

# --- 6. Tao file .bat tunnel (neu chua co) ---
$batContent = @"
@echo off
"$CLOUDFLARED" tunnel --url http://127.0.0.1:5000 --protocol http2
"@
Set-Content -Path $BAT_TUNNEL -Value $batContent -Encoding ASCII
Write-Host "[OK] Da tao $BAT_TUNNEL" -ForegroundColor Green

# --- 7. Start cloudflared ---
Write-Host "[>>] Khoi dong cloudflared (http2)..." -ForegroundColor Yellow
pm2 stop cloudflared 2>$null
pm2 delete cloudflared 2>$null
pm2 start $BAT_TUNNEL --name cloudflared
pm2 save
Start-Sleep -Seconds 8

Write-Host ""
Write-Host "========== TIM URL TUNNEL ==========" -ForegroundColor Magenta
Write-Host "Chay lenh sau va TIM dong chua trycloudflare.com:" -ForegroundColor Yellow
Write-Host "  pm2 logs cloudflared --lines 50 --nostream" -ForegroundColor White
Write-Host ""
pm2 logs cloudflared --lines 50 --nostream 2>$null

Write-Host ""
Write-Host "========== VERCEL (lam tay) ==========" -ForegroundColor Magenta
Write-Host "1. Vercel -> Project DATN_FE -> Settings -> Environment Variables" -ForegroundColor White
Write-Host "2. VITE_API_URL = https://XXXX.trycloudflare.com  (KHONG co /api cuoi)" -ForegroundColor White
Write-Host "3. VITE_SOCKET_URL = cung URL (neu co)" -ForegroundColor White
Write-Host "4. Redeploy frontend" -ForegroundColor White
Write-Host ""
Write-Host "Test tunnel (thay URL):" -ForegroundColor Yellow
Write-Host '  Invoke-WebRequest -Uri "https://XXXX.trycloudflare.com" -UseBasicParsing' -ForegroundColor White
Write-Host ""
Write-Host "pm2 status:" -ForegroundColor Cyan
pm2 status
