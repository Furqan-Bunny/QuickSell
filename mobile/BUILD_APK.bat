@echo off
echo ========================================
echo     Quicksell APK Builder
echo ========================================
echo.

REM Check if Java is installed
java -version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Java is not installed!
    echo.
    echo Please install Java first:
    echo 1. Download from: https://adoptium.net/
    echo 2. Choose OpenJDK 11 or 17 LTS
    echo 3. Install and restart this terminal
    echo.
    pause
    exit /b 1
)

echo Java found! Building APK...
echo.

cd android

REM Clean previous builds
echo Cleaning previous builds...
call gradlew.bat clean

REM Build debug APK
echo Building APK (this may take 3-5 minutes)...
call gradlew.bat assembleDebug

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo     BUILD SUCCESSFUL!
    echo ========================================
    echo.
    echo Your APK is ready at:
    echo %cd%\app\build\outputs\apk\debug\app-debug.apk
    echo.
    echo To install on your phone:
    echo 1. Transfer the APK file to your phone
    echo 2. Enable "Unknown Sources" in Settings
    echo 3. Open the APK and tap Install
    echo.
) else (
    echo.
    echo Build failed! Please check the error messages above.
    echo.
)

pause