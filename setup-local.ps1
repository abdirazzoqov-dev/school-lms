# Lokal kompyuterda to'liq setup script
# PowerShell script

Write-Host "🚀 Lokal kompyuterda to'liq setup..." -ForegroundColor Cyan
Write-Host ""

# 1. Docker Container Status
Write-Host "1️⃣ Docker container status tekshirish..." -ForegroundColor Yellow
$containerStatus = docker ps -a --filter "name=school_lms_db" --format "{{.Status}}"

if ($containerStatus -match "Up") {
    Write-Host "✅ Container ishlayapti" -ForegroundColor Green
} else {
    Write-Host "⚠️  Container to'xtatilgan, ishga tushirilmoqda..." -ForegroundColor Yellow
    docker-compose up -d
    Start-Sleep -Seconds 3
    Write-Host "✅ Container ishga tushirildi" -ForegroundColor Green
}

# 2. .env Fayl Tekshirish
Write-Host ""
Write-Host "2️⃣ .env fayl tekshirish..." -ForegroundColor Yellow

if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env fayl topilmadi, yaratilmoqda..." -ForegroundColor Yellow
    
    $envContent = @"
# ============================================
# DATABASE CONFIGURATION (LOCAL DOCKER)
# ============================================
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/school_lms?schema=public"

# ============================================
# AUTHENTICATION
# ============================================
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="kn8s9d7f6g5h4j3k2l1m0n9b8v7c6x5z4y3x2w1v0u9t8s7r6q5p4o3n2m110"

# ============================================
# SUPER ADMIN
# ============================================
SUPER_ADMIN_EMAIL="admin@schoollms.uz"
SUPER_ADMIN_PASSWORD="SuperAdmin123!"

# ============================================
# ENVIRONMENT
# ============================================
NODE_ENV="development"
"@
    
    Set-Content -Path ".env" -Value $envContent
    Write-Host "✅ .env fayl yaratildi" -ForegroundColor Green
} else {
    # .env fayl mavjud, lokal connection string tekshirish
    $envContent = Get-Content ".env" -Raw
    
    if ($envContent -notmatch "localhost:5433") {
        Write-Host "⚠️  .env fayl lokal Docker PostgreSQL ga sozlanmagan" -ForegroundColor Yellow
        Write-Host "📝 .env faylni quyidagi content bilan yangilang:" -ForegroundColor Cyan
        Write-Host ""
        Write-Host 'DATABASE_URL="postgresql://postgres:postgres@localhost:5433/school_lms?schema=public"' -ForegroundColor Gray
        Write-Host ""
        Write-Host "Keyin script ni qayta ishga tushiring." -ForegroundColor Yellow
        exit 1
    } else {
        Write-Host "✅ .env fayl to'g'ri sozlangan" -ForegroundColor Green
    }
}

# 3. Prisma Client Generate
Write-Host ""
Write-Host "3️⃣ Prisma Client generate qilish..." -ForegroundColor Yellow
npm run db:generate
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Prisma Client generate qilindi" -ForegroundColor Green
} else {
    Write-Host "❌ Prisma Client generate xatosi!" -ForegroundColor Red
    exit 1
}

# 4. Schema Push
Write-Host ""
Write-Host "4️⃣ Database schema push qilish..." -ForegroundColor Yellow
npx prisma db push
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Schema push qilindi" -ForegroundColor Green
} else {
    Write-Host "❌ Schema push xatosi!" -ForegroundColor Red
    exit 1
}

# 5. Ma'lumotlar Yuklash
Write-Host ""
Write-Host "5️⃣ Ma'lumotlar yuklash..." -ForegroundColor Yellow

if (Test-Path "backup.sql") {
    Write-Host "📦 backup.sql topildi, import qilinmoqda..." -ForegroundColor Cyan
    Get-Content backup.sql | docker exec -i school_lms_db psql -U postgres -d school_lms 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ backup.sql import qilindi" -ForegroundColor Green
    } else {
        Write-Host "⚠️  backup.sql import xatosi, demo ma'lumotlar yaratilmoqda..." -ForegroundColor Yellow
        npm run db:seed
    }
} else {
    Write-Host "📦 backup.sql topilmadi, demo ma'lumotlar yaratilmoqda..." -ForegroundColor Cyan
    npm run db:seed
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Demo ma'lumotlar yaratildi" -ForegroundColor Green
    }
}

# 6. Final
Write-Host ""
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host "✅ TO'LIQ SETUP TUGALLANDI!" -ForegroundColor Green
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Keyingi qadamlar:" -ForegroundColor Yellow
Write-Host "   1. npm run dev          - Development server ishga tushirish" -ForegroundColor White
Write-Host "   2. npm run db:studio    - Prisma Studio (http://localhost:5555)" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Brauzerda: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔐 Login: admin@schoollms.uz / SuperAdmin123!" -ForegroundColor Cyan
Write-Host ""

