/**
 * @fileOverview DUBSAR 2.0 Official GitHub Release & Updater Automated Publisher
 * للمطور: حسين صلاح
 * 
 * يقوم بإعداد حزمة التحديث الموقعة رقمياً ورفعها آلياً إلى GitHub Releases
 * وتحديث ملف latest.json ليعمل التحديث التلقائي لكافة الزبائن فوراً وبدون أي تدخل يدوي.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const REPO_OWNER = 'alatmad67-ux';
const REPO_NAME = 'DUBSAR';

// Paths
const ROOT_DIR = path.resolve(__dirname, '..');
const TAURI_DIR = path.join(process.env.USERPROFILE, '.tauri');
const TOKEN_FILE_PATH = path.join(TAURI_DIR, 'github_token.txt');
const DIST_RELEASE_DIR = path.join(ROOT_DIR, 'dist-release');

// 1. Read Version
const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8'));
const version = packageJson.version;
const tagName = `v${version}`;

console.log(`\n======================================================`);
console.log(` 🚀 DUBSAR 2.0 - محرك النشر الآلي لإصدار: ${tagName}`);
console.log(`======================================================\n`);

// Get GitHub Token from ENV, argument, or token file
let githubToken = process.env.GITHUB_TOKEN;
const tokenArg = process.argv.find(a => a.startsWith('--token='));
if (tokenArg) {
  githubToken = tokenArg.split('=')[1].trim();
} else if (!githubToken && fs.existsSync(TOKEN_FILE_PATH)) {
  githubToken = fs.readFileSync(TOKEN_FILE_PATH, 'utf8').trim();
}

// 2. Check built artifacts
const nsisDir = path.join(ROOT_DIR, 'src-tauri', 'target', 'release', 'bundle', 'nsis');
const msiDir = path.join(ROOT_DIR, 'src-tauri', 'target', 'release', 'bundle', 'msi');

const exeName = `DUBSAR 2.0_${version}_x64-setup.exe`;
const exePath = path.join(nsisDir, exeName);
const sigPath = path.join(nsisDir, `${exeName}.sig`);
const msiName = `DUBSAR 2.0_${version}_x64_en-US.msi`;
const msiPath = path.join(msiDir, msiName);

if (!fs.existsSync(exePath) || !fs.existsSync(sigPath)) {
  console.log('⚠️ لم يتم العثور على ملفات التثبيت المبنية لهذا الإصدار.');
  console.log('جاري تشغيل بناء النسخة الموقعة desktop:build الآن...');
  try {
    execSync('npm.cmd run desktop:build', { stdio: 'inherit', cwd: ROOT_DIR });
  } catch (err) {
    console.error('❌ فشل بناء النسخة:', err.message);
    process.exit(1);
  }
}

if (!fs.existsSync(exePath) || !fs.existsSync(sigPath)) {
  console.error('❌ تعذر العثور على ملفات التثبيت بعد البناء:', exePath);
  process.exit(1);
}

// 3. Prepare latest.json
const signature = fs.readFileSync(sigPath, 'utf8').trim();
// Standard release filename on GitHub
const remoteExeName = `DUBSAR.2.0_${version}_x64-setup.exe`;

const latestJsonContent = {
  version: version,
  notes: `DUBSAR ${version} - التحديث الرسمي الشامل: ترقية نظام التراخيص الدائم Lifetime للتوافق التام مع الحروف العربية والـ Unicode، إضافة قوالب طباعة الفواتير A4 المرنة مع إمكانية إخفاء وإظهار الأعمدة والهيدر المخصص، والتحديثات الأمنية.`,
  pub_date: new Date().toISOString(),
  platforms: {
    'windows-x86_64': {
      signature: signature,
      url: `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/download/${tagName}/${remoteExeName}`
    }
  }
};

// Ensure dist-release directory exists
if (!fs.existsSync(DIST_RELEASE_DIR)) {
  fs.mkdirSync(DIST_RELEASE_DIR, { recursive: true });
}

// Copy and prepare release artifacts
const distLatestJsonPath = path.join(DIST_RELEASE_DIR, 'latest.json');
fs.writeFileSync(distLatestJsonPath, JSON.stringify(latestJsonContent, null, 2), 'utf8');
fs.writeFileSync(path.join(ROOT_DIR, 'latest.json'), JSON.stringify(latestJsonContent, null, 2), 'utf8');
fs.writeFileSync(path.join(nsisDir, 'latest.json'), JSON.stringify(latestJsonContent, null, 2), 'utf8');

const distExePath = path.join(DIST_RELEASE_DIR, remoteExeName);
const distSigPath = path.join(DIST_RELEASE_DIR, `${remoteExeName}.sig`);
fs.copyFileSync(exePath, distExePath);
fs.copyFileSync(sigPath, distSigPath);

let hasMsi = false;
let distMsiPath = '';
if (fs.existsSync(msiPath)) {
  distMsiPath = path.join(DIST_RELEASE_DIR, `DUBSAR.2.0_${version}_x64_en-US.msi`);
  fs.copyFileSync(msiPath, distMsiPath);
  hasMsi = true;
}

console.log('✅ تم تجهيز حزمة التحديث الموقعة بنجاح في مجلد: dist-release/');
console.log(`• ملف الإعداد: ${remoteExeName} (${(fs.statSync(distExePath).size / 1024 / 1024).toFixed(2)} MB)`);
console.log(`• ملف التوقيع الرقمي: ${remoteExeName}.sig`);
console.log(`• ملف بيانات التحديث: latest.json`);
if (hasMsi) console.log(`• حزمة MSI: DUBSAR.2.0_${version}_x64_en-US.msi`);

// 4. Automated Upload to GitHub
if (!githubToken) {
  console.log('\n------------------------------------------------------------------');
  console.log('ℹ️ لم يتم تعيين GitHub Token للرفع التلقائي المباشر.');
  console.log('لحفظ التوكن لمرة واحدة ليعمل الرفع التلقائي دوماً دون تدخلك:');
  console.log(`احفظ التوكن في الملف: ${TOKEN_FILE_PATH}`);
  console.log('أو شغل الأمر التالي مع التوكن:');
  console.log(`node scripts/publish-updater.js --token=YOUR_GITHUB_TOKEN`);
  console.log('------------------------------------------------------------------\n');
  process.exit(0);
}

// Helper: GitHub API Request
function githubApi(endpoint, method = 'GET', data = null, contentType = 'application/json') {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint.startsWith('http') ? endpoint : `https://api.github.com${endpoint}`);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'User-Agent': 'DUBSAR-Release-Publisher',
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    if (contentType) {
      options.headers['Content-Type'] = contentType;
    }
    if (data && Buffer.isBuffer(data)) {
      options.headers['Content-Length'] = data.length;
    }

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(body || '{}'));
          } catch (e) {
            resolve(body);
          }
        } else {
          reject(new Error(`GitHub API Error (${res.statusCode}): ${body}`));
        }
      });
    });

    req.on('error', reject);
    if (data) {
      if (Buffer.isBuffer(data)) {
        req.write(data);
      } else {
        req.write(typeof data === 'string' ? data : JSON.stringify(data));
      }
    }
    req.end();
  });
}

// Upload Release Asset
function uploadAsset(uploadUrlTemplate, filePath, fileName, contentType = 'application/octet-stream') {
  const fileBytes = fs.readFileSync(filePath);
  const uploadUrl = uploadUrlTemplate.replace(/\{(\?name,label|name)\}/g, `?name=${encodeURIComponent(fileName)}`);

  return new Promise((resolve, reject) => {
    const url = new URL(uploadUrl);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'User-Agent': 'DUBSAR-Release-Publisher',
        'Authorization': `token ${githubToken}`,
        'Content-Type': contentType,
        'Content-Length': fileBytes.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`  ✔ تم رفع: ${fileName}`);
          resolve(JSON.parse(body || '{}'));
        } else {
          reject(new Error(`فشل رفع ${fileName} (${res.statusCode}): ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(fileBytes);
    req.end();
  });
}

async function runPublish() {
  try {
    console.log(`\n📡 الاتصال بمستودع GitHub (${REPO_OWNER}/${REPO_NAME})...`);
    
    // Check or create release
    let release;
    try {
      release = await githubApi(`/repos/${REPO_OWNER}/${REPO_NAME}/releases/tags/${tagName}`);
      console.log(`ℹ️ تم العثور على Release موجود سابقاً لـ ${tagName}.`);
    } catch (e) {
      console.log(`✨ جاري إنشاء Release رسمي جديد: ${tagName}...`);
      release = await githubApi(`/repos/${REPO_OWNER}/${REPO_NAME}/releases`, 'POST', {
        tag_name: tagName,
        target_commitish: 'main',
        name: `DUBSAR v${version} Official Release`,
        body: latestJsonContent.notes,
        draft: false,
        prerelease: false
      });
      console.log(`✔ تم إنشاء الإصدار ${tagName} بنجاح!`);
    }

    const uploadUrl = release.upload_url;
    console.log('\n📦 جاري رفع ملفات التثبيت والتحديث الموقعة...');

    // Upload Files
    await uploadAsset(uploadUrl, distExePath, remoteExeName, 'application/vnd.microsoft.portable-executable');
    await uploadAsset(uploadUrl, distSigPath, `${remoteExeName}.sig`, 'text/plain');
    await uploadAsset(uploadUrl, distLatestJsonPath, 'latest.json', 'application/json');

    if (hasMsi) {
      await uploadAsset(uploadUrl, distMsiPath, `DUBSAR.2.0_${version}_x64_en-US.msi`, 'application/x-msi');
    }

    console.log(`\n======================================================`);
    console.log(` 🎉 تم نشر تحديث DUBSAR v${version} بنجاح على GitHub!`);
    console.log(` رابط التحديث: https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/tag/${tagName}`);
    console.log(` رابط فحص التحديثات: https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/latest/download/latest.json`);
    console.log(`======================================================\n`);
  } catch (err) {
    console.error('❌ خطأ أثناء الرفع إلى GitHub:', err.message);
  }
}

runPublish();
