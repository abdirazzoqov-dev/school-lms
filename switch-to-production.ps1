# Production (Supabase) ga o'tish script
# PowerShell script

Write-Host "🔄 Switching to PRODUCTION (Supabase)..." -ForegroundColor Yellow

# .env.production fayl mavjudligini tekshirish
if (Test-Path ".env.production") {
    Copy-Item .env.production .env -Force
    Write-Host "✅ Switched to PRODUCTION (Supabase)" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next steps:" -ForegroundColor Cyan
    Write-Host "   1. npx prisma db push" -ForegroundColor White
    Write-Host "   2. npm run dev (test qilish uchun)" -ForegroundColor White
    Write-Host "   3. Vercel deploy qilish" -ForegroundColor White
} else {
    Write-Host "❌ .env.production fayl topilmadi!" -ForegroundColor Red
    Write-Host "📝 .env.production fayl yarating va Supabase connection string qo'ying:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host 'DATABASE_URL="postgresql://postgres.[PROJECT-ID]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"' -ForegroundColor Gray
    Write-Host 'NEXTAUTH_URL="http://localhost:3000"' -ForegroundColor Gray
    Write-Host 'NEXTAUTH_SECRET="kn8s9d7f6g5h4j3k2l1m0n9b8v7c6x5z4y3x2w1v0u9t8s7r6q5p4o3n2m110"' -ForegroundColor Gray
    Write-Host 'SUPER_ADMIN_EMAIL="admin@schoollms.uz"' -ForegroundColor Gray
    Write-Host 'SUPER_ADMIN_PASSWORD="SuperAdmin123!"' -ForegroundColor Gray
}

