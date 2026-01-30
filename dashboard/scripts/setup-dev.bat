@echo off
REM Setup script for development environment on Windows
REM Run this after cloning the repo: npm run setup:dev

echo Setting up development environment...

set PUBLIC_DIR=%~dp0..\public
set SCREENSHOTS_SOURCE=%~dp0..\..\dws-report\reports\screenshots

REM Create public directory
if not exist "%PUBLIC_DIR%" mkdir "%PUBLIC_DIR%"

REM Check if source screenshots directory exists
if not exist "%SCREENSHOTS_SOURCE%" (
    echo Error: Screenshots source directory does not exist: %SCREENSHOTS_SOURCE%
    echo Please run the collector to generate test reports and screenshots first.
    exit /b 1
)

REM Remove existing screenshots entry if it exists (handle directory/symlink vs file explicitly)
if exist "%PUBLIC_DIR%\screenshots" (
    REM If "%PUBLIC_DIR%\screenshots" behaves like a directory (including junction/symlink), use rmdir
    if exist "%PUBLIC_DIR%\screenshots\NUL" (
        rmdir "%PUBLIC_DIR%\screenshots"
    ) else (
        REM Otherwise treat it as a file
        del "%PUBLIC_DIR%\screenshots"
    )
    if errorlevel 1 (
        echo Failed to remove existing "%PUBLIC_DIR%\screenshots". Please delete it manually and re-run this script.
        exit /b 1
    )
)

REM Create symlink to screenshots folder (requires admin rights or developer mode on Windows 10+)
mklink /D "%PUBLIC_DIR%\screenshots" "%SCREENSHOTS_SOURCE%"
if errorlevel 1 (
    echo Failed to create symlink "%PUBLIC_DIR%\screenshots" -^> "%SCREENSHOTS_SOURCE%".
    echo Ensure you are running this script with administrative privileges or Developer Mode enabled.
    exit /b 1
)

echo Created symlink: public\screenshots -^> dws-report\reports\screenshots
echo Development environment setup complete!
