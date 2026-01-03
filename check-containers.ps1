# Container'lar holatini tekshirish
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PostgreSQL Containers Holati" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Container'larni ko'rsatish
$containers = docker ps -a | Select-String "school_lms"

if ($containers) {
    Write-Host "Topilgan container'lar:" -ForegroundColor Green
    Write-Host ""
    docker ps -a | Select-String "school_lms"
    Write-Host ""
    
    # Health check
    Write-Host "Health Check:" -ForegroundColor Yellow
    Write-Host ""
    
    # Birinchi container
    Write-Host "Birinchi Container (school_lms_db):" -ForegroundColor Cyan
    $result1 = docker exec school_lms_db pg_isready -U postgres 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Ishlayapti" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Ishlamayapti" -ForegroundColor Red
    }
    
    # Ikkinchi container
    Write-Host "Ikkinchi Container (school_lms_db2):" -ForegroundColor Cyan
    $result2 = docker exec school_lms_db2 pg_isready -U postgres 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Ishlayapti" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Ishlamayapti" -ForegroundColor Red
    }
    
} else {
    Write-Host "❌ Hech qanday container topilmadi!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Container'larni ishga tushirish uchun:" -ForegroundColor Yellow
    Write-Host "  .\start-containers.ps1" -ForegroundColor Gray
}

Write-Host ""

