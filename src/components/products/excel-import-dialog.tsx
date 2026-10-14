'use client';

import React, { useState, useRef, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  FileDown,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  X,
  Package,
  Layers,
  FileText,
  ShieldCheck,
  Check,
  Download,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  ExcelImportService,
  IMPORT_FIELDS,
  ImportOptions,
  PreparedImportRow,
  ImportValidationResult,
  ImportExecutionResult,
} from '@/services/excel-import-service';
import { Product } from '@/core/entities/product';

interface ExcelImportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  existingProducts: Product[];
  existingCategories: any[];
  onImportSuccess: () => void;
}

type Step = 'file' | 'mapping' | 'preview' | 'importing' | 'completed';

export function ExcelImportDialog({
  isOpen,
  onOpenChange,
  existingProducts,
  existingCategories,
  onImportSuccess,
}: ExcelImportDialogProps) {
  const [step, setStep] = useState<Step>('file');
  const [file, setFile] = useState<File | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});

  // Options
  const [options, setOptions] = useState<ImportOptions>({
    duplicateBarcodeStrategy: 'skip',
    autoCreateCategories: true,
    matchByNameIfNoBarcode: false,
  });

  // Validation
  const [validationResult, setValidationResult] = useState<ImportValidationResult | null>(null);

  // Import Progress & Result
  const [progress, setProgress] = useState({
    current: 0,
    total: 0,
    percentage: 0,
    currentItemName: '',
  });
  const [importResult, setImportResult] = useState<ImportExecutionResult | null>(null);
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state on close
  const handleClose = () => {
    if (step === 'importing') {
      if (!confirm('الاستيراد جاري حالياً، هل أنت متأكد من الإغلاق؟')) return;
    }
    onOpenChange(false);
    setTimeout(() => {
      setStep('file');
      setFile(null);
      setHeaders([]);
      setRawRows([]);
      setColumnMapping({});
      setValidationResult(null);
      setImportResult(null);
      setShowErrorDetails(false);
    }, 300);
  };

  // Download template
  const handleDownloadTemplate = () => {
    try {
      const wb = ExcelImportService.generateTemplateWorkbook();
      ExcelImportService.downloadWorkbook(wb, 'قالب_استيراد_المنتجات_دبسار.xlsx');
      toast({ title: 'تم تحميل قالب Excel بنجاح' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'فشل تحميل القالب', description: e?.message });
    }
  };

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    processSelectedFile(selectedFile);
  };

  const processSelectedFile = async (selectedFile: File) => {
    setIsReadingFile(true);
    setFile(selectedFile);
    try {
      const buffer = await selectedFile.arrayBuffer();
      const parsed = ExcelImportService.parseFileBuffer(buffer);

      if (parsed.headers.length === 0) {
        toast({
          variant: 'destructive',
          title: 'الملف فارغ أو غير صالح',
          description: 'لم نتمكن من العثور على رؤوس أعمدة أو بيانات في الملف المرفوع',
        });
        setIsReadingFile(false);
        return;
      }

      setHeaders(parsed.headers);
      setRawRows(parsed.rawRows);

      // Auto-detect mappings
      const autoMap = ExcelImportService.autoMapHeaders(parsed.headers);
      setColumnMapping(autoMap);

      setStep('mapping');
      toast({
        title: 'تمت قراءة الملف بنجاح',
        description: `تم العثور على ${parsed.headers.length} عموداً و ${parsed.rawRows.length} صفاً`,
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'خطأ في قراءة ملف Excel',
        description: err?.message || 'تأكد من صيغة الملف (.xlsx, .xls, .csv)',
      });
    } finally {
      setIsReadingFile(false);
    }
  };

  // Run validation
  const handleProceedToPreview = () => {
    if (!columnMapping.name) {
      toast({
        variant: 'destructive',
        title: 'حقل إلزامي مفقود',
        description: 'يجب مطابقة حقل (اسم المنتج) على الأقل للاستمرار في الاستيراد',
      });
      return;
    }

    const res = ExcelImportService.validateRows(
      rawRows,
      columnMapping,
      existingProducts,
      existingCategories,
      options
    );

    setValidationResult(res);
    setStep('preview');
  };

  // Re-run validation whenever options change
  const handleOptionChange = (newOptions: ImportOptions) => {
    setOptions(newOptions);
    if (rawRows.length > 0 && columnMapping.name) {
      const res = ExcelImportService.validateRows(
        rawRows,
        columnMapping,
        existingProducts,
        existingCategories,
        newOptions
      );
      setValidationResult(res);
    }
  };

  // Start import execution
  const handleStartImport = async () => {
    if (!validationResult || validationResult.validRows.length === 0) {
      toast({
        variant: 'destructive',
        title: 'لا توجد بيانات صالحة للاستيراد',
      });
      return;
    }

    setStep('importing');
    setProgress({
      current: 0,
      total: validationResult.validRows.length,
      percentage: 0,
      currentItemName: '',
    });

    try {
      const result = await ExcelImportService.executeImport(
        validationResult.validRows,
        existingCategories,
        options,
        (p) => setProgress(p)
      );

      setImportResult(result);
      setStep('completed');
      onImportSuccess();
      toast({
        title: 'اكتملت عملية الاستيراد',
        description: `تمت إضافة ${result.added} مادة، وتحديث ${result.updated} مادة بنجاح`,
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'حدث خطأ أثناء الاستيراد',
        description: err?.message,
      });
      setStep('preview');
    }
  };

  // Export error log to Excel
  const handleExportErrors = () => {
    if (!importResult || importResult.errors.length === 0) return;
    try {
      const wb = ExcelImportService.generateErrorsWorkbook(importResult.errors);
      ExcelImportService.downloadWorkbook(wb, 'تقرير_أخطاء_الاستيراد_دبسار.xlsx');
      toast({ title: 'تم تحميل ملف تقرير الأخطاء' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'فشل تصدير الأخطاء', description: e?.message });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-4xl max-h-[92vh] overflow-y-auto rounded-[28px] p-6 sm:p-8"
        dir="rtl"
      >
        <DialogHeader className="border-b pb-4 mb-4 text-right">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white">
                  استيراد المواد من ملف Excel
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                  نقل وإدراج المنتجات والأسعار والمخزون دفعة واحدة بدون إدخال يدوي
                </p>
              </div>
            </div>

            {/* Stepper Indicator */}
            <div className="hidden md:flex items-center gap-1.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl">
              <span className={`px-2.5 py-1 rounded-lg ${step === 'file' ? 'bg-primary text-white' : 'text-muted-foreground'}`}>
                1. الملف
              </span>
              <span>←</span>
              <span className={`px-2.5 py-1 rounded-lg ${step === 'mapping' ? 'bg-primary text-white' : 'text-muted-foreground'}`}>
                2. المطابقة
              </span>
              <span>←</span>
              <span className={`px-2.5 py-1 rounded-lg ${step === 'preview' ? 'bg-primary text-white' : 'text-muted-foreground'}`}>
                3. المعاينة
              </span>
              <span>←</span>
              <span className={`px-2.5 py-1 rounded-lg ${step === 'completed' ? 'bg-emerald-600 text-white' : 'text-muted-foreground'}`}>
                4. النتيجة
              </span>
            </div>
          </div>
        </DialogHeader>

        {/* ---------------- STEP 1: FILE PICKER ---------------- */}
        {step === 'file' && (
          <div className="space-y-6 py-2">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-emerald-500/40 hover:border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all rounded-3xl p-10 text-center cursor-pointer flex flex-col items-center justify-center gap-4 group"
            >
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <UploadCloud className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">
                  اضغط لاختيار ملف Excel أو اسحبه إلى هنا
                </h3>
                <p className="text-xs text-muted-foreground font-medium">
                  الصيغ المدعومة: .xlsx أو .xls أو .csv
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                className="mt-2 rounded-xl font-bold border-emerald-500/30 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900"
              >
                استعراض الملفات من الجهاز
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-slate-800 dark:text-slate-200">
                    هل تريد قالباً جاهزاً لتعبئة البيانات؟
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    يمكنك تحميل نموذج Excel منظم ومرفق معه أمثلة توضيحية لتعبئة منتجاتك بسهولة.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleDownloadTemplate}
                className="font-bold rounded-xl gap-2 h-10 shrink-0 border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30"
              >
                <Download className="h-4 w-4" /> تحميل قالب Excel
              </Button>
            </div>
          </div>
        )}

        {/* ---------------- STEP 2: COLUMN MAPPING ---------------- */}
        {step === 'mapping' && (
          <div className="space-y-6 py-2">
            <div className="flex items-center justify-between bg-primary/5 p-4 rounded-2xl border border-primary/20">
              <div>
                <h3 className="font-black text-sm text-primary">مطابقة أعمدة الملف مع حقول DUBSAR</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  قام النظام بالتعرف التلقائي على الأعمدة، ويمكنك تعديل أي ربط يدوياً قبل المعاينة.
                </p>
              </div>
              <Badge variant="secondary" className="font-bold text-xs">
                {rawRows.length} صف تم التعرف عليه
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto px-1">
              {IMPORT_FIELDS.map((field) => {
                const currentMapped = columnMapping[field.key] || '';
                return (
                  <div
                    key={field.key}
                    className="p-3.5 rounded-2xl border bg-white dark:bg-slate-900 flex flex-col gap-2 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <Label className="font-black text-xs flex items-center gap-1.5">
                        {field.label}
                        {field.required && <span className="text-red-500 text-sm">*</span>}
                      </Label>
                      {currentMapped ? (
                        <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-300">
                          تم الربط
                        </Badge>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">غير محدد</span>
                      )}
                    </div>

                    <Select
                      value={currentMapped || 'none'}
                      onValueChange={(val) => {
                        setColumnMapping((prev) => ({
                          ...prev,
                          [field.key]: val === 'none' ? '' : val,
                        }));
                      }}
                    >
                      <SelectTrigger className="h-9 rounded-xl font-medium text-xs">
                        <SelectValue placeholder="اختر العمود من ملف Excel..." />
                      </SelectTrigger>
                      <SelectContent dir="rtl">
                        <SelectItem value="none">-- غير محدد (تجاهل هذا الحقل) --</SelectItem>
                        {headers.map((h) => (
                          <SelectItem key={h} value={h}>
                            {h}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>

            <DialogFooter className="flex items-center justify-between gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep('file')}
                className="font-bold rounded-xl gap-1.5"
              >
                <ArrowRight className="h-4 w-4" /> اختيار ملف آخر
              </Button>
              <Button
                type="button"
                onClick={handleProceedToPreview}
                className="font-bold rounded-xl gap-2 h-11 px-6 shadow-sm"
              >
                التالي: معاينة وفحص البيانات <ArrowLeft className="h-4 w-4" />
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* ---------------- STEP 3: PREVIEW & VALIDATION ---------------- */}
        {step === 'preview' && validationResult && (
          <div className="space-y-6 py-2">
            {/* Summary Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border">
                <span className="text-xs text-muted-foreground font-bold">إجمالي الصفوف</span>
                <p className="text-xl font-black font-mono text-slate-800 dark:text-slate-100">
                  {validationResult.totalRows.toLocaleString('en-US')}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800">
                <span className="text-xs text-emerald-800 dark:text-emerald-300 font-bold">إضافة جديدة</span>
                <p className="text-xl font-black font-mono text-emerald-700 dark:text-emerald-400">
                  {validationResult.toCreateCount.toLocaleString('en-US')}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-300 dark:border-blue-800">
                <span className="text-xs text-blue-800 dark:text-blue-300 font-bold">
                  {options.duplicateBarcodeStrategy === 'skip' ? 'تخطي (موجود مسبقاً)' : 'تحديث (موجود مسبقاً)'}
                </span>
                <p className="text-xl font-black font-mono text-blue-700 dark:text-blue-400">
                  {(options.duplicateBarcodeStrategy === 'skip'
                    ? validationResult.toSkipCount
                    : validationResult.toUpdateCount
                  ).toLocaleString('en-US')}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-800">
                <span className="text-xs text-red-800 dark:text-red-300 font-bold">صفوف بها أخطاء</span>
                <p className="text-xl font-black font-mono text-red-700 dark:text-red-400">
                  {validationResult.errorCount.toLocaleString('en-US')}
                </p>
              </div>
            </div>

            {/* Existing Barcode Handling Strategy */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <h4 className="font-black text-xs text-slate-800 dark:text-slate-200">
                  عند وجود باركود مسجل مسبقاً في DUBSAR:
                </h4>
              </div>

              <RadioGroup
                value={options.duplicateBarcodeStrategy}
                onValueChange={(val: any) =>
                  handleOptionChange({ ...options, duplicateBarcodeStrategy: val })
                }
                className="grid grid-cols-1 sm:grid-cols-3 gap-2"
              >
                <div
                  className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                    options.duplicateBarcodeStrategy === 'skip'
                      ? 'border-primary bg-primary/5 font-black'
                      : 'hover:bg-muted/30'
                  }`}
                  onClick={() =>
                    handleOptionChange({ ...options, duplicateBarcodeStrategy: 'skip' })
                  }
                >
                  <RadioGroupItem value="skip" id="r-skip" />
                  <Label htmlFor="r-skip" className="text-xs cursor-pointer">
                    تخطي المنتجات الموجودة (آمن ومستحسن)
                  </Label>
                </div>

                <div
                  className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                    options.duplicateBarcodeStrategy === 'update'
                      ? 'border-blue-500 bg-blue-500/5 font-black text-blue-700 dark:text-blue-300'
                      : 'hover:bg-muted/30'
                  }`}
                  onClick={() =>
                    handleOptionChange({ ...options, duplicateBarcodeStrategy: 'update' })
                  }
                >
                  <RadioGroupItem value="update" id="r-update" />
                  <Label htmlFor="r-update" className="text-xs cursor-pointer">
                    تحديث بيانات المنتج الحالي بالجديدة
                  </Label>
                </div>

                <div
                  className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                    options.duplicateBarcodeStrategy === 'new'
                      ? 'border-emerald-500 bg-emerald-500/5 font-black'
                      : 'hover:bg-muted/30'
                  }`}
                  onClick={() =>
                    handleOptionChange({ ...options, duplicateBarcodeStrategy: 'new' })
                  }
                >
                  <RadioGroupItem value="new" id="r-new" />
                  <Label htmlFor="r-new" className="text-xs cursor-pointer">
                    إضافة كمنتج جديد وتوليد باركود مميز
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Categories Auto-Creation Option */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border">
              <div>
                <Label htmlFor="auto-cat" className="font-black text-xs cursor-pointer">
                  إنشاء التصنيفات تلقائياً إذا كانت غير موجودة في DUBSAR
                </Label>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {validationResult.newCategories.length > 0
                    ? `سيتم إنشاء ${validationResult.newCategories.length} تصنيف جديد: (${validationResult.newCategories.slice(0, 3).join('، ')}${validationResult.newCategories.length > 3 ? '...' : ''})`
                    : 'جميع التصنيفات الموجودة في الملف مطابقة ومسجلة مسبقاً.'}
                </p>
              </div>
              <Switch
                id="auto-cat"
                checked={options.autoCreateCategories}
                onCheckedChange={(val) =>
                  handleOptionChange({ ...options, autoCreateCategories: val })
                }
              />
            </div>

            {/* Table Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-black text-slate-800 dark:text-slate-200">
                  معاينة أول {Math.min(validationResult.validRows.length, 6)} مواد من الملف:
                </span>
                <span className="text-muted-foreground">
                  (سيتم استيراد {validationResult.validRows.length.toLocaleString('en-US')} منتج)
                </span>
              </div>

              <div className="border rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                <Table>
                  <TableHeader className="bg-slate-100 dark:bg-slate-800">
                    <TableRow>
                      <TableHead className="w-12 text-center font-black">#</TableHead>
                      <TableHead className="text-right font-black">اسم المنتج</TableHead>
                      <TableHead className="text-right font-black">الباركود</TableHead>
                      <TableHead className="text-right font-black">التصنيف</TableHead>
                      <TableHead className="text-center font-black">سعر الشراء</TableHead>
                      <TableHead className="text-center font-black">سعر البيع</TableHead>
                      <TableHead className="text-center font-black">الكمية</TableHead>
                      <TableHead className="text-center font-black">الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validationResult.validRows.slice(0, 6).map((row) => (
                      <TableRow key={row.rowNumber} className="text-xs">
                        <TableCell className="text-center font-mono text-muted-foreground">
                          {row.rowNumber}
                        </TableCell>
                        <TableCell className="font-black text-slate-900 dark:text-white">
                          {row.sanitized.name || <span className="text-red-500">مفقود</span>}
                        </TableCell>
                        <TableCell className="font-mono text-muted-foreground">
                          {row.sanitized.barcode || '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {row.sanitized.category || '-'}
                        </TableCell>
                        <TableCell className="text-center font-mono font-medium">
                          {row.sanitized.purchasePrice.toLocaleString('en-US')}
                        </TableCell>
                        <TableCell className="text-center font-mono font-bold text-primary">
                          {row.sanitized.retailPrice.toLocaleString('en-US')}
                        </TableCell>
                        <TableCell className="text-center font-mono font-black">
                          {row.sanitized.stockQuantity} {row.sanitized.unit}
                        </TableCell>
                        <TableCell className="text-center">
                          {row.errors.length > 0 ? (
                            <Badge variant="destructive" className="text-[10px]">
                              خطأ ({row.errors[0]})
                            </Badge>
                          ) : row.matchedExistingProduct ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300"
                            >
                              {options.duplicateBarcodeStrategy === 'skip'
                                ? 'سيتم التخطي'
                                : 'سيتم التحديث'}
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300"
                            >
                              جديد
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <DialogFooter className="flex items-center justify-between gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep('mapping')}
                className="font-bold rounded-xl gap-1.5"
              >
                <ArrowRight className="h-4 w-4" /> تعديل مطابقة الأعمدة
              </Button>
              <Button
                type="button"
                onClick={handleStartImport}
                className="font-bold rounded-xl gap-2 h-11 px-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              >
                <Check className="h-5 w-5" /> بدء الاستيراد الآن
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* ---------------- STEP 4: IMPORTING PROGRESS ---------------- */}
        {step === 'importing' && (
          <div className="py-12 space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center animate-pulse">
              <RefreshCw className="h-8 w-8 animate-spin" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-800 dark:text-white">
                جاري استيراد المنتجات وحفظها...
              </h3>
              <p className="text-sm font-bold text-muted-foreground">
                {progress.current.toLocaleString('en-US')} / {progress.total.toLocaleString('en-US')} صف
              </p>
              {progress.currentItemName && (
                <p className="text-xs text-primary font-mono truncate max-w-md mx-auto">
                  {progress.currentItemName}
                </p>
              )}
            </div>

            <div className="max-w-md mx-auto space-y-2">
              <Progress value={progress.percentage} className="h-3 rounded-full" />
              <div className="flex justify-between text-xs font-mono font-bold text-muted-foreground px-1">
                <span>{progress.percentage}%</span>
                <span>المتبقي: {(progress.total - progress.current).toLocaleString('en-US')}</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              يتم الحفظ الآمن في قاعدة البيانات المحلية دون تجميد النظام...
            </p>
          </div>
        )}

        {/* ---------------- STEP 5: COMPLETED REPORT ---------------- */}
        {step === 'completed' && importResult && (
          <div className="space-y-6 py-4">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                تم الاستيراد بنجاح!
              </h3>
              <p className="text-xs text-muted-foreground font-medium">
                تمت معالجة جميع الصفوف وحفظ المواد الجديدة والمحدّثة في قاعدة بيانات DUBSAR.
              </p>
            </div>

            {/* Results Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center">
              <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border">
                <span className="text-[11px] text-muted-foreground font-bold">إجمالي الصفوف</span>
                <p className="text-lg font-black font-mono text-slate-800 dark:text-slate-100">
                  {importResult.total.toLocaleString('en-US')}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800">
                <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-bold">تمت الإضافة</span>
                <p className="text-lg font-black font-mono text-emerald-700 dark:text-emerald-400">
                  {importResult.added.toLocaleString('en-US')}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-300 dark:border-blue-800">
                <span className="text-[11px] text-blue-800 dark:text-blue-300 font-bold">تم التحديث</span>
                <p className="text-lg font-black font-mono text-blue-700 dark:text-blue-400">
                  {importResult.updated.toLocaleString('en-US')}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800">
                <span className="text-[11px] text-amber-800 dark:text-amber-300 font-bold">تم التجاوز</span>
                <p className="text-lg font-black font-mono text-amber-700 dark:text-amber-400">
                  {importResult.skipped.toLocaleString('en-US')}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-800 col-span-2 sm:col-span-1">
                <span className="text-[11px] text-red-800 dark:text-red-300 font-bold">بها أخطاء</span>
                <p className="text-lg font-black font-mono text-red-700 dark:text-red-400">
                  {importResult.errors.length.toLocaleString('en-US')}
                </p>
              </div>
            </div>

            {/* Error Details Section if any */}
            {importResult.errors.length > 0 && (
              <div className="space-y-3 p-4 rounded-2xl bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <div>
                      <h4 className="font-black text-xs text-red-900 dark:text-red-300">
                        حدثت أخطاء في {importResult.errors.length} صفوف لم يتم استيرادها
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        يمكنك تصدير تقرير الأخطاء لتصحيحها وإعادة استيرادها فقط.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowErrorDetails(!showErrorDetails)}
                      className="font-bold text-xs h-8 rounded-xl border-red-300 text-red-800 dark:text-red-300 bg-white dark:bg-slate-900"
                    >
                      {showErrorDetails ? 'إخفاء تفاصيل الأخطاء' : 'عرض تفاصيل الأخطاء'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleExportErrors}
                      className="font-bold text-xs h-8 rounded-xl gap-1.5 bg-red-600 hover:bg-red-700 text-white"
                    >
                      <FileDown className="h-3.5 w-3.5" /> تصدير الأخطاء إلى Excel
                    </Button>
                  </div>
                </div>

                {showErrorDetails && (
                  <div className="mt-3 border rounded-xl overflow-hidden max-h-48 overflow-y-auto bg-white dark:bg-slate-900">
                    <Table>
                      <TableHeader className="bg-slate-100 dark:bg-slate-800">
                        <TableRow className="text-xs">
                          <TableHead className="w-16 text-center font-black">الصف</TableHead>
                          <TableHead className="text-right font-black">اسم المنتج</TableHead>
                          <TableHead className="text-right font-black">الباركود</TableHead>
                          <TableHead className="text-right font-black">سبب الخطأ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {importResult.errors.map((err, idx) => (
                          <TableRow key={idx} className="text-xs">
                            <TableCell className="text-center font-mono text-muted-foreground">
                              {err.rowNumber}
                            </TableCell>
                            <TableCell className="font-bold text-slate-800 dark:text-slate-200">
                              {err.productName}
                            </TableCell>
                            <TableCell className="font-mono text-muted-foreground">
                              {err.barcode || '-'}
                            </TableCell>
                            <TableCell className="text-red-600 font-bold">
                              {err.reason}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                onClick={handleClose}
                className="w-full sm:w-auto font-black rounded-xl h-11 px-8 text-sm"
              >
                تم والعودة لقائمة المنتجات
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
