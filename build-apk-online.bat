@echo off
chcp 65001 >nul
title بناء APK دليلك — النسخة الأونلاين

echo.
echo ████████████████████████████████████████
echo       دليلك — بناء APK الأونلاين
echo ████████████████████████████████████████
echo.

:: التحقق من Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [خطأ] Node.js غير مثبت! حمّله من nodejs.org
    pause & exit /b 1
)

:: التحقق من Java
java -version >nul 2>&1
if %errorlevel% neq 0 (
    echo [خطأ] Java غير مثبت! حمّله من adoptium.net
    pause & exit /b 1
)

echo [1/5] تثبيت الحزم...
call npm install
if %errorlevel% neq 0 (echo [خطأ] فشل تثبيت الحزم & pause & exit /b 1)

echo.
echo [2/5] بناء الفرونتند (production)...
call npm run build
if %errorlevel% neq 0 (echo [خطأ] فشل البناء & pause & exit /b 1)

echo.
echo [3/5] مزامنة مع Android (capacitor sync)...
call npx cap sync android
if %errorlevel% neq 0 (echo [خطأ] فشل المزامنة & pause & exit /b 1)

echo.
echo [4/5] بناء APK...
cd android
call gradlew.bat assembleDebug
if %errorlevel% neq 0 (
    echo [خطأ] فشل بناء APK
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo [5/5] نسخ APK...
set APK_SRC=android\app\build\outputs\apk\debug\app-debug.apk
set APK_DST=..\دليلك-online.apk

if exist "%APK_SRC%" (
    copy /y "%APK_SRC%" "%APK_DST%"
    echo.
    echo ████████████████████████████████████████
    echo   ✅ تم! APK جاهز:
    echo   دليلك-online.apk
    echo ████████████████████████████████████████
) else (
    echo [خطأ] لم يُوجد ملف APK في المسار المتوقع
)

echo.
pause
