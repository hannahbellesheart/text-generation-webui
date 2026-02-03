@echo off
setlocal

if "%~1"=="" (
  echo Usage: download-model.bat organization/model
  echo Example: download-model.bat facebook/opt-1.3b
  exit /b 1
)

cd /d "%~dp0\.."
python download-model.py %*

endlocal
