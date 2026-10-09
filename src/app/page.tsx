'use client';

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Download, 
  Check, 
  ShieldCheck, 
  Zap, 
  Monitor, 
  Printer, 
  Coins, 
  Layers, 
  ExternalLink, 
  MessageCircle, 
  Phone, 
  HelpCircle, 
  Database, 
  Lock, 
  ArrowUpRight,
  Package,
  ShoppingCart,
  Receipt,
  TrendingUp,
  Cpu,
  HardDrive,
  RefreshCw,
  QrCode,
  ChevronDown
} from "lucide-react";
import Link from "next/link";

export default function DubsarLandingPage() {
  const router = useRouter();
  const [checkingEnv, setCheckingEnv] = useState(true);
  const [calcTotal, setCalcTotal] = useState(25000);
  const [tenderAmount, setTenderAmount] = useState(50000);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  useEffect(() => {
    // If running inside desktop app, redirect immediately to local login
    const isDesktop = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__;
    if (isDesktop) {
      router.replace('/login');
    } else {
      setCheckingEnv(false);
    }
  }, [router]);

  if (checkingEnv) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#09090b] text-zinc-100 gap-4 font-sans" dir="rtl">
        <div className="h-10 w-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-400 font-mono text-sm font-semibold animate-pulse shadow-sm">
          D2
        </div>
        <div className="text-center space-y-1.5">
          <p className="font-medium text-xs tracking-wider text-zinc-400 font-mono uppercase">DUBSAR 2.0</p>
          <p className="text-zinc-600 text-[11px]">جاري تهيئة البيئة...</p>
        </div>
      </div>
    );
  }

  const downloadExeUrl = "https://github.com/alatmad67-ux/DUBSAR/releases/latest/download/DUBSAR.2.0_2.0.5_x64-setup.exe";
  const downloadMsiUrl = "https://github.com/alatmad67-ux/DUBSAR/releases/latest/download/DUBSAR.2.0_2.0.5_x64_en-US.msi";
  const developerWhatsApp = "https://wa.me/9647858833838";

  const banknotes = [
    { label: "50,000", value: 50000, img: "/banknotes/50000.jpg" },
    { label: "25,000", value: 25000, img: "/banknotes/25000.jpg" },
    { label: "5,000", value: 5000, img: "/banknotes/5000.jpg" },
    { label: "250", value: 250, img: "/banknotes/250.jpg" },
  ];

  const remainder = Math.max(0, tenderAmount - calcTotal);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 selection:bg-amber-400/20 selection:text-amber-300 font-sans antialiased" dir="rtl">
      
      {/* Background Subtle Mesh (No cheesy neon gradients) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-40">
        <div className="absolute top-[-10%] right-1/2 translate-x-1/2 w-[900px] h-[400px] bg-gradient-to-b from-zinc-800/20 via-zinc-900/10 to-transparent blur-3xl" />
        <div className="absolute top-0 right-0 left-0 h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
      </div>

      {/* Floating Precision Navbar */}
      <header className="sticky top-4 z-50 px-4 sm:px-6 max-w-6xl mx-auto">
        <nav className="h-14 px-4 rounded-2xl bg-zinc-950/70 border border-white/[0.08] backdrop-blur-xl shadow-2xl flex items-center justify-between">
          
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-xl overflow-hidden border border-white/10 ring-1 ring-amber-400/20 group-hover:border-amber-400/50 transition-all shrink-0 bg-zinc-900 shadow-sm">
              <img src="/logo.jpg" alt="DUBSAR Logo" className="w-full h-full object-cover" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-sm tracking-tight text-white">دوبسار DUEBSAR</span>
              <span className="font-mono text-[10px] text-amber-400 uppercase font-semibold">2.0 PRO</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-7 text-xs font-medium text-zinc-400">
            <a href="#bento" className="hover:text-zinc-100 transition-colors">المواصفات التقنية</a>
            <a href="#cashier" className="hover:text-zinc-100 transition-colors">نظام الكاشير</a>
            <a href="#pricing" className="hover:text-zinc-100 transition-colors">باقات الأسعار</a>
            <a href="#download" className="hover:text-zinc-100 transition-colors">التحميل</a>
            <a href="#faq" className="hover:text-zinc-100 transition-colors">الأسئلة الشائعة</a>
          </div>

          <div className="flex items-center gap-2.5">
            <a 
              href={developerWhatsApp}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors"
            >
              <span>الدعم الفني</span>
              <ArrowUpRight className="h-3 w-3 opacity-70" strokeWidth={1.5} />
            </a>

            <a 
              href="#download"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white text-zinc-950 hover:bg-zinc-200 transition-colors shadow-sm"
            >
              <Download className="h-3.5 w-3.5" strokeWidth={2} />
              <span>تنزيل البرنامج</span>
            </a>
          </div>

        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-16 pb-20 px-4 sm:px-6 max-w-4xl mx-auto text-center space-y-7">
        
        {/* Official Brand Emblem Showcase */}
        <div className="flex justify-center">
          <div className="relative group">
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-amber-600/20 blur-xl opacity-70 group-hover:opacity-100 transition-opacity" />
            <div className="relative h-28 w-28 sm:h-32 sm:w-32 rounded-3xl overflow-hidden border-2 border-amber-400/40 shadow-2xl bg-zinc-900 ring-4 ring-black/40">
              <img src="/logo.jpg" alt="شعار دوبسار الرسمي DUBSAR" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* Release Tag Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-zinc-900 border border-white/[0.08] text-xs text-zinc-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-[11px] text-amber-400 font-semibold">DUBSAR 2.0.5 (x64)</span>
          <span className="text-zinc-600">•</span>
          <span className="text-[11px] font-medium text-zinc-300">نظام إدارة المبيعات المعتمد رسمياً</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-zinc-100 leading-[1.18]">
          إدارة متكاملة لنقاط البيع<br />
          <span className="text-zinc-400 font-normal">
            بسرعة محلية فائقة وترخيص دائم.
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p className="text-base sm:text-lg text-zinc-400 font-normal leading-relaxed max-w-2xl mx-auto">
          نظام محاسبي ومكتبي صُمم خصيصاً لإدارة المبيعات، المخازن، والديون. يعمل محلياً بنسبة 100% دون اعتماد على الإنترنت، مع دعم شامل للنقد العراقي وطباعة الفواتير الحرارية.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
          <a 
            href={downloadExeUrl}
            className="w-full sm:w-auto h-12 px-6 rounded-xl text-sm font-semibold bg-white text-zinc-950 hover:bg-zinc-200 flex items-center justify-center gap-2.5 transition-all shadow-sm"
          >
            <Download className="h-4 w-4" strokeWidth={2} />
            <span>تحميل مثبت Windows (.exe)</span>
            <span className="font-mono text-[11px] text-zinc-500 mr-1 border-r border-zinc-300 pr-2">9 MB</span>
          </a>

          <a 
            href="https://wa.me/9647858833838?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%20%D8%A3%D8%B3%D8%AA%D8%A7%D8%B0%20%D8%AD%D8%B3%D9%8A%D9%86%D8%8C%20%D8%A3%D9%88%D8%AF%20%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%B9%D9%86%20%D8%AA%D8%B1%D8%AE%D9%8A%D8%B5%20%D9%86%D8%B8%D8%A7%D9%85%20DUBSAR%202.0"
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto h-12 px-5 rounded-xl text-sm font-medium bg-zinc-900 border border-white/[0.08] text-zinc-200 hover:bg-zinc-800/80 hover:border-white/15 flex items-center justify-center gap-2 transition-colors"
          >
            <MessageCircle className="h-4 w-4 text-emerald-400" strokeWidth={1.5} />
            <span>طلب التفعيل مع المطور</span>
          </a>
        </div>

        {/* Metrics Strip */}
        <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto text-right">
          <div className="p-3.5 rounded-xl bg-zinc-900/30 border border-white/[0.06]">
            <p className="font-mono text-xs font-semibold text-zinc-200">0.2 ms</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">استجابة قاعدة البيانات المحلية</p>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-900/30 border border-white/[0.06]">
            <p className="font-mono text-xs font-semibold text-emerald-400">100% Offline</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">استمرارية العمل بلا انقطاع</p>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-900/30 border border-white/[0.06]">
            <p className="font-mono text-xs font-semibold text-amber-400">IQD + USD</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">تسوية نقدية فورية بالفئات</p>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-900/30 border border-white/[0.06]">
            <p className="font-mono text-xs font-semibold text-zinc-200">Lifetime</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">شراء لمرة واحدة بلا اشتراك</p>
          </div>
        </div>

      </section>

      {/* Section: Bento Grid (Linear Architecture) */}
      <section id="bento" className="relative z-10 py-16 px-4 sm:px-6 max-w-6xl mx-auto space-y-6">
        
        <div className="space-y-1.5 text-right">
          <span className="font-mono text-[11px] uppercase tracking-wider text-amber-400">الهندسة المعمارية</span>
          <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-100 tracking-tight">
            بُني لتقديم تجربة سطح مكتب حقيقية
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-xl">
            تكامل هندسي بين سرعة لغة Rust، خفة واجهة المستخدم، وتخزين SQLite المحلي المحمي.
          </p>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Bento Cell 1 (Spans 2 cols): Iraqi Cashier Engine */}
          <div id="cashier" className="md:col-span-2 p-6 sm:p-7 rounded-2xl bg-zinc-900/40 border border-white/[0.08] backdrop-blur-md flex flex-col justify-between space-y-6 hover:border-white/15 transition-colors">
            
            <div className="flex items-start justify-between">
              <div className="space-y-1 text-right">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
                    <Coins className="h-4 w-4" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-base font-semibold text-zinc-100">تسوية النقد العراقي وحساب الباقي اللحظي</h3>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-lg">
                  واجهة كاشير بصرية تعرض الفئات النقدية المتداولة في السوق العراقي (50,000 ، 25,000 ، 5,000 ، 250 دينار) لحساب باقي الزبون بلمسة واحدة ومنع الأخطاء الحسابية.
                </p>
              </div>

              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-white/[0.06]">
                Interactive Widget
              </span>
            </div>

            {/* Interactive Currency Simulator Widget */}
            <div className="p-4 rounded-xl bg-zinc-950/70 border border-white/[0.06] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-white/[0.06] pb-3">
                <div className="space-y-0.5">
                  <span className="text-[11px] text-zinc-500">مبلغ الفاتورة:</span>
                  <div className="font-mono font-semibold text-zinc-200">{calcTotal.toLocaleString()} د.ع</div>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[11px] text-zinc-500">المبلغ المستلم:</span>
                  <div className="font-mono font-semibold text-amber-400">{tenderAmount.toLocaleString()} د.ع</div>
                </div>

                <div className="space-y-0.5 text-left">
                  <span className="text-[11px] text-zinc-500">الباقي للزبون:</span>
                  <div className="font-mono font-semibold text-emerald-400 text-sm">
                    {remainder.toLocaleString()} د.ع
                  </div>
                </div>
              </div>

              {/* Banknote selection chips */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-zinc-500 uppercase">اختر الفئة المستلمة من الزبون:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {banknotes.map((b) => (
                    <button
                      key={b.value}
                      onClick={() => setTenderAmount(b.value)}
                      className={`p-2 rounded-lg border text-right transition-all flex items-center justify-between gap-2 ${
                        tenderAmount === b.value 
                          ? 'bg-amber-400/10 border-amber-400/50 text-amber-200' 
                          : 'bg-zinc-900/60 border-white/[0.06] text-zinc-400 hover:text-zinc-200 hover:border-white/10'
                      }`}
                    >
                      <span className="font-mono text-xs font-medium">{b.label}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">IQD</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Bento Cell 2: Local SQLite Architecture */}
          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-white/[0.08] backdrop-blur-md flex flex-col justify-between space-y-4 hover:border-white/15 transition-colors text-right">
            <div className="space-y-3">
              <div className="h-7 w-7 rounded-lg bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center text-emerald-400">
                <HardDrive className="h-4 w-4" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-semibold text-zinc-100">قاعدة بيانات محلية بلا خادم سحابي</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                تُخزن جميع العمليات محلياً على القرص الصلب باستخدام محرك SQLite الفائق مع تقنية WAL (Write-Ahead Logging). بياناتك لا تغادر حاسوبك، وسرعة الاستجابة فورية.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950/70 border border-white/[0.06] font-mono text-[11px] space-y-1 text-zinc-400">
              <div className="flex justify-between">
                <span>Storage Engine</span>
                <span className="text-zinc-200">SQLite 3 (Local)</span>
              </div>
              <div className="flex justify-between">
                <span>Disk Latency</span>
                <span className="text-emerald-400">~0.18 ms</span>
              </div>
              <div className="flex justify-between">
                <span>Offline Capability</span>
                <span className="text-emerald-400">100% Native</span>
              </div>
            </div>
          </div>

          {/* Bento Cell 3: Unified Document Engine */}
          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-white/[0.08] backdrop-blur-md flex flex-col justify-between space-y-4 hover:border-white/15 transition-colors text-right">
            <div className="space-y-3">
              <div className="h-7 w-7 rounded-lg bg-indigo-400/10 border border-indigo-400/20 flex items-center justify-center text-indigo-400">
                <Printer className="h-4 w-4" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-semibold text-zinc-100">محرك قوالب الطباعة (80mm & A4)</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                مصدر تصميم موحد يدعم الفواتير الحرارية، كشوفات A4، ملصقات الباركود، ورموز QR الذكية مع إمكانية إخفاء أو إظهار الشعار والديون بحرية.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950/70 border border-white/[0.06] flex items-center justify-between text-xs font-mono text-zinc-300">
              <span className="flex items-center gap-1.5">
                <Receipt className="h-3.5 w-3.5 text-zinc-500" strokeWidth={1.5} />
                Thermal 80mm
              </span>
              <span className="text-zinc-600">•</span>
              <span className="flex items-center gap-1.5">
                <QrCode className="h-3.5 w-3.5 text-zinc-500" strokeWidth={1.5} />
                Zatca & Tax Ready
              </span>
            </div>
          </div>

          {/* Bento Cell 4 (Spans 2 cols): Cryptographic Licensing & Tauri Updates */}
          <div className="md:col-span-2 p-6 sm:p-7 rounded-2xl bg-zinc-900/40 border border-white/[0.08] backdrop-blur-md flex flex-col justify-between space-y-6 hover:border-white/15 transition-colors">
            
            <div className="flex items-start justify-between">
              <div className="space-y-1 text-right">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-200">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-base font-semibold text-zinc-100">توقيع رقمي تشفيري (ECDSA) وتحديثات رسمية صامتة</h3>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-lg">
                  تعتمد رخص DUBSAR على خوارزمية التوقيع الإهليلجي (ECDSA P-256) مع ربط أمني لمعرّف الجهاز (Hardware ID). التحديثات تصدر رسمياً وتُثبت بوضع Passive دون لمس بيانات SQLite.
                </p>
              </div>

              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-white/[0.06]">
                Security Architecture
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-right">
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-white/[0.06]">
                <p className="text-[11px] font-mono text-zinc-500">SIGNING STANDARD</p>
                <p className="text-xs font-semibold text-zinc-200 mt-0.5">ECDSA SHA-256 (P-256)</p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950/60 border border-white/[0.06]">
                <p className="text-[11px] font-mono text-zinc-500">UPDATE DELIVERY</p>
                <p className="text-xs font-semibold text-zinc-200 mt-0.5">Tauri 2 Native Updater</p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950/60 border border-white/[0.06]">
                <p className="text-[11px] font-mono text-zinc-500">DATA PRESERVATION</p>
                <p className="text-xs font-semibold text-emerald-400 mt-0.5">Zero Database Rewrite</p>
              </div>
            </div>

          </div>

        </div>

      </section>

      {/* Section: Transparent Lifetime Pricing */}
      <section id="pricing" className="relative z-10 py-20 px-4 sm:px-6 max-w-5xl mx-auto space-y-10">
        
        <div className="space-y-3 text-center max-w-2xl mx-auto">
          <span className="font-mono text-[11px] uppercase tracking-wider text-amber-400">باقات التمليك الدائم</span>
          <h2 className="text-3xl font-semibold text-zinc-100 tracking-tight">استثمار لمرة واحدة دون أي اشتراكات</h2>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            اشترِ النسخة الرسمية وتملكها مدى الحياة. لا توجد رسوم تجديد شهرية أو سنوية، ودون الحاجة للإنترنت.
          </p>
          
          {/* Feature Equality Guarantee Banner */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs mt-2">
            <Check className="h-4 w-4 text-amber-400 shrink-0" strokeWidth={2} />
            <span>جميع ميزات النظام مفتوحة 100% بالكامل في كافة الباقات — الفرق الوحيد هو عدد الحاسبات</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          
          {/* Plan 1: Single Computer */}
          <div className="p-6 rounded-2xl bg-zinc-900/30 border border-white/[0.08] flex flex-col justify-between space-y-6 text-right hover:border-white/15 transition-colors">
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="font-mono text-[11px] text-zinc-500 uppercase">1 Workstation</span>
                <h3 className="text-lg font-semibold text-white">باقة الحاسوب المنفرد</h3>
                <p className="text-xs text-zinc-400">حاسبة رئيسية واحدة (كاشير أو إدارة) للمتاجر المستقلة</p>
              </div>

              <div className="pt-2 border-t border-white/[0.06]">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-semibold text-white font-mono">250,000</span>
                  <span className="text-xs font-medium text-zinc-400">د.ع</span>
                </div>
                <span className="text-[11px] text-zinc-500 font-mono">رخصة دائمية لمدى الحياة (جهاز واحد)</span>
              </div>

              <div className="space-y-2.5 text-xs text-zinc-300 pt-2 font-normal">
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" strokeWidth={2} />
                  <span className="font-medium text-zinc-100">ترخيص حاسوب رئيسي واحد (1 PC)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-zinc-400 shrink-0" strokeWidth={2} />
                  <span>يعمل محلياً بلا إنترنت 100% (Offline)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-zinc-400 shrink-0" strokeWidth={2} />
                  <span>إدارة المبيعات والمخزن ونظام الديون بالكامل</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-zinc-400 shrink-0" strokeWidth={2} />
                  <span>طباعة فواتير حرارية 80mm و A4</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-zinc-400 shrink-0" strokeWidth={2} />
                  <span>نسخ احتياطي تلقائي وقاعدة بيانات آمنة</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-zinc-400 shrink-0" strokeWidth={2} />
                  <span>كل الميزات البرمجية مفتوحة دون قيود</span>
                </div>
              </div>
            </div>

            <a 
              href="https://wa.me/9647858833838?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%D8%8C%20%D8%A3%D9%88%D8%AF%20%D8%B7%D9%84%D8%A8%20%D8%A8%D8%A7%D9%82%D8%A9%20%D8%A7%D9%84%D8%AD%D8%A7%D8%B3%D9%88%D8%A8%20%D8%A7%D9%84%D9%85%D9%86%D9%81%D8%B1%D8%AF%20%D9%84%D9%86%D8%B8%D8%A7%D9%85%20DUBSAR%20(250,000%20%D8%AF.%D8%B9)"
              target="_blank"
              rel="noreferrer"
              className="w-full h-11 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-200 flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>طلب باقة الحاسوب الفردي</span>
              <ArrowUpRight className="h-3 w-3 opacity-60" />
            </a>
          </div>

          {/* Plan 2: 2 Computers (Main + 1 Network) */}
          <div className="p-6 rounded-2xl bg-zinc-900/60 border border-amber-400/40 flex flex-col justify-between space-y-6 text-right relative shadow-[inset_0_1px_0_0_rgba(245,158,11,0.2)]">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="font-mono text-[11px] text-amber-400 uppercase font-semibold">2 Workstations • الأكثر طلباً</span>
                  <h3 className="text-lg font-semibold text-white">باقة الحاسوبين (رئيسي + شبكي)</h3>
                  <p className="text-xs text-zinc-400">حاسبة رئيسية + حاسوب ثاني شبكي مربوط محلياً</p>
                </div>
              </div>

              <div className="pt-2 border-t border-white/[0.06]">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-semibold text-amber-400 font-mono">350,000</span>
                  <span className="text-xs font-medium text-zinc-400">د.ع</span>
                </div>
                <span className="text-[11px] text-zinc-500 font-mono">رخصة دائمية لجهازين (Main + 1 Network)</span>
              </div>

              <div className="space-y-2.5 text-xs text-zinc-200 pt-2 font-normal">
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-amber-400 shrink-0" strokeWidth={2} />
                  <span className="font-medium text-white">حاسوب رئيسي + حاسوب ثاني شبكي (2 PCs)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-amber-400 shrink-0" strokeWidth={2} />
                  <span>ربط شبكي محلي فائق السرعة ومستقر</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-amber-400 shrink-0" strokeWidth={2} />
                  <span>مزامنة المبيعات والمخزن لحظياً بين الجهازين</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-amber-400 shrink-0" strokeWidth={2} />
                  <span>طباعة فواتير حرارية و A4 على أي جهاز</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-amber-400 shrink-0" strokeWidth={2} />
                  <span>كل الميزات البرمجية مفتوحة 100% بالكامل</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-amber-400 shrink-0" strokeWidth={2} />
                  <span>دعم فني وأولوية التحديثات المجانية</span>
                </div>
              </div>
            </div>

            <a 
              href="https://wa.me/9647858833838?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%D8%8C%20%D8%A3%D9%88%D8%AF%20%D8%B7%D9%84%D8%A8%20%D8%A8%D8%A7%D9%82%D8%A9%20%D8%A7%D9%84%D8%AD%D8%A7%D8%B3%D9%88%D8%A8%D9%8A%D9%86%20(%D8%B1%D8%A6%D9%8A%D8%B3%D9%8A%20%2B%20%D8%B4%D8%A8%D9%83%D9%8A)%20%D9%84%D9%86%D8%B8%D8%A7%D9%85%20DUBSAR%20(350,000%20%D8%AF.%D8%B9)"
              target="_blank"
              rel="noreferrer"
              className="w-full h-11 rounded-xl text-xs font-semibold bg-white text-zinc-950 hover:bg-zinc-200 flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <span>طلب باقة الحاسوبين</span>
              <ArrowUpRight className="h-3 w-3 opacity-60" />
            </a>
          </div>

          {/* Plan 3: 3 Computers (Main + 2 Network) */}
          <div className="p-6 rounded-2xl bg-zinc-900/30 border border-white/[0.08] flex flex-col justify-between space-y-6 text-right hover:border-white/15 transition-colors">
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="font-mono text-[11px] text-zinc-500 uppercase">3 Workstations</span>
                <h3 className="text-lg font-semibold text-white">باقة 3 حاسبات (رئيسية + 2 شبكي)</h3>
                <p className="text-xs text-zinc-400">حاسبة رئيسية + حاسوبين شبكيين لنقاط البيع والمخازن</p>
              </div>

              <div className="pt-2 border-t border-white/[0.06]">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-semibold text-white font-mono">450,000</span>
                  <span className="text-xs font-medium text-zinc-400">د.ع</span>
                </div>
                <span className="text-[11px] text-zinc-500 font-mono">رخصة دائمية لـ 3 أجهزة (Main + 2 Networks)</span>
              </div>

              <div className="space-y-2.5 text-xs text-zinc-300 pt-2 font-normal">
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" strokeWidth={2} />
                  <span className="font-medium text-zinc-100">حاسبة رئيسية + حاسوبين شبكيين (3 PCs)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-zinc-400 shrink-0" strokeWidth={2} />
                  <span>ربط شبكي متزامن لـ 3 محطات عمل معاً</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-zinc-400 shrink-0" strokeWidth={2} />
                  <span>توزيع نقاط البيع (كاشيرات متعددة + إدارة + مخزن)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-zinc-400 shrink-0" strokeWidth={2} />
                  <span>صلاحيات دقيقة وتدقيق مبيعات الموظفين</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-zinc-400 shrink-0" strokeWidth={2} />
                  <span>كل الميزات البرمجية مفتوحة 100% بالكامل</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-zinc-400 shrink-0" strokeWidth={2} />
                  <span>مساعدة كاملة في الربط والإعداد الشبكي</span>
                </div>
              </div>
            </div>

            <a 
              href="https://wa.me/9647858833838?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%D8%8C%20%D8%A3%D9%88%D8%AF%20%D8%B7%D9%84%D8%A8%20%D8%A8%D8%A7%D9%82%D8%A9%203%20%D8%AD%D8%A7%D8%B3%D8%A8%D8%A7%D8%AA%20(%D8%B1%D8%A6%D9%8A%D8%B3%D9%8A%D8%A9%20%2B%202%20%D8%B4%D8%A8%D9%83%D9%8A)%20%D9%84%D9%86%D8%B8%D8%A7%D9%85%20DUBSAR%20(450,000%20%D8%AF.%D8%B9)"
              target="_blank"
              rel="noreferrer"
              className="w-full h-11 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-200 flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>طلب باقة الـ 3 حاسبات</span>
              <ArrowUpRight className="h-3 w-3 opacity-60" />
            </a>
          </div>

        </div>

      </section>

      {/* Section: Download Dock */}
      <section id="download" className="relative z-10 py-16 px-4 sm:px-6 max-w-4xl mx-auto">
        <div className="p-8 sm:p-10 rounded-2xl bg-zinc-900/40 border border-white/[0.08] backdrop-blur-md space-y-7 text-right">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
            <div className="space-y-1">
              <span className="font-mono text-[11px] text-amber-400 uppercase">مركز التحميل الرسمي</span>
              <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">حزمة التثبيت لنظام Windows</h2>
            </div>
            <div className="font-mono text-xs text-zinc-400 bg-zinc-950/60 px-3 py-1 rounded-lg border border-white/[0.06]">
              Arch: x86_64 • Win 10/11
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a 
              href={downloadExeUrl}
              className="p-4 rounded-xl bg-zinc-950/70 border border-white/[0.08] hover:border-white/20 transition-all flex items-center justify-between group"
            >
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-white group-hover:text-amber-400 transition-colors">مثبت الإعداد التنفيذي (.exe)</p>
                <p className="text-[11px] font-mono text-zinc-500">DUBSAR.2.0_2.0.5_x64-setup.exe • 9 MB</p>
              </div>
              <Download className="h-4 w-4 text-zinc-400 group-hover:text-white transition-colors" strokeWidth={1.5} />
            </a>

            <a 
              href={downloadMsiUrl}
              className="p-4 rounded-xl bg-zinc-950/70 border border-white/[0.08] hover:border-white/20 transition-all flex items-center justify-between group"
            >
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-white group-hover:text-amber-400 transition-colors">حزمة النشر المؤسسية (.msi)</p>
                <p className="text-[11px] font-mono text-zinc-500">DUBSAR.2.0_2.0.5_x64_en-US.msi • 10 MB</p>
              </div>
              <Package className="h-4 w-4 text-zinc-400 group-hover:text-white transition-colors" strokeWidth={1.5} />
            </a>
          </div>

          {/* Installation steps */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-zinc-400">
            <div className="space-y-1">
              <span className="font-mono text-[10px] text-zinc-500">01</span>
              <p className="font-medium text-zinc-200">تحميل وتشغيل المثبت</p>
              <p className="text-[11px] text-zinc-500">تثبيت هادئ وسريع ينشئ اختصاراً على سطح المكتب.</p>
            </div>

            <div className="space-y-1">
              <span className="font-mono text-[10px] text-zinc-500">02</span>
              <p className="font-medium text-zinc-200">نسخ معرّف الجهاز (Hardware ID)</p>
              <p className="text-[11px] text-zinc-500">يظهر المعرف في شاشة التفعيل بضغطة زر واحدة.</p>
            </div>

            <div className="space-y-1">
              <span className="font-mono text-[10px] text-zinc-500">03</span>
              <p className="font-medium text-zinc-200">إدخال كود التفعيل المستلم</p>
              <p className="text-[11px] text-zinc-500">يتم تفعيل النظام فوراً وبشكل دائم للأبد.</p>
            </div>
          </div>

        </div>
      </section>

      {/* Section: Frequently Asked Questions */}
      <section id="faq" className="relative z-10 py-16 px-4 sm:px-6 max-w-3xl mx-auto space-y-6">
        <div className="space-y-1.5 text-center">
          <span className="font-mono text-[11px] uppercase tracking-wider text-amber-400">الشفافية الكاملة</span>
          <h2 className="text-2xl font-semibold text-zinc-100 tracking-tight">الأسئلة الشائعة</h2>
        </div>

        <div className="space-y-2">
          {[
            {
              q: "هل يعمل البرنامج في حال انقطاع خدمة الإنترنت نهائياً؟",
              a: "نعم بنسبة 100%. نظام DUBSAR 2.0 مبني بالكامل على معمارية محلية (Offline-First). كافة فواتيرك، حسابات الصندوق، والمخازن تُخزن وتُعالج على حاسوبك دون أي حاجة للاتصال بالإنترنت."
            },
            {
              q: "هل يتطلب النظام أي اشتراكات أو تجديدات شهرية أو سنوية؟",
              a: "كلا إطلاقاً. ترخيص DUBSAR هو ترخيص دائم (Lifetime License). تشتري نسختك لمرة واحدة فقط وتظل ملكاً لك وتعمل دائماً دون أي انقطاع أو رسوم إضافية."
            },
            {
              q: "ماذا يحدث لبياناتي في حال تعطل الحاسوب أو إعادة تهيئة النظام (Format)؟",
              a: "يوفر البرنامج ميزة النسخ الاحتياطي التلقائي والمجدول إلى أي قرص خارجي أو فلاش ميموري بضغطة زر، ويمكن استعادة قاعدة بياناتك كاملة في ثوانٍ معدودة."
            },
            {
              q: "ما هي أنواع الطابعات وأجهزة الباركود المتوافقة مع النظام؟",
              a: "يدعم النظام جميع الطابعات الحرارية (مقاس 80mm و 58mm) المتصلة بـ USB أو الشبكة المحلية، بالإضافة إلى طابعات A4 العادية، وقارئات الباركود الليزرية، وأدراج النقود التلقائية."
            }
          ].map((item, index) => (
            <div 
              key={index}
              onClick={() => setFaqOpen(faqOpen === index ? null : index)}
              className="rounded-xl bg-zinc-900/30 border border-white/[0.06] p-4 cursor-pointer hover:border-white/10 transition-colors space-y-2 text-right"
            >
              <div className="flex items-center justify-between text-xs font-medium text-zinc-200">
                <span>{item.q}</span>
                <ChevronDown className={`h-3.5 w-3.5 text-zinc-500 transition-transform ${faqOpen === index ? 'rotate-180' : ''}`} />
              </div>
              {faqOpen === index && (
                <p className="text-xs text-zinc-400 font-normal leading-relaxed pt-2 border-t border-white/[0.04]">
                  {item.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Developer Profile Card */}
      <section className="relative z-10 py-12 px-4 sm:px-6 max-w-4xl mx-auto">
        <div className="p-6 rounded-2xl bg-zinc-900/40 border border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-5 text-right">
          <div className="space-y-1">
            <span className="font-mono text-[11px] text-amber-400 uppercase font-semibold">تطوير ودعم تقني</span>
            <h3 className="text-lg font-semibold text-white">المطور حسين صلاح (Hussein Salah)</h3>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-lg">
              برمجة وتطوير منظومات نقاط البيع وإدارة المنشآت التجارية. استشارات ودعم فني مباشر متوفر لكافة المحافظات.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <a 
              href="tel:07858833838"
              className="h-10 px-4 rounded-xl text-xs font-mono font-medium bg-zinc-900 border border-white/[0.08] text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <Phone className="h-3.5 w-3.5 text-zinc-500" strokeWidth={1.5} />
              <span>07858833838</span>
            </a>

            <a 
              href={developerWhatsApp}
              target="_blank"
              rel="noreferrer"
              className="h-10 px-4 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span>محادثة واتساب</span>
            </a>
          </div>
        </div>
      </section>

      {/* Editorial Minimal Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] py-12 px-4 sm:px-6 text-center text-xs text-zinc-500 space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-amber-500/30 bg-zinc-900 shrink-0 shadow-sm">
            <img 
              src="/logo.jpg" 
              alt="DUBSAR 2.0" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex items-center gap-2 text-zinc-300 font-mono text-xs">
            <span className="font-semibold text-white">DUBSAR 2.0 PRO</span>
            <span className="text-zinc-600">•</span>
            <span>Offline POS & Enterprise Ledger</span>
          </div>
        </div>
        <p className="text-[11px] text-zinc-500 font-sans">
          جميع الحقوق محفوظة © 2026 منظومة دوبسار (DUBSAR Systems) • تطوير المطور حسين صلاح
        </p>
      </footer>

    </div>
  );
}
