@echo off
setlocal

echo ================================================
echo   ZAKLADCHIK DETECTOR - SETUP
echo ================================================
echo.

REM Python tekshirish
echo [1/4] Python tekshirilmoqda...
python --version >nul 2>&1
if errorlevel 1 (
    echo   [X] Python topilmadi!
    echo   https://python.org dan o'rnating va PATH ga qo'shing
    pause
    exit /b 1
)
python --version
echo   [OK] Python topildi
echo.

REM Virtual environment
echo [2/4] Virtual environment yaratilmoqda...
if exist venv (
    echo   [=] venv allaqachon mavjud
) else (
    python -m venv venv
    if errorlevel 1 (
        echo   [X] venv yaratilmadi
        pause
        exit /b 1
    )
    echo   [OK] venv yaratildi
)
echo.

REM Activate va install
echo [3/4] Paketlarni o'rnatish (5-10 daqiqa)...
call venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -r requirements.txt
if errorlevel 1 (
    echo   [X] Paketlarni o'rnatishda xato
    pause
    exit /b 1
)
echo   [OK] Hammasi o'rnatildi
echo.

echo [4/4] Modellar birinchi ishga tushishda avtomatik yuklanadi
echo.

echo ================================================
echo   TAYYOR!
echo ================================================
echo.
echo Ishga tushirish:
echo.
echo   Streamlit UI:
echo     venv\Scripts\activate
echo     streamlit run app.py
echo.
echo   Komanda qatori (webcam):
echo     venv\Scripts\activate
echo     python cli.py --source 0 --show
echo.
echo   Komanda qatori (video fayl):
echo     venv\Scripts\activate
echo     python cli.py --source samples\test.mp4
echo.
pause
