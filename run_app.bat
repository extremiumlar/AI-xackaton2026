@echo off
REM Streamlit UI ni ishga tushirish
cd /d "%~dp0"

if not exist venv (
    echo [X] venv topilmadi! Avval setup.bat ni ishga tushiring
    pause
    exit /b 1
)

call venv\Scripts\activate.bat
streamlit run app.py
pause
