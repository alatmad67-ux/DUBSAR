@echo off
chcp 65001 > nul
title DUBSAR 2.0 • License Studio
echo جاري تشغيل استوديو التراخيص الرسومي...
wscript.exe "%~dp0تشغيل_مدير_التراخيص.vbs"
exit
