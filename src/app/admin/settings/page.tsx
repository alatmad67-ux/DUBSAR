'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Store, 
  Receipt, 
  Palette, 
  Printer, 
  Monitor, 
  Warehouse, 
  Coins, 
  Users, 
  MessageSquare, 
  Database, 
  ShieldCheck, 
  Info, 
  Save, 
  Loader2, 
  Check, 
  Upload, 
  RefreshCw, 
  HardDrive, 
  FileText,
  Clock,
  Sparkles,
  Layers,
  Percent,
  Download,
  CheckCircle2,
  AlertCircle,
  ArrowUpCircle,
  Lock,
  Key,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { LocalAuthService } from '@/services/local-auth-service';
import { AdapterFactory } from '@/infra/database/adapter-factory';
import { DB_COMMANDS } from '@/infra/database/adapter';
import { cn } from '@/lib/utils';
import { UpdaterService, UpdateCheckResult } from '@/services/updater-service';

interface SettingsState {
  systemLanguage: string;
  defaultCurrency: string;
  usdExchangeRate: number;
  dateFormat: string;
  autoSaveInterval: number;

  businessName: string;
  ownerName: string;
  phone1: string;
  phone2: string;
  address: string;
  province: string;
  commercialRecord: string;
  taxNumber: string;
  logo: string;

  invoicePrefix: string;
  invoiceStartNumber: number;
  enableTax: boolean;
  taxPercentage: number;
  allowCreditSales: boolean;
  defaultPaymentMethod: string;
  invoiceNotice: string;
  invoiceFooterNotes: string;

  defaultPrintFormat: '80mm' | 'A4';
  showCompanyLogo: boolean;
  showCustomerBalance: boolean;
  showPreviousBalance: boolean;
  showBarcodeOnInvoice: boolean;
  showCashierName: boolean;
  printFontScale: 'small' | 'medium' | 'large';

  selectedThermalPrinter: string;
  selectedA4Printer: string;
  autoPrintOnSave: boolean;
  printCopies: number;

  defaultPriceType: 'retail' | 'wholesale' | 'agent';
  barcodeAutoAdd: boolean;
  allowPriceEditOnSale: boolean;
  allowDiscountOnSale: boolean;
  maxDiscountPercentage: number;
  soundOnScan: boolean;

  preventSaleOutOfStock: boolean;
  lowStockAlertLimit: number;
  defaultWarehouseId: string;
  enableExpiryTracking: boolean;
  enableSerialTracking: boolean;

  fiscalYearStart: string;
  enableAutomaticCashClosing: boolean;
  dailyCashClosingTime: string;
  allowNegativeCustomerBalance: boolean;

  workStartTime: string;
  workEndTime: string;
  weeklyOffDay: string;
  overtimeHourRate: number;
  enableAttendanceTracking: boolean;

  whatsappEnabled: boolean;
  whatsappDefaultCountryCode: string;
  whatsappInvoiceTemplate: string;
  whatsappPaymentReminderTemplate: string;

  backupAutoEnabled: boolean;
  backupInterval: 'daily' | 'weekly' | 'manual';
  backupPath: string;
  maxBackupsKept: number;
}

const DEFAULT_SETTINGS: SettingsState = {
  systemLanguage: 'ar',
  defaultCurrency: 'IQD',
  usdExchangeRate: 1530,
  dateFormat: 'YYYY-MM-DD',
  autoSaveInterval: 5,

  businessName: 'مؤسسة دوبسار التجارية',
  ownerName: '',
  phone1: '',
  phone2: '',
  address: 'بغداد - الكرادة',
  province: 'بغداد',
  commercialRecord: '',
  taxNumber: '',
  logo: '',

  invoicePrefix: 'INV-',
  invoiceStartNumber: 1001,
  enableTax: false,
  taxPercentage: 0,
  allowCreditSales: true,
  defaultPaymentMethod: 'cash',
  invoiceNotice: 'فاتورة مبيعات معتمدة رسمياً',
  invoiceFooterNotes: 'البضاعة المباعة خاضعة للفحص والاستلام • لا ترد بعد مرور 3 أيام من تاريخ الشراء',

  defaultPrintFormat: '80mm',
  showCompanyLogo: true,
  showCustomerBalance: true,
  showPreviousBalance: true,
  showBarcodeOnInvoice: true,
  showCashierName: true,
  printFontScale: 'medium',

  selectedThermalPrinter: '',
  selectedA4Printer: '',
  autoPrintOnSave: true,
  printCopies: 1,

  defaultPriceType: 'retail',
  barcodeAutoAdd: true,
  allowPriceEditOnSale: true,
  allowDiscountOnSale: true,
  maxDiscountPercentage: 25,
  soundOnScan: true,

  preventSaleOutOfStock: false,
  lowStockAlertLimit: 5,
  defaultWarehouseId: 'default-warehouse',
  enableExpiryTracking: false,
  enableSerialTracking: false,

  fiscalYearStart: '01-01',
  enableAutomaticCashClosing: false,
  dailyCashClosingTime: '23:00',
  allowNegativeCustomerBalance: true,

  workStartTime: '09:00',
  workEndTime: '18:00',
  weeklyOffDay: 'الجمعة',
  overtimeHourRate: 5000,
  enableAttendanceTracking: false,

  whatsappEnabled: true,
  whatsappDefaultCountryCode: '964',
  whatsappInvoiceTemplate: 'مرحباً {customer_name}، شكراً لتعاملكم معنا. مرفق تفاصيل فاتورتكم رقم {invoice_no} بمبلغ {total_amount}. الرصيد الحالي: {current_balance}.',
  whatsappPaymentReminderTemplate: 'عزيزنا {customer_name}، نود تذكيركم بذمة مالية مستحقة قدرها {remaining_amount} لدى مؤسسة {business_name}.',

  backupAutoEnabled: true,
  backupInterval: 'daily',
  backupPath: 'C:\\DubsarBackups',
  maxBackupsKept: 10
};

