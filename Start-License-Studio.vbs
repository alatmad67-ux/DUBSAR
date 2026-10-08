Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")
CurrentDir = FSO.GetParentFolderName(WScript.ScriptFullName)

' إغلاق أي عملية قديمة على المنفذ 4242
WshShell.Run "cmd /c for /f ""tokens=5"" %a in ('netstat -aon ^| findstr :4242') do taskkill /f /pid %a", 0, True

' تشغيل الخادم النظيف
WshShell.Run "node """ & CurrentDir & "\scripts\license-server.js""", 0, False
