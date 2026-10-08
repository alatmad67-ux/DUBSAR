/**
 * @fileOverview DUBSAR 2.0 Official License Studio & Dedicated GUI.
 * للمطور: حسين صلاح
 * 
 * واجهة رسومية فاخرة متكاملة لإصدار، تعديل، توقيع، وإدارة تراخيص DUBSAR Lifetime
 * مع دعم واتساب المباشر، طباعة الفواتير والشهادات الرسمية الفاخرة، البحث السريع، وتصدير Excel.
 */

const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');

const PORT = 4242;
const TAURI_DIR = path.join(process.env.USERPROFILE, '.tauri');
const PRIVATE_KEY_PATH = path.join(TAURI_DIR, 'dubsar_license_signer_private.key');
const REGISTRY_JSON_PATH = path.join(TAURI_DIR, 'dubsar_issued_licenses.json');
const REGISTRY_CSV_PATH = path.join(TAURI_DIR, 'dubsar_issued_licenses.csv');

// Load or initialize registry
function loadRegistry() {
  try {
    if (fs.existsSync(REGISTRY_JSON_PATH)) {
      const data = fs.readFileSync(REGISTRY_JSON_PATH, 'utf8');
      const list = JSON.parse(data);
      let modified = false;

      // Migrate existing keys to safe unicode-escaped format
      for (const item of list) {
        if (item.armoredKey) {
          try {
            const rawDecoded = Buffer.from(item.armoredKey, 'base64').toString('utf8');
            const tokenObj = JSON.parse(rawDecoded);
            const safeAscii = JSON.stringify(tokenObj).replace(/[^\x00-\x7F]/g, ch => {
              return '\\u' + ('0000' + ch.charCodeAt(0).toString(16)).slice(-4);
            });
            const safeArmored = Buffer.from(safeAscii, 'ascii').toString('base64');
            if (safeArmored !== item.armoredKey) {
              item.armoredKey = safeArmored;
              modified = true;
            }
          } catch (e) {}
        }
      }

      if (modified) {
        saveRegistry(list);
      }
      return list;
    }
  } catch (e) {}
  return [];
}

function saveRegistry(list) {
  fs.writeFileSync(REGISTRY_JSON_PATH, JSON.stringify(list, null, 2), 'utf8');
  try {
    // CSV with UTF-8 BOM so Microsoft Excel renders Arabic text properly without scrambled letters
    const csvHeader = '\uFEFFرقم الترخيص,اسم النشاط التجاري,اسم صاحب العمل,هاتف العميل,العنوان والمحافظة,سعر الشراء,معرف الجهاز المربوط,عدد الأجهزة,تاريخ الإصدار,الملاحظات\n';
    const csvRows = list.map(r => 
      `"${r.licenseId}","${r.businessName}","${r.customerOwner || ''}","${r.phone || ''}","${r.address || ''}","${r.price || ''}","${r.deviceBinding}","${r.maxDevices}","${r.issuedAtFormatted}","${(r.notes || '').replace(/"/g, '""')}"`
    ).join('\n');
    fs.writeFileSync(REGISTRY_CSV_PATH, csvHeader + csvRows, 'utf8');
  } catch (err) {}
}

function signPayload(payload) {
  if (!fs.existsSync(PRIVATE_KEY_PATH)) {
    throw new Error('لم يتم العثور على مفتاح التوقيع الرقمي الخاص في: ' + PRIVATE_KEY_PATH);
  }
  const privateKeyPem = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');
  const canonicalPayload = JSON.stringify(payload);

  const signer = crypto.createSign('SHA256');
  signer.update(canonicalPayload);
  signer.end();
  const signature = signer.sign({ key: privateKeyPem, dsaEncoding: 'ieee-p1363' }, 'base64');

  const licenseToken = {
    ...payload,
    signature
  };

  // Safe ASCII-only Unicode escaping so browser atob() decodes without mangling Arabic UTF-8 bytes
  const jsonAsciiOnly = JSON.stringify(licenseToken).replace(/[^\x00-\x7F]/g, ch => {
    return '\\u' + ('0000' + ch.charCodeAt(0).toString(16)).slice(-4);
  });

  return {
    licenseToken,
    armoredKey: Buffer.from(jsonAsciiOnly, 'ascii').toString('base64')
  };
}

function generateLicenseToken(businessName, deviceBinding, maxDevices, phone, notes, customerOwner, address, price, developerPhone) {
  const licenseId = `DUB-LT-${Date.now().toString().slice(-6)}`;
  const cleanDevice = (deviceBinding || '').trim() || 'ANY_DEVICE';
  const devicesCount = parseInt(maxDevices || '1', 10) || 1;

  const payload = {
    licenseId,
    businessName: businessName.trim(),
    plan: 'lifetime',
    maxDevices: devicesCount,
    deviceBinding: cleanDevice,
    issuedAt: Date.now()
  };

  const { armoredKey } = signPayload(payload);

  const record = {
    licenseId,
    businessName: payload.businessName,
    customerOwner: (customerOwner || '').trim(),
    phone: (phone || '').trim(),
    address: (address || '').trim(),
    price: (price || '').trim(),
    deviceBinding: cleanDevice,
    maxDevices: devicesCount,
    notes: (notes || '').trim(),
    developerName: 'حسين صلاح',
    developerPhone: (developerPhone || '07858833838').trim(),
    issuedAt: payload.issuedAt,
    issuedAtFormatted: new Date(payload.issuedAt).toLocaleString('ar-IQ', { dateStyle: 'medium', timeStyle: 'short' }),
    armoredKey
  };

  const registry = loadRegistry();
  registry.unshift(record);
  saveRegistry(registry);

  return { record, armoredKey };
}

