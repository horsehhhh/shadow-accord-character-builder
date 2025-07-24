@echo off
echo Creating Shadow Accord Character Builder Release Package...

REM Clean up previous builds
if exist "dist\shadow-accord-release" rmdir /s /q "dist\shadow-accord-release"

REM Create release directory
mkdir "dist\shadow-accord-release"

REM Copy optimized build
xcopy "dist\shadow-accord-fixed-win32-x64\*" "dist\shadow-accord-release\" /E /I /Y

REM Remove unnecessary locale files (keep only English)
if exist "dist\shadow-accord-release\locales" (
    cd "dist\shadow-accord-release\locales"
    for %%f in (*.pak) do (
        if not "%%f"=="en-US.pak" if not "%%f"=="en-GB.pak" del "%%f"
    )
    cd "..\..\.."
)

REM Create ZIP archive
powershell "Compress-Archive -Path 'dist\shadow-accord-release\*' -DestinationPath 'dist\ShadowAccord-CharacterBuilder-v0.1.6-Windows.zip' -Force"

echo.
echo Release package created: dist\ShadowAccord-CharacterBuilder-v0.1.6-Windows.zip
echo.
echo To distribute:
echo 1. Extract the ZIP file
echo 2. Run shadow-accord-fixed.exe
echo.
pause