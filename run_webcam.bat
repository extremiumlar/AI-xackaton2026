@echo off
REM Webcam orqali real-time aniqlash
cd /d "%~dp0"

if not exist venv (
    echo [X] venv topilmadi! Avval setup.bat ni ishga tushiring
    pause
    exit /b 1
)

call venv\Scripts\activate.bat
python cli.py --source 0 --show
pause
