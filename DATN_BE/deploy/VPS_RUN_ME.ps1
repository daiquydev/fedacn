# ============================================================
# DATN_BE - VPS AUTO SETUP SCRIPT (Updated v2)
# ============================================================

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "     DATN_BE AUTO SETUP (WINDOWS VPS)                 " -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

$APP_DIR = "C:\fedacn\DATN_BE"

# 0. Dong bo gio Windows (NTP) — can cho Cloudinary upload (avatar, anh, ...)
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator
)
if ($isAdmin -and (Test-Path "$APP_DIR\deploy\SYNC_WINDOWS_TIME.ps1")) {
    Write-Host "[>>] Dong bo gio he thong (W32Time)..." -ForegroundColor Yellow
    & "$APP_DIR\deploy\SYNC_WINDOWS_TIME.ps1"
} else {
    Write-Host "[*] Chay rieng (PowerShell Admin): deploy\SYNC_WINDOWS_TIME.ps1" -ForegroundColor Yellow
}

# 1. Check directory
if (-not (Test-Path $APP_DIR)) {
    Write-Host "[!!] LOI: Khong tim thay thu muc $APP_DIR." -ForegroundColor Red
    exit 1
}

# 2. Check and Upgrade Node.js (Yeu cau ban cao hon de fix EBADENGINE)
$requiredNode = "25.9.0"
$currentNode = node -v 2>$null
if ($null -eq $currentNode -or $currentNode -lt "v$requiredNode") {
    Write-Host "[>>] Dang tai/Nang cap Node.js v$requiredNode..." -ForegroundColor Yellow
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $nodeMsi = "$env:TEMP\node.msi"
    Invoke-WebRequest -Uri "https://nodejs.org/dist/v20.18.0/node-v20.18.0-x64.msi" -OutFile $nodeMsi
    
    Write-Host "[>>] Dang cai dat Node.js (vui long cho)..." -ForegroundColor Yellow
    Start-Process msiexec.exe -ArgumentList "/i $nodeMsi /qn" -Wait
    
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    Write-Host "[OK] Cap nhat Node.js thanh cong!" -ForegroundColor Green
} else {
    Write-Host "[OK] Node.js hien tai: $currentNode" -ForegroundColor Green
}

# 3. Open Port 5000 Firewall
Write-Host "[>>] Dang cau hinh Firewall mo Port 5000..." -ForegroundColor Yellow
$firewallRule = Get-NetFirewallRule -DisplayName "DATN_BE_API_PORT_5000" -ErrorAction SilentlyContinue
if (-not $firewallRule) {
    New-NetFirewallRule -DisplayName "DATN_BE_API_PORT_5000" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow | Out-Null
    Write-Host "[OK] Da mo port 5000 cho API." -ForegroundColor Green
} else {
    Write-Host "[OK] Port 5000 da duoc mo san." -ForegroundColor Green
}

# 4. Install PM2
Set-Location $APP_DIR
if (-not (Get-Command pm2 -ErrorAction SilentlyContinue)) {
    Write-Host "[>>] Dang cai dat PM2 global..." -ForegroundColor Yellow
    npm install -g pm2
}

# 5. NPM Install with legacy-peer-deps
Write-Host "[>>] Dang xoa thu muc node_modules va dist cu de build lai tu dau..." -ForegroundColor Yellow
if (Test-Path "node_modules") { Remove-Item -Recurse -Force node_modules }
if (Test-Path "dist") { Remove-Item -Recurse -Force dist }

Write-Host "[>>] Dang cai dat thu vien (npm install --legacy-peer-deps)..." -ForegroundColor Yellow
# Su dung --legacy-peer-deps de tranh loi xung dot version cua cac goi AWS SDK
npm install --legacy-peer-deps

Write-Host "[>>] Dang build ma nguon (npm run build)..." -ForegroundColor Yellow
npm run build

# 6. Start PM2
Write-Host "[>>] Dang khoi dong Backend voi PM2..." -ForegroundColor Yellow
pm2 stop DATN_BE 2>$null
pm2 delete DATN_BE 2>$null
pm2 start deploy/ecosystem.config.js
pm2 save

# Install PM2 Startup
if (-not (Get-Command pm2-startup -ErrorAction SilentlyContinue)) {
    npm install -g pm2-windows-startup
}
pm2-startup install
pm2 save

Write-Host ""
Write-Host "======================================================" -ForegroundColor Green
Write-Host "  SETUP HOAN TAT THANH CONG!                          " -ForegroundColor Green
Write-Host "  API: http://160.187.229.211:5000                    " -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Green
Write-Host "Dung lenh 'pm2 logs' de xem log."
