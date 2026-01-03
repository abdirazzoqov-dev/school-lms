# PowerShell script to fix Prisma generate EPERM error

Write-Host "Prisma Generate Fix Script" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green
Write-Host ""

# Step 1: Kill all node processes
Write-Host "1. Stopping all Node.js processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "   ✓ Node processes stopped" -ForegroundColor Green

# Step 2: Remove .prisma folder if exists
Write-Host "2. Cleaning .prisma folder..." -ForegroundColor Yellow
if (Test-Path "node_modules\.prisma") {
    Remove-Item -Recurse -Force "node_modules\.prisma" -ErrorAction SilentlyContinue
    Write-Host "   ✓ .prisma folder removed" -ForegroundColor Green
} else {
    Write-Host "   ✓ .prisma folder doesn't exist" -ForegroundColor Green
}

# Step 3: Generate Prisma client
Write-Host "3. Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Prisma client generated successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now start the dev server:" -ForegroundColor Cyan
    Write-Host "  npm run dev" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "✗ Error generating Prisma client" -ForegroundColor Red
    Write-Host "  Please try manually: npx prisma generate" -ForegroundColor Yellow
}

