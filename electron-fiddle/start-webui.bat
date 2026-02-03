@echo off
setlocal

REM Start the Text Generation Web UI server.
REM If you use conda, uncomment the next two lines and update the env name.
REM call conda activate textgen
REM echo Using conda env: textgen

cd /d "%~dp0\.."
python server.py

endlocal
