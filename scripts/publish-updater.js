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
const { execSync, execFile } = require('child_process');

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

let exeName = `DUBSAR_${version}_x64-setup.exe`;
let exePath = path.join(nsisDir, exeName);
let sigPath = path.join(nsisDir, `${exeName}.sig`);

if (!fs.existsSync(exePath) && fs.existsSync(path.join(nsisDir, `DUBSAR 2.0_${version}_x64-setup.exe`))) {
  exeName = `DUBSAR 2.0_${version}_x64-setup.exe`;
  exePath = path.join(nsisDir, exeName);
  sigPath = path.join(nsisDir, `${exeName}.sig`);
}

let msiName = `DUBSAR_${version}_x64_en-US.msi`;
let msiPath = path.join(msiDir, msiName);
if (!fs.existsSync(msiPath) && fs.existsSync(path.join(msiDir, `DUBSAR 2.0_${version}_x64_en-US.msi`))) {
  msiName = `DUBSAR 2.0_${version}_x64_en-US.msi`;
  msiPath = path.join(msiDir, msiName);
}

if (!fs.existsSync(exePath) || !fs.existsSync(sigPath)) {
  console.log('⚠️ لم يتم العثور على ملفات التثبيت المبنية لهذا الإصدار.');
  console.log('جاري تشغيل بناء النسخة الموقعة desktop:build الآن...');
  try {
    const keyFile = path.join(TAURI_DIR, 'dubsar_updater.key');
    const buildEnv = { ...process.env };
    if (!buildEnv.TAURI_SIGNING_PRIVATE_KEY && fs.existsSync(keyFile)) {
      buildEnv.TAURI_SIGNING_PRIVATE_KEY = fs.readFileSync(keyFile, 'utf8').trim();
      buildEnv.TAURI_SIGNING_PRIVATE_KEY_PASSWORD = '';
    }
    execSync('npm.cmd run desktop:build', { stdio: 'inherit', cwd: ROOT_DIR, env: buildEnv });
    if (!fs.existsSync(exePath) && fs.existsSync(path.join(nsisDir, `DUBSAR_${version}_x64-setup.exe`))) {
      exeName = `DUBSAR_${version}_x64-setup.exe`;
      exePath = path.join(nsisDir, exeName);
      sigPath = path.join(nsisDir, `${exeName}.sig`);
    } else if (!fs.existsSync(exePath) && fs.existsSync(path.join(nsisDir, `DUBSAR 2.0_${version}_x64-setup.exe`))) {
      exeName = `DUBSAR 2.0_${version}_x64-setup.exe`;
      exePath = path.join(nsisDir, exeName);
      sigPath = path.join(nsisDir, `${exeName}.sig`);
    }
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
const remoteExeName = exeName;

const latestJsonContent = {
  version: version,
  notes: `DUBSAR ${version} - التحديث الرسمي الشامل: تحسينات شاشة المبيعات والاقتراح التلقائي للزبائن والمواد، دعم مقاسات الطباعة (58mm / 80mm / A4)، طرق الدفع المتعددة والدفع المختلط، مشاركة الفواتير عبر WhatsApp، وإصلاح حساب الأرباح.`,
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
  distMsiPath = path.join(DIST_RELEASE_DIR, msiName);
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

// Upload Release Asset using curl.exe for reliable binary streaming
function uploadAsset(uploadUrlTemplate, filePath, fileName, contentType = 'application/octet-stream') {
  const uploadUrl = uploadUrlTemplate.replace(/\{(\?name,label|name)\}/g, `?name=${encodeURIComponent(fileName)}`);

  return new Promise((resolve, reject) => {
    const curlArgs = [
      '-s', '-S',
      '-X', 'POST',
      '-H', `Authorization: token ${githubToken}`,
      '-H', `Content-Type: ${contentType}`,
      '-H', 'User-Agent: DUBSAR-Release-Publisher',
      '--data-binary', `@${path.resolve(filePath)}`,
      uploadUrl
    ];

    execFile('curl.exe', curlArgs, { maxBuffer: 20 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        return reject(new Error(`فشل رفع ${fileName} عبر curl: ${stderr || err.message}`));
      }
      try {
        const json = JSON.parse(stdout);
        if (json.errors || (json.message && !json.id && !json.browser_download_url)) {
          return reject(new Error(`GitHub upload error: ${stdout}`));
        }
        console.log(`  ✔ تم رفع: ${fileName}`);
        resolve(json);
      } catch (e) {
        console.log(`  ✔ تم رفع: ${fileName}`);
        resolve({});
      }
    });
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

    // Function to safely upload or overwrite existing asset
    async function safeUploadAsset(filePath, fileName, contentType) {
      try {
        const freshRelease = await githubApi(`/repos/${REPO_OWNER}/${REPO_NAME}/releases/${release.id}`);
        if (freshRelease.assets && Array.isArray(freshRelease.assets)) {
          const existing = freshRelease.assets.find(a => a.name === fileName);
          if (existing) {
            console.log(`  🔄 جاري حذف النسخة السابقة من: ${fileName}...`);
            try {
              await githubApi(`/repos/${REPO_OWNER}/${REPO_NAME}/releases/assets/${existing.id}`, 'DELETE');
            } catch (delErr) {
              console.warn(`  ⚠️ تعذر حذف ${fileName}:`, delErr.message);
            }
          }
        }
      } catch (e) {
        // ignore
      }
      await uploadAsset(uploadUrl, filePath, fileName, contentType);
    }

    // 1. Primary Setup Exe & Signature
    await safeUploadAsset(distExePath, remoteExeName, 'application/vnd.microsoft.portable-executable');
    await safeUploadAsset(distSigPath, `${remoteExeName}.sig`, 'text/plain');
    await safeUploadAsset(distLatestJsonPath, 'latest.json', 'application/json');

    // 2. MSI Package if available
    if (hasMsi) {
      await safeUploadAsset(distMsiPath, `DUBSAR.2.0_${version}_x64_en-US.msi`, 'application/x-msi');
    }

    // 3. Compatibility asset names so old/cached links NEVER 404
    console.log('\n🛡️ جاري رفع أسماء التوافق لروابط التحميل القديمة والدائمة لمنع 404...');
    for (const compatName of [
      `DUBSAR 2.0_${version}_x64-setup.exe`,
      'DUBSAR.2.0_2.0.5_x64-setup.exe',
      'DUBSAR.2.0_2.0.6_x64-setup.exe',
      'DUBSAR.2.0_2.0.7_x64-setup.exe',
      'DUBSAR-Setup.exe'
    ]) {
      try {
        await safeUploadAsset(distExePath, compatName, 'application/vnd.microsoft.portable-executable');
      } catch (err) {
        console.log(`  ℹ️ اسم التوافق (${compatName}): ${err.message || 'موجود مسبقاً'}`);
      }
    }

    console.log(`\n======================================================`);
    console.log(` 🎉 تم نشر تحديث DUBSAR v${version} بنجاح على GitHub!`);
    console.log(` رابط التحديث: https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/tag/${tagName}`);
    console.log(` رابط فحص التحديثات: https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/latest/download/latest.json`);
    console.log(` رابط التحميل المباشر: https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/latest/download/${remoteExeName}`);
    console.log(`======================================================\n`);
  } catch (err) {
    console.error('❌ خطأ أثناء الرفع إلى GitHub:', err.message);
  }
}

runPublish();
