# Ikkita duplicate loyihani to'liq sozlash script'i
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Ikkita Duplicate Loyiha Sozlash" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Qadam 1: Container'larni ishga tushirish
Write-Host "Qadam 1: Container'larni ishga tushiryapman..." -ForegroundColor Yellow
docker-compose up -d
Start-Sleep -Seconds 5
Write-Host "✅ Container'lar ishga tushdi" -ForegroundColor Green
Write-Host ""

# Qadam 2: Ikkinchi loyiha papkasini yaratish
Write-Host "Qadam 2: Ikkinchi loyiha papkasini yaratish..." -ForegroundColor Yellow
$lms2Path = "C:\lms2"

if (Test-Path $lms2Path) {
    Write-Host "⚠️  C:\lms2 papkasi allaqachon mavjud!" -ForegroundColor Yellow
    $response = Read-Host "U o'chirilsinmi va qayta yaratilsinmi? (y/n)"
    if ($response -eq "y") {
        Remove-Item -Path $lms2Path -Recurse -Force
        Write-Host "✅ Eski papka o'chirildi" -ForegroundColor Green
    } else {
        Write-Host "❌ Script to'xtatildi" -ForegroundColor Red
        exit
    }
}

Write-Host "Loyihani nusxalayapman (bu biroz vaqt olishi mumkin)..." -ForegroundColor Yellow
Copy-Item -Path "C:\lms" -Destination $lms2Path -Recurse -Exclude "node_modules",".next",".git"
Write-Host "✅ Ikkinchi loyiha papkasi yaratildi: $lms2Path" -ForegroundColor Green
Write-Host ""

# Qadam 3: Environment variables sozlash
Write-Host "Qadam 3: Environment variables sozlash..." -ForegroundColor Yellow

# Birinchi loyiha .env
$env1Path = "C:\lms\.env"
if (-not (Test-Path $env1Path)) {
    Write-Host "Birinchi loyiha uchun .env fayl yaratilmoqda..." -ForegroundColor Yellow
    $env1Content = @"
# Birinchi Loyiha - Container 1 (Port 5433)
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/school_lms?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="$(-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_}))"
SUPER_ADMIN_EMAIL="admin@schoollms.uz"
SUPER_ADMIN_PASSWORD="SuperAdmin123!"
"@
    Set-Content -Path $env1Path -Value $env1Content
    Write-Host "✅ Birinchi loyiha .env fayli yaratildi" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Birinchi loyiha .env fayli allaqachon mavjud" -ForegroundColor Cyan
}

# Ikkinchi loyiha .env
$env2Path = "$lms2Path\.env"
Write-Host "Ikkinchi loyiha uchun .env fayl yaratilmoqda..." -ForegroundColor Yellow
$env2Content = @"
# Ikkinchi Loyiha - Container 2 (Port 5434)
DATABASE_URL="postgresql://postgres:postgres2@localhost:5434/school_lms2?schema=public"
NEXTAUTH_URL="http://localhost:3001"
NEXTAUTH_SECRET="$(-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_}))"
SUPER_ADMIN_EMAIL="admin2@schoollms.uz"
SUPER_ADMIN_PASSWORD="SuperAdmin123!"
"@
Set-Content -Path $env2Path -Value $env2Content
Write-Host "✅ Ikkinchi loyiha .env fayli yaratildi" -ForegroundColor Green
Write-Host ""

# Qadam 4: Dependencies o'rnatish
Write-Host "Qadam 4: Dependencies o'rnatish..." -ForegroundColor Yellow
Write-Host "Ikkinchi loyihada dependencies o'rnatilmoqda (bu biroz vaqt olishi mumkin)..." -ForegroundColor Yellow
Set-Location $lms2Path
npm install
Write-Host "✅ Dependencies o'rnatildi" -ForegroundColor Green
Write-Host ""

# Qadam 5: Database schema push
Write-Host "Qadam 5: Database schema push qilish..." -ForegroundColor Yellow

# Birinchi loyiha
Write-Host "Birinchi loyiha schema push..." -ForegroundColor Yellow
Set-Location "C:\lms"
npm run db:generate
npm run db:push
Write-Host "✅ Birinchi loyiha schema push qilindi" -ForegroundColor Green

# Ikkinchi loyiha
Write-Host "Ikkinchi loyiha schema push..." -ForegroundColor Yellow
Set-Location $lms2Path
npm run db:generate
npm run db:push
Write-Host "✅ Ikkinchi loyiha schema push qilindi" -ForegroundColor Green
Write-Host ""

# Xulosa
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Barcha sozlamalar tugallandi!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Keyingi qadamlar:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Birinchi loyihani ishga tushirish:" -ForegroundColor Cyan
Write-Host "   cd C:\lms" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host "   URL: http://localhost:3000" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Ikkinchi loyihani ishga tushirish (YANGI TERMINAL):" -ForegroundColor Cyan
Write-Host "   cd C:\lms2" -ForegroundColor Gray
Write-Host "   PORT=3001 npm run dev" -ForegroundColor Gray
Write-Host "   URL: http://localhost:3001" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Login ma'lumotlari:" -ForegroundColor Cyan
Write-Host "   Birinchi: admin@schoollms.uz / SuperAdmin123!" -ForegroundColor Gray
Write-Host "   Ikkinchi: admin2@schoollms.uz / SuperAdmin123!" -ForegroundColor Gray
Write-Host ""