const SECTIONS = [
  { id: 'general', label: 'عام', icon: Building2, desc: 'اللغة والعملات والخيارات الأساسية' },
  { id: 'business', label: 'المنشأة', icon: Store, desc: 'اسم الشركة، العنوان، الهواتف، والشعار' },
  { id: 'invoices', label: 'الفواتير والمستندات', icon: Receipt, desc: 'الترقيم التلقائي والضرائب وطرق الدفع' },
  { id: 'print_design', label: 'تصميم المطبوعات', icon: Palette, desc: 'خيارات الفاتورة الحرارية وفاتورة A4' },
  { id: 'printers', label: 'الطابعات', icon: Printer, desc: 'التعرف على طابعات Windows واختبارها' },
  { id: 'cashier', label: 'الكاشير ونقاط البيع', icon: Monitor, desc: 'سلوك الباركود وسرعة إدخال الفواتير' },
  { id: 'inventory', label: 'المخزون', icon: Warehouse, desc: 'حدود التنبيه، المستودعات، ومنع النفاذ' },
  { id: 'accounts', label: 'الحسابات والمالية', icon: Coins, desc: 'السنة المالية والصناديق والأرصدة' },
  { id: 'hr', label: 'الموارد البشرية', icon: Users, desc: 'ساعات العمل والإجازات والرواتب' },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, desc: 'قوالب إرسال الفواتير والتذكيرات' },
  { id: 'backup', label: 'النسخ الاحتياطي', icon: Database, desc: 'مسار الحفظ التلقائي لقاعدة البيانات' },
  { id: 'security', label: 'المستخدمون والصلاحيات', icon: ShieldCheck, desc: 'إدارة الأدوار وكلمات المرور' },
  { id: 'license', label: 'الترخيص والملكية', icon: Lock, desc: 'رخصة DUBSAR Lifetime ومركز التفعيل' },
  { id: 'about', label: 'معلومات البرنامج', icon: Info, desc: 'إصدار النظام والتحديثات الرسمية' }
];