function updateLicenseRecord(licenseId, updates) {
  const registry = loadRegistry();
  const index = registry.findIndex(l => l.licenseId === licenseId);
  if (index === -1) {
    throw new Error('الترخيص غير موجود بالسجل');
  }

  const existing = registry[index];
  const newBusinessName = (updates.businessName || existing.businessName).trim();
  const newDeviceBinding = (updates.deviceBinding !== undefined ? updates.deviceBinding : existing.deviceBinding).trim() || 'ANY_DEVICE';
  const newMaxDevices = parseInt(updates.maxDevices || existing.maxDevices || '1', 10) || 1;

  // Re-sign if core security fields changed
  let armoredKey = existing.armoredKey;
  if (newBusinessName !== existing.businessName || newDeviceBinding !== existing.deviceBinding || newMaxDevices !== existing.maxDevices) {
    const payload = {
      licenseId: existing.licenseId,
      businessName: newBusinessName,
      plan: 'lifetime',
      maxDevices: newMaxDevices,
      deviceBinding: newDeviceBinding,
      issuedAt: existing.issuedAt || Date.now()
    };
    armoredKey = signPayload(payload).armoredKey;
  }

  const updatedRecord = {
    ...existing,
    businessName: newBusinessName,
    customerOwner: (updates.customerOwner !== undefined ? updates.customerOwner : existing.customerOwner || '').trim(),
    phone: (updates.phone !== undefined ? updates.phone : existing.phone || '').trim(),
    address: (updates.address !== undefined ? updates.address : existing.address || '').trim(),
    price: (updates.price !== undefined ? updates.price : existing.price || '').trim(),
    deviceBinding: newDeviceBinding,
    maxDevices: newMaxDevices,
    notes: (updates.notes !== undefined ? updates.notes : existing.notes || '').trim(),
    developerPhone: (updates.developerPhone !== undefined ? updates.developerPhone : existing.developerPhone || '07858833838').trim(),
    armoredKey
  };

  registry[index] = updatedRecord;
  saveRegistry(registry);
  return updatedRecord;
}

