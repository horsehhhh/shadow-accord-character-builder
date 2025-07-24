@echo off
echo Creating single executable for Shadow Accord Character Builder...
echo.

REM Check if 7-Zip is installed
set "SEVENZIP="
if exist "C:\Program Files\7-Zip\7z.exe" set "SEVENZIP=C:\Program Files\7-Zip\7z.exe"
if exist "C:\Program Files (x86)\7-Zip\7z.exe" set "SEVENZIP=C:\Program Files (x86)\7-Zip\7z.exe"

if "%SEVENZIP%"=="" (
    echo 7-Zip not found. Please install 7-Zip or manually create the executable.
    echo.
    echo Alternative: Use WinRAR to create self-extracting archive:
    echo 1. Right-click on dist\ShadowAccord-win32-x64 folder
    echo 2. Choose "Add to archive"
    echo 3. Set format to "RAR"
    echo 4. Check "Create SFX archive"
    echo 5. In "SFX options" - "General" tab, set "Path to extract" to %%TEMP%%\ShadowAccord
    echo 6. In "SFX options" - "Setup" tab, set "Run after extraction" to ShadowAccord.exe
    echo 7. Check "Silent mode" if desired
    pause
    exit /b 1
)

echo Found 7-Zip at: %SEVENZIP%
echo.

REM Create the self-extracting archive
echo Creating self-extracting executable...
"%SEVENZIP%" a -sfx7z.sfx "dist\ShadowAccord-CharacterBuilder-v0.1.6.exe" "dist\ShadowAccord-win32-x64\*"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo SUCCESS! Single executable created:
    echo dist\ShadowAccord-CharacterBuilder-v0.1.6.exe
    echo.
    echo File size:
    dir "dist\ShadowAccord-CharacterBuilder-v0.1.6.exe" | find ".exe"
    echo.
    echo This executable will:
    echo 1. Extract files to a temporary directory
    echo 2. Run the application
    echo 3. Clean up when closed
) else (
    echo ERROR: Failed to create executable
)

echo.
pause