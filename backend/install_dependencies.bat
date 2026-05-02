@echo off
echo Installing SubLeech AI Agent Dependencies...
echo.

cd /d "%~dp0"

echo [1/3] Installing core dependencies...
pip install httpx pyyaml

echo.
echo [2/3] Installing LangChain...
pip install langchain

echo.
echo [3/3] Installing IBM watsonx integration...
pip install langchain-ibm

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Run: python test_live_orchestrate.py
echo 2. Or start the backend: uvicorn app.main:app --reload
echo.
pause

@REM Made with Bob