// Generate high-end HTML GUI
function getHtml() {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DUBSAR 2.0 • استوديو إدارة وتوليد التراخيص والفواتير الرسمية</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap" rel="stylesheet">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
  <style>
    * {
      font-family: 'Tajawal', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    body {
      background-color: #070a12;
      color: #f1f5f9;
      background-image: 
        radial-gradient(circle at 10% 20%, rgba(245, 158, 11, 0.05) 0%, transparent 40%),
        radial-gradient(circle at 90% 80%, rgba(59, 130, 246, 0.05) 0%, transparent 40%);
      background-attachment: fixed;
    }
    .custom-scroll::-webkit-scrollbar {
      width: 7px;
      height: 7px;
    }
    .custom-scroll::-webkit-scrollbar-track {
      background: rgba(15, 23, 42, 0.6);
    }
    .custom-scroll::-webkit-scrollbar-thumb {
      background: rgba(245, 158, 11, 0.3);
      border-radius: 9999px;
    }
    .custom-scroll::-webkit-scrollbar-thumb:hover {
      background: rgba(245, 158, 11, 0.6);
    }
    @media print {
      body * {
        visibility: hidden !important;
      }
      #printInvoiceArea, #printInvoiceArea * {
        visibility: visible !important;
      }
      #printInvoiceArea {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 24px !important;
        background: #ffffff !important;
        color: #0f172a !important;
        box-shadow: none !important;
        border: none !important;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body class="min-h-screen flex flex-col p-4 sm:p-6 lg:p-8 select-none custom-scroll">
  
  <div class="max-w-6xl w-full mx-auto space-y-6">
    
    <!-- Top Modern Brand Bar -->
    <header class="bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/40 p-6 rounded-3xl border border-amber-500/20 shadow-2xl backdrop-blur flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
      <div class="flex items-center gap-4">
        <div class="relative">
          <div class="h-16 w-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black text-3xl shadow-xl shadow-amber-500/25 ring-2 ring-amber-400/30">
            👑
          </div>
          <span class="absolute -bottom-1 -right-1 flex h-4 w-4">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-slate-900"></span>
          </span>
        </div>
        <div>
          <div class="flex flex-wrap items-center gap-2.5">
            <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight">DUBSAR 2.0 • License Studio</h1>
            <span class="px-3 py-1 rounded-full text-xs font-black bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 shadow-sm">
              <span class="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
              Lifetime Pro Suite
            </span>
          </div>
          <p class="text-xs sm:text-sm text-slate-400 font-bold mt-1">
            إدارة وتوليد تراخيص الزبائن وفواتير الشراء الرسمية • المطور: <span class="text-amber-300 font-black">حسين صلاح</span> (07858833838)
          </p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2.5 self-end md:self-auto">
        <button onclick="exportCsv()" class="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-800/90 hover:bg-slate-700/90 text-emerald-300 border border-emerald-500/30 flex items-center gap-2 transition-all shadow-sm hover:scale-[1.02] active:scale-95">
          <span>📊 تصدير Excel (عربي)</span>
        </button>
        <button onclick="loadLicenses()" class="px-4 py-2.5 rounded-xl font-bold text-xs bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-200 border border-indigo-500/30 flex items-center gap-2 transition-all shadow-sm hover:scale-[1.02] active:scale-95">
          <span>🔄 تحديث السجل</span>
        </button>
      </div>
    </header>

    <!-- Quick Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-slate-900/80 p-5 rounded-2xl border border-white/10 shadow-sm flex items-center justify-between">
        <div>
          <span class="text-xs text-slate-400 font-bold">إجمالي العملاء والتراخيص:</span>
          <p id="totalCount" class="text-3xl font-black text-amber-400 font-mono mt-1">0</p>
        </div>
        <div class="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-xl">📜</div>
      </div>

      <div class="bg-slate-900/80 p-5 rounded-2xl border border-white/10 shadow-sm flex items-center justify-between">
        <div>
          <span class="text-xs text-slate-400 font-bold">نوع الباقة المعتمدة:</span>
          <p class="text-lg font-black text-emerald-400 mt-1">Lifetime • مدى الحياة</p>
        </div>
        <div class="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xl">♾️</div>
      </div>

      <div class="bg-slate-900/80 p-5 rounded-2xl border border-white/10 shadow-sm flex items-center justify-between">
        <div>
          <span class="text-xs text-slate-400 font-bold">ربط الأجهزة (Binding):</span>
          <p class="text-sm font-black text-blue-400 mt-1">Hardware ID أو حر</p>
        </div>
        <div class="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center text-xl">💻</div>
      </div>

      <div class="bg-slate-900/80 p-5 rounded-2xl border border-white/10 shadow-sm flex items-center justify-between">
        <div>
          <span class="text-xs text-slate-400 font-bold">مفتاح التوقيع الرقمي:</span>
          <p class="text-xs font-black text-emerald-400 mt-1 flex items-center gap-1.5">
            <span class="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            ECDSA P-256 (محمي محلياً)
          </p>
        </div>
        <div class="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xl">🔐</div>
      </div>
    </div>

    <!-- Main Generator Form Card -->
    <div class="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl space-y-6">
      <div class="flex items-center justify-between border-b border-white/10 pb-4">
        <div class="flex items-center gap-3">
          <div class="h-9 w-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-black">✨</div>
          <div>
            <h2 class="text-lg font-black text-white">إصدار ترخيص وفاتورة شراء جديدة لعميل</h2>
            <p class="text-xs text-slate-400 font-medium">سيتولى النظام توقيع رخصة Lifetime رسمية وإعداد الفاتورة المعتمدة فوراً</p>
          </div>
        </div>
        <span class="text-xs font-bold text-amber-400/80 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
          توليد مشفر معتمد
        </span>
      </div>

      <form id="licenseForm" onsubmit="handleGenerate(event)" class="space-y-5">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <!-- Business Name -->
          <div class="space-y-1.5">
            <label class="text-xs font-black text-slate-200">
              اسم المحل / النشاط التجاري <span class="text-rose-500">*</span>
            </label>
            <input 
              id="businessName" 
              required 
              type="text" 
              placeholder="مثال: أسواق دبي المركزية، صيدلية النور..." 
              class="w-full h-12 px-4 rounded-xl bg-slate-950 border border-white/15 text-white font-bold text-sm focus:border-amber-400 focus:ring-1 focus:ring-amber-400 focus:outline-none transition-all placeholder:text-slate-600"
            />
          </div>

          <!-- Customer Owner Name -->
          <div class="space-y-1.5">
            <label class="text-xs font-black text-slate-200">
              اسم صاحب المحل / المسؤول
            </label>
            <input 
              id="customerOwner" 
              type="text" 
              placeholder="مثال: السيد أحمد علي، د. سيف..." 
              class="w-full h-12 px-4 rounded-xl bg-slate-950 border border-white/15 text-white font-bold text-sm focus:border-amber-400 focus:ring-1 focus:ring-amber-400 focus:outline-none transition-all placeholder:text-slate-600"
            />
          </div>

          <!-- Customer Phone -->
          <div class="space-y-1.5">
            <label class="text-xs font-black text-slate-200">
              رقم هاتف / واتساب الزبون
            </label>
            <input 
              id="phone" 
              type="text" 
              placeholder="مثال: 07858833838 أو 96478..." 
              class="w-full h-12 px-4 rounded-xl bg-slate-950 border border-white/15 text-white font-bold text-sm font-mono focus:border-amber-400 focus:ring-1 focus:ring-amber-400 focus:outline-none transition-all placeholder:text-slate-600"
            />
          </div>

          <!-- Customer Address / City -->
          <div class="space-y-1.5">
            <label class="text-xs font-black text-slate-200">
              العنوان / المدينة والمحافظة
            </label>
            <input 
              id="address" 
              type="text" 
              placeholder="مثال: بغداد - الكرادة، أربيل، البصرة..." 
              class="w-full h-12 px-4 rounded-xl bg-slate-950 border border-white/15 text-white font-bold text-sm focus:border-amber-400 focus:ring-1 focus:ring-amber-400 focus:outline-none transition-all placeholder:text-slate-600"
            />
          </div>

          <!-- Sale Price -->
          <div class="space-y-1.5">
            <label class="text-xs font-black text-slate-200">
              سعر شراء النظام (للفاتورة والسجل)
            </label>
            <input 
              id="price" 
              type="text" 
              placeholder="مثال: 250,000 د.ع أو 200$" 
              class="w-full h-12 px-4 rounded-xl bg-slate-950 border border-white/15 text-amber-300 font-bold text-sm focus:border-amber-400 focus:ring-1 focus:ring-amber-400 focus:outline-none transition-all placeholder:text-slate-600"
            />
          </div>

          <!-- Max Devices -->
          <div class="space-y-1.5">
            <label class="text-xs font-black text-slate-200">عدد الأجهزة المسموحة</label>
            <select 
              id="maxDevices" 
              class="w-full h-12 px-3 rounded-xl bg-slate-950 border border-white/15 text-white font-bold text-sm focus:border-amber-400 focus:outline-none"
            >
              <option value="1">1 جهاز (كاشير واحد - الباقة الفردية)</option>
              <option value="2">2 جهازين (كاشير + جهاز إدارة/مخزن)</option>
              <option value="3">3 أجهزة (شبكة محلية متكاملة)</option>
              <option value="5">5 أجهزة (باقة الشركات والفروع)</option>
              <option value="10">10 أجهزة</option>
            </select>
          </div>

          <!-- Hardware ID -->
          <div class="space-y-1.5 sm:col-span-2">
            <div class="flex justify-between items-center">
              <label class="text-xs font-black text-slate-200 flex items-center gap-1.5">
                <span>معرّف جهاز الزبون (Hardware ID المنسوخ من برنامج DUBSAR لدى الزبون):</span>
              </label>
              <div class="flex items-center gap-2">
                <button type="button" onclick="pasteHardwareId()" class="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 transition-all">
                  📋 لصق من الحافظة
                </button>
                <button type="button" onclick="setAnyDevice()" class="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20 transition-all">
                  🔓 ترخيص حر (أي جهاز)
                </button>
              </div>
            </div>
            <input 
              id="deviceId" 
              type="text" 
              placeholder="مثال: DB-DEV-9B21-X48A (أو اتركه ANY_DEVICE لترخيص يعمل على أي جهاز)" 
              class="w-full h-12 px-4 rounded-xl bg-slate-950 border border-white/15 text-amber-300 font-mono font-bold text-sm focus:border-amber-400 focus:ring-1 focus:ring-amber-400 focus:outline-none transition-all placeholder:text-slate-600"
            />
          </div>

          <!-- Notes -->
          <div class="space-y-1.5">
            <label class="text-xs font-black text-slate-200">ملاحظات إضافية</label>
            <input 
              id="notes" 
              type="text" 
              placeholder="مثال: تم الاستلام نقداً، نسخة فرع 1..." 
              class="w-full h-12 px-4 rounded-xl bg-slate-950 border border-white/15 text-white font-bold text-sm focus:border-amber-400 focus:outline-none placeholder:text-slate-600"
            />
          </div>

        </div>

        <button 
          type="submit" 
          id="submitBtn"
          class="w-full h-14 rounded-2xl font-black text-base bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2.5 transition-all transform active:scale-[0.99] cursor-pointer"
        >
          <span class="text-xl">✨</span>
          <span>إصدار وتوقيع ترخيص DUBSAR Lifetime وإعداد الفاتورة</span>
        </button>
      </form>

      <!-- Result Card -->
      <div id="resultCard" class="hidden p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/40 border-2 border-amber-500/50 shadow-2xl space-y-6">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div class="flex items-center gap-3">
            <div class="h-12 w-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl border border-emerald-500/30">
              🎉
            </div>
            <div>
              <h3 class="font-black text-base text-amber-300">تم إنشاء وتوقيع الترخيص بنجاح!</h3>
              <p id="resultMeta" class="text-xs text-slate-300 mt-0.5 font-bold"></p>
            </div>
          </div>
          <span class="px-3 py-1.5 rounded-xl text-xs font-mono font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
            <span class="h-2 w-2 rounded-full bg-emerald-400"></span>
            ECDSA Cryptographically Signed
          </span>
        </div>

        <div class="space-y-2">
          <div class="flex justify-between items-center">
            <label class="text-xs font-black text-slate-200">
              كود التفعيل الرقمي المعتمد للزبون (جاهز للصق في DUBSAR):
            </label>
            <span class="text-[11px] text-amber-400 font-bold">تم نسخه للحافظة تلقائياً ✅</span>
          </div>
          <textarea 
            id="resultCode" 
            readonly 
            rows="3" 
            class="w-full p-3.5 rounded-2xl bg-slate-950 border border-amber-500/30 font-mono text-xs text-amber-200 select-all focus:outline-none custom-scroll leading-relaxed"
          ></textarea>
        </div>

        <div class="flex flex-wrap items-center gap-3 pt-1">
          <button 
            type="button" 
            onclick="copyResultCode()" 
            class="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
          >
            📋 نسخ الكود للحافظة
          </button>

          <button 
            type="button" 
            onclick="sendWhatsApp()" 
            class="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95"
          >
            💬 إرسال الفاتورة والكود للزبون عبر واتساب
          </button>

          <button 
            type="button" 
            onclick="openInvoiceModal()" 
            class="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95"
          >
            📄 عرض وطباعة الفاتورة والشهادة الرسمية (A4)
          </button>
        </div>
      </div>
    </div>

    <!-- Registry & Search Table -->
    <div class="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl space-y-5">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-lg font-black text-white flex items-center gap-2">
            <span>📜 سجل وتراخيص العملاء الصادرة</span>
            <span id="registryBadge" class="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">0</span>
          </h2>
          <p class="text-xs text-slate-400 font-medium mt-0.5">ابحث برقم الهاتف أو اسم العميل أو العنوان لتعديل البيانات أو إعادة الطباعة</p>
        </div>
        <div class="w-full sm:w-96">
          <div class="relative">
            <input 
              id="searchInput" 
              type="text" 
              oninput="renderTable()" 
              placeholder="🔍 بحث سريع: بالاسم، رقم الهاتف، العنوان، أو رقم الترخيص..." 
              class="w-full h-11 px-4 pr-4 pl-10 rounded-xl bg-slate-950 border border-white/15 text-xs text-white font-bold focus:border-amber-400 focus:outline-none placeholder:text-slate-500 transition-colors"
            />
            <span id="searchCountBadge" class="absolute left-3 top-3 text-[11px] text-amber-400 font-bold"></span>
          </div>
        </div>
      </div>

      <div class="rounded-2xl border border-white/10 overflow-x-auto custom-scroll max-h-[500px]">
        <table class="w-full text-right text-xs">
          <thead class="bg-slate-950 sticky top-0 border-b border-white/10 text-slate-300 font-black">
            <tr>
              <th class="p-3.5">رقم الترخيص</th>
              <th class="p-3.5">اسم المحل / النشاط</th>
              <th class="p-3.5">المسؤول</th>
              <th class="p-3.5">رقم الهاتف</th>
              <th class="p-3.5">العنوان / المدينة</th>
              <th class="p-3.5">سعر الشراء</th>
              <th class="p-3.5 text-center">الأجهزة</th>
              <th class="p-3.5">تاريخ الإصدار</th>
              <th class="p-3.5 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody id="licensesTableBody" class="divide-y divide-white/5 font-bold">
            <!-- Dynamically populated -->
          </tbody>
        </table>
      </div>
    </div>

  </div>

  <!-- Modal: Edit Customer & License Data -->
  <div id="editModal" class="hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="bg-slate-900 rounded-3xl max-w-xl w-full border border-amber-500/40 p-6 sm:p-8 space-y-5 shadow-2xl relative">
      <div class="flex justify-between items-center border-b border-white/10 pb-4">
        <h3 class="text-base font-black text-white flex items-center gap-2">
          <span>✏️ تعديل بيانات العميل والترخيص</span>
        </h3>
        <button onclick="closeEditModal()" class="text-slate-400 hover:text-white font-bold text-sm">✖</button>
      </div>

      <form onsubmit="handleSaveEdit(event)" class="space-y-4">
        <input type="hidden" id="editLicenseId" />
        
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div class="space-y-1">
            <label class="text-xs font-black text-slate-300">اسم المحل / النشاط التجاري</label>
            <input id="editBusinessName" required class="w-full h-11 px-3.5 rounded-xl bg-slate-950 border border-white/15 text-white font-bold text-xs focus:border-amber-400 focus:outline-none" />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-black text-slate-300">اسم صاحب المحل / المسؤول</label>
            <input id="editCustomerOwner" class="w-full h-11 px-3.5 rounded-xl bg-slate-950 border border-white/15 text-white font-bold text-xs focus:border-amber-400 focus:outline-none" />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-black text-slate-300">رقم الهاتف / واتساب</label>
            <input id="editPhone" class="w-full h-11 px-3.5 rounded-xl bg-slate-950 border border-white/15 text-white font-bold font-mono text-xs focus:border-amber-400 focus:outline-none" />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-black text-slate-300">العنوان / المحافظة</label>
            <input id="editAddress" class="w-full h-11 px-3.5 rounded-xl bg-slate-950 border border-white/15 text-white font-bold text-xs focus:border-amber-400 focus:outline-none" />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-black text-slate-300">سعر الشراء</label>
            <input id="editPrice" class="w-full h-11 px-3.5 rounded-xl bg-slate-950 border border-white/15 text-amber-300 font-bold text-xs focus:border-amber-400 focus:outline-none" />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-black text-slate-300">عدد الأجهزة المسموحة</label>
            <select id="editMaxDevices" class="w-full h-11 px-3 rounded-xl bg-slate-950 border border-white/15 text-white font-bold text-xs focus:border-amber-400 focus:outline-none">
              <option value="1">1 جهاز (كاشير واحد)</option>
              <option value="2">2 جهازين</option>
              <option value="3">3 أجهزة</option>
              <option value="5">5 أجهزة</option>
              <option value="10">10 أجهزة</option>
            </select>
          </div>

          <div class="space-y-1 sm:col-span-2">
            <label class="text-xs font-black text-slate-300">معرف الجهاز (Binding):</label>
            <input id="editDeviceBinding" class="w-full h-11 px-3.5 rounded-xl bg-slate-950 border border-white/15 text-amber-300 font-mono text-xs focus:border-amber-400 focus:outline-none" />
          </div>

          <div class="space-y-1 sm:col-span-2">
            <label class="text-xs font-black text-slate-300">ملاحظات</label>
            <input id="editNotes" class="w-full h-11 px-3.5 rounded-xl bg-slate-950 border border-white/15 text-white font-bold text-xs focus:border-amber-400 focus:outline-none" />
          </div>
        </div>

        <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
          <button type="button" onclick="closeEditModal()" class="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">إلغاء</button>
          <button type="submit" class="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md">💾 حفظ التعديلات وتحديث الترخيص</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Modal: Luxury Official Invoice & License Certificate (A4 Print Ready) -->
  <div id="invoiceModal" class="hidden fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto custom-scroll">
    <div class="bg-slate-900 rounded-3xl max-w-4xl w-full border border-amber-500/40 p-4 sm:p-8 space-y-6 shadow-2xl relative my-auto">
      
      <!-- Top Action Bar (Screen Only) -->
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4 no-print">
        <div class="flex items-center gap-2">
          <span class="text-xl">📄</span>
          <div>
            <h3 class="text-base font-black text-white">فاتورة شراء وسند تفعيل رخصة DUBSAR 2.0 المعتمدة</h3>
            <p class="text-xs text-slate-400">مهيأة للطباعة بجودة فائقة بحجم A4 أو الحفظ كملف PDF</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="printInvoice()" class="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20">
            🖨️ طباعة الفاتورة والشهادة
          </button>
          <button onclick="sendInvoiceWhatsApp()" class="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5">
            💬 إرسال واتساب
          </button>
          <button onclick="closeInvoiceModal()" class="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs">
            ✖ إغلاق
          </button>
        </div>
      </div>

      <!-- PRINTABLE A4 INVOICE & CERTIFICATE CONTAINER -->
      <div id="printInvoiceArea" class="bg-white text-slate-900 p-8 sm:p-10 rounded-2xl border border-slate-300 shadow-xl relative space-y-7 leading-normal">
        
        <!-- Header -->
        <div class="flex items-start justify-between border-b-2 border-amber-600/40 pb-6">
          <div class="space-y-1 text-right">
            <div class="flex items-center gap-2">
              <span class="text-2xl font-black text-slate-900 tracking-tight">DUBSAR 2.0 PRO</span>
              <span class="text-[11px] font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md border border-amber-300 font-mono">
                LIFETIME LICENSE
              </span>
            </div>
            <p class="text-xs font-bold text-slate-600">نظام إدارة المبيعات ونقاط البيع والمخازن والحسابات المتكامل</p>
            <p class="text-xs font-bold text-amber-700">تطوير وبرمجة: حسين صلاح • هاتف الدعم: <span id="invDevPhone" class="font-mono">07858833838</span></p>
          </div>

          <div class="text-left space-y-1">
            <span class="text-xs font-black uppercase text-slate-500 tracking-wider">فاتورة وسند تفعيل رسمي</span>
            <p id="invLicenseId" class="text-lg font-black font-mono text-amber-700"></p>
            <p id="invDate" class="text-xs font-mono text-slate-600 font-bold"></p>
          </div>
        </div>

        <!-- Two Columns: Customer Info & System Info -->
        <div class="grid grid-cols-2 gap-4">
          <!-- Customer Box -->
          <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5 text-xs text-right">
            <h4 class="font-black text-slate-900 text-xs border-b border-slate-200 pb-1.5 flex items-center justify-between">
              <span>👤 بيانات العميل والمشتري:</span>
              <span class="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">مرخص رسمي</span>
            </h4>
            <div class="grid grid-cols-3 gap-1 pt-1 font-bold">
              <span class="text-slate-500">اسم النشاط:</span>
              <span id="invBusinessName" class="col-span-2 text-slate-900 font-black"></span>
              
              <span class="text-slate-500">المسؤول:</span>
              <span id="invCustomerOwner" class="col-span-2 text-slate-800 font-bold"></span>

              <span class="text-slate-500">رقم الهاتف:</span>
              <span id="invPhone" class="col-span-2 font-mono text-slate-800"></span>

              <span class="text-slate-500">العنوان:</span>
              <span id="invAddress" class="col-span-2 text-slate-800"></span>
            </div>
          </div>

          <!-- Software Specification Box -->
          <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5 text-xs text-right">
            <h4 class="font-black text-slate-900 text-xs border-b border-slate-200 pb-1.5 flex items-center justify-between">
              <span>💻 تفاصيل الرخصة والمنظومة:</span>
              <span class="text-[10px] text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded">رقمية مشفرة</span>
            </h4>
            <div class="grid grid-cols-3 gap-1 pt-1 font-bold">
              <span class="text-slate-500">نوع الباقة:</span>
              <span class="col-span-2 text-emerald-700 font-black">Lifetime • مدى الحياة (دائمية)</span>

              <span class="text-slate-500">عدد المحطات:</span>
              <span id="invDevices" class="col-span-2 text-slate-900 font-black"></span>

              <span class="text-slate-500">معرف الجهاز:</span>
              <span id="invDeviceBinding" class="col-span-2 font-mono text-[11px] text-slate-700 truncate"></span>

              <span class="text-slate-500">نظام التشغيل:</span>
              <span class="col-span-2 text-slate-700">Windows Desktop Native (x64)</span>
            </div>
          </div>
        </div>

        <!-- Items Table -->
        <div class="rounded-xl border border-slate-200 overflow-hidden text-right text-xs">
          <table class="w-full">
            <thead class="bg-slate-100 text-slate-800 font-black border-b border-slate-200">
              <tr>
                <th class="p-3 w-12 text-center">#</th>
                <th class="p-3">بيان البرمجيات والخدمات المتضمنة</th>
                <th class="p-3 text-center w-24">الكمية</th>
                <th class="p-3 text-center w-32">نوع الترخيص</th>
                <th class="p-3 text-left w-36">المبلغ</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-bold text-slate-700">
              <tr>
                <td class="p-3 text-center font-mono">1</td>
                <td class="p-3">
                  <div class="font-black text-slate-900">برنامج DUBSAR 2.0 Desktop POS & ERP المتكامل</div>
                  <div class="text-[11px] text-slate-500 mt-0.5">
                    إدارة نقاط البيع، المبيعات والمشتريات، المخازن، الحسابات، الديون، سندات القبض والصرف، فئات العملات العراقية، والطباعة الحرارية 80mm وA4.
                  </div>
                </td>
                <td class="p-3 text-center font-mono">1</td>
                <td class="p-3 text-center text-emerald-700 font-black">Lifetime دائم</td>
                <td id="invPriceCell" class="p-3 text-left font-black text-slate-900 font-mono"></td>
              </tr>
              <tr>
                <td class="p-3 text-center font-mono">2</td>
                <td class="p-3">
                  <div class="font-black text-slate-900">محرك قاعدة البيانات المحلية الآمنة (SQLite Native Engine)</div>
                  <div class="text-[11px] text-slate-500 mt-0.5">
                    يعمل دون الحاجة إلى إنترنت وبسرعة فائقة مع حماية مشفرة لبيانات العميل ونسخ احتياطي تلقائي.
                  </div>
                </td>
                <td class="p-3 text-center font-mono">1</td>
                <td class="p-3 text-center text-slate-600">شامل مجاناً</td>
                <td class="p-3 text-left text-slate-500 font-mono">0 د.ع</td>
              </tr>
              <tr>
                <td class="p-3 text-center font-mono">3</td>
                <td class="p-3">
                  <div class="font-black text-slate-900">خدمة التحديثات الرسمية والدعم الفني المباشر</div>
                  <div class="text-[11px] text-slate-500 mt-0.5">
                    تحديثات برمجية مجانية عبر محرك التحديثات الرسمي للمطور حسين صلاح.
                  </div>
                </td>
                <td class="p-3 text-center font-mono">1</td>
                <td class="p-3 text-center text-slate-600">مشمول</td>
                <td class="p-3 text-left text-slate-500 font-mono">0 د.ع</td>
              </tr>
            </tbody>
            <tfoot class="bg-amber-50/70 border-t-2 border-slate-300 font-black text-slate-900">
              <tr>
                <td colspan="4" class="p-3 text-left text-sm">المجموع الكلي المدفوع:</td>
                <td id="invTotalAmount" class="p-3 text-left text-base font-mono text-amber-900 font-black"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Activation Code & QR Section -->
        <div class="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 rounded-2xl flex items-center justify-between gap-5 shadow-inner">
          <div class="space-y-1.5 flex-1 text-right">
            <span class="text-xs font-black text-amber-300 flex items-center gap-1.5">
              <span>🔐 كود التفعيل الرقمي المعتمد (Activation License Key):</span>
            </span>
            <div id="invCodeBlock" class="p-2.5 rounded-xl bg-black/50 border border-white/20 font-mono text-[10px] text-amber-200 break-all select-all leading-tight"></div>
            <p class="text-[10px] text-slate-300 font-bold">
              * يتم لصق هذا الكود داخل شاشة تفعيل DUBSAR في كمبيوتر الزبون لتفعيل النظام فوراً وبشكل دائم.
            </p>
          </div>
          <div class="text-center space-y-1 shrink-0">
            <div id="invQr" class="bg-white p-2 rounded-xl shadow-lg inline-block"></div>
            <p class="text-[9px] text-slate-400 font-bold font-mono">مسح الكود للتحقق</p>
          </div>
        </div>

        <!-- Signatures & Official Stamp -->
        <div class="flex items-end justify-between pt-4 border-t border-slate-200 text-xs">
          <div class="text-right space-y-1">
            <p class="text-slate-500 font-bold">إقرار الاستلام والملكية:</p>
            <p class="text-slate-800 font-bold">تم استلام النظام وتركيبه بنجاح وخضوعه للتجربة والفحص.</p>
            <p class="text-slate-400 text-[10px]">كافة الحقوق محفوظة © DUBSAR Systems • 2026</p>
          </div>

          <div class="text-center space-y-2">
            <div class="h-16 w-32 border-2 border-dashed border-amber-600/40 rounded-xl flex items-center justify-center bg-amber-50/50">
              <span class="text-amber-800 font-black text-[11px] leading-tight">
                ختم وتوقيع المطور<br>
                حسين صلاح
              </span>
            </div>
            <p class="text-[10px] font-mono text-slate-500">ECDSA P-256 Validated</p>
          </div>
        </div>

      </div>

    </div>
  </div>

  <!-- Audio Chime Generator -->
  <script>
    function playChime() {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, now);
        osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(880, now);
        osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.2);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.6);
        osc2.stop(now + 0.6);
      } catch (e) {}
    }
  </script>

  <!-- Client JavaScript Logic -->
  <script>
    let allLicenses = [];
    let lastGenerated = null;
    let currentModalData = null;

    async function loadLicenses() {
      try {
        const res = await fetch('/api/licenses');
        allLicenses = await res.json();
        document.getElementById('totalCount').innerText = allLicenses.length;
        document.getElementById('registryBadge').innerText = allLicenses.length;
        renderTable();
      } catch (e) {
        console.error(e);
      }
    }

    function renderTable() {
      const q = (document.getElementById('searchInput').value || '').trim().toLowerCase();
      const filtered = allLicenses.filter(l => 
        (l.businessName || '').toLowerCase().includes(q) ||
        (l.customerOwner || '').toLowerCase().includes(q) ||
        (l.phone || '').includes(q) ||
        (l.address || '').toLowerCase().includes(q) ||
        (l.deviceBinding || '').toLowerCase().includes(q) ||
        (l.licenseId || '').toLowerCase().includes(q) ||
        (l.notes || '').toLowerCase().includes(q)
      );

      const countBadge = document.getElementById('searchCountBadge');
      if (q) {
        countBadge.innerText = filtered.length + ' نتيجة';
      } else {
        countBadge.innerText = '';
      }

      const tbody = document.getElementById('licensesTableBody');
      if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="p-8 text-center text-slate-500 font-bold">لا توجد نتائج مطابقة للبحث</td></tr>';
        return;
      }

      tbody.innerHTML = filtered.map(l => \`
        <tr class="hover:bg-white/5 transition-colors">
          <td class="p-3.5 font-mono text-amber-400 font-black">\${l.licenseId}</td>
          <td class="p-3.5 text-white font-black text-sm">\${l.businessName}</td>
          <td class="p-3.5 text-slate-300 font-bold">\${l.customerOwner || '-'}</td>
          <td class="p-3.5 font-mono text-amber-200">\${l.phone || '-'}</td>
          <td class="p-3.5 text-slate-300 text-[11px]">\${l.address || '-'}</td>
          <td class="p-3.5 font-mono text-emerald-400 font-bold">\${l.price || '-'}</td>
          <td class="p-3.5 text-center font-mono font-bold text-amber-300">\${l.maxDevices || 1}</td>
          <td class="p-3.5 font-mono text-slate-400 text-[11px]">\${l.issuedAtFormatted || ''}</td>
          <td class="p-3.5 text-center">
            <div class="flex items-center justify-center gap-1">
              <button onclick="openEditModal('\${l.licenseId}')" class="px-2 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 text-xs font-bold border border-amber-500/30" title="تعديل بيانات العميل">
                ✏️ تعديل
              </button>
              <button onclick="copySpecificKey('\${l.armoredKey}')" class="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold border border-white/10" title="نسخ الكود">
                📋 نسخ
              </button>
              <button onclick='viewInvoiceFor(\${JSON.stringify(l).replace(/'/g, "&apos;")})' class="px-2 py-1.5 rounded-lg bg-indigo-950 hover:bg-indigo-800 text-indigo-300 text-xs font-bold border border-indigo-500/30" title="الفاتورة والشهادة">
                📄 فاتورة
              </button>
              <button onclick="sendWhatsAppDirect('\${l.phone || ''}', '\${l.businessName}', '\${l.licenseId}', '\${l.armoredKey}', '\${l.price || ''}')" class="px-2 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-800 text-emerald-300 text-xs font-bold border border-emerald-500/30" title="إرسال واتساب">
                💬 واتساب
              </button>
              <button onclick="deleteLicense('\${l.licenseId}')" class="px-1.5 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 text-xs font-bold border border-rose-500/20" title="حذف">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      \`).join('');
    }

    async function handleGenerate(e) {
      e.preventDefault();
      const btn = document.getElementById('submitBtn');
      btn.disabled = true;
      btn.innerText = '⏳ جاري التوقيع والتشفير الرقمي...';

      const payload = {
        businessName: document.getElementById('businessName').value,
        customerOwner: document.getElementById('customerOwner').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value,
        price: document.getElementById('price').value,
        deviceBinding: document.getElementById('deviceId').value,
        maxDevices: document.getElementById('maxDevices').value,
        notes: document.getElementById('notes').value
      };

      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'فشل التوليد');

        lastGenerated = data;
        currentModalData = data.record;
        
        document.getElementById('resultMeta').innerText = \`النشاط: \${data.record.businessName} • رقم الترخيص: \${data.record.licenseId}\`;
        document.getElementById('resultCode').value = data.armoredKey;
        document.getElementById('resultCard').classList.remove('hidden');

        navigator.clipboard.writeText(data.armoredKey);
        playChime();
        await loadLicenses();
        document.getElementById('resultCard').scrollIntoView({ behavior: 'smooth' });
      } catch (err) {
        alert('خطأ: ' + err.message);
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<span class="text-xl">✨</span><span>إصدار وتوقيع ترخيص DUBSAR Lifetime وإعداد الفاتورة</span>';
      }
    }

    function openEditModal(licenseId) {
      const item = allLicenses.find(l => l.licenseId === licenseId);
      if (!item) return;

      document.getElementById('editLicenseId').value = item.licenseId;
      document.getElementById('editBusinessName').value = item.businessName || '';
      document.getElementById('editCustomerOwner').value = item.customerOwner || '';
      document.getElementById('editPhone').value = item.phone || '';
      document.getElementById('editAddress').value = item.address || '';
      document.getElementById('editPrice').value = item.price || '';
      document.getElementById('editMaxDevices').value = item.maxDevices || '1';
      document.getElementById('editDeviceBinding').value = item.deviceBinding || 'ANY_DEVICE';
      document.getElementById('editNotes').value = item.notes || '';

      document.getElementById('editModal').classList.remove('hidden');
    }

    function closeEditModal() {
      document.getElementById('editModal').classList.add('hidden');
    }

    async function handleSaveEdit(e) {
      e.preventDefault();
      const licenseId = document.getElementById('editLicenseId').value;
      const updates = {
        businessName: document.getElementById('editBusinessName').value,
        customerOwner: document.getElementById('editCustomerOwner').value,
        phone: document.getElementById('editPhone').value,
        address: document.getElementById('editAddress').value,
        price: document.getElementById('editPrice').value,
        maxDevices: document.getElementById('editMaxDevices').value,
        deviceBinding: document.getElementById('editDeviceBinding').value,
        notes: document.getElementById('editNotes').value
      };

      try {
        const res = await fetch('/api/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ licenseId, updates })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'فشل التحديث');

        playChime();
        closeEditModal();
        await loadLicenses();
        alert('✅ تم تحديث بيانات العميل والترخيص بنجاح!');
      } catch (err) {
        alert('خطأ أثناء التحديث: ' + err.message);
      }
    }

    function viewInvoiceFor(record) {
      currentModalData = record;
      openInvoiceModal();
    }

    function openInvoiceModal() {
      const data = currentModalData || (lastGenerated ? lastGenerated.record : null);
      if (!data) return;

      document.getElementById('invBusinessName').innerText = data.businessName || '-';
      document.getElementById('invCustomerOwner').innerText = data.customerOwner || '-';
      document.getElementById('invPhone').innerText = data.phone || '-';
      document.getElementById('invAddress').innerText = data.address || '-';
      document.getElementById('invLicenseId').innerText = data.licenseId;
      document.getElementById('invDate').innerText = data.issuedAtFormatted || new Date(data.issuedAt).toLocaleDateString('ar-IQ');
      document.getElementById('invDevices').innerText = (data.maxDevices || 1) + ' أجهزة كاشير وإدارة';
      document.getElementById('invDeviceBinding').innerText = data.deviceBinding || 'ANY_DEVICE';
      document.getElementById('invPriceCell').innerText = data.price || '250,000 د.ع';
      document.getElementById('invTotalAmount').innerText = data.price || '250,000 د.ع';
      document.getElementById('invCodeBlock').innerText = data.armoredKey;
      document.getElementById('invDevPhone').innerText = data.developerPhone || '07858833838';

      const qrContainer = document.getElementById('invQr');
      qrContainer.innerHTML = '';
      if (window.QRCode) {
        new QRCode(qrContainer, {
          text: data.armoredKey || data.licenseId,
          width: 90,
          height: 90,
          colorDark: "#000000",
          colorLight: "#ffffff",
          correctLevel: QRCode.CorrectLevel.M
        });
      }

      document.getElementById('invoiceModal').classList.remove('hidden');
    }

    function closeInvoiceModal() {
      document.getElementById('invoiceModal').classList.add('hidden');
    }

    function printInvoice() {
      window.print();
    }

    function copyResultCode() {
      const code = document.getElementById('resultCode').value;
      navigator.clipboard.writeText(code);
      playChime();
      alert('✅ تم نسخ كود الترخيص إلى الحافظة بنجاح!');
    }

    function copySpecificKey(key) {
      navigator.clipboard.writeText(key);
      playChime();
      alert('✅ تم نسخ كود الترخيص إلى الحافظة!');
    }

    async function pasteHardwareId() {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          document.getElementById('deviceId').value = text.trim();
        }
      } catch (e) {
        const manual = prompt('الصق معرّف الجهاز هنا:');
        if (manual) document.getElementById('deviceId').value = manual.trim();
      }
    }

    function setAnyDevice() {
      document.getElementById('deviceId').value = 'ANY_DEVICE';
    }

    function sendWhatsApp() {
      if (!lastGenerated) return;
      const rec = lastGenerated.record;
      sendWhatsAppDirect(rec.phone, rec.businessName, rec.licenseId, lastGenerated.armoredKey, rec.price);
    }

    function sendInvoiceWhatsApp() {
      if (!currentModalData) return;
      const rec = currentModalData;
      sendWhatsAppDirect(rec.phone, rec.businessName, rec.licenseId, rec.armoredKey, rec.price);
    }

    function sendWhatsAppDirect(phone, businessName, licenseId, code, price) {
      let cleanPhone = (phone || '').replace(/\\D/g, '');
      if (cleanPhone.startsWith('07')) {
        cleanPhone = '964' + cleanPhone.substring(1);
      } else if (cleanPhone.startsWith('7')) {
        cleanPhone = '964' + cleanPhone;
      }

      const msg = \`🌟 مرحباً بكم في نظام DUBSAR 2.0 Pro\\n\\nتم إصدار فاتورة الشراء ورخصة الاستخدام الدائم (Lifetime) بنجاح:\\n• المنشأة: \${businessName}\\n• رقم الفاتورة والترخيص: \${licenseId}\\n• المبلغ المدفوع: \${price || 'مدفوع بالكامل'}\\n• المطور المعتمد: حسين صلاح (07858833838)\\n\\n🔐 كود التفعيل الرقمي المعتمد الخاص بكم:\\n\${code}\\n\\nطريقة التفعيل السريع:\\n1. افتح برنامج DUBSAR على جهازك.\\n2. الصق الكود أعلاه في خانة التفعيل.\\n3. اضغط "تفعيل رخصة DUBSAR Lifetime".\\n\\nشكراً لتعاملكم معنا ونتمنى لكم عملاً مباركاً وناجحاً! 🌹\`;

      const url = cleanPhone ? \`https://wa.me/\${cleanPhone}?text=\${encodeURIComponent(msg)}\` : \`https://wa.me/?text=\${encodeURIComponent(msg)}\`;
      window.open(url, '_blank');
    }

    async function deleteLicense(id) {
      if (!confirm('هل أنت متأكد من حذف هذا السجل من القائمة؟')) return;
      await fetch('/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseId: id })
      });
      loadLicenses();
    }

    function exportCsv() {
      window.open('/api/export-csv', '_blank');
    }

    // Auto-load registry on startup
    loadLicenses();
  </script>
</body>
</html>`;
}

