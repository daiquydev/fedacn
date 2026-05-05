# ============================================================
# DATN_BE - Deploy Script (Windows to Windows VPS)
# VPS: gencloud-1777985515 | IP: 160.187.229.211
# Chạy: .\deploy\deploy.ps1
# ============================================================

param(
    [switch]$CodeOnly,     # Chỉ upload code (các lần sau)
    [switch]$FullDeploy    # Upload + cài dependencies + deploy (mặc định)
)

# ─── CONFIG ───────────────────────────────────────────────
$VPS_IP       = "160.187.229.211"
$VPS_USER     = "Administrator"
$VPS_PASS     = "GENCLOUD67P@!2T4nm"
$REMOTE_DIR   = "C:\DATN_BE"
$LOCAL_BE     = $PSScriptRoot | Split-Path
$DEPLOY_DIR   = $PSScriptRoot

# ─── COLORS ───────────────────────────────────────────────
function Log-Success { param($msg) Write-Host "[OK] $msg" -ForegroundColor Green }
function Log-Info    { param($msg) Write-Host "[>>] $msg" -ForegroundColor Cyan }
function Log-Warn    { param($msg) Write-Host "[!!] $msg" -ForegroundColor Yellow }
function Log-Error   { param($msg) Write-Host "[XX] $msg" -ForegroundColor Red; exit 1 }
function Log-Title   { param($msg) Write-Host "`n=== $msg ===" -ForegroundColor Magenta }

# ─── CHECK WINRM AVAILABLE ────────────────────────────────
function Check-WinRM {
    Log-Title "Kiểm tra WinRM"
    Log-Info "Cấu hình TrustedHosts để cho phép kết nối tới VPS..."
    
    $currentTrustedHosts = (Get-Item WSMan:\localhost\Client\TrustedHosts).Value
    if ($currentTrustedHosts -notmatch $VPS_IP) {
        $newTrustedHosts = if ($currentTrustedHosts) { "$currentTrustedHosts,$VPS_IP" } else { $VPS_IP }
        Set-Item WSMan:\localhost\Client\TrustedHosts -Value $newTrustedHosts -Force
        Log-Success "Đã thêm $VPS_IP vào TrustedHosts"
    } else {
        Log-Success "$VPS_IP đã có trong TrustedHosts"
    }
}

# ─── GET CREDENTIALS ──────────────────────────────────────
function Get-VPSCredential {
    $securePass = ConvertTo-SecureString $VPS_PASS -AsPlainText -Force
    return New-Object System.Management.Automation.PSCredential ($VPS_USER, $securePass)
}

# ─── STEP 1: TEST CONNECTION ──────────────────────────────
function Test-Connection-VPS {
    Log-Title "Test kết nối VPS qua WinRM"
    Log-Info "Đang kết nối tới $VPS_IP..."
    
    $cred = Get-VPSCredential
    try {
        $session = New-PSSession -ComputerName $VPS_IP -Credential $cred -ErrorAction Stop
        Remove-PSSession $session
        Log-Success "Kết nối WinRM thành công!"
    } catch {
        Log-Warn "Kết nối WinRM thất bại. Vui lòng đảm bảo VPS đã bật WinRM."
        Log-Warn "Trên VPS, hãy chạy PowerShell as Admin: Enable-PSRemoting -Force"
        Log-Error $_.Exception.Message
    }
}

# ─── STEP 2: BUILD LOCAL ──────────────────────────────────
function Build-Local {
    Log-Title "Build TypeScript locally"
    Log-Info "Đang chạy: npm run build"
    
    $originalDir = Get-Location
    Set-Location $LOCAL_BE
    
    if (-not (Test-Path "node_modules")) {
        Log-Info "Cài đặt dependencies..."
        npm install
    }
    
    npm run build
    if ($LASTEXITCODE -ne 0) { Log-Error "Build thất bại!" }
    
    Log-Success "Build thành công! dist/ đã sẵn sàng."
    Set-Location $originalDir
}

