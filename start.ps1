Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Ongwaeh Penetration Testing Platform  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectDir

Write-Host "[1/3] Installing dependencies..." -ForegroundColor Yellow
cd backend; npm install; cd ..
cd frontend; npm install; cd ..

Write-Host ""
Write-Host "[2/3] Seeding database..." -ForegroundColor Yellow
cd backend; node seed.js; cd ..

Write-Host ""
Write-Host "[3/3] Starting development servers..." -ForegroundColor Yellow
Write-Host ""
Write-Host "  Backend:  http://localhost:5000" -ForegroundColor Green
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "  Default login: admin / password123" -ForegroundColor Cyan
Write-Host "  Tester login:  brian.ongwaeh / password123" -ForegroundColor Cyan
Write-Host ""

npm run dev