// Server logic
const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'GET' && parsedUrl.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(getHtml());
    return;
  }

  if (req.method === 'GET' && parsedUrl.pathname === '/api/licenses') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(loadRegistry()));
    return;
  }

  if (req.method === 'GET' && parsedUrl.pathname === '/api/export-csv') {
    if (fs.existsSync(REGISTRY_CSV_PATH)) {
      res.writeHead(200, {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="dubsar_licenses.csv"'
      });
      fs.createReadStream(REGISTRY_CSV_PATH).pipe(res);
      return;
    }
    res.writeHead(404);
    res.end('File not found');
    return;
  }

  if (req.method === 'POST' && parsedUrl.pathname === '/api/generate') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { businessName, deviceBinding, maxDevices, phone, notes, customerOwner, address, price, developerPhone } = JSON.parse(body);
        if (!businessName) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'اسم النشاط التجاري مطلوب' }));
          return;
        }
        const result = generateLicenseToken(businessName, deviceBinding, maxDevices, phone, notes, customerOwner, address, price, developerPhone);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(result));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  if (req.method === 'POST' && parsedUrl.pathname === '/api/update') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { licenseId, updates } = JSON.parse(body);
        if (!licenseId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'رقم الترخيص مطلوب' }));
          return;
        }
        const updated = updateLicenseRecord(licenseId, updates);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, record: updated }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  if (req.method === 'POST' && parsedUrl.pathname === '/api/delete') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { licenseId } = JSON.parse(body);
        const registry = loadRegistry().filter(l => l.licenseId !== licenseId);
        saveRegistry(registry);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(500);
        res.end();
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

