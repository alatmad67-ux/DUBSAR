'use client';

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Download, 
  CheckCircle2, 
  Sparkles, 
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
  ArrowRight,
  Package,
  ShoppingCart,
  Receipt,
  TrendingUp,
  FileSpreadsheet,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";

export default function DubsarLandingPage() {
  const router = useRouter();
  const [checkingEnv, setCheckingEnv] = useState(true);
  const [activeTab, setActiveTab] = useState<'pos' | 'inventory' | 'debts' | 'print'>('pos');
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  useEffect(() => {
    // If running inside desktop app, redirect immediately to login
    const isDesktop = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__;
    if (isDesktop) {
      router.replace('/login');
    } else {
      setCheckingEnv(false);
    }
  }, [router]);

  if (checkingEnv) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-white gap-4" dir="rtl">
        <div className="h-16 w-16 bg-gradient-to-tr from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center text-slate-950 font-black text-3xl animate-bounce shadow-2xl">
          👑
        </div>
        <p className="font-black text-xl text-amber-400 font-mono">DUBSAR 2.0 PRO</p>
        <p className="text-slate-400 text-xs font-bold animate-pulse">جاري فحص بيئة التشغيل...</p>
      </div>
    );
  }

  const downloadExeUrl = "https://github.com/alatmad67-ux/DUBSAR/releases/latest/download/DUBSAR.2.0_2.0.4_x64-setup.exe";
  const downloadMsiUrl = "https://github.com/alatmad67-ux/DUBSAR/releases/latest/download/DUBSAR.2.0_2.0.4_x64_en-US.msi";
  const developerWhatsApp = "https://wa.me/9647858833838";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-amber-500 selection:text-slate-950 overflow-x-hidden font-sans" dir="rtl">
      
      {/* Background Glow Accents */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 left-10 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[160px]" />
        <div className="absolute bottom-10 right-10 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[180px]" />
      </div>

      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          
          <Link href="/" className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg shadow-amber-500/20">
              👑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-white tracking-tight">DUBSAR</span>
                <Badge variant="outline" className="text-[10px] bg-amber-500/15 text-amber-300 border-amber-500/30 font-black">
                  2.0 PRO
                </Badge>
              </div>
              <p className="text-[10px] text-slate-400 font-bold">نظام الكاشير والمبيعات والحسابات</p>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-300">
            <a href="#features" className="hover:text-amber-400 transition-colors">المميزات</a>
            <a href="#preview" className="hover:text-amber-400 transition-colors">واجهات النظام</a>
            <a href="#pricing" className="hover:text-amber-400 transition-colors">باقات الأسعار</a>
            <a href="#download" className="hover:text-amber-400 transition-colors">تحميل البرنامج</a>
            <a href="#faq" className="hover:text-amber-400 transition-colors">الأسئلة الشائعة</a>
          </div>

          <div className="flex items-center gap-3">
            <a 
              href={developerWhatsApp} 
              target="_blank" 
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all"
            >
              <MessageCircle className="h-4 w-4" />
              <span>واتساب المطور</span>
            </a>
            <a 
              href="#download" 
              className="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
            >
              <Download className="h-4 w-4" />
              <span>تحميل مجاني (v2.0.4)</span>
            </a>
          </div>

        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-16 pb-24 px-4 sm:px-6 max-w-6xl mx-auto text-center space-y-8">
        
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-black">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span>الإصدار الرسمي v2.0.4 جاهز للتحميل لنظام ويندوز (Windows 64-bit)</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white leading-tight tracking-tight">
          نظام الكاشير والمبيعات الأول في العراق<br />
          <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent">
            أوفلاين 100% وبدون اشتراكات شهرية
          </span>
        </h1>

        <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto font-medium leading-relaxed">
          تحكم كامل بمبيعات متجرك، مخازنك، وديونك مع دعم كامل للعملة العراقية (دينار ودولار) وطباعة الفواتير الحرارية و A4. اشترِ رخصة DUBSAR Lifetime مرة واحدة واستخدمها مدى الحياة للأبد.
        </p>

        {/* CTA Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <a 
            href={downloadExeUrl} 
            className="w-full sm:w-auto h-16 px-8 rounded-2xl text-base font-black bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-2xl shadow-amber-500/30 flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Download className="h-6 w-6" />
            <div className="text-right">
              <div>تحميل برنامج DUBSAR للكمبيوتر</div>
              <div className="text-[11px] font-bold opacity-80 font-mono">الإصدار v2.0.4 • بحجم 9 MB فقط</div>
            </div>
          </a>

          <a 
            href="https://wa.me/9647858833838?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%20%D8%A3%D8%B3%D8%AA%D8%A7%D8%B0%20%D8%AD%D8%B3%D9%8A%D9%86%D8%8C%20%D8%A3%D9%88%D8%AF%20%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%B9%D9%86%20%D8%AA%D9%81%D8%B9%D9%8A%D9%84%20%D9%86%D8%B8%D8%A7%D9%85%20DUBSAR%202.0"
            target="_blank" 
            rel="noreferrer"
            className="w-full sm:w-auto h-16 px-8 rounded-2xl text-base font-black bg-emerald-600/90 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95"
          >
            <MessageCircle className="h-6 w-6" />
            <div className="text-right">
              <div>طلب كود التفعيل عبر واتساب</div>
              <div className="text-[11px] font-bold opacity-80">المطور: حسين صلاح (07858833838)</div>
            </div>
          </a>
        </div>

        {/* Feature Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 max-w-4xl mx-auto">
          <div className="bg-slate-900/80 border border-white/10 p-4 rounded-2xl flex items-center gap-3 text-right">
            <Zap className="h-6 w-6 text-amber-400 shrink-0" />
            <div>
              <p className="text-xs font-black text-white">0ms تأخير</p>
              <p className="text-[10px] text-slate-400 font-bold">قاعدة بيانات محلية سريعة</p>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-white/10 p-4 rounded-2xl flex items-center gap-3 text-right">
            <Lock className="h-6 w-6 text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs font-black text-white">أوفلاين 100%</p>
              <p className="text-[10px] text-slate-400 font-bold">يعمل بدون إنترنت تماماً</p>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-white/10 p-4 rounded-2xl flex items-center gap-3 text-right">
            <Coins className="h-6 w-6 text-blue-400 shrink-0" />
            <div>
              <p className="text-xs font-black text-white">النقد العراقي</p>
              <p className="text-[10px] text-slate-400 font-bold">حاسبة الباقي بالفئات</p>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-white/10 p-4 rounded-2xl flex items-center gap-3 text-right">
            <ShieldCheck className="h-6 w-6 text-purple-400 shrink-0" />
            <div>
              <p className="text-xs font-black text-white">رخصة Lifetime</p>
              <p className="text-[10px] text-slate-400 font-bold">شراء دائم بدون اشتراك</p>
            </div>
          </div>
        </div>

      </section>

      {/* Interactive System Preview & Screenshots Section */}
      <section id="preview" className="relative z-10 py-16 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center space-y-3 mb-10">
          <h2 className="text-3xl sm:text-4xl font-black text-white">شاهد واجهات النظام أثناء العمل</h2>
          <p className="text-sm text-slate-400 font-bold max-w-2xl mx-auto">
            واجهة مستخدم عصرية، سريعة وسهلة جداً في الاستخدام، مصممة خصيصاً لتناسب سرعة الكاشير وضغط العمل اليومي.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          <button 
            onClick={() => setActiveTab('pos')}
            className={`px-5 py-3 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === 'pos' 
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 scale-105' 
                : 'bg-slate-900 text-slate-400 border border-white/10 hover:text-white'
            }`}
          >
            <ShoppingCart className="h-4 w-4" />
            <span>واجهة الكاشير والنقد العراقي</span>
          </button>

          <button 
            onClick={() => setActiveTab('inventory')}
            className={`px-5 py-3 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === 'inventory' 
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 scale-105' 
                : 'bg-slate-900 text-slate-400 border border-white/10 hover:text-white'
            }`}
          >
            <Package className="h-4 w-4" />
            <span>إدارة المخزن والباركود</span>
          </button>

          <button 
            onClick={() => setActiveTab('debts')}
            className={`px-5 py-3 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === 'debts' 
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 scale-105' 
                : 'bg-slate-900 text-slate-400 border border-white/10 hover:text-white'
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            <span>الديون وسندات القبض</span>
          </button>

          <button 
            onClick={() => setActiveTab('print')}
            className={`px-5 py-3 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === 'print' 
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 scale-105' 
                : 'bg-slate-900 text-slate-400 border border-white/10 hover:text-white'
            }`}
          >
            <Printer className="h-4 w-4" />
            <span>طباعة الفواتير 80mm و A4</span>
          </button>
        </div>

        {/* Tab Content Display */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-indigo-950/40 p-6 sm:p-10 rounded-3xl border border-white/15 shadow-2xl space-y-8">
          
          {activeTab === 'pos' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-xl font-black text-amber-400 flex items-center gap-2">
                    <Coins className="h-5 w-5" />
                    <span>واجهة الكاشير السريعة مع الفئات النقدية العراقية</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-bold mt-1">
                    أزرار تفاعلية بصور العملات الفعلية (50,000 و 25,000 و 5,000 و 250 دينار) لحساب باقي الزبون بلمسة واحدة.
                  </p>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs font-bold">
                  حاسبة الباقي التلقائية
                </Badge>
              </div>

              {/* Banknotes Visual Showcase */}
              <div className="space-y-3">
                <span className="text-xs font-black text-slate-300">صور الفئات النقدية المعتمدة في نافذة الدفع السريع:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-slate-950 p-3 rounded-2xl border border-white/10 space-y-2 hover:border-amber-400/50 transition-all text-center">
                    <img src="/banknotes/50000.jpg" alt="50,000 IQD" className="w-full h-24 object-cover rounded-xl shadow" />
                    <span className="text-xs font-black text-amber-300 block font-mono">50,000 دينار عراقي</span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-2xl border border-white/10 space-y-2 hover:border-amber-400/50 transition-all text-center">
                    <img src="/banknotes/25000.jpg" alt="25,000 IQD" className="w-full h-24 object-cover rounded-xl shadow" />
                    <span className="text-xs font-black text-amber-300 block font-mono">25,000 دينار عراقي</span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-2xl border border-white/10 space-y-2 hover:border-amber-400/50 transition-all text-center">
                    <img src="/banknotes/5000.jpg" alt="5,000 IQD" className="w-full h-24 object-cover rounded-xl shadow" />
                    <span className="text-xs font-black text-amber-300 block font-mono">5,000 دينار عراقي</span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-2xl border border-white/10 space-y-2 hover:border-amber-400/50 transition-all text-center">
                    <img src="/banknotes/250.jpg" alt="250 IQD" className="w-full h-24 object-cover rounded-xl shadow" />
                    <span className="text-xs font-black text-amber-300 block font-mono">250 دينار عراقي</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 font-bold">
                💡 <strong>مثال عملي:</strong> إذا كان مجموع الفاتورة 25,000 دينار وأعطاك الزبون 50,000، بضغطة واحدة على صورة الـ 50 ألف يظهر لك النظام فوراً: "المتبقي للزبون: 25,000 دينار" مع طباعة الفاتورة تلقائياً.
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="border-b border-white/10 pb-4">
                <h3 className="text-xl font-black text-amber-400 flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  <span>إدارة المستودعات، الباركود، وتنبيهات النفاذ</span>
                </h3>
                <p className="text-xs text-slate-400 font-bold mt-1">
                  إضافة سريعة للمواد، توليد وطباعة ملصقات الباركود، تتبع كميات المخزن لحظياً، وتنبيهات فورية عند وصول المادة لحد الأمان.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold">
                <div className="p-5 rounded-2xl bg-slate-950 border border-white/10 space-y-2">
                  <div className="text-amber-400 text-lg">🏷️</div>
                  <h4 className="text-white font-black text-sm">طباعة ملصقات الباركود</h4>
                  <p className="text-slate-400">توليد وطباعة باركود المواد بجميع المقاسات (حراري ومكتبي) بضغطة زر واحدة.</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950 border border-white/10 space-y-2">
                  <div className="text-rose-400 text-lg">⚠️</div>
                  <h4 className="text-white font-black text-sm">تنبيهات نقص المخزون</h4>
                  <p className="text-slate-400">إشعارك التلقائي بالمواد التي أوشكت على النفاد لطلبها قبل ضياع المبيعات.</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950 border border-white/10 space-y-2">
                  <div className="text-emerald-400 text-lg">📦</div>
                  <h4 className="text-white font-black text-sm">المخازن المتعددة</h4>
                  <p className="text-slate-400">تحويل المواد بين المستودعات والصالات مع سجل دقيق لحركات الإدخال والإخراج.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'debts' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="border-b border-white/10 pb-4">
                <h3 className="text-xl font-black text-amber-400 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>إدارة الديون، الحسابات، وسندات القبض والصرف</span>
                </h3>
                <p className="text-xs text-slate-400 font-bold mt-1">
                  كشف حساب دقيق لكل زبون ومورد، تسجيل سندات القبض والدفعات، وإرسال تنبيهات وتفاصيل الحساب عبر واتساب.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold">
                <div className="p-5 rounded-2xl bg-slate-950 border border-white/10 space-y-2">
                  <div className="text-indigo-400 text-lg">📜</div>
                  <h4 className="text-white font-black text-sm">كشف حساب زبون تفصيلي</h4>
                  <p className="text-slate-400">طباعة وتصدير كشف حساب كامل بجميع الفواتير والواصل والمتبقي.</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950 border border-white/10 space-y-2">
                  <div className="text-emerald-400 text-lg">💵</div>
                  <h4 className="text-white font-black text-sm">سندات القبض والصرف</h4>
                  <p className="text-slate-400">إصدار سندات قبض سريعة واختيار الزبائن بسهولة مع طباعة سند رسمي فوري.</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950 border border-white/10 space-y-2">
                  <div className="text-amber-400 text-lg">📊</div>
                  <h4 className="text-white font-black text-sm">أرباح وخسائر الصندوق</h4>
                  <p className="text-slate-400">معرفة دخل الصندوق اليومي الصافي ومجموع الأرباح بعد خصم المصاريف.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'print' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="border-b border-white/10 pb-4">
                <h3 className="text-xl font-black text-amber-400 flex items-center gap-2">
                  <Printer className="h-5 w-5" />
                  <span>محرك قوالب الطباعة الموحد (80mm & A4)</span>
                </h3>
                <p className="text-xs text-slate-400 font-bold mt-1">
                  نظام طباعة مخصص يلبي متطلبات المحلات والشركات، مع دعم كامل للباركود، QR Code، والشعار المخصص.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
                <div className="p-6 rounded-2xl bg-slate-950 border border-white/10 space-y-3 text-right">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black">
                    🧾
                  </div>
                  <h4 className="text-white font-black text-sm">الفاتورة الحرارية السريعة (80mm)</h4>
                  <p className="text-slate-400">
                    طباعة لحظية في أقل من ثانية واحدة لكاشيرات السوبرماركت والمطاعم والمحلات. يمكنك إظهار اسم المحل، المتبقي، والباركود بحرية.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-slate-950 border border-white/10 space-y-3 text-right">
                  <div className="h-10 w-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black">
                    📄
                  </div>
                  <h4 className="text-white font-black text-sm">الفاتورة الضريبية والرسمية (A4)</h4>
                  <p className="text-slate-400">
                    تصميم فاخر جداً للشركات وتجار الجملة يتضمن تفاصيل المواد، الشعار الرسمي، الختم، وكشف ذمة الزبون السابقة.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* Pricing Packages Section */}
      <section id="pricing" className="relative z-10 py-20 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center space-y-3 mb-14">
          <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30 text-xs font-black">
            باقات الشراء الدائم (Lifetime)
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-black text-white">اختر الباقة المناسبة لنشاطك التجاري</h2>
          <p className="text-sm text-slate-400 font-bold max-w-xl mx-auto">
            جميع الباقات تمنحك تملّكاً دائماً للبرنامج بدون أي اشتراكات أو دفعات شهرية إجبارية.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          
          {/* Plan 1: Single Station */}
          <div className="bg-slate-900/80 rounded-3xl p-8 border border-white/10 shadow-xl flex flex-col justify-between space-y-6 hover:border-white/20 transition-all">
            <div className="space-y-4 text-right">
              <Badge variant="outline" className="text-slate-400 border-white/10 font-bold">للمحلات الفردية</Badge>
              <h3 className="text-2xl font-black text-white">الباقة الفردية</h3>
              <p className="text-xs text-slate-400 font-bold">مثالية للمحلات الصغيرة ونقاط البيع المنفردة</p>
              
              <div className="pt-2">
                <span className="text-4xl font-black text-white font-mono">200,000</span>
                <span className="text-xs text-amber-400 font-bold mr-1.5">دينار عراقي</span>
                <p className="text-[11px] text-slate-400 font-bold mt-1">تدفع مرة واحدة فقط (مدى الحياة)</p>
              </div>

              <div className="border-t border-white/10 pt-4 space-y-2.5 text-xs font-bold text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>جهاز كاشير واحد (Single Station)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>يعمل 100% بدون إنترنت</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>إدارة المبيعات والمخزن والديون</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>طباعة فواتير 80mm حرارية و A4</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>تحديثات النظام المجانية</span>
                </div>
              </div>
            </div>

            <a 
              href="https://wa.me/9647858833838?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%D8%8C%20%D8%A3%D9%88%D8%AF%20%D8%B7%D9%84%D8%A8%20%D8%A7%D9%84%D8%A8%D8%A7%D9%82%D8%A9%20%D8%A7%D9%84%D9%81%D8%B1%D8%AF%D9%8A%D8%A9%20%D9%84%D9%86%D8%B8%D8%A7%D9%85%20DUBSAR%20(200,000%20%D8%AF.%D8%B9)"
              target="_blank"
              rel="noreferrer"
              className="w-full h-12 rounded-xl font-black text-xs bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center gap-2 transition-all shadow"
            >
              <span>طلب الباقة عبر واتساب</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>

          {/* Plan 2: Pro Duo (Highlighted) */}
          <div className="bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-900 rounded-3xl p-8 border-2 border-amber-500 shadow-2xl flex flex-col justify-between space-y-6 relative transform md:-translate-y-3">
            <div className="absolute -top-3.5 right-1/2 translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-[11px] font-black shadow-md">
              👑 الأكثر طلباً للمحلات النشطة
            </div>

            <div className="space-y-4 text-right pt-2">
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 font-bold">كاشير + إدارة</Badge>
              <h3 className="text-2xl font-black text-white">باقة برو (Pro Duo)</h3>
              <p className="text-xs text-slate-400 font-bold">جهاز كاشير لنقطة البيع + جهاز لابتوب للإدارة والمخزن</p>
              
              <div className="pt-2">
                <span className="text-4xl font-black text-amber-400 font-mono">350,000</span>
                <span className="text-xs text-amber-300 font-bold mr-1.5">دينار عراقي</span>
                <p className="text-[11px] text-slate-400 font-bold mt-1">تدفع مرة واحدة فقط (مدى الحياة)</p>
              </div>

              <div className="border-t border-white/10 pt-4 space-y-2.5 text-xs font-bold text-slate-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                  <span className="text-white font-black">جهازين مرخصين (كاشير + إدارة)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>ربط شبكي محلي فائق السرعة</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>متابعة المبيعات من الإدارة لحظة بلحظة</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>طباعة فواتير مخصصة بالشعار والباركود</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>أولوية في الدعم الفني والتحديثات</span>
                </div>
              </div>
            </div>

            <a 
              href="https://wa.me/9647858833838?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%D8%8C%20%D8%A3%D9%88%D8%AF%20%D8%B7%D9%84%D8%A8%20%D8%A8%D8%A7%D9%82%D8%A9%20%D8%A8%D8%B1%D9%88%20(Pro%20Duo)%20%D8%AC%D9%87%D8%A7%D8%B2%D9%8A%D9%86%20%D9%84%D9%86%D8%B8%D8%A7%D9%85%20DUBSAR%20(350,000%20%D8%AF.%D8%B9)"
              target="_blank"
              rel="noreferrer"
              className="w-full h-14 rounded-2xl font-black text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 flex items-center justify-center gap-2 transition-all shadow-xl shadow-amber-500/25 cursor-pointer"
            >
              <span>طلب باقة برو عبر واتساب</span>
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          {/* Plan 3: Enterprise Network */}
          <div className="bg-slate-900/80 rounded-3xl p-8 border border-white/10 shadow-xl flex flex-col justify-between space-y-6 hover:border-white/20 transition-all">
            <div className="space-y-4 text-right">
              <Badge variant="outline" className="text-slate-400 border-white/10 font-bold">للشركات والمخازن</Badge>
              <h3 className="text-2xl font-black text-white">باقة الشبكات والشركات</h3>
              <p className="text-xs text-slate-400 font-bold">شبكة متكاملة من 3 إلى 5 أجهزة للمؤسسات وتجار الجملة</p>
              
              <div className="pt-2">
                <span className="text-4xl font-black text-white font-mono">500,000</span>
                <span className="text-xs text-amber-400 font-bold mr-1.5">دينار عراقي</span>
                <p className="text-[11px] text-slate-400 font-bold mt-1">تدفع مرة واحدة فقط (مدى الحياة)</p>
              </div>

              <div className="border-t border-white/10 pt-4 space-y-2.5 text-xs font-bold text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>3 إلى 5 أجهزة مرخصة في شبكة واحدة</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>كاشيرات متعددة + مخازن + محاسبة</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>صلاحيات دقيقة للمستخدمين والموظفين</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>نسخ احتياطي مركزي مبرمج</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>دعم فني خاص وتدريب شامل</span>
                </div>
              </div>
            </div>

            <a 
              href="https://wa.me/9647858833838?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%D8%8C%20%D8%A3%D9%88%D8%AF%20%D8%B7%D9%84%D8%A8%20%D8%A8%D8%A7%D9%82%D8%A9%20%D8%A7%D9%84%D8%B4%D8%A8%D9%83%D8%A7%D8%AA%20%D9%88%D8%A7%D9%84%D8%B4%D8%B1%D9%83%D8%A7%D8%AA%20%D9%84%D9%86%D8%B8%D8%A7%D9%85%20DUBSAR%20(500,000%20%D8%AF.%D8%B9)"
              target="_blank"
              rel="noreferrer"
              className="w-full h-12 rounded-xl font-black text-xs bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center gap-2 transition-all shadow"
            >
              <span>طلب باقة الشركات عبر واتساب</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>

        </div>
      </section>

      {/* Download Center Section */}
      <section id="download" className="relative z-10 py-16 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 p-8 sm:p-12 rounded-3xl border-2 border-amber-500/30 shadow-2xl text-center space-y-8">
          
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center font-black text-3xl mx-auto shadow-xl shadow-amber-500/20">
            ⬇️
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl sm:text-4xl font-black text-white">مركز التحميل الرسمي المباشر</h2>
            <p className="text-sm text-slate-300 font-bold max-w-xl mx-auto">
              قم بتنزيل ملف التثبيت المعتمد وتثبيته على أي جهاز يعمل بنظام Windows (Windows 10 / Windows 11).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <a 
              href={downloadExeUrl}
              className="w-full sm:w-auto h-16 px-8 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-base flex items-center justify-center gap-3 shadow-xl shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
            >
              <Download className="h-6 w-6" />
              <div className="text-right">
                <div>تحميل مثبت النظام الرسمي (.EXE)</div>
                <div className="text-[11px] font-bold opacity-80 font-mono">Setup Installer • v2.0.4 (9 MB)</div>
              </div>
            </a>

            <a 
              href={downloadMsiUrl}
              className="w-full sm:w-auto h-16 px-8 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-black text-base flex items-center justify-center gap-3 border border-white/10 transition-all hover:scale-105 active:scale-95"
            >
              <Package className="h-6 w-6 text-indigo-400" />
              <div className="text-right">
                <div>تحميل حزمة ويندوز (.MSI)</div>
                <div className="text-[11px] font-bold text-slate-400 font-mono">Enterprise MSI Package (10 MB)</div>
              </div>
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-white/10 text-xs font-bold text-slate-300 text-right">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>متوافق مع Windows 10 & 11 (64-bit)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>موقّع ومشفّر رقمياً ضد التلاعب</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>تثبيت صامت وآمن لا يمس ملفاتك</span>
            </div>
          </div>

        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="relative z-10 py-16 px-4 sm:px-6 max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-3xl font-black text-white">الأسئلة الشائعة</h2>
          <p className="text-xs text-slate-400 font-bold">كل ما تحتاج معرفته عن نظام DUBSAR 2.0</p>
        </div>

        <div className="space-y-3">
          {[
            {
              q: "هل يتطلب النظام اشتراكاً شهرياً أو سنوياً؟",
              a: "كلا، إطلاقاً! نظام DUBSAR يعتمد رخصة الاستخدام الدائم (Lifetime). تشتري النسخة مرة واحدة وتظل ملكاً لك وتعمل للأبد بدون أي مدفوعات دورية إجبارية."
            },
            {
              q: "هل يعمل البرنامج في حال انقطاع خدمة الإنترنت؟",
              a: "نعم 100%! تم بناء DUBSAR ليعمل محلياً (Offline First) اعتماداً على قاعدة بيانات SQLite فائقة السرعة، وبالتالي مبيعاتك وطباعتك تعمل دون أي توقف حتى مع انقطاع الإنترنت التام."
            },
            {
              q: "كيف أحصل على كود التفعيل بعد تنزيل البرنامج؟",
              a: "بعد تحميل البرنامج وتشغيله، يظهر لك على الشاشة معرف الجهاز (Hardware ID). اضغط زر النسخ وأرسله للمطور حسين صلاح عبر واتساب (07858833838) لتستلم كود التفعيل الرقمي المعتمد فوراً."
            },
            {
              q: "هل بياناتي ومعلومات فواتيري في أمان؟",
              a: "نعم، كافة بيانات المحل والمبيعات والزبائن والديون تُخزن مشفرة محلياً على جهاز الكمبيوتر الخاص بك فقط ولا يتم إرسالها لأي خادم خارجي، مع نظام نسخ احتياطي تلقائي لحفظها."
            },
            {
              q: "هل يدعم البرنامج طابعات الفواتير الحرارية والباركود؟",
              a: "نعم، يدعم جميع طابعات الإيصالات الحرارية مقاس 80mm و 58mm، وطابعات الفواتير العادية A4، وقارئات الباركود الليزرية بمختلف أنواعها مباشرة."
            }
          ].map((item, index) => (
            <div 
              key={index}
              onClick={() => setFaqOpen(faqOpen === index ? null : index)}
              className="bg-slate-900/80 border border-white/10 rounded-2xl p-5 cursor-pointer hover:border-amber-500/30 transition-all space-y-2"
            >
              <div className="flex items-center justify-between font-black text-sm text-white">
                <span>{item.q}</span>
                <ChevronDown className={`h-4 w-4 text-amber-400 transition-transform ${faqOpen === index ? 'rotate-180' : ''}`} />
              </div>
              {faqOpen === index && (
                <p className="text-xs text-slate-400 font-medium leading-relaxed pt-2 border-t border-white/5 animate-in fade-in">
                  {item.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Developer & Contact Section */}
      <section className="relative z-10 py-16 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950/40 p-8 sm:p-10 rounded-3xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-right">
            <div className="h-16 w-16 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-3xl shadow-xl">
              👨‍💻
            </div>
            <div>
              <span className="text-xs text-amber-400 font-black">المطور المعتمد للنظام:</span>
              <h3 className="text-2xl font-black text-white">حسين صلاح (Hussein Salah)</h3>
              <p className="text-xs text-slate-300 font-bold mt-0.5">
                مطور أنظمة إدارة المبيعات والمخازن • دعم فني واستشارات مجانية لكافة محافظات العراق
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a 
              href="tel:07858833838" 
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs flex items-center gap-2 border border-white/10 transition-all font-mono"
            >
              <Phone className="h-4 w-4 text-amber-400" />
              <span>07858833838</span>
            </a>

            <a 
              href="https://wa.me/9647858833838?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%20%D8%A3%D8%B3%D8%AA%D8%A7%D8%B0%20%D8%AD%D8%B3%D9%8A%D9%86%D8%8C%20%D8%A3%D9%88%D8%AF%20%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%B9%D9%86%20%D9%86%D8%B8%D8%A7%D9%85%20DUBSAR%202.0"
              target="_blank" 
              rel="noreferrer"
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95"
            >
              <MessageCircle className="h-4 w-4" />
              <span>محادثة واتساب مباشرة</span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-10 px-4 sm:px-6 text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <span className="font-black text-white text-lg tracking-tight">DUBSAR 2.0 PRO</span>
          <span className="text-slate-500">•</span>
          <span className="text-xs text-slate-400 font-bold">نظام الكاشير والمبيعات وإدارة المخازن</span>
        </div>
        <p className="text-xs text-slate-500 font-medium">
          كافة الحقوق محفوظة © 2026 DUBSAR Systems • تطوير وبرمجة: حسين صلاح
        </p>
      </footer>

    </div>
  );
}
