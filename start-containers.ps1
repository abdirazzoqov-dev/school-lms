# Ikkala PostgreSQL container'ni ishga tushirish
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PostgreSQL Containers'ni Ishga Tushirish" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Container'larni ishga tushirish
Write-Host "Container'larni ishga tushiryapman..." -ForegroundColor Yellow
docker-compose up -d

# Kutilish
Write-Host "Container'lar tayyor bo'lishini kutmoqdaman (10 soniya)..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Holatni ko'rsatish
Write-Host ""
Write-Host "Container holati:" -ForegroundColor Green
docker ps | Select-String "school_lms"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Container'lar tayyor!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Birinchi Container:" -ForegroundColor Yellow
Write-Host "  - Container: school_lms_db" -ForegroundColor White
Write-Host "  - Port: localhost:5433" -ForegroundColor White
Write-Host "  - Database: school_lms" -ForegroundColor White
Write-Host "  - Parol: postgres" -ForegroundColor White
Write-Host ""
Write-Host "Ikkinchi Container:" -ForegroundColor Yellow
Write-Host "  - Container: school_lms_db2" -ForegroundColor White
Write-Host "  - Port: localhost:5434" -ForegroundColor White
Write-Host "  - Database: school_lms2" -ForegroundColor White
Write-Host "  - Parol: postgres2" -ForegroundColor White
Write-Host ""
Write-Host "Connection String'lar:" -ForegroundColor Cyan
Write-Host "  Container 1: postgresql://postgres:postgres@localhost:5433/school_lms" -ForegroundColor Gray
Write-Host "  Container 2: postgresql://postgres:postgres2@localhost:5434/school_lms2" -ForegroundColor Gray
Write-Host ""