function openClientWindow() {
  const url = `http://127.0.0.1:${PORT}`;
  const edgePath86 = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edgePath64 = 'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe';
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  if (fs.existsSync(edgePath86)) {
    spawn(edgePath86, [`--app=${url}`, '--window-size=1220,900'], { detached: true, stdio: 'ignore' });
  } else if (fs.existsSync(edgePath64)) {
    spawn(edgePath64, [`--app=${url}`, '--window-size=1220,900'], { detached: true, stdio: 'ignore' });
  } else if (fs.existsSync(chromePath)) {
    spawn(chromePath, [`--app=${url}`, '--window-size=1220,900'], { detached: true, stdio: 'ignore' });
  } else {
    exec(`start ${url}`);
  }
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    // Server is already running in background, just open the window immediately
    console.log(`ℹ️ الخادم يعمل بالفعل على المنفذ ${PORT}، جاري فتح نافذة التطبيق فوراً...`);
    openClientWindow();
    process.exit(0);
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});

server.listen(PORT, '127.0.0.1', () => {
  const url = `http://127.0.0.1:${PORT}`;
  console.log(`\n======================================================`);
  console.log(`✨ DUBSAR License & Invoice Studio is running at: ${url}`);
  console.log(`======================================================\n`);
  openClientWindow();
});

