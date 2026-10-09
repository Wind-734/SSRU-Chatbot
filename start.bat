@echo off
chcp 65001 >nul
title SSRU Chatbot Server
cls
echo ========================================================
echo          SSRU Chatbot - Suan Sunandha Rajabhat Univ
echo ========================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] ไม่พบ Node.js ในเครื่องนี้!
    echo กรุณาติดตั้ง Node.js จาก https://nodejs.org ก่อนเปิดใช้งาน
    echo.
    pause
    exit /b
)

echo [OK] ตรวจพบ Node.js เรียบร้อยแล้ว
echo กำลังเริ่มต้นระบบ SSRU Chatbot Server...
echo เปิดเบราว์เซอร์ไปที่: http://localhost:3000
echo.

start "" http://localhost:3000
node server.js
pause
