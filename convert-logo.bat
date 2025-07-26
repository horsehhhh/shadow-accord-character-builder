@echo off
echo Converting Shadow Accord logo for Electron app...
echo.

REM Check if PowerShell is available
powershell -Command "Get-Command PowerShell" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Error: PowerShell not found!
    goto manual
)

REM Run the PowerShell script
powershell -ExecutionPolicy Bypass -File "convert-logo.ps1"
goto end

:manual
echo Manual conversion required:
echo 1. Open "shadow accord logo.jpeg" in an image editor
echo 2. Resize to 256x256 pixels
echo 3. Save as "public/shadow-accord-logo.png"
echo 4. Convert to ICO format using: https://convertio.co/png-ico/
echo 5. Save as "public/shadow-accord-logo.ico"

:end
echo.
pause
