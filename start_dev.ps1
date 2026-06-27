#!/usr/bin/env pwsh
# SentinelAI — ishga tushirish skripti
# Foydalanish: .\start_dev.ps1

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "  ╔══════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  ║       SentinelAI Dev Launcher        ║" -ForegroundColor Cyan
Write-Host "  ╚══════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ── 1. Backend kutubxonalarini o'rnatish ──────────────────────────────────────
Write-Host "  [1/4] Backend kutubxonalari tekshirilmoqda..." -ForegroundColor Yellow
$pip = Join-Path $Root "venv\Scripts\pip.exe"
& $pip install -q -r (Join-Path $Root "backend\requirements_api.txt")
Write-Host "        OK" -ForegroundColor Green

# ── 2. Frontend kutubxonalarini o'rnatish ────────────────────────────────────
$frontDir = Join-Path $Root "frontend"
if (-not (Test-Path (Join-Path $frontDir "node_modules"))) {
    Write-Host "  [2/4] npm install..." -ForegroundColor Yellow
    Push-Location $frontDir
    npm install --silent
    Pop-Location
    Write-Host "        OK" -ForegroundColor Green
} else {
    Write-Host "  [2/4] node_modules mavjud — o'tkazib yuborildi" -ForegroundColor DarkGray
}

# ── 3. Backend (FastAPI + uvicorn) ishga tushirish ───────────────────────────
Write-Host "  [3/4] Backend ishga tushirilmoqda  →  http://localhost:8000" -ForegroundColor Yellow
$python = Join-Path $Root "venv\Scripts\python.exe"
$backendProc = Start-Process -FilePath $python `
    -ArgumentList "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--reload", "--port", "8000" `
    -WorkingDirectory $Root `
    -PassThru -WindowStyle Minimized
Write-Host "        PID $($backendProc.Id)" -ForegroundColor Green

Start-Sleep -Seconds 2

# ── 4. Frontend (Vite) ishga tushirish ───────────────────────────────────────
Write-Host "  [4/4] Frontend ishga tushirilmoqda  →  http://localhost:5173" -ForegroundColor Yellow
$viteCmd = Join-Path $frontDir "node_modules\.bin\vite.cmd"
Start-Process -FilePath $viteCmd -WorkingDirectory $frontDir -WindowStyle Minimized

Write-Host ""
Write-Host "  ✓  Barcha xizmatlar ishga tushdi!" -ForegroundColor Green
Write-Host ""
Write-Host "     Backend   →  http://localhost:8000" -ForegroundColor Cyan
Write-Host "     Frontend  →  http://localhost:5173" -ForegroundColor Cyan
Write-Host "     API docs  →  http://localhost:8000/docs" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  To'xtatish uchun: Ctrl+C yoki oynalarni yoping" -ForegroundColor DarkGray
Write-Host ""

# Brauzerda ochish
Start-Sleep -Seconds 3
Start-Process "http://localhost:5173"

# Backend jarayonini to'xtatmasdan kutish
Wait-Process -Id $backendProc.Id -ErrorAction SilentlyContinue
