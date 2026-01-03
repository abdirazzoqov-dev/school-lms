# Local Development ga o'tish script
# PowerShell script

Write-Host "🔄 Switching to LOCAL development..." -ForegroundColor Yellow

# .env.local fayl mavjudligini tekshirish
if (Test-Path ".env.local") {
    Copy-Item .env.local .env -Force
    Write-Host "✅ Switched to LOCAL development (Docker PostgreSQL)" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next steps:" -ForegroundColor Cyan
    Write-Host "   1. docker-compose up -d" -ForegroundColor White
    Write-Host "   2. npx prisma db push" -ForegroundColor White
    Write-Host "   3. npm run dev" -ForegroundColor White
} else {
    Write-Host "❌ .env.local fayl topilmadi!" -ForegroundColor Red
    Write-Host "📝 .env.local fayl yarating va quyidagi content qo'ying:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host 'DATABASE_URL="postgresql://postgres:postgres@localhost:5433/school_lms?schema=public"' -ForegroundColor Gray
    Write-Host 'NEXTAUTH_URL="http://localhost:3000"' -ForegroundColor Gray
    Write-Host 'NEXTAUTH_SECRET="kn8s9d7f6g5h4j3k2l1m0n9b8v7c6x5z4y3x2w1v0u9t8s7r6q5p4o3n2m110"' -ForegroundColor Gray
    Write-Host 'SUPER_ADMIN_EMAIL="admin@schoollms.uz"' -ForegroundColor Gray
    Write-Host 'SUPER_ADMIN_PASSWORD="SuperAdmin123!"' -ForegroundColor Gray
}

