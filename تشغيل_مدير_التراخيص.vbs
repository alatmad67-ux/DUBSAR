' DUBSAR 2.0 - مشغل استوديو التراخيص الصامت (بدون شاشة كونسول سوداء)
' للمطور: حسين صلاح

Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")
CurrentDir = FSO.GetParentFolderName(WScript.ScriptFullName)

' تشغيل خادم الواجهة الرسومية في الخلفية بدون أي نافذة سوداء
WshShell.Run "node """ & CurrentDir & "\scripts\license-server.js""", 0, False
