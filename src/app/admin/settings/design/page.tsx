'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Printer, 
  Receipt, 
  FileText, 
  Save, 
  Loader2, 
  Upload, 
  CheckCircle2, 
  Eye, 
  Sliders, 
  QrCode, 
  Barcode, 
  Building2, 
  Phone, 
  MapPin, 
  Sparkles,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { LocalAuthService } from '@/services/local-auth-service';
import { AdapterFactory } from '@/infra/database/adapter-factory';
import { DB_COMMANDS } from '@/infra/database/adapter';

export default function InvoiceDesignPage() {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingPrinter, setIsTestingPrinter] = useState(false);
  const [systemPrinters, setSystemPrinters] = useState<any[]>([]);

  // Preview Mode: '80mm' thermal receipt vs 'A4' standard invoice
  const [previewMode, setPreviewMode] = useState<'80mm' | 'A4'>('80mm');

  // Core Business & Design Settings
  const [settings, setSettings] = useState({
    businessName: 'مؤسسة دوبسار التجارية',
    businessType: 'تجارة عامة ومواد احتياطية',
    phone: '07701234567',
    address: 'بغداد - شارع الرشيد',
    logo: '',
    invoiceHeaderImage: '',
    
    // Invoice Layout Options
    defaultPrintFormat: '80mm' as '80mm' | 'A4',
    showLogo: true,
    showBarcode: true,
    showQrCode: true,
    showCashierName: true,
    showCustomerBalance: true,
    showPreviousBalance: true,
    fontScale: 'medium' as 'small' | 'medium' | 'large',
    
    // Header & Footer Texts
    invoiceNotice: 'فاتورة مبيعات معتمدة',
    footerNotes: 'البضاعة المباعة لا ترد ولا تستبدل إلا خلال 3 أيام وبحالتها الأصلية مع إبراز الفاتورة.',
    thankYouMessage: 'شكراً لتعاملكم معنا - نتطلع لخدمتكم دائماً',
    
    // Printers Settings
    selectedThermalPrinter: '',
    selectedA4Printer: '',
    autoPrintOnSave: true,
    printCopies: 1,
  });

  useEffect(() => {
    loadAllSettings();
  }, []);

  const loadAllSettings = async () => {
    setLoading(true);
    try {
      // 1. Load SQLite App Settings
      const appSettings = await LocalAuthService.getAppSettings().catch(() => null);
      
      // 2. Load Extended Design Settings from LocalStorage
      let extendedSettings = {};
      try {
        const stored = localStorage.getItem('dubsar_invoice_settings');
        if (stored) extendedSettings = JSON.parse(stored);
      } catch {}

      setSettings((prev) => ({
        ...prev,
        businessName: appSettings?.businessName || prev.businessName,
        businessType: appSettings?.businessType || prev.businessType,
        phone: appSettings?.phone || prev.phone,
        address: appSettings?.address || prev.address,
        logo: appSettings?.logo || prev.logo,
        invoiceHeaderImage: appSettings?.invoiceHeaderImage || prev.invoiceHeaderImage,
        ...extendedSettings,
      }));

      // 3. Query System Printers via Tauri IPC
      const adapter = AdapterFactory.getAdapter();
      const printers = await adapter.execute(DB_COMMANDS.GET_SYSTEM_PRINTERS).catch(() => []);
      if (Array.isArray(printers)) {
        setSystemPrinters(printers);
      }
    } catch (e) {
      console.error("Failed to load settings:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (file: File | undefined, field: 'logo' | 'invoiceHeaderImage') => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ variant: 'destructive', title: 'ملف غير صالح', description: 'يرجى اختيار ملف صورة صالح.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setSettings((prev) => ({ ...prev, [field]: String(reader.result || '') }));
      toast({ title: 'تم تحميل الصورة', description: 'تم تحديث الصورة في المعاينة الحية.' });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 1. Save Core Settings in SQLite
      await LocalAuthService.saveAppSettings({
        businessName: settings.businessName,
        businessType: settings.businessType,
        phone: settings.phone,
        address: settings.address,
        logo: settings.logo || '',
        invoiceHeaderImage: settings.invoiceHeaderImage || '',
      });

      // 2. Save Extended Invoice Design Settings in LocalStorage
      localStorage.setItem('dubsar_invoice_settings', JSON.stringify(settings));

      toast({ 
        title: 'تم حفظ إعدادات وتصميم الفاتورة', 
        description: 'تم اعتماد القالب الجديد وتطبيقه على كافة الفواتير والطباعة بنجاح.' 
      });
    } catch (e: any) {
      console.error("Save error:", e);
      toast({ 
        variant: 'destructive', 
        title: 'خطأ في الحفظ', 
        description: e?.message || 'تعذر حفظ الإعدادات في قاعدة البيانات.' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestPrint = async () => {
    setIsTestingPrinter(true);
    try {
      const printer = previewMode === '80mm' ? settings.selectedThermalPrinter : settings.selectedA4Printer;
      const adapter = AdapterFactory.getAdapter();
      await adapter.execute(DB_COMMANDS.PRINT_TEST_PAGE, { printerName: printer || undefined });
      toast({ title: 'تم إرسال أمر الطباعة', description: 'تم إرسال صفحة اختبار إلى الطابعة بنجاح.' });
    } catch (e: any) {
      console.error("Test print error:", e);
      toast({ variant: 'destructive', title: 'خطأ في الطباعة', description: e?.message || 'تعذر الوصول إلى الطابعة المحددة.' });
    } finally {
      setIsTestingPrinter(false);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-300 pb-24" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">استوديو تصميم الفواتير والطباعة</h1>
            <Badge className="bg-primary/10 text-primary border-none font-black text-xs px-2.5 py-0.5 rounded-full">
              DUBSAR Print Studio
            </Badge>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground font-medium">
            تخصيص هوية وترويسة الفواتير، اختيار الطابعات المحلية، وتعديل خيارات العرض مع معاينة فورية حية.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleTestPrint} 
            disabled={isTestingPrinter} 
            className="rounded-xl h-11 px-4 font-bold text-xs gap-2 border-slate-300 dark:border-slate-700"
          >
            {isTestingPrinter ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4 text-emerald-600" />}
            <span>طباعة تجريبية</span>
          </Button>

          <Button 
            onClick={handleSave} 
            disabled={isSaving} 
            className="rounded-xl h-11 px-6 font-black text-xs gap-2 shadow-md bg-primary hover:bg-primary/90 text-white"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>اعتماد وحفظ التصميم</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Settings Controls (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Company Identity */}
          <Card className="rounded-2xl border bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b bg-slate-50/50 dark:bg-slate-800/40">
              <CardTitle className="text-base font-black flex items-center gap-2 text-primary">
                <Building2 className="h-4 w-4" /> بيانات وترويسة المنشأة
              </CardTitle>
              <CardDescription className="text-xs">المعلومات التي تظهر في رأس الفاتورة الرسمية والإيصال</CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="font-bold text-xs">اسم المنشأة / المحل</Label>
                  <Input 
                    value={settings.businessName} 
                    onChange={(e) => setSettings({ ...settings, businessName: e.target.value })} 
                    className="h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm font-bold" 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-bold text-xs">نوع النشاط التجاري</Label>
                  <Input 
                    value={settings.businessType} 
                    onChange={(e) => setSettings({ ...settings, businessType: e.target.value })} 
                    className="h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm font-bold" 
                    placeholder="مثال: قطع غيار، صيدلية، مواد غذائية" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="font-bold text-xs">رقم الهاتف للتواصل</Label>
                  <Input 
                    value={settings.phone} 
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })} 
                    className="h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm font-bold font-mono" 
                    dir="ltr" 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-bold text-xs">العنوان / الفرع</Label>
                  <Input 
                    value={settings.address} 
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })} 
                    className="h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm font-bold" 
                  />
                </div>
              </div>

              {/* Logo and Header Uploads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="space-y-2">
                  <Label className="font-bold text-xs block">شعار المحل (Logo)</Label>
                  <label className="h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer font-bold text-xs hover:border-primary transition-colors bg-slate-50 dark:bg-slate-800/50">
                    <Upload className="h-4 w-4 text-primary" />
                    <span>{settings.logo ? "تم اختيار الشعار (اضغط للتغيير)" : "رفع صورة الشعار"}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e.target.files?.[0], 'logo')} />
                  </label>
                </div>

                <div className="space-y-2">
                  <Label className="font-bold text-xs block">ترويسة A4 العريضة (Header Image)</Label>
                  <label className="h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer font-bold text-xs hover:border-primary transition-colors bg-slate-50 dark:bg-slate-800/50">
                    <Upload className="h-4 w-4 text-primary" />
                    <span>{settings.invoiceHeaderImage ? "تم اختيار الترويسة (اضغط للتغيير)" : "رفع ترويسة A4"}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e.target.files?.[0], 'invoiceHeaderImage')} />
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Visibility & Layout Options */}
          <Card className="rounded-2xl border bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b bg-slate-50/50 dark:bg-slate-800/40">
              <CardTitle className="text-base font-black flex items-center gap-2 text-primary">
                <Sliders className="h-4 w-4" /> خيارات إظهار العناصر ومقاس الورق
              </CardTitle>
              <CardDescription className="text-xs">تحديد البيانات المعروضة داخل الفاتورة لتقليل الهدر أو زيادة التفاصيل</CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="font-bold text-xs">المقاس الافتراضي عند الطباعة</Label>
                  <Select 
                    value={settings.defaultPrintFormat} 
                    onValueChange={(val: any) => {
                      setSettings({ ...settings, defaultPrintFormat: val });
                      setPreviewMode(val);
                    }}
                  >
                    <SelectTrigger className="h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="80mm" className="font-bold text-xs">طابعة كاشير حرارية (80mm Thermal)</SelectItem>
                      <SelectItem value="A4" className="font-bold text-xs">طابعة مكتبية قياسية (A4 Standard)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="font-bold text-xs">حجم الخط داخل الفاتورة</Label>
                  <Select 
                    value={settings.fontScale} 
                    onValueChange={(val: any) => setSettings({ ...settings, fontScale: val })}
                  >
                    <SelectTrigger className="h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="small" className="font-bold text-xs">صغير (مضغوط)</SelectItem>
                      <SelectItem value="medium" className="font-bold text-xs">متوسط (افتراضي وموصى به)</SelectItem>
                      <SelectItem value="large" className="font-bold text-xs">كبير وواضح</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="flex items-center justify-between p-3 rounded-xl border bg-slate-50/60 dark:bg-slate-800/40">
                  <span className="font-bold text-xs text-slate-700 dark:text-slate-300">إظهار شعار المحل</span>
                  <Switch 
                    checked={settings.showLogo} 
                    onCheckedChange={(val) => setSettings({ ...settings, showLogo: val })} 
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border bg-slate-50/60 dark:bg-slate-800/40">
                  <span className="font-bold text-xs text-slate-700 dark:text-slate-300">إظهار باركود الفاتورة</span>
                  <Switch 
                    checked={settings.showBarcode} 
                    onCheckedChange={(val) => setSettings({ ...settings, showBarcode: val })} 
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border bg-slate-50/60 dark:bg-slate-800/40">
                  <span className="font-bold text-xs text-slate-700 dark:text-slate-300">إظهار رمز QR للتحقق</span>
                  <Switch 
                    checked={settings.showQrCode} 
                    onCheckedChange={(val) => setSettings({ ...settings, showQrCode: val })} 
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border bg-slate-50/60 dark:bg-slate-800/40">
                  <span className="font-bold text-xs text-slate-700 dark:text-slate-300">إظهار اسم موظف المبيعات</span>
                  <Switch 
                    checked={settings.showCashierName} 
                    onCheckedChange={(val) => setSettings({ ...settings, showCashierName: val })} 
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border bg-slate-50/60 dark:bg-slate-800/40">
                  <span className="font-bold text-xs text-slate-700 dark:text-slate-300">إظهار رصيد الزبون الحالي</span>
                  <Switch 
                    checked={settings.showCustomerBalance} 
                    onCheckedChange={(val) => setSettings({ ...settings, showCustomerBalance: val })} 
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border bg-slate-50/60 dark:bg-slate-800/40">
                  <span className="font-bold text-xs text-slate-700 dark:text-slate-300">إظهار الرصيد السابق والمتبقي</span>
                  <Switch 
                    checked={settings.showPreviousBalance} 
                    onCheckedChange={(val) => setSettings({ ...settings, showPreviousBalance: val })} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Footer & Policies */}
          <Card className="rounded-2xl border bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b bg-slate-50/50 dark:bg-slate-800/40">
              <CardTitle className="text-base font-black flex items-center gap-2 text-primary">
                <FileText className="h-4 w-4" /> تذييل الفاتورة وشروط الإرجاع
              </CardTitle>
              <CardDescription className="text-xs">الملاحظات القانونية والرسائل الترحيبية أسفل الفاتورة</CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-1.5">
                <Label className="font-bold text-xs">شروط الإرجاع والاستبدال</Label>
                <Textarea 
                  value={settings.footerNotes} 
                  onChange={(e) => setSettings({ ...settings, footerNotes: e.target.value })} 
                  rows={2}
                  className="rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold resize-none leading-relaxed" 
                />
              </div>

              <div className="space-y-1.5">
                <Label className="font-bold text-xs">رسالة الشكر الختامية</Label>
                <Input 
                  value={settings.thankYouMessage} 
                  onChange={(e) => setSettings({ ...settings, thankYouMessage: e.target.value })} 
                  className="h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold" 
                />
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Local Printers */}
          <Card className="rounded-2xl border bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b bg-slate-50/50 dark:bg-slate-800/40">
              <CardTitle className="text-base font-black flex items-center gap-2 text-primary">
                <Printer className="h-4 w-4" /> الطابعات المحلية المثبتة في Windows
              </CardTitle>
              <CardDescription className="text-xs">ربط طابعة الإيصالات الحرارية وطابعة الفواتير المكتبية</CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="font-bold text-xs">طابعة الكاشير الحرارية (80mm)</Label>
                  <Select 
                    value={settings.selectedThermalPrinter || 'default'} 
                    onValueChange={(val) => setSettings({ ...settings, selectedThermalPrinter: val === 'default' ? '' : val })}
                  >
                    <SelectTrigger className="h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm font-bold font-mono" dir="ltr">
                      <SelectValue placeholder="اختر طابعة الكاشير" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl" dir="ltr">
                      <SelectItem value="default">الطابعة الافتراضية للويندوز</SelectItem>
                      {systemPrinters.map((p: any) => (
                        <SelectItem key={p.Name} value={p.Name}>{p.Name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="font-bold text-xs">طابعة الفواتير الكبيرة (A4)</Label>
                  <Select 
                    value={settings.selectedA4Printer || 'default'} 
                    onValueChange={(val) => setSettings({ ...settings, selectedA4Printer: val === 'default' ? '' : val })}
                  >
                    <SelectTrigger className="h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm font-bold font-mono" dir="ltr">
                      <SelectValue placeholder="اختر طابعة A4" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl" dir="ltr">
                      <SelectItem value="default">الطابعة الافتراضية للويندوز</SelectItem>
                      {systemPrinters.map((p: any) => (
                        <SelectItem key={p.Name} value={p.Name}>{p.Name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border bg-slate-50/60 dark:bg-slate-800/40">
                <div>
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">طباعة تلقائية فور حفظ الفاتورة</span>
                  <span className="text-[10px] text-muted-foreground">إرسال الفاتورة للطابعة مباشرة دون فتح نافذة الحوار</span>
                </div>
                <Switch 
                  checked={settings.autoPrintOnSave} 
                  onCheckedChange={(val) => setSettings({ ...settings, autoPrintOnSave: val })} 
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right / Live Interactive Preview (5 Cols) */}
        <div className="lg:col-span-5 sticky top-20 space-y-3">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-xl border shadow-sm">
            <span className="font-black text-xs text-primary flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" /> المعاينة الحية للفاتورة
            </span>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <Button 
                size="sm" 
                variant={previewMode === '80mm' ? 'default' : 'ghost'} 
                onClick={() => setPreviewMode('80mm')}
                className="h-7 px-2.5 text-xs font-bold rounded-md"
              >
                كاشير 80mm
              </Button>
              <Button 
                size="sm" 
                variant={previewMode === 'A4' ? 'default' : 'ghost'} 
                onClick={() => setPreviewMode('A4')}
                className="h-7 px-2.5 text-xs font-bold rounded-md"
              >
                مكتبية A4
              </Button>
            </div>
          </div>

          {/* PREVIEW CONTAINER */}
          <div className="rounded-2xl border bg-slate-100 dark:bg-slate-950 p-4 flex justify-center shadow-inner overflow-hidden max-h-[750px] overflow-y-auto">
            {previewMode === '80mm' ? (
              /* Thermal 80mm Receipt Preview */
              <div 
                className="w-[290px] bg-white text-slate-900 p-4 rounded-lg shadow-md border font-sans text-right space-y-3 select-text"
                style={{ fontSize: settings.fontScale === 'small' ? '10px' : settings.fontScale === 'large' ? '13px' : '11px' }}
              >
                {/* Header */}
                <div className="text-center space-y-1 pb-2 border-b border-dashed border-slate-300">
                  {settings.showLogo && settings.logo && (
                    <img src={settings.logo} alt="Logo" className="h-12 w-12 object-contain mx-auto rounded-md mb-1" />
                  )}
                  <h3 className="font-black text-sm text-slate-900 tracking-tight">{settings.businessName}</h3>
                  <p className="text-[10px] text-slate-600 font-bold">{settings.businessType}</p>
                  <p className="text-[10px] text-slate-500 font-mono" dir="ltr">{settings.phone}</p>
                  <p className="text-[10px] text-slate-500">{settings.address}</p>
                </div>

                {/* Invoice Meta */}
                <div className="text-[10px] space-y-0.5 border-b border-dashed border-slate-300 pb-2">
                  <div className="flex justify-between font-mono font-bold">
                    <span>رقم الفاتورة:</span>
                    <span>INV-2026-0891</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>التاريخ:</span>
                    <span>19/09/2026 04:15 م</span>
                  </div>
                  {settings.showCashierName && (
                    <div className="flex justify-between text-slate-600">
                      <span>الكاشير:</span>
                      <span>حبيب عبدالرزاق</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>الزبون:</span>
                    <span>شركة الرافدين للتجارة</span>
                  </div>
                </div>

                {/* Table Items */}
                <table className="w-full text-right text-[10px] border-collapse">
                  <thead>
                    <tr className="border-b border-slate-300 font-black">
                      <th className="py-1">المادة</th>
                      <th className="py-1 text-center">العدد</th>
                      <th className="py-1 text-left">السعر</th>
                      <th className="py-1 text-left">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dashed divide-slate-200">
                    <tr>
                      <td className="py-1 font-bold">فلتر زيت أصلي</td>
                      <td className="py-1 text-center font-mono">2</td>
                      <td className="py-1 text-left font-mono">15,000</td>
                      <td className="py-1 text-left font-mono font-bold">30,000</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-bold">زيت محرك سوبر 5W30</td>
                      <td className="py-1 text-center font-mono">1</td>
                      <td className="py-1 text-left font-mono">45,000</td>
                      <td className="py-1 text-left font-mono font-bold">45,000</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-bold">شمعات احتراق بلاتينيوم</td>
                      <td className="py-1 text-center font-mono">4</td>
                      <td className="py-1 text-left font-mono">10,000</td>
                      <td className="py-1 text-left font-mono font-bold">40,000</td>
                    </tr>
                  </tbody>
                </table>

                {/* Totals */}
                <div className="border-t-2 border-slate-900 pt-2 space-y-1 font-bold text-xs">
                  <div className="flex justify-between">
                    <span>المجموع الفرعي:</span>
                    <span className="font-mono">115,000 د.ع</span>
                  </div>
                  <div className="flex justify-between text-slate-600 text-[10px]">
                    <span>الخصم:</span>
                    <span className="font-mono">5,000 د.ع</span>
                  </div>
                  <div className="flex justify-between text-sm font-black border-t border-dashed border-slate-300 pt-1 text-primary">
                    <span>المبلغ الصافي:</span>
                    <span className="font-mono">110,000 د.ع</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-emerald-700">
                    <span>المدفوع نقداً:</span>
                    <span className="font-mono">100,000 د.ع</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-red-600 font-black">
                    <span>المتبقي في الذمة:</span>
                    <span className="font-mono">10,000 د.ع</span>
                  </div>

                  {settings.showCustomerBalance && (
                    <div className="border-t border-dashed border-slate-300 pt-1 text-[10px] text-slate-600">
                      <div className="flex justify-between font-bold">
                        <span>إجمالي رصيد العميل الحالي:</span>
                        <span className="font-mono text-red-700">25,000 د.ع</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Barcode / QR */}
                <div className="text-center pt-2 space-y-1">
                  {settings.showBarcode && (
                    <div className="flex flex-col items-center">
                      <Barcode className="h-8 w-36 text-slate-800" />
                      <span className="font-mono text-[9px] tracking-widest text-slate-500">INV-2026-0891</span>
                    </div>
                  )}
                  {settings.showQrCode && (
                    <div className="flex justify-center pt-1">
                      <QrCode className="h-12 w-12 text-slate-800" />
                    </div>
                  )}
                </div>

                {/* Footer Notes */}
                <div className="text-center text-[9px] text-slate-500 pt-1 space-y-1 border-t border-dashed border-slate-300">
                  <p className="leading-tight">{settings.footerNotes}</p>
                  <p className="font-bold text-slate-800">{settings.thankYouMessage}</p>
                  <p className="text-[8px] text-slate-400 font-mono">طُبع بواسطة نظام DUBSAR 2.0 المكتبي</p>
                </div>
              </div>
            ) : (
              /* A4 Standard Invoice Preview */
              <div 
                className="w-[380px] bg-white text-slate-900 p-6 rounded-lg shadow-md border font-sans text-right space-y-4 select-text"
                style={{ fontSize: settings.fontScale === 'small' ? '10px' : settings.fontScale === 'large' ? '12px' : '11px' }}
              >
                {/* A4 Header Image or Info */}
                {settings.invoiceHeaderImage ? (
                  <img src={settings.invoiceHeaderImage} alt="Header" className="w-full h-16 object-cover rounded mb-2" />
                ) : (
                  <div className="flex items-center justify-between border-b pb-3">
                    <div className="space-y-0.5">
                      <h2 className="text-base font-black text-primary">{settings.businessName}</h2>
                      <p className="text-[10px] text-slate-500 font-bold">{settings.businessType}</p>
                      <p className="text-[10px] text-slate-500 font-mono" dir="ltr">{settings.phone}</p>
                    </div>
                    {settings.showLogo && settings.logo ? (
                      <img src={settings.logo} alt="Logo" className="h-12 w-12 object-contain" />
                    ) : (
                      <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-black text-xs">
                        شعار
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg text-[10px] font-bold">
                  <div>
                    <span className="text-slate-500">رقم الفاتورة: </span>
                    <span className="font-mono text-primary font-black">INV-2026-0891</span>
                  </div>
                  <div>
                    <span className="text-slate-500">التاريخ: </span>
                    <span>19 أيلول 2026</span>
                  </div>
                </div>

                {/* Customer Details Box */}
                <div className="border p-2.5 rounded-lg text-[10px] space-y-1 bg-slate-50/50">
                  <div className="flex justify-between">
                    <span className="text-slate-500">السيد / الشركة:</span>
                    <span className="font-black text-slate-900">شركة الرافدين للتجارة العامة</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">رقم الهاتف:</span>
                    <span className="font-mono" dir="ltr">07801234567</span>
                  </div>
                </div>

                {/* A4 Table */}
                <table className="w-full text-right text-[10px] border">
                  <thead className="bg-slate-100 font-black">
                    <tr className="border-b">
                      <th className="p-1.5">ت</th>
                      <th className="p-1.5">المادة</th>
                      <th className="p-1.5 text-center">الكمية</th>
                      <th className="p-1.5 text-left">السعر المفرد</th>
                      <th className="p-1.5 text-left">المجموع</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-medium">
                    <tr>
                      <td className="p-1.5 font-mono">1</td>
                      <td className="p-1.5 font-bold">فلتر زيت أصلي</td>
                      <td className="p-1.5 text-center font-mono">2</td>
                      <td className="p-1.5 text-left font-mono">15,000</td>
                      <td className="p-1.5 text-left font-mono font-bold">30,000</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 font-mono">2</td>
                      <td className="p-1.5 font-bold">زيت محرك سوبر 5W30</td>
                      <td className="p-1.5 text-center font-mono">1</td>
                      <td className="p-1.5 text-left font-mono">45,000</td>
                      <td className="p-1.5 text-left font-mono font-bold">45,000</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 font-mono">3</td>
                      <td className="p-1.5 font-bold">شمعات احتراق بلاتينيوم</td>
                      <td className="p-1.5 text-center font-mono">4</td>
                      <td className="p-1.5 text-left font-mono">10,000</td>
                      <td className="p-1.5 text-left font-mono font-bold">40,000</td>
                    </tr>
                  </tbody>
                </table>

                {/* A4 Summary */}
                <div className="flex justify-between items-start pt-1">
                  <div className="text-[9px] text-slate-500 max-w-[180px] leading-tight space-y-1">
                    <p className="font-bold text-slate-700">شروط وملاحظات:</p>
                    <p>{settings.footerNotes}</p>
                    <p className="font-bold text-slate-800">{settings.thankYouMessage}</p>
                  </div>

                  <div className="w-[150px] border p-2 rounded-lg text-[10px] space-y-1 bg-slate-50">
                    <div className="flex justify-between font-bold">
                      <span>الإجمالي:</span>
                      <span className="font-mono">115,000</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>الخصم:</span>
                      <span className="font-mono">5,000</span>
                    </div>
                    <div className="flex justify-between font-black text-primary border-t pt-1">
                      <span>الصافي:</span>
                      <span className="font-mono">110,000 د.ع</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