# ─── STEP 3: UPLOAD CODE ──────────────────────────────────
function Upload-Code {
    Log-Title "Upload code lên VPS"
    
    $cred = Get-VPSCredential
    $session = New-PSSession -ComputerName $VPS_IP -Credential $cred
    
    Log-Info "Tạo thư mục $REMOTE_DIR trên VPS..."
    Invoke-Command -Session $session -ScriptBlock {
        param($dir)
        if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    } -ArgumentList $REMOTE_DIR
    
    $uploadItems = @(
        "src",
        "dist",
        "public",
        "assets",
        "data",
        "package.json",
        "package-lock.json",
        "ecosystem.config.js"
    )
    
    foreach ($item in $uploadItems) {
        $localPath = Join-Path $LOCAL_BE $item
        if (Test-Path $localPath) {
            Log-Info "Uploading: $item"
            $destPath = Join-Path $REMOTE_DIR (Split-Path $localPath -Leaf)
            Copy-Item -Path $localPath -Destination $REMOTE_DIR -ToSession $session -Recurse -Force
            Log-Success "Uploaded: $item"
        } else {
            Log-Warn "Không tìm thấy local: $item (bỏ qua)"
        }
    }
    
    Log-Info "Uploading .env.production → .env"
    $envFile = Join-Path $DEPLOY_DIR ".env.production"
    if (Test-Path $envFile) {
        $envDest = Join-Path $REMOTE_DIR ".env"
        Copy-Item -Path $envFile -Destination $envDest -ToSession $session -Force
        Log-Success ".env uploaded"
    } else {
        Log-Warn ".env.production không tìm thấy, bỏ qua"
    }
    
    Remove-PSSession $session
    Log-Success "Upload hoàn tất!"
}

# ─── STEP 4: INSTALL & START ON VPS ──────────────────────
function Deploy-OnVPS {
    Log-Title "Cài đặt và khởi động trên VPS"
    
    $cred = Get-VPSCredential
    $session = New-PSSession -ComputerName $VPS_IP -Credential $cred
    
    $scriptBlock = {
        param($appDir)
        Set-Location $appDir
        Write-Host "[>>] Cài đặt dependencies (production)..."
        npm install --omit=dev
        Write-Host "[>>] Khởi động ứng dụng với PM2..."
        if (-not (Get-Command pm2 -ErrorAction SilentlyContinue)) {
            Write-Host "[>>] Đang cài đặt PM2 global..."
            npm install -g pm2
        }
        pm2 stop DATN_BE 2>$null
        pm2 delete DATN_BE 2>$null
        pm2 start ecosystem.config.js
        pm2 save
        Start-Sleep -Seconds 3
        pm2 status
    }
    
    Invoke-Command -Session $session -ScriptBlock $scriptBlock -ArgumentList $REMOTE_DIR
    Remove-PSSession $session
    
    Log-Success "Deploy on VPS thành công!"
}

# ─── STEP 5: VERIFY DEPLOYMENT ────────────────────────────
function Verify-Deployment {
    Log-Title "Kiểm tra deployment"
    Log-Info "Đợi 5s cho server khởi động..."
    Start-Sleep -Seconds 5
    
    try {
        $response = Invoke-WebRequest -Uri "http://${VPS_IP}:5000" -TimeoutSec 10 -ErrorAction Stop
        Log-Success "API phản hồi: HTTP $($response.StatusCode)"
    } catch {
        Log-Warn "Không thể kết nối tới http://${VPS_IP}:5000. Có thể do Firewall chưa mở port."
    }
}

# ─── MAIN FLOW ────────────────────────────────────────────
Write-Host ""
Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     DATN_BE → Windows VPS Deploy Tool        ║" -ForegroundColor Cyan
Write-Host "║     IP: 160.187.229.211                      ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Check-WinRM

if ($CodeOnly) {
    Log-Title "MODE: Code Deploy Only"
    Test-Connection-VPS
    Build-Local
    Upload-Code
    Deploy-OnVPS
    Verify-Deployment
} else {
    Log-Title "MODE: Full Deploy"
    Test-Connection-VPS
    Build-Local
    Upload-Code
    Deploy-OnVPS
    Verify-Deployment
}

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  Deploy script đã chạy xong!                         ║" -ForegroundColor Green
Write-Host "║  API trực tiếp (nếu mở port): http://160.187.229.211:5000 ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
