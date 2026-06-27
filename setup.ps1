# Zakladchik Detector - O'rnatish skripti
# Usage: .\setup.ps1

$ErrorActionPreference = "Stop"

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  ZAKLADCHIK DETECTOR - SETUP" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Python tekshirish
Write-Host "[1/4] Python tekshirilmoqda..." -ForegroundColor Yellow
try {
    $pyver = & python --version 2>&1
    Write-Host "  [OK] $pyver" -ForegroundColor Green
}
catch {
    Write-Host "  [X] Python topilmadi. https://python.org dan o'rnating" -ForegroundColor Red
    exit 1
}

# Virtual environment
Write-Host ""
Write-Host "[2/4] Virtual environment yaratilmoqda..." -ForegroundColor Yellow
if (Test-Path "venv") {
    Write-Host "  [=] venv allaqachon mavjud" -ForegroundColor Yellow
} else {
    python -m venv venv
    Write-Host "  [OK] venv yaratildi" -ForegroundColor Green
}

# Activate
Write-Host ""
Write-Host "[3/4] Paketlarni o'rnatish..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt

Write-Host ""
Write-Host "[4/4] Modellar tayyorlash (avtomatik birinchi ishga tushishda yuklanadi)" -ForegroundColor Yellow

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "  TAYYOR!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Ishga tushirish:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Streamlit UI:" -ForegroundColor White
Write-Host "    streamlit run app.py" -ForegroundColor Gray
Write-Host ""
Write-Host "  Komanda qatori (webcam):" -ForegroundColor White
Write-Host "    python cli.py --source 0 --show" -ForegroundColor Gray
Write-Host ""
Write-Host "  Komanda qatori (video fayl):" -ForegroundColor White
Write-Host "    python cli.py --source samples\test.mp4" -ForegroundColor Gray