export default function ComprehensiveSettingsPage() {
  const [activeSection, setActiveSection] = useState('business');
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [printers, setPrinters] = useState<any[]>([]);
  const [loadingPrinters, setLoadingPrinters] = useState(false);
  const [testingPrinter, setTestingPrinter] = useState(false);

  // Tauri 2 Official Updater State
  const [currentAppVersion, setCurrentAppVersion] = useState('2.0.3');
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'available' | 'up_to_date' | 'downloading' | 'error'>('idle');
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [updateError, setUpdateError] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
          const { getVersion } = await import('@tauri-apps/api/app');
          const v = await getVersion();
          if (v) setCurrentAppVersion(v);
        }
      } catch {}
    })();
  }, []);

  const handleCheckUpdate = async () => {
    setUpdateStatus('checking');
    setUpdateError('');
    try {
      const result = await UpdaterService.checkForUpdates();
      setUpdateInfo(result);
      if (result.available) {
        setUpdateStatus('available');
        toast({ title: 'يتوفر تحديث جديد', description: `الإصدار ${result.version} متاح الآن للتحميل.` });
      } else if (result.error) {
        setUpdateStatus('error');
        setUpdateError(result.error);
        toast({ variant: 'destructive', title: 'فحص التحديثات', description: result.error });
      } else {
        setUpdateStatus('up_to_date');
        toast({ title: 'النظام محدث', description: `أنت تستخدم آخر إصدار رسمي (${result.currentVersion}).` });
      }
    } catch (e: any) {
      setUpdateStatus('error');
      setUpdateError(e?.message || 'تعذر الاتصال بخادم التحديثات');
    }
  };

  const handleApplyUpdate = async () => {
    setUpdateStatus('downloading');
    setDownloadProgress(0);
    try {
      await UpdaterService.downloadAndInstall((percent) => {
        setDownloadProgress(percent);
      });
      toast({ title: 'تم تثبيت التحديث', description: 'جاري إعادة تشغيل النظام لتطبيق الإصدار الجديد...' });
    } catch (e: any) {
      setUpdateStatus('error');
      setUpdateError(e?.message || 'فشل تحميل أو تثبيت التحديث');
      toast({ variant: 'destructive', title: 'فشل التحديث', description: String(e) });
    }
  };

  const adapter = AdapterFactory.getAdapter();

  useEffect(() => {
    try {
      const stored = localStorage.getItem('dubsar_app_settings');
      if (stored) {
        setSettings((prev) => ({ ...prev, ...JSON.parse(stored) }));
      }
    } catch {}

    LocalAuthService.getAppSettings()
      .then((data) => {
        if (data && typeof data === 'object') {
          setSettings((prev) => ({
            ...prev,
            businessName: data.businessName || prev.businessName,
            phone1: data.phone || prev.phone1,
            address: data.address || prev.address,
            logo: data.logo || prev.logo
          }));
        }
      })
      .catch(() => {});
  }, []);

  const refreshPrinters = async () => {
    setLoadingPrinters(true);
    try {
      const list = await adapter.execute(DB_COMMANDS.GET_SYSTEM_PRINTERS);
      if (Array.isArray(list)) {
        setPrinters(list);
        if (!settings.selectedThermalPrinter && list.length > 0) {
          const defaultOne = list.find((p) => p.isDefault)?.name || list[0].name;
          setSettings((prev) => ({ ...prev, selectedThermalPrinter: defaultOne, selectedA4Printer: defaultOne }));
        }
      }
    } catch (e) {
      toast({ variant: 'destructive', title: 'تعذر جلب طابعات النظام' });
    } finally {
      setLoadingPrinters(false);
    }
  };

  useEffect(() => {
    if (activeSection === 'printers') {
      refreshPrinters();
    }
  }, [activeSection]);

  const handleTestPrint = async (printerName: string) => {
    if (!printerName) {
      toast({ variant: 'destructive', title: 'يرجى اختيار طابعة أولاً' });
      return;
    }
    setTestingPrinter(true);
    try {
      await adapter.execute(DB_COMMANDS.PRINT_TEST_PAGE, { printerName });
      toast({ title: 'تم إرسال صفحة الاختبار بنجاح إلى الطابعة' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'فشل اختبار الطباعة', description: String(err) });
    } finally {
      setTestingPrinter(false);
    }
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'حجم الصورة كبير جداً', description: 'يرجى اختيار صورة أقل من 2 ميغابايت' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setSettings((prev) => ({ ...prev, logo: dataUrl }));
      toast({ title: 'تم تحميل الشعار بنجاح' });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      localStorage.setItem('dubsar_app_settings', JSON.stringify(settings));

      try {
        await LocalAuthService.saveAppSettings({
          businessName: settings.businessName || 'مؤسسة دوبسار',
          phone: settings.phone1 || '',
          address: settings.address || '',
          businessType: 'commercial',
          logo: settings.logo || '',
          invoiceHeaderImage: ''
        });
      } catch {}

      toast({
        title: 'تم حفظ كافة الإعدادات بنجاح',
        description: 'تم تحديث خيارات المنشأة والطابعات والفواتير محلياً.'
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'فشل حفظ الإعدادات',
        description: String(error)
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 select-none pb-12" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border shadow-sm">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            <span>مركز إعدادات النظام المكتبي</span>
          </h1>
          <p className="text-xs md:text-sm font-bold text-muted-foreground mt-1">
            التحكم الشامل ببيانات المنشأة، تصميم الفواتير، الطابعات، الكاشير، والنسخ الاحتياطي.
          </p>
        </div>

        <Button
          onClick={handleSaveAll}
          disabled={saving}
          className="h-12 px-8 font-black text-sm gap-2 rounded-xl shadow-lg bg-primary hover:bg-primary/95 text-white"
        >
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          <span>حفظ كافة الإعدادات</span>
        </Button>
      </div>

      {/* Main Settings Layout: Internal Sidebar + Content Pane */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Internal Navigation Sidebar */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border shadow-sm p-3 space-y-1 md:sticky md:top-4">
          <div className="px-3 py-2 text-xs font-black text-slate-400 uppercase tracking-widest">
            أقسام الإعدادات
          </div>

          {SECTIONS.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveSection(sec.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-right transition-all font-bold text-xs',
                  isActive
                    ? 'bg-primary text-white shadow-md font-black'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                )}
              >
                <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-white' : 'text-slate-400')} />
                <div className="flex-1 truncate">
                  <div className="truncate">{sec.label}</div>
                  <div className={cn('text-[10px] font-normal truncate opacity-80', isActive ? 'text-white/90' : 'text-slate-400')}>
                    {sec.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Content Pane */}
        <div className="md:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border shadow-sm p-6 space-y-6 min-h-[600px]">
          {/* 1. GENERAL */}
          {activeSection === 'general' && (
            <div className="space-y-6">
              <div className="border-b pb-4">
                <h2 className="text-xl font-black">الإعدادات العامة</h2>
                <p className="text-xs font-bold text-muted-foreground">اللغة وتنسيقات الوقت والعملة الأساسية للنظام</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black">لغة واجهة النظام</Label>
                  <select
                    value={settings.systemLanguage}
                    onChange={(e) => setSettings({ ...settings, systemLanguage: e.target.value })}
                    className="w-full h-11 px-3 text-xs font-bold rounded-xl border bg-background"
                  >
                    <option value="ar">العربية (Arabic) - الافتراضي</option>
                    <option value="en">English (الإنجليزية)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black">العملة الافتراضية للمعاملات</Label>
                  <select
                    value={settings.defaultCurrency}
                    onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value })}
                    className="w-full h-11 px-3 text-xs font-bold rounded-xl border bg-background"
                  >
                    <option value="IQD">دينار عراقي (د.ع) - الافتراضي</option>
                    <option value="USD">دولار أمريكي ($)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black">سعر صرف الدولار المعتمد (IQD مقابل 100$)</Label>
                  <Input
                    type="number"
                    value={settings.usdExchangeRate}
                    onChange={(e) => setSettings({ ...settings, usdExchangeRate: Number(e.target.value) || 1500 })}
                    className="h-11 text-xs font-bold"
                  />
                  <p className="text-[10px] text-muted-foreground font-bold">يستخدم في تقييم فواتير العملات الأجنبية وسندات القبض.</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black">صيغة عرض التاريخ</Label>
                  <select
                    value={settings.dateFormat}
                    onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
                    className="w-full h-11 px-3 text-xs font-bold rounded-xl border bg-background"
                  >
                    <option value="YYYY-MM-DD">YYYY-MM-DD (2026-09-18)</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY (18/09/2026)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 2. BUSINESS INFO */}
          {activeSection === 'business' && (
            <div className="space-y-6">
              <div className="border-b pb-4">
                <h2 className="text-xl font-black">بيانات المنشأة والنشاط التجاري</h2>
                <p className="text-xs font-bold text-muted-foreground">تظهر هذه المعلومات في ترويسة الفواتير والمستندات الرسمية</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-black">اسم المنشأة أو المحل التجاري *</Label>
                    <Input
                      value={settings.businessName}
                      onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                      placeholder="مثال: مؤسسة دوبسار للقطع والصيانة"
                      className="h-11 text-sm font-black"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-black">اسم المدير / صاحب العمل</Label>
                      <Input
                        value={settings.ownerName}
                        onChange={(e) => setSettings({ ...settings, ownerName: e.target.value })}
                        placeholder="اسم المسؤول"
                        className="h-11 text-xs font-bold"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-black">المحافظة / المدينة</Label>
                      <Input
                        value={settings.province}
                        onChange={(e) => setSettings({ ...settings, province: e.target.value })}
                        placeholder="بغداد، البصرة، أربيل..."
                        className="h-11 text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-black">رقم الهاتف الأول (رئيسي)</Label>
                      <Input
                        value={settings.phone1}
                        onChange={(e) => setSettings({ ...settings, phone1: e.target.value })}
                        placeholder="07XXXXXXXXX"
                        className="h-11 text-xs font-mono font-bold"
                        dir="ltr"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-black">رقم الهاتف الثاني (إضافي)</Label>
                      <Input
                        value={settings.phone2}
                        onChange={(e) => setSettings({ ...settings, phone2: e.target.value })}
                        placeholder="07XXXXXXXXX"
                        className="h-11 text-xs font-mono font-bold"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-black">العنوان بالتفصيل</Label>
                    <Input
                      value={settings.address}
                      onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                      placeholder="اسم الشارع، الفرع، أقرب نقطة دالة..."
                      className="h-11 text-xs font-bold"
                    />
                  </div>
                </div>

                {/* Logo Uploader */}
                <div className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed bg-slate-50 dark:bg-slate-800/40 text-center space-y-4">
                  <Label className="text-xs font-black">شعار المنشأة (Logo)</Label>
                  <div className="relative h-32 w-32 rounded-2xl bg-white dark:bg-slate-900 border flex items-center justify-center overflow-hidden shadow-sm">
                    {settings.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={settings.logo} alt="Logo" className="h-full w-full object-contain p-2" />
                    ) : (
                      <Store className="h-12 w-12 text-slate-300" />
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-black rounded-xl cursor-pointer hover:bg-primary/90 transition-colors shadow">
                      <Upload className="h-4 w-4" />
                      <span>اختيار صورة</span>
                      <input type="file" accept="image/*" onChange={handleLogoSelect} className="hidden" />
                    </label>

                    {settings.logo && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSettings({ ...settings, logo: '' })}
                        className="text-xs text-destructive hover:bg-destructive/10 font-bold block mx-auto"
                      >
                        إزالة الشعار
                      </Button>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground font-bold">يفضل ملف PNG شفاف أو JPG بأبعاد مربعة.</p>
                </div>
              </div>
            </div>
          )}

          {/* 3. INVOICES & DOCUMENTS */}
          {activeSection === 'invoices' && (
            <div className="space-y-6">
              <div className="border-b pb-4">
                <h2 className="text-xl font-black">الفواتير والمستندات الرسمية</h2>
                <p className="text-xs font-bold text-muted-foreground">إعدادات الترقيم التسلسلي والضرائب والشروط الافتراضية</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black">بادئة رقم الفاتورة (Invoice Prefix)</Label>
                  <Input
                    value={settings.invoicePrefix}
                    onChange={(e) => setSettings({ ...settings, invoicePrefix: e.target.value })}
                    placeholder="INV- أو قائمة-"
                    className="h-11 text-xs font-mono font-bold"
                  />
                  <p className="text-[10px] text-muted-foreground font-bold">الحروف التي تسبق رقم الفاتورة التسلسلي.</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black">بداية الترقيم التسلسلي</Label>
                  <Input
                    type="number"
                    value={settings.invoiceStartNumber}
                    onChange={(e) => setSettings({ ...settings, invoiceStartNumber: Number(e.target.value) || 1 })}
                    className="h-11 text-xs font-mono font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black">طريقة الدفع الافتراضية عند فتح الفاتورة</Label>
                  <select
                    value={settings.defaultPaymentMethod}
                    onChange={(e) => setSettings({ ...settings, defaultPaymentMethod: e.target.value })}
                    className="w-full h-11 px-3 text-xs font-bold rounded-xl border bg-background"
                  >
                    <option value="cash">نقداً (واصل كامل) - الافتراضي</option>
                    <option value="credit">آجل / ذمم</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black">عنوان ترويسة الفاتورة</Label>
                  <Input
                    value={settings.invoiceNotice}
                    onChange={(e) => setSettings({ ...settings, invoiceNotice: e.target.value })}
                    placeholder="فاتورة مبيعات نقدية / ذمم"
                    className="h-11 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black">الشروط والملاحظات الثابتة في أسفل الفاتورة</Label>
                <textarea
                  value={settings.invoiceFooterNotes}
                  onChange={(e) => setSettings({ ...settings, invoiceFooterNotes: e.target.value })}
                  rows={3}
                  className="w-full p-3 text-xs font-bold rounded-xl border bg-background"
                  placeholder="ملاحظات وشروط الفاتورة للمستهلك..."
                />
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="allowCredit"
                    checked={settings.allowCreditSales}
                    onChange={(e) => setSettings({ ...settings, allowCreditSales: e.target.checked })}
                    className="h-4 w-4 rounded accent-primary"
                  />
                  <Label htmlFor="allowCredit" className="text-xs font-black cursor-pointer">
                    السماح بالبيع الآجل وتسجيل المتبقي كـ (دين / ذمة) على العميل
                  </Label>
                </div>
              </div>
            </div>
          )}

          {/* 4. PRINT DESIGN */}
          {activeSection === 'print_design' && (
            <div className="space-y-6">
              <div className="border-b pb-4">
                <h2 className="text-xl font-black">تصميم المطبوعات والهوية الورقية</h2>
                <p className="text-xs font-bold text-muted-foreground">تخصيص العناصر التي تظهر على الفواتير الحرارية 80mm أو الورق A4</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black">القياس الافتراضي للطباعة</Label>
                  <select
                    value={settings.defaultPrintFormat}
                    onChange={(e) => setSettings({ ...settings, defaultPrintFormat: e.target.value as any })}
                    className="w-full h-11 px-3 text-xs font-bold rounded-xl border bg-background"
                  >
                    <option value="80mm">طابعة حرارية رول (80mm Thermal Receipt) - موصى به للمحلات</option>
                    <option value="A4">طابعة مكتبية رسمية (A4 Standard) - موصى به للشركات والجملة</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black">حجم خط الطباعة</Label>
                  <select
                    value={settings.printFontScale}
                    onChange={(e) => setSettings({ ...settings, printFontScale: e.target.value as any })}
                    className="w-full h-11 px-3 text-xs font-bold rounded-xl border bg-background"
                  >
                    <option value="small">صغير (مضغوط للأوراق الضيقة)</option>
                    <option value="medium">متوسط (افتراضي وواضح)</option>
                    <option value="large">كبير (أعلى وضوح للأرقام)</option>
                  </select>
                </div>
              </div>

              <div className="border rounded-xl p-4 bg-slate-50 dark:bg-slate-800/30 space-y-3">
                <div className="text-xs font-black text-slate-700 dark:text-slate-300 mb-2">العناصر المرئية على الفاتورة:</div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="flex items-center gap-2.5 text-xs font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.showCompanyLogo}
                      onChange={(e) => setSettings({ ...settings, showCompanyLogo: e.target.checked })}
                      className="h-4 w-4 rounded accent-primary"
                    />
                    <span>إظهار شعار المنشأة في أعلى الفاتورة</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.showCashierName}
                      onChange={(e) => setSettings({ ...settings, showCashierName: e.target.checked })}
                      className="h-4 w-4 rounded accent-primary"
                    />
                    <span>إظهار اسم الموظف / الكاشير الصادر للفاتورة</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.showCustomerBalance}
                      onChange={(e) => setSettings({ ...settings, showCustomerBalance: e.target.checked })}
                      className="h-4 w-4 rounded accent-primary"
                    />
                    <span>إظهار رصيد العميل الحالي في أسفل الفاتورة</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.showPreviousBalance}
                      onChange={(e) => setSettings({ ...settings, showPreviousBalance: e.target.checked })}
                      className="h-4 w-4 rounded accent-primary"
                    />
                    <span>إظهار الرصيد السابق للعميل قبل هذه القائمة</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.showBarcodeOnInvoice}
                      onChange={(e) => setSettings({ ...settings, showBarcodeOnInvoice: e.target.checked })}
                      className="h-4 w-4 rounded accent-primary"
                    />
                    <span>طباعة باركود رقم القائمة في ذيل الفاتورة</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* 5. PRINTERS */}
          {activeSection === 'printers' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h2 className="text-xl font-black">إدارة الطابعات</h2>
                  <p className="text-xs font-bold text-muted-foreground">ربط طابعات Windows واختبار الإرسال المباشر</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={refreshPrinters}
                  disabled={loadingPrinters}
                  className="h-9 text-xs font-black gap-1.5 rounded-lg"
                >
                  <RefreshCw className={cn('h-3.5 w-3.5', loadingPrinters && 'animate-spin')} />
                  <span>تحديث قائمة الطابعات</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black">طابعة الفواتير الحرارية الافتراضية (Thermal 80mm)</Label>
                  <select
                    value={settings.selectedThermalPrinter}
                    onChange={(e) => setSettings({ ...settings, selectedThermalPrinter: e.target.value })}
                    className="w-full h-11 px-3 text-xs font-bold rounded-xl border bg-background"
                  >
                    <option value="">-- طابعة Windows الافتراضية --</option>
                    {printers.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name} {p.isDefault ? '(الافتراضية)' : ''}
                      </option>
                    ))}
                  </select>
                  {settings.selectedThermalPrinter && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={testingPrinter}
                      onClick={() => handleTestPrint(settings.selectedThermalPrinter)}
                      className="text-xs font-bold text-primary gap-1"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>إرسال صفحة اختبار لهذه الطابعة</span>
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black">طابعة المستندات الرسمية الافتراضية (A4)</Label>
                  <select
                    value={settings.selectedA4Printer}
                    onChange={(e) => setSettings({ ...settings, selectedA4Printer: e.target.value })}
                    className="w-full h-11 px-3 text-xs font-bold rounded-xl border bg-background"
                  >
                    <option value="">-- طابعة Windows الافتراضية --</option>
                    {printers.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name} {p.isDefault ? '(الافتراضية)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="autoPrint"
                    checked={settings.autoPrintOnSave}
                    onChange={(e) => setSettings({ ...settings, autoPrintOnSave: e.target.checked })}
                    className="h-4 w-4 rounded accent-primary"
                  />
                  <Label htmlFor="autoPrint" className="text-xs font-black cursor-pointer">
                    طباعة تلقائية فور الضغط على (حفظ الفاتورة F10) دون الحاجة لفتح المعاينة
                  </Label>
                </div>

                <div className="flex items-center gap-3 pt-2 border-t">
                  <Label className="text-xs font-bold">عدد النسخ المطبوعة افتراضياً:</Label>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    value={settings.printCopies}
                    onChange={(e) => setSettings({ ...settings, printCopies: Math.max(1, Number(e.target.value) || 1) })}
                    className="h-9 w-20 text-xs font-bold text-center"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 6. CASHIER & POS */}
          {activeSection === 'cashier' && (
            <div className="space-y-6">
              <div className="border-b pb-4">
                <h2 className="text-xl font-black">شاشة المبيعات والكاشير</h2>
                <p className="text-xs font-bold text-muted-foreground">تسريع إدخال الفواتير وسلوك قارئ الباركود</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black">نوع السعر الافتراضي عند فتح القائمة</Label>
                  <select
                    value={settings.defaultPriceType}
                    onChange={(e) => setSettings({ ...settings, defaultPriceType: e.target.value as any })}
                    className="w-full h-11 px-3 text-xs font-bold rounded-xl border bg-background"
                  >
                    <option value="retail">مفرد (البيع للزبائن العاديين)</option>
                    <option value="wholesale">جملة</option>
                    <option value="agent">وكيل (خاص للموزعين)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black">الحد الأقصى لنسبة الخصم المسموحة للكاشير (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={settings.maxDiscountPercentage}
                    onChange={(e) => setSettings({ ...settings, maxDiscountPercentage: Number(e.target.value) || 0 })}
                    className="h-11 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border space-y-3">
                <label className="flex items-center gap-2.5 text-xs font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.barcodeAutoAdd}
                    onChange={(e) => setSettings({ ...settings, barcodeAutoAdd: e.target.checked })}
                    className="h-4 w-4 rounded accent-primary"
                  />
                  <span>إضافة المادة فوراً إلى السلة عند مسح الباركود دون الحاجة للضغط على إضافة</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.allowPriceEditOnSale}
                    onChange={(e) => setSettings({ ...settings, allowPriceEditOnSale: e.target.checked })}
                    className="h-4 w-4 rounded accent-primary"
                  />
                  <span>السماح للمستخدم بتعديل سعر البيع مباشرة من جدول الفاتورة</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.allowDiscountOnSale}
                    onChange={(e) => setSettings({ ...settings, allowDiscountOnSale: e.target.checked })}
                    className="h-4 w-4 rounded accent-primary"
                  />
                  <span>تفعيل خانة الخصم (المبلغ أو النسبة) داخل شاشة البيع</span>
                </label>
              </div>
            </div>
          )}

          {/* 7. INVENTORY */}
          {activeSection === 'inventory' && (
            <div className="space-y-6">
              <div className="border-b pb-4">
                <h2 className="text-xl font-black">المخزون والمستودعات</h2>
                <p className="text-xs font-bold text-muted-foreground">سياسات البيع حسب الكميات ومراقبة النقص والجرد</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black">حد التنبيه لنقص المادة (الحد الأدنى للطلب)</Label>
                  <Input
                    type="number"
                    value={settings.lowStockAlertLimit}
                    onChange={(e) => setSettings({ ...settings, lowStockAlertLimit: Number(e.target.value) || 5 })}
                    className="h-11 text-xs font-bold"
                  />
                  <p className="text-[10px] text-muted-foreground font-bold">تظهر المادة في تنبيهات النقص بالرئيسية عند بلوغ هذا الرقم.</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border space-y-3">
                <label className="flex items-center gap-2.5 text-xs font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.preventSaleOutOfStock}
                    onChange={(e) => setSettings({ ...settings, preventSaleOutOfStock: e.target.checked })}
                    className="h-4 w-4 rounded accent-primary"
                  />
                  <span className="font-black text-red-600">منع حفظ الفاتورة نهائياً إذا كانت الكمية غير متوفرة في المخزن</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableSerialTracking}
                    onChange={(e) => setSettings({ ...settings, enableSerialTracking: e.target.checked })}
                    className="h-4 w-4 rounded accent-primary"
                  />
                  <span>إلزام تسجيل الرقم التسلسلي (Serial Number) للأجهزة والمعدات</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableExpiryTracking}
                    onChange={(e) => setSettings({ ...settings, enableExpiryTracking: e.target.checked })}
                    className="h-4 w-4 rounded accent-primary"
                  />
                  <span>متابعة تواريخ الصلاحية والتنبيه قبل الانتهاء بـ 30 يوماً</span>
                </label>
              </div>
            </div>
          )}

          {/* 8. ACCOUNTS & FINANCE */}
          {activeSection === 'accounts' && (
            <div className="space-y-6">
              <div className="border-b pb-4">
                <h2 className="text-xl font-black">الحسابات والمالية والصندوق</h2>
                <p className="text-xs font-bold text-muted-foreground">خيارات الأرصدة وإغلاق اليومية المحاسبية</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black">وقت الإغلاق اليومي التلقائي للصندوق</Label>
                  <Input
                    type="time"
                    value={settings.dailyCashClosingTime}
                    onChange={(e) => setSettings({ ...settings, dailyCashClosingTime: e.target.value })}
                    className="h-11 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border space-y-3">
                <label className="flex items-center gap-2.5 text-xs font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.allowNegativeCustomerBalance}
                    onChange={(e) => setSettings({ ...settings, allowNegativeCustomerBalance: e.target.checked })}
                    className="h-4 w-4 rounded accent-primary"
                  />
                  <span>السماح برصيد سالب (ذمم وائتمان) لزبائن الحساب الجاري</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableAutomaticCashClosing}
                    onChange={(e) => setSettings({ ...settings, enableAutomaticCashClosing: e.target.checked })}
                    className="h-4 w-4 rounded accent-primary"
                  />
                  <span>إشعار المسؤول بجرد الصندوق وترحيل اليومية عند نهاية الدوام</span>
                </label>
              </div>
            </div>
          )}

          {/* 9. HR */}
          {activeSection === 'hr' && (
            <div className="space-y-6">
              <div className="border-b pb-4">
                <h2 className="text-xl font-black">الموارد البشرية والدوام</h2>
                <p className="text-xs font-bold text-muted-foreground">تحديد أوقات الدوام الرسمي وأيام العطل وساعات العمل الإضافي</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black">ساعة بدء العمل</Label>
                  <Input
                    type="time"
                    value={settings.workStartTime}
                    onChange={(e) => setSettings({ ...settings, workStartTime: e.target.value })}
                    className="h-11 text-xs font-mono font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black">ساعة انتهاء العمل</Label>
                  <Input
                    type="time"
                    value={settings.workEndTime}
                    onChange={(e) => setSettings({ ...settings, workEndTime: e.target.value })}
                    className="h-11 text-xs font-mono font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black">العطلة الأسبوعية</Label>
                  <select
                    value={settings.weeklyOffDay}
                    onChange={(e) => setSettings({ ...settings, weeklyOffDay: e.target.value })}
                    className="w-full h-11 px-3 text-xs font-bold rounded-xl border bg-background"
                  >
                    <option value="الجمعة">الجمعة</option>
                    <option value="الجمعة والسبت">الجمعة والسبت</option>
                    <option value="الأحد">الأحد</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black">أجر ساعة العمل الإضافي الافتراضية (د.ع)</Label>
                <Input
                  type="number"
                  value={settings.overtimeHourRate}
                  onChange={(e) => setSettings({ ...settings, overtimeHourRate: Number(e.target.value) || 0 })}
                  className="h-11 text-xs font-mono font-bold max-w-sm"
                />
              </div>
            </div>
          )}

          {/* 10. WHATSAPP */}
          {activeSection === 'whatsapp' && (
            <div className="space-y-6">
              <div className="border-b pb-4">
                <h2 className="text-xl font-black">الربط مع WhatsApp</h2>
                <p className="text-xs font-bold text-muted-foreground">إرسال الفواتير ورسائل تذكير الديون بنقرة واحدة عبر WhatsApp Desktop</p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-2">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="waEnabled"
                    checked={settings.whatsappEnabled}
                    onChange={(e) => setSettings({ ...settings, whatsappEnabled: e.target.checked })}
                    className="h-4 w-4 rounded accent-emerald-600"
                  />
                  <Label htmlFor="waEnabled" className="text-xs font-black cursor-pointer text-emerald-900 dark:text-emerald-100">
                    تفعيل زر مشاركة الفاتورة عبر WhatsApp في شاشات البيع وكشف الحساب
                  </Label>
                </div>
                <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium mr-7">
                  يقوم النظام بفتح تطبيق واتساب مثبت على جهازك مع نص الفاتورة جاهزاً دون الحاجة لاشتراكات مدفوعة.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black">قالب رسالة إرسال الفاتورة للعميل</Label>
                  <textarea
                    rows={4}
                    value={settings.whatsappInvoiceTemplate}
                    onChange={(e) => setSettings({ ...settings, whatsappInvoiceTemplate: e.target.value })}
                    className="w-full p-3 text-xs font-bold rounded-xl border bg-background"
                  />
                  <p className="text-[10px] text-muted-foreground font-bold">
                    المتغيرات المتاحة: {'{customer_name}'}, {'{invoice_no}'}, {'{total_amount}'}, {'{current_balance}'}, {'{business_name}'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black">قالب تذكير الديون المستحقة</Label>
                  <textarea
                    rows={3}
                    value={settings.whatsappPaymentReminderTemplate}
                    onChange={(e) => setSettings({ ...settings, whatsappPaymentReminderTemplate: e.target.value })}
                    className="w-full p-3 text-xs font-bold rounded-xl border bg-background"
                  />
                  <p className="text-[10px] text-muted-foreground font-bold">
                    المتغيرات المتاحة: {'{customer_name}'}, {'{remaining_amount}'}, {'{business_name}'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 11. BACKUP */}
          {activeSection === 'backup' && (
            <div className="space-y-6">
              <div className="border-b pb-4">
                <h2 className="text-xl font-black">النسخ الاحتياطي وحماية البيانات</h2>
                <p className="text-xs font-bold text-muted-foreground">تأمين قاعدة بيانات النظام محلياً للحماية من أي تلف أو فقدان</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black">مسار مجلد النسخ الاحتياطي على جهازك</Label>
                  <Input
                    value={settings.backupPath}
                    onChange={(e) => setSettings({ ...settings, backupPath: e.target.value })}
                    placeholder="مثال: D:\\DubsarBackups"
                    className="h-11 text-xs font-mono font-bold"
                  />
                  <p className="text-[10px] text-muted-foreground font-bold">يفضل اختيار قرص صلب خارجي أو قسم مختلف عن قرص النظام C:.</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black">تكرار النسخ الاحتياطي التلقائي</Label>
                  <select
                    value={settings.backupInterval}
                    onChange={(e) => setSettings({ ...settings, backupInterval: e.target.value as any })}
                    className="w-full h-11 px-3 text-xs font-bold rounded-xl border bg-background"
                  >
                    <option value="daily">يومياً عند إغلاق البرنامج (موصى به)</option>
                    <option value="weekly">أسبوعياً</option>
                    <option value="manual">يدوياً فقط</option>
                  </select>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border space-y-3">
                <label className="flex items-center gap-2.5 text-xs font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.backupAutoEnabled}
                    onChange={(e) => setSettings({ ...settings, backupAutoEnabled: e.target.checked })}
                    className="h-4 w-4 rounded accent-primary"
                  />
                  <span>إنشاء نسخة احتياطية مشفرة فور كل عملية إغلاق للنظام</span>
                </label>
              </div>
            </div>
          )}

          {/* 12. SECURITY & USERS */}
          {activeSection === 'security' && (
            <div className="space-y-6">
              <div className="border-b pb-4">
                <h2 className="text-xl font-black">المستخدمون وصلاحيات الوصول</h2>
                <p className="text-xs font-bold text-muted-foreground">إدارة الحسابات المحلية ورموز الدخول PIN</p>
              </div>

              <div className="p-4 rounded-2xl border bg-slate-50 dark:bg-slate-800/30 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">إدارة المستخدمين والصلاحيات</h3>
                  <p className="text-xs text-muted-foreground font-bold mt-0.5">
                    إضافة محاسبين أو كاشير، تحديد صلاحيات البيع والحذف والتعديل، وتغيير رموز PIN.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="default"
                  className="font-black text-xs h-10 px-4 rounded-xl"
                  onClick={() => window.location.href = '/admin/employees'}
                >
                  فتح شاشة المستخدمين
                </Button>
              </div>
            </div>
          )}

          {/* LICENSE & ACTIVATION */}
          {activeSection === 'license' && (
            <div className="space-y-6">
              <div className="border-b pb-4">
                <h2 className="text-xl font-black flex items-center gap-2">
                  <Lock className="h-5 w-5 text-amber-500" />
                  <span>الترخيص والملكية (DUBSAR Lifetime)</span>
                </h2>
                <p className="text-xs font-bold text-muted-foreground">تفاصيل رخصة البرنامج وحالة التفعيل على هذا الجهاز</p>
              </div>

              <div className="max-w-xl">
                <div className="p-6 rounded-2xl border bg-card space-y-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black text-xl">
                      🛡️
                    </div>
                    <div>
                      <h3 className="font-black text-sm">بيانات ورخصة هذا الجهاز</h3>
                      <p className="text-xs text-muted-foreground font-medium">عرض حالة تفعيل البرنامج، اسم النشاط التجاري، ومعرف الجهاز الحالي</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={() => window.location.href = '/admin/license'}
                    className="w-full rounded-xl font-black text-xs h-11 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <span>عرض تفاصيل رخصة البرنامج الحالية</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* 13. ABOUT & SYSTEM UPDATES */}
          {activeSection === 'about' && (
            <div className="space-y-6 text-center py-6">
              <div className="h-20 w-20 bg-primary/10 rounded-3xl mx-auto flex items-center justify-center text-primary shadow-inner">
                <Building2 className="h-10 w-10" />
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100">DUBSAR 2.0 Desktop</h2>
                <p className="text-sm font-bold text-muted-foreground">نظام إدارة الأعمال والمبيعات والمخازن المتكامل</p>
                <div className="inline-block px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-mono">
                  الإصدار الحالي: v{currentAppVersion}
                </div>
              </div>

              {/* Tauri 2 Official Updater Card */}
              <div className="max-w-lg mx-auto p-6 rounded-2xl border bg-card text-right shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-2">
                    <ArrowUpCircle className="h-5 w-5 text-primary" />
                    <div>
                      <h3 className="text-sm font-black">تحديثات النظام الرسمية (Tauri Updater)</h3>
                      <p className="text-[11px] text-muted-foreground font-bold">التحقق من التحديثات وتثبيتها تلقائياً دون لمس قاعدة البيانات المحلية</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={updateStatus === 'checking' || updateStatus === 'downloading'}
                    onClick={handleCheckUpdate}
                    className="font-bold text-xs h-9 px-3 gap-1.5 rounded-xl border-primary/30 text-primary hover:bg-primary/5"
                  >
                    {updateStatus === 'checking' ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5" />
                    )}
                    <span>التحقق من وجود تحديث</span>
                  </Button>
                </div>

                {updateStatus === 'checking' && (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 flex items-center justify-center gap-2 text-xs font-bold text-primary animate-pulse">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>جاري الاتصال بخادم التحديثات والتحقق من الإصدارات...</span>
                  </div>
                )}

                {updateStatus === 'up_to_date' && (
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 flex items-center gap-2.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    <span>نظام DUBSAR محدث إلى آخر إصدار رسمي (الإصدار الحالي: v{updateInfo?.currentVersion || currentAppVersion})</span>
                  </div>
                )}

                {updateStatus === 'available' && updateInfo && (
                  <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ArrowUpCircle className="h-5 w-5 text-blue-600" />
                        <div>
                          <span className="text-xs font-black text-blue-900 dark:text-blue-200">يتوفر تحديث جديد: v{updateInfo.version}</span>
                          <p className="text-[10px] text-muted-foreground font-mono">الإصدار الحالي: v{updateInfo.currentVersion}</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        onClick={handleApplyUpdate}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs h-9 px-4 rounded-xl gap-1.5 shadow"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>تحديث الآن</span>
                      </Button>
                    </div>
                    {updateInfo.body && (
                      <div className="text-[11px] text-slate-700 dark:text-slate-300 bg-white/70 dark:bg-slate-900/50 p-2.5 rounded-lg border border-blue-100 font-medium whitespace-pre-line">
                        {updateInfo.body}
                      </div>
                    )}
                  </div>
                )}

                {updateStatus === 'downloading' && (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 space-y-2 border">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-primary flex items-center gap-1.5">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> جاري تنزيل وتثبيت التحديث...
                      </span>
                      <span className="font-mono">{downloadProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                        style={{ width: `${downloadProgress}%` }} 
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground font-bold">سيتم استبدال ملفات البرنامج وإعادة تشغيل التطبيق تلقائياً بمجرد اكتمال التنزيل.</p>
                  </div>
                )}

                {updateStatus === 'error' && (
                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 text-xs font-bold text-amber-800 dark:text-amber-200 space-y-1">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                      <span>حالة فحص التحديثات:</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mr-6">{updateError || 'خادم التحديثات غير متاح أو لم يتم نشر إصدارات بعد.'}</p>
                  </div>
                )}

                <div className="text-[10px] text-muted-foreground font-bold border-t pt-2 flex items-center justify-between">
                  <span>وضع التثبيت الآمن: Passive Background Engine</span>
                  <span className="text-emerald-600 font-bold">بيانات SQLite محفوظة 100%</span>
                </div>
              </div>

              <div className="max-w-md mx-auto p-4 rounded-xl border bg-slate-50 dark:bg-slate-800/40 text-xs space-y-2 font-bold text-slate-600 dark:text-slate-400">
                <div className="flex justify-between"><span>البيئة المشغلة:</span><span className="font-mono text-slate-900 dark:text-slate-100">Windows Desktop Native (x64)</span></div>
                <div className="flex justify-between"><span>محرك التخزين:</span><span className="font-mono text-slate-900 dark:text-slate-100">SQLite High Performance Engine</span></div>
                <div className="flex justify-between"><span>حالة الأمان:</span><span className="text-emerald-600">محمي ومشفر محلياً</span></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
