/**
 * DUBSAR 2.0 Official License Generator Entry Point
 * للمطور: حسين صلاح
 * 
 * يطلق فوراً الواجهة الرسومية الحديثة (License Studio GUI)
 * لتفادي أي تشوه أو انعكاس للنصوص العربية في موجه الأوامر (CMD)
 */

const path = require('path');
const { spawn } = require('child_process');

console.log('\n=============================================================');
console.log(' ✨ DUBSAR 2.0 - جاري فتح استوديو إدارة وتوليد التراخيص الرسومي...');
console.log('=============================================================\n');

const serverScript = path.join(__dirname, 'license-server.js');
const child = spawn(process.execPath, [serverScript], {
  detached: false,
  stdio: 'inherit'
});

child.on('error', (err) => {
  console.error('تعذر تشغيل خادم التراخيص:', err.message);
});
