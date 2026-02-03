@echo off
REM Set the repository root to the parent directory of this script
set TEXTGEN_REPO_ROOT=D:\_src\2026\electron-fiddle\text-gen-webui\text-generation-webui

echo Repository root set to: %TEXTGEN_REPO_ROOT%
echo.
echo Launching Electron Fiddle...
echo.

REM Launch Electron Fiddle (assumes it's in PATH or common install location)
if exist "%LOCALAPPDATA%\Programs\electron-fiddle\Electron Fiddle.exe" (
    start "" "%LOCALAPPDATA%\Programs\electron-fiddle\Electron Fiddle.exe" "%~dp0"
) else if exist "%PROGRAMFILES%\Electron Fiddle\Electron Fiddle.exe" (
    start "" "%PROGRAMFILES%\Electron Fiddle\Electron Fiddle.exe" "%~dp0"
) else (
    echo Could not find Electron Fiddle. Please launch it manually.
    echo The environment variable is set for this session.
    pause
)
