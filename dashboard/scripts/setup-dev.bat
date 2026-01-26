@echo off
REM Setup script for development environment on Windows
REM Run this after cloning the repo: npm run setup:dev

echo Setting up development environment...

set PUBLIC_DIR=%~dp0..\public
set SCREENSHOTS_SOURCE=%~dp0..\..\dws-report\reports\screenshots

REM Create public directory
if not exist "%PUBLIC_DIR%" mkdir "%PUBLIC_DIR%"

REM Remove existing symlink if it exists
if exist "%PUBLIC_DIR%\screenshots" rmdir "%PUBLIC_DIR%\screenshots"

REM Create symlink to screenshots folder (requires admin rights or developer mode on Windows 10+)
mklink /D "%PUBLIC_DIR%\screenshots" "%SCREENSHOTS_SOURCE%"

echo Created symlink: public\screenshots -^> dws-report\reports\screenshots
echo Development environment setup complete!
