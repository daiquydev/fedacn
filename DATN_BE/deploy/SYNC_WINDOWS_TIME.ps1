# Dong bo gio Windows (NTP) — chay PowerShell **Run as Administrator** tren VPS/backend:
#   cd C:\fedacn\DATN_BE
#   powershell -ExecutionPolicy Bypass -File .\deploy\SYNC_WINDOWS_TIME.ps1
#
# Sau khi xong, restart PM2: pm2 restart all

$ErrorActionPreference = 'Stop'

function Require-Admin {
    $isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
        [Security.Principal.WindowsBuiltInRole]::Administrator
    )
    if (-not $isAdmin) {
        Write-Host '[!] Can quyen Administrator. Mo PowerShell -> Run as administrator.' -ForegroundColor Red
        exit 1
    }
}

Require-Admin

Write-Host '=== Thoi gian truoc dong bo ===' -ForegroundColor Cyan
Write-Host ('Local:  ' + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss zzz'))
Write-Host ('UTC:    ' + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss') + ' (kind=' + [DateTime]::UtcNow.Kind + ')')
Write-Host ('UTCNow: ' + ([DateTime]::UtcNow.ToString('yyyy-MM-dd HH:mm:ss') + ' +0000'))

Write-Host ''
Write-Host '=== Bat dich vu Windows Time (W32Time) ===' -ForegroundColor Cyan
Set-Service -Name W32Time -StartupType Automatic
Start-Service -Name W32Time
Start-Sleep -Seconds 2

Write-Host ''
Write-Host '=== Cau hinh NTP (Microsoft + pool) ===' -ForegroundColor Cyan
# Peer mac dinh Windows; /syncfromflags:manual + /reliable:yes cho phep dong bo chinh xac
w32tm /config /manualpeerlist:"time.windows.com,0x9 pool.ntp.org,0x9" /syncfromflags:manual /reliable:yes /update
if ($LASTEXITCODE -ne 0) { throw "w32tm /config failed (exit $LASTEXITCODE)" }

Restart-Service -Name W32Time -Force
Start-Sleep -Seconds 3

Write-Host ''
Write-Host '=== Ep dong bo ngay ===' -ForegroundColor Cyan
w32tm /resync /force
if ($LASTEXITCODE -ne 0) {
    Write-Host '[*] Lan 1 that bai, thu lai sau 5 giay...' -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    w32tm /resync /force
}
if ($LASTEXITCODE -ne 0) {
    Write-Host '[!] w32tm /resync van loi. Kiem tra firewall UDP 123 (NTP).' -ForegroundColor Yellow
}

Write-Host ''
Write-Host '=== Trang thai W32Time ===' -ForegroundColor Green
w32tm /query /status
Write-Host ''
w32tm /query /source

Write-Host ''
Write-Host '=== Thoi gian sau dong bo ===' -ForegroundColor Green
Write-Host ('Local:  ' + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss zzz'))
Write-Host ('UTCNow: ' + ([DateTime]::UtcNow.ToString('yyyy-MM-dd HH:mm:ss') + ' +0000'))
Write-Host ''
Write-Host '[OK] Xong. Chay: pm2 restart all  (tren VPS)' -ForegroundColor Green
