@echo off
chcp 65001 >nul
title DUBSAR 2.0 - License Studio
echo ========================================================
echo DUBSAR 2.0 - استوديو إدارة وتوليد التراخيص والفواتير
echo ========================================================
echo جاري تهيئة الخادم وتشغيل أحدث إصدار...

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :4242') do (
    taskkill /f /pid %%a >nul 2>&1
)

start "" node "%~dp0scripts\license-server.js"
