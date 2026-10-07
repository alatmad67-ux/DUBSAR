'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Palette, 
  Save, 
  RotateCcw, 
  Printer, 
  Eye, 
  ArrowUp, 
  ArrowDown, 
  Check, 
  X, 
  Sliders, 
  Layout, 
  FileText,
  AlignRight,
  AlignCenter,
  AlignLeft,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  DocumentTemplate, 
  DocumentType, 
  TemplateFormat, 
  TemplateSection, 
  AlignmentType 
} from '@/core/templates/template-types';
import { DOCUMENT_TITLES } from '@/core/templates/default-templates';
import { TemplateService } from '@/core/templates/template-service';
import { DocumentRenderer } from '@/core/templates/document-renderer';
import { PrintEngine } from '@/services/print-engine';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function DocumentTemplateDesignerPage() {
  const [selectedType, setSelectedType] = useState<DocumentType>('sales_invoice');
  const [selectedFormat, setSelectedFormat] = useState<TemplateFormat>('80mm');
  const [template, setTemplate] = useState<DocumentTemplate | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load template whenever type or format changes
  useEffect(() => {
    const t = TemplateService.getTemplate(selectedType, selectedFormat);
    setTemplate(JSON.parse(JSON.stringify(t)));
  }, [selectedType, selectedFormat]);

  // Sample mock data for live preview
  const sampleData = useMemo(() => ({
    business: {
      name: "مؤسسة دوبسار للتجارة العامة",
      phone1: "07858833838",
      phone2: "07701234567",
      address: "العراق - بغداد - الكرادة خارج",
      footerNotice: "البضاعة المباعة لا ترد ولا تستبدل إلا بموجب الفاتورة الرسمية"
    },
    document: {
      number: "INV-2026-8842",
      title: DOCUMENT_TITLES[selectedType],
      date: new Date().toLocaleDateString('ar-IQ'),
      time: "14:30",
      cashierName: "حسين صلاح (المسؤول)",
      paymentMethod: "cash",
      notes: "تم تجهيز المواد وفحصها بالكامل قبل التسليم"
    },
    party: {
      type: selectedType.includes('supplier') ? 'supplier' : 'customer',
      name: selectedType.includes('supplier') ? "شركة النور للتوريدات" : "علي حسن الموسوي",
      phone: "07812345678",
      address: "بغداد - المنصور"
    },
    items: [
      { name: "شاشة كمبيوتر Dell 24 بوصة IPS", barcode: "6291048201", quantity: 2, unit: "قطعة", price: 185000, total: 370000, serialNo: "DL-99214" },
      { name: "لوحة مفاتيح ميكانيكية لاسلكية", barcode: "6291048202", quantity: 1, unit: "قطعة", price: 45000, total: 45000 },
      { name: "ماوس لاسلكي مريح Pro", barcode: "6291048203", quantity: 3, unit: "قطعة", price: 20000, total: 60000 }
    ],
    totals: {
      subtotal: 475000,
      discount: 25000,
      netTotal: 450000,
      paid: 450000,
      remaining: 0,
      receivedAmount: 500000,
      changeGiven: 50000,
      currency: "د.ع"
    }
  }), [selectedType]);

  // Live rendered HTML
  const renderedHtml = useMemo(() => {
    if (!template) return '';
    return DocumentRenderer.renderToHtml(template, sampleData);
  }, [template, sampleData]);

  const handleSave = () => {
    if (!template) return;
    setIsSaving(true);
    try {
      TemplateService.saveTemplate(template);
      toast({ title: "تم حفظ القالب بنجاح", description: `تم تحديث قالب ${template.titleArabic} (${template.format})` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل حفظ القالب" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (!template) return;
    if (confirm(`هل أنت متأكد من استعادة التصميم الافتراضي لقالب ${template.titleArabic}؟`)) {
      TemplateService.resetToDefault(selectedType, selectedFormat);
      const t = TemplateService.getTemplate(selectedType, selectedFormat);
      setTemplate(JSON.parse(JSON.stringify(t)));
      toast({ title: "تمت الاستعادة", description: "تمت استعادة التصميم الافتراضي الأصلي." });
    }
  };

  const handlePrintTest = async () => {
    if (!renderedHtml) return;
    try {
      await PrintEngine.printIsolatedHtml(renderedHtml);
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "خطأ في الطباعة التجريبية" });
    }
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    if (!template) return;
    const sections = [...template.sections].sort((a, b) => a.order - b.order);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    // Swap orders
    const tempOrder = sections[index].order;
    sections[index].order = sections[targetIndex].order;
    sections[targetIndex].order = tempOrder;

    setTemplate({
      ...template,
      sections
    });
  };

  const updateSection = (id: string, updates: Partial<TemplateSection>) => {
    if (!template) return;
    setTemplate({
      ...template,
      sections: template.sections.map(s => s.id === id ? { ...s, ...updates } : s)
    });
  };

  const updateOption = (id: string, key: string, val: any) => {
    if (!template) return;
    setTemplate({
      ...template,
      sections: template.sections.map(s => {
        if (s.id !== id) return s;
        return {
          ...s,
          options: {
            ...(s.options || {}),
            [key]: val
          }
        };
      })
    });
  };

  const sortedSections = useMemo(() => {
    if (!template) return [];
    return [...template.sections].sort((a, b) => a.order - b.order);
  }, [template]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 select-none pb-20" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-2xl border shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black">مصمم القوالب والمطبوعات (Template Designer)</h1>
              <p className="text-muted-foreground text-xs font-bold mt-0.5">
                أداة المطور الداخلية للتحكم المباشر في ترتيب، حجم، وعناصر كافة مستندات وفواتير النظام
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleReset} 
            className="h-10 rounded-xl font-bold gap-1 text-xs"
          >
            <RotateCcw className="h-4 w-4" />
            <span>استعادة الافتراضي</span>
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={handlePrintTest} 
            className="h-10 rounded-xl font-bold gap-1 text-xs"
          >
            <Printer className="h-4 w-4 text-primary" />
            <span>تجربة الطباعة</span>
          </Button>

          <Button 
            variant="default" 
            size="sm" 
            onClick={handleSave} 
            disabled={isSaving}
            className="h-10 rounded-xl font-bold gap-1.5 shadow-sm text-xs px-4"
          >
            <Save className="h-4 w-4" />
            <span>حفظ القالب</span>
          </Button>
        </div>
      </div>

      {/* Selectors Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-card p-4 rounded-2xl border shadow-sm">
        <div className="space-y-1.5">
          <Label className="text-xs font-black">المستند المطلوب تعديله (13 مستند):</Label>
          <select 
            className="w-full h-11 rounded-xl border bg-background px-3 font-bold text-xs"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as DocumentType)}
          >
            {Object.entries(DOCUMENT_TITLES).map(([key, label]) => (
              <option key={key} value={key}>{label} ({key})</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-black">حجم ونوع الورق المعتمد:</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSelectedFormat('80mm')}
              className={cn(
                "h-11 rounded-xl font-black text-xs border transition-all flex items-center justify-center gap-2",
                selectedFormat === '80mm' ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground"
              )}
            >
              <span>حراري كاشير (80mm)</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedFormat('A4')}
              className={cn(
                "h-11 rounded-xl font-black text-xs border transition-all flex items-center justify-center gap-2",
                selectedFormat === 'A4' ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground"
              )}
            >
              <span>رسمي كامل (A4)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Designer Grid: Controls Left, Live Preview Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Controls Column (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-black text-slate-800 dark:text-slate-200">
              ترتيب وعناصر المستند ({sortedSections.length} عناصر):
            </h2>
            <span className="text-[11px] text-muted-foreground font-bold">
              استخدم الأسهم لتغيير الترتيب والمفاتيح لإظهار/إخفاء العناصر
            </span>
          </div>

          <div className="space-y-2.5">
            {sortedSections.map((sec, idx) => (
              <Card key={sec.id} className={cn(
                "rounded-2xl border transition-all p-3.5 space-y-2.5 shadow-sm",
                sec.visible ? "bg-card" : "bg-muted/30 opacity-60"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-lg bg-primary/10 text-primary text-xs font-black flex items-center justify-center font-mono">
                      {idx + 1}
                    </span>
                    <span className="font-black text-xs">{sec.nameArabic}</span>
                    <Badge variant={sec.visible ? "default" : "outline"} className="text-[9px] px-2 py-0">
                      {sec.visible ? "ظاهر" : "مخفي"}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Reorder Buttons */}
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      disabled={idx === 0}
                      onClick={() => moveSection(idx, 'up')}
                      className="h-7 w-7 rounded-lg"
                      title="تقديم لأعلى"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      disabled={idx === sortedSections.length - 1}
                      onClick={() => moveSection(idx, 'down')}
                      className="h-7 w-7 rounded-lg"
                      title="تأخير لأسفل"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>

                    {/* Visibility Switch */}
                    <Switch 
                      checked={sec.visible} 
                      onCheckedChange={(checked) => updateSection(sec.id, { visible: checked })} 
                    />
                  </div>
                </div>

                {/* Section Specific Controls */}
                {sec.visible && (
                  <div className="pt-2 border-t grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    {/* Alignment */}
                    <div>
                      <span className="text-[10px] text-muted-foreground font-bold block mb-1">المحاذاة:</span>
                      <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border">
                        <button
                          type="button"
                          onClick={() => updateSection(sec.id, { alignment: 'right' })}
                          className={cn("p-1 rounded flex-1 flex justify-center", sec.alignment === 'right' ? "bg-primary text-white" : "text-muted-foreground")}
                        >
                          <AlignRight className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => updateSection(sec.id, { alignment: 'center' })}
                          className={cn("p-1 rounded flex-1 flex justify-center", sec.alignment === 'center' ? "bg-primary text-white" : "text-muted-foreground")}
                        >
                          <AlignCenter className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => updateSection(sec.id, { alignment: 'left' })}
                          className={cn("p-1 rounded flex-1 flex justify-center", sec.alignment === 'left' ? "bg-primary text-white" : "text-muted-foreground")}
                        >
                          <AlignLeft className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Font size */}
                    <div>
                      <span className="text-[10px] text-muted-foreground font-bold block mb-1">حجم الخط:</span>
                      <Input 
                        type="number" 
                        min="7" 
                        max="26" 
                        value={sec.fontSize} 
                        onChange={(e) => updateSection(sec.id, { fontSize: Number(e.target.value) || 11 })}
                        className="h-8 rounded-lg font-mono text-xs" 
                      />
                    </div>

                    {/* Table-specific: Barcode toggle */}
                    {sec.type === 'items_table' && (
                      <div className="col-span-2 sm:col-span-1 flex flex-col justify-center">
                        <span className="text-[10px] text-muted-foreground font-bold block mb-1">عمود الباركود:</span>
                        <label className="flex items-center gap-2 cursor-pointer text-[11px] font-bold">
                          <input 
                            type="checkbox" 
                            checked={!!sec.options?.showBarcode}
                            onChange={(e) => updateOption(sec.id, 'showBarcode', e.target.checked)}
                            className="rounded h-4 w-4"
                          />
                          <span>إظهار الباركود</span>
                        </label>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Live Preview Column (5 cols) */}
        <div className="lg:col-span-5">
          <div className="sticky top-6 space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-sm font-black flex items-center gap-1.5">
                <Eye className="h-4 w-4 text-primary" />
                المعاينة الحية المتطابقة (Live Render):
              </span>
              <Badge variant="outline" className="font-mono text-xs">
                {selectedFormat}
              </Badge>
            </div>

            <Card className="rounded-[28px] border-2 shadow-xl overflow-hidden bg-slate-100 dark:bg-slate-950 p-2">
              <div className="bg-white rounded-[22px] overflow-hidden shadow-inner flex justify-center">
                <iframe
                  title="Document Live Preview"
                  srcDoc={renderedHtml}
                  className="w-full border-none"
                  style={{
                    height: selectedFormat === 'A4' ? '700px' : '520px',
                    maxWidth: selectedFormat === 'A4' ? '100%' : '340px'
                  }}
                />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
