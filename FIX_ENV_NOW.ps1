# .env faylni lokal Docker PostgreSQL ga sozlash
# PowerShell script

Write-Host "🔧 .env faylni lokal Docker PostgreSQL ga sozlash..." -ForegroundColor Cyan
Write-Host ""

# .env fayl mavjudligini tekshirish
if (-not (Test-Path ".env")) {
    Write-Host "❌ .env fayl topilmadi!" -ForegroundColor Red
    exit 1
}

# .env faylni backup qilish
$backupName = ".env.backup-$(Get-Date -Format 'yyyy-MM-dd-HHmmss')"
Copy-Item .env $backupName
Write-Host "✅ .env fayl backup qilindi: $backupName" -ForegroundColor Green

# .env fayl content ni o'qish
$envContent = Get-Content .env -Raw

# Supabase connection string ni lokal Docker PostgreSQL ga almashtirish
$newEnvContent = $envContent -replace 'DATABASE_URL="postgresql://[^"]*"', 'DATABASE_URL="postgresql://postgres:postgres@localhost:5433/school_lms?schema=public"'

# Agar o'zgarish bo'lmasa, to'liq yangi content yozish
if ($newEnvContent -eq $envContent) {
    Write-Host "⚠️  DATABASE_URL topilmadi, to'liq yangi .env fayl yaratilmoqda..." -ForegroundColor Yellow
    
    $lines = @(
        "# ============================================",
        "# DATABASE CONFIGURATION (LOCAL DOCKER)",
        "# ============================================",
        'DATABASE_URL="postgresql://postgres:postgres@localhost:5433/school_lms?schema=public"',
        "",
        "# ============================================",
        "# AUTHENTICATION",
        "# ============================================",
        'NEXTAUTH_URL="http://localhost:3000"',
        'NEXTAUTH_SECRET="kn8s9d7f6g5h4j3k2l1m0n9b8v7c6x5z4y3x2w1v0u9t8s7r6q5p4o3n2m110"',
        "",
        "# ============================================",
        "# SUPER ADMIN",
        "# ============================================",
        'SUPER_ADMIN_EMAIL="admin@schoollms.uz"',
        'SUPER_ADMIN_PASSWORD="SuperAdmin123!"',
        "",
        "# ============================================",
        "# ENVIRONMENT",
        "# ============================================",
        'NODE_ENV="development"'
    )
    
    $newEnvContent = $lines -join "`n"
}

# .env faylni yangilash
Set-Content -Path ".env" -Value $newEnvContent

Write-Host "✅ .env fayl yangilandi!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Keyingi qadamlar:" -ForegroundColor Yellow
Write-Host "   1. npm run db:generate" -ForegroundColor White
Write-Host "   2. npx prisma db push" -ForegroundColor White
Write-Host "   3. npm run dev" -ForegroundColor White
Write-Host ""
