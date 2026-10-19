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
  Building2, 
  Trash2,
  Download
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
import { TemplateService } from '@/core/templates/template-service';
import { DocumentRenderer } from '@/core/templates/document-renderer';
import { PrintEngine } from '@/services/print-engine';
import { cn } from '@/lib/utils';

export default function InvoiceDesignPage() {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingPrinter, setIsTestingPrinter] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [systemPrinters, setSystemPrinters] = useState<any[]>([]);
  const [clearHeaderRequested, setClearHeaderRequested] = useState(false);
  const [clearLogoRequested, setClearLogoRequested] = useState(false);

  // Preview Mode: '80mm' thermal receipt vs 'A4' standard invoice
  const [previewMode, setPreviewMode] = useState<'80mm' | 'A4'>('A4');

  // Unified Business & Design Settings
  const [settings, setSettings] = useState({
    businessName: 'مؤسسة دوبسار التجارية',
    businessType: 'تجارة عامة ومواد احتياطية',
    phone: '07701234567',
    address: 'بغداد - شارع الرشيد',
    logo: '',
    invoiceHeaderImage: '',
    
    // Invoice Layout & Dynamic Columns Options
    defaultPrintFormat: '80mm' as '80mm' | 'A4',
    showLogo: true,
    showItemIndex: true,
    showItemName: true,
    showBarcode: true,
    showUnit: true,
    showQuantity: true,
    showPrice: true,
    showDiscount: true,
    showTotal: true,
    showQrCode: true,
    showCashierName: true,
    showCustomerBalance: true,
    showPreviousBalance: true,
    showSignatures: true,
    showOrganizerName: true,
    showSupplierName: true,
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
      const unified = await LocalAuthService.getUnifiedSettings();
      setSettings((prev) => ({
        ...prev,
        ...unified,
        phone: unified.phone || unified.phone1 || prev.phone,
        defaultPrintFormat: unified.defaultPrintFormat || prev.defaultPrintFormat,
        fontScale: unified.fontScale || prev.fontScale,
      }));
      if (unified.defaultPrintFormat) {
        setPreviewMode(unified.defaultPrintFormat);
      }

      const adapter = AdapterFactory.getAdapter();
      const printers = await adapter.execute(DB_COMMANDS.GET_SYSTEM_PRINTERS).catch(() => []);
      if (Array.isArray(printers)) {
        setSystemPrinters(printers);
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
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
      const dataUrl = String(reader.result || '');
      setSettings((prev) => ({ ...prev, [field]: dataUrl }));
      if (field === 'invoiceHeaderImage') {
        setClearHeaderRequested(false);
        setPreviewMode('A4');
      } else {
        setClearLogoRequested(false);
      }
      toast({ title: 'تم تحميل الصورة', description: 'تم تحديث الصورة في المعاينة الحية لمحرك الطباعة.' });
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = (field: 'logo' | 'invoiceHeaderImage') => {
    setSettings((prev) => ({ ...prev, [field]: '' }));
    if (field === 'invoiceHeaderImage') {
      setClearHeaderRequested(true);
    } else {
      setClearLogoRequested(true);
    }
    toast({ title: 'تمت إزالة الصورة من المعاينة', description: 'اضغط "اعتماد وحفظ التصميم" لتثبيت التغيير.' });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const saved = await LocalAuthService.saveUnifiedSettings(
        {
          ...settings,
          phone1: settings.phone,
          defaultPrintSize: settings.defaultPrintFormat,
          printFontScale: settings.fontScale,
          showCompanyLogo: settings.showLogo,
          showBarcodeOnInvoice: settings.showBarcode,
          invoiceFooterNotes: settings.footerNotes,
          footerText: settings.footerNotes,
        },
        {
          clearHeaderImage: clearHeaderRequested && !settings.invoiceHeaderImage,
          clearLogo: clearLogoRequested && !settings.logo,
        }
      );

      setSettings((prev) => ({
        ...prev,
        ...saved,
        phone: saved.phone || saved.phone1 || prev.phone,
      }));
      setClearHeaderRequested(false);
      setClearLogoRequested(false);

      toast({ 
        title: 'تم حفظ إعدادات وتصميم الفاتورة', 
        description: 'تم توحيد وحفظ القالب والترويسة في قاعدة البيانات وتطبيقه على المعاينة والطباعة وPDF بنجاح.' 
      });
    } catch (e: any) {
      console.error('Save error:', e);
      toast({ 
        variant: 'destructive', 
        title: 'خطأ في الحفظ', 
        description: e?.message || 'تعذر حفظ الإعدادات في قاعدة البيانات.' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Unified Sample Invoice Data passed to DocumentRenderer (Single Source of Truth)
  const sampleRenderHtml = useMemo(() => {
    const template = TemplateService.getTemplate('sales_invoice', previewMode);
    return DocumentRenderer.renderToHtml(template, {
      invoiceNo: '0001',
      date: '2026/09/18',
      time: '03:45 م',
      customerName: 'شركة الرافدين للتجارة العامة',
      customerPhone: '07801234567',
      customerAddress: 'بغداد - المنصور',
      cashierName: 'حبيب عبدالرزاق',
      paymentMethod: 'credit',
      saleType: 'آجل / ذمم',
      warehouse: 'المستودع الرئيسي',
      currency: 'IQD',
      notes: 'يرجى فحص المواد عند الاستلام. البضاعة المباعة لا ترد ولا تستبدل إلا بموجب الفاتورة الأصلية.',
      items: [
        { name: 'فلتر زيت أصلي كوري', barcode: '88012345601', unit: 'قطعة', quantity: 2, price: 15000, discount: 0, total: 30000 },
        { name: 'زيت محرك تخليقي بالكامل 5W30', barcode: '88012345602', unit: 'علبة 4 لتر', quantity: 1, price: 45000, discount: 5000, total: 40000 },
        { name: 'طقم شمعات احتراق ليزر بلاتينيوم', barcode: '88012345603', unit: 'سيت', quantity: 4, price: 10000, discount: 0, total: 40000 },
      ],
      subtotal: 115000,
      discountAmount: 5000,
      netTotal: 110000,
      paidAmount: 100000,
      remaining: 10000,
      previousBalance: 15000,
      currentBalance: 25000,
      businessSettings: {
        ...settings,
        phone1: settings.phone,
        footerText: settings.footerNotes,
      },
    });
  }, [previewMode, settings]);

  const handleTestPrint = async () => {
    setIsTestingPrinter(true);
    try {
      await PrintEngine.printIsolatedHtml(sampleRenderHtml);
      toast({ title: 'تم فتح طباعة القالب الفعلي', description: `تم إرسال قالب ${previewMode} الموحد إلى الطباعة.` });
    } catch (e: any) {
      console.error('Test print error:', e);
      toast({ variant: 'destructive', title: 'خطأ في الطباعة', description: e?.message || 'تعذر طباعة القالب.' });
    } finally {
      setIsTestingPrinter(false);
    }
  };

  const handleExportSamplePdf = async () => {
    setIsExportingPdf(true);
    try {
      const res = await PrintEngine.exportToPdf(sampleRenderHtml, `Sample_Invoice_${previewMode}`);
      if (res.path) {
        toast({
          title: 'تم تصدير وفتح ملف PDF بنجاح',
          description: `تم الحفظ بدون ترويسة المتصفح في: ${res.path}`
        });
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'تعذر تصدير PDF', description: e?.message || String(e) });
    } finally {
      setIsExportingPdf(false);
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
              Unified DocumentRenderer
            </Badge>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground font-medium">
            تخصيص ترويسة A4 العريضة، الأعمدة الديناميكية، وخيارات الطباعة مع معاينة حقيقية مطابقة 100% للطباعة وPDF.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleExportSamplePdf} 
            disabled={isExportingPdf} 
            className="rounded-xl h-11 px-4 font-bold text-xs gap-2 border-slate-300 dark:border-slate-700"
          >
            {isExportingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 text-sky-600" />}
            <span>تصدير PDF تجريبي</span>
          </Button>

          <Button 
            variant="outline" 
            onClick={handleTestPrint} 
            disabled={isTestingPrinter} 
            className="rounded-xl h-11 px-4 font-bold text-xs gap-2 border-slate-300 dark:border-slate-700"
          >
            {isTestingPrinter ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4 text-emerald-600" />}
            <span>طباعة تجريبية ({previewMode})</span>
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
          {/* Card 1: Company Identity & Header Image */}
          <Card className="rounded-2xl border bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b bg-slate-50/50 dark:bg-slate-800/40">
              <CardTitle className="text-base font-black flex items-center gap-2 text-primary">
                <Building2 className="h-4 w-4" /> بيانات وترويسة المنشأة
              </CardTitle>
              <CardDescription className="text-xs">
                في حال رفع "ترويسة A4 العريضة"، ستظهر بعرض أعلى فاتورة A4 بالكامل بدلاً من الترويسة النصية الافتراضية
              </CardDescription>
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

              {/* Logo and Wide A4 Header Uploads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="font-bold text-xs">شعار المحل الصغير (Logo)</Label>
                    {settings.logo && (
                      <button
                        type="button"
                        onClick={() => handleClearImage('logo')}
                        className="text-[11px] font-bold text-rose-600 hover:underline flex items-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" /> إزالة
                      </button>
                    )}
                  </div>
                  <label className="h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 cursor-pointer font-bold text-xs hover:border-primary transition-colors bg-slate-50 dark:bg-slate-800/50 p-2">
                    {settings.logo ? (
                      <img src={settings.logo} alt="Logo" className="max-h-14 object-contain" />
                    ) : (
                      <>
                        <Upload className="h-4 w-4 text-primary" />
                        <span>رفع صورة الشعار</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e.target.files?.[0], 'logo')} />
                  </label>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="font-bold text-xs">ترويسة A4 العريضة (Header Image)</Label>
                    {settings.invoiceHeaderImage && (
                      <button
                        type="button"
                        onClick={() => handleClearImage('invoiceHeaderImage')}
                        className="text-[11px] font-bold text-rose-600 hover:underline flex items-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" /> إزالة الترويسة
                      </button>
                    )}
                  </div>
                  <label className="h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 cursor-pointer font-bold text-xs hover:border-primary transition-colors bg-slate-50 dark:bg-slate-800/50 p-2 overflow-hidden">
                    {settings.invoiceHeaderImage ? (
                      <img src={settings.invoiceHeaderImage} alt="A4 Header" className="w-full max-h-16 object-contain" />
                    ) : (
                      <>
                        <Upload className="h-4 w-4 text-primary" />
                        <span>رفع ترويسة A4 عريضة (تحل محل الهيدر النصي)</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e.target.files?.[0], 'invoiceHeaderImage')} />
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Dynamic Columns & Visibility Options */}
          <Card className="rounded-2xl border bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b bg-slate-50/50 dark:bg-slate-800/40">
              <CardTitle className="text-base font-black flex items-center gap-2 text-primary">
                <Sliders className="h-4 w-4" /> التحكم الديناميكي بأعمدة الجدول وعناصر الفاتورة
              </CardTitle>
              <CardDescription className="text-xs">
                عند إخفاء أي عمود في فاتورة A4، يتم إعادة توزيع عرض الأعمدة المتبقية تلقائياً لملء الصفحة بالكامل
              </CardDescription>
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

              <div className="text-xs font-black text-slate-700 dark:text-slate-300 pt-2">أعمدة جدول المواد (الفواتير A4 و 80mm):</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-3 rounded-xl border bg-slate-50/60 dark:bg-slate-800/40">
                  <span className="font-bold text-xs text-slate-700 dark:text-slate-300">عمود التسلسل (#)</span>
                  <Switch 
                    checked={settings.showItemIndex} 
                    onCheckedChange={(val) => setSettings({ ...settings, showItemIndex: val })} 
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border bg-slate-50/60 dark:bg-slate-800/40">
                  <span className="font-bold text-xs text-slate-700 dark:text-slate-300">عمود المادة (اسم المنتج)</span>
                  <Switch 
                    checked={settings.showItemName} 
                    onCheckedChange={(val) => setSettings({ ...settings, showItemName: val })} 
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border bg-slate-50/60 dark:bg-slate-800/40">
                  <span className="font-bold text-xs text-slate-700 dark:text-slate-300">عمود الباركود (Barcode)</span>
                  <Switch 
                    checked={settings.showBarcode} 
                    onCheckedChange={(val) => setSettings({ ...settings, showBarcode: val })} 
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border bg-slate-50/60 dark:bg-slate-800/40">
                  <span className="font-bold text-xs text-slate-700 dark:text-slate-300">عمود الوحدة (Unit)</span>
                  <Switch 
                    checked={settings.showUnit} 
                    onCheckedChange={(val) => setSettings({ ...settings, showUnit: val })} 
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border bg-slate-50/60 dark:bg-slate-800/40">
                  <span className="font-bold text-xs text-slate-700 dark:text-slate-300">عمود العدد (الكمية)</span>
                  <Switch 
                    checked={settings.showQuantity} 
                    onCheckedChange={(val) => setSettings({ ...settings, showQuantity: val })} 
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border bg-slate-50/60 dark:bg-slate-800/40">
                  <span className="font-bold text-xs text-slate-700 dark:text-slate-300">عمود سعر الوحدة</span>
                  <Switch 
                    checked={settings.showPrice} 
                    onCheckedChange={(val) => setSettings({ ...settings, showPrice: val })} 
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border bg-slate-50/60 dark:bg-slate-800/40">
                  <span className="font-bold text-xs text-slate-700 dark:text-slate-300">عمود الخصم (Discount)</span>
                  <Switch 
                    checked={settings.showDiscount} 
                    onCheckedChange={(val) => setSettings({ ...settings, showDiscount: val })} 
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border bg-slate-50/60 dark:bg-slate-800/40">
                  <span className="font-bold text-xs text-slate-700 dark:text-slate-300">عمود الإجمالي (Total)</span>
                  <Switch 
                    checked={settings.showTotal} 
                    onCheckedChange={(val) => setSettings({ ...settings, showTotal: val })} 
                  />
                </div>
              </div>

              <div className="text-xs font-black text-slate-700 dark:text-slate-300 pt-2">عناصر الهيدر والأرصدة والتواقيع:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-3 rounded-xl border bg-slate-50/60 dark:bg-slate-800/40">
                  <span className="font-bold text-xs text-slate-700 dark:text-slate-300">إظهار الشعار الصغير</span>
                  <Switch 
                    checked={settings.showLogo} 
                    onCheckedChange={(val) => setSettings({ ...settings, showLogo: val })} 
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
                  <span className="font-bold text-xs text-slate-700 dark:text-slate-300">إظهار الرصيد السابق</span>
                  <Switch 
                    checked={settings.showPreviousBalance} 
                    onCheckedChange={(val) => setSettings({ ...settings, showPreviousBalance: val })} 
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border bg-slate-50/60 dark:bg-slate-800/40">
                  <span className="font-bold text-xs text-slate-700 dark:text-slate-300">توقيع منظم الفاتورة</span>
                  <Switch 
                    checked={settings.showOrganizerName} 
                    onCheckedChange={(val) => setSettings({ ...settings, showOrganizerName: val })} 
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border bg-slate-50/60 dark:bg-slate-800/40">
                  <span className="font-bold text-xs text-slate-700 dark:text-slate-300">توقيع المستلم / العميل</span>
                  <Switch 
                    checked={settings.showSupplierName} 
                    onCheckedChange={(val) => setSettings({ ...settings, showSupplierName: val })} 
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

        {/* Right / Unified Live DocumentRenderer Preview (5 Cols) */}
        <div className="lg:col-span-5 sticky top-20 space-y-3">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2.5 rounded-xl border shadow-sm">
            <span className="font-black text-xs text-primary flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" /> معاينة محرك الطباعة الفعلي ({previewMode})
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

          {/* UNIFIED ENGINE PREVIEW CONTAINER */}
          <div className="rounded-2xl border bg-slate-200/70 dark:bg-slate-950 p-3 flex justify-center shadow-inner overflow-y-auto max-h-[780px]">
            <div
              className={cn(
                'bg-white shadow-xl rounded-sm overflow-hidden transition-all',
                previewMode === '80mm' ? 'w-[80mm] max-w-[302px]' : 'w-full'
              )}
            >
              <iframe
                title="Live DocumentRenderer Preview"
                srcDoc={sampleRenderHtml}
                className="w-full border-none block"
                onLoad={(e) => {
                  try {
                    const iframeEl = e.currentTarget;
                    const docBody = iframeEl.contentWindow?.document?.body;
                    if (docBody) {
                      const contentHeight = Math.max(docBody.scrollHeight, docBody.offsetHeight, previewMode === 'A4' ? 620 : 220);
                      iframeEl.style.height = `${contentHeight + 16}px`;
                    }
                  } catch {}
                }}
                style={{
                  height: previewMode === 'A4' ? '680px' : '420px',
                  minHeight: previewMode === 'A4' ? '520px' : '200px',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
