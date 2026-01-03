# Ikkala PostgreSQL container'ni to'xtatish
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "PostgreSQL Containers'ni To'xtatish" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""

# Container'larni to'xtatish
Write-Host "Container'larni to'xtatyapman..." -ForegroundColor Yellow
docker-compose stop

Write-Host ""
Write-Host "Container'lar to'xtatildi!" -ForegroundColor Green
Write-Host ""

# Holatni ko'rsatish
Write-Host "Container holati:" -ForegroundColor Cyan
docker ps -a | Select-String "school_lms"

Write-Host ""
Write-Host "Eslatma: Ma'lumotlar saqlanadi. Qayta ishga tushirish uchun:" -ForegroundColor Yellow
Write-Host "  docker-compose start" -ForegroundColor Gray
Write-Host "  yoki" -ForegroundColor Gray
Write-Host "  .\start-containers.ps1" -ForegroundColor Gray
Write-Host ""

