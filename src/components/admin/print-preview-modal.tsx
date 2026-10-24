'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { 
  Check, 
  CreditCard, 
  FileText, 
  Layout, 
  Loader2, 
  Printer, 
  Sliders, 
  Wrench, 
  X,
  Eye,
  Download,
  Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { PrintableInvoiceProps } from './printable-invoice';
import { PrintEngine } from '@/services/print-engine';
import { AdapterFactory } from '@/infra/database/adapter-factory';
import { DB_COMMANDS } from '@/infra/database/adapter';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { TemplateService } from '@/core/templates/template-service';
import { DocumentRenderer } from '@/core/templates/document-renderer';
import { LocalAuthService } from '@/services/local-auth-service';

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceData: Omit<PrintableInvoiceProps, 'format'>;
  initialFormat?: 'A4' | '80mm' | '58mm';
}

export function PrintPreviewModal({
  isOpen,
  onClose,
  invoiceData,
  initialFormat = '80mm'
}: PrintPreviewModalProps) {
  const [format, setFormat] = useState<'A4' | '80mm' | '58mm'>(initialFormat);
  const [printers, setPrinters] = useState<any[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>('');
  const [loadingPrinters, setLoadingPrinters] = useState(false);
  const [testingPrinter, setTestingPrinter] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [businessSettings, setBusinessSettings] = useState<any>(() => LocalAuthService.getUnifiedSettingsSync());

  const adapter = AdapterFactory.getAdapter();

  useEffect(() => {
    if (isOpen) {
      if (initialFormat) {
        setFormat(initialFormat);
      }
      const syncUnified = LocalAuthService.getUnifiedSettingsSync();
      setBusinessSettings(syncUnified);
      if (!initialFormat && syncUnified.defaultPrintFormat) {
        setFormat(syncUnified.defaultPrintFormat);
      }

      LocalAuthService.getUnifiedSettings()
        .then((unified) => {
          setBusinessSettings(unified);
          if (!initialFormat && unified.defaultPrintFormat) {
            setFormat(unified.defaultPrintFormat);
          }
        })
        .catch(() => {});

      // Load Windows printers
      setLoadingPrinters(true);
      adapter.execute(DB_COMMANDS.GET_SYSTEM_PRINTERS)
        .then((res: any[]) => {
          if (Array.isArray(res)) {
            setPrinters(res);
            const def = res.find((p) => p.Default);
            if (def) setSelectedPrinter(def.Name);
            else if (res[0]) setSelectedPrinter(res[0].Name);
          }
        })
        .catch(() => {
          setPrinters([{ Name: 'طابعة النظام الافتراضية', Default: true }]);
        })
        .finally(() => setLoadingPrinters(false));
    }
  }, [isOpen]);

  // UNIFIED DOCUMENT TEMPLATE RENDERER (Single Source of Truth for Preview, Print, and PDF)
  const renderedHtml = useMemo(() => {
    const template = TemplateService.getTemplate('sales_invoice', format);
    return DocumentRenderer.renderToHtml(template, {
      ...invoiceData,
      businessSettings: { ...businessSettings, ...invoiceData.businessSettings }
    });
  }, [format, invoiceData, businessSettings]);

  const handlePrint = async () => {
    try {
      await PrintEngine.printIsolatedHtml(renderedHtml);
      onClose();
    } catch (e) {
      console.error('[PrintPreviewModal Print Error]:', e);
      toast({
        variant: 'destructive',
        title: 'تعذرت الطباعة المباشرة',
        description: e instanceof Error ? e.message : String(e)
      });
    }
  };

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      const res = await PrintEngine.exportToPdf(renderedHtml, `Invoice_${invoiceData.invoiceNo || 'Doc'}`);
      if (res.path) {
        toast({
          title: 'تم حفظ وفتح ملف PDF بنجاح',
          description: `تم التصدير بدون ترويسة المتصفح إلى: ${res.path}`
        });
      }
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'تعذر تصدير PDF',
        description: e instanceof Error ? e.message : String(e)
      });
    } finally {
      setExportingPdf(false);
    }
  };

  const handleTestPrint = async () => {
    setTestingPrinter(true);
    try {
      await adapter.execute(DB_COMMANDS.PRINT_TEST_PAGE, { printerName: selectedPrinter || undefined });
      toast({ title: 'تم إرسال أمر الاختبار', description: `تم الإرسال إلى ${selectedPrinter || 'الطابعة الافتراضية'}` });
    } catch (e) {
      toast({ variant: 'destructive', title: 'فشل إرسال أمر الاختبار', description: String(e) });
    } finally {
      setTestingPrinter(false);
    }
  };

  const handleShareWhatsApp = () => {
    const bizName = businessSettings?.businessName || 'مؤسسة دوبسار التجارية';
    const customerName = invoiceData.customer?.name || 'زبون نقدي';
    const cur = invoiceData.currency === 'USD' ? '$' : 'د.ع';
    let phone = (invoiceData.customer?.phone || '').replace(/\D/g, '');
    if (phone.startsWith('07')) {
      phone = '964' + phone.substring(1);
    } else if (phone.startsWith('7')) {
      phone = '964' + phone;
    }

    const itemsLines = (invoiceData.items || [])
      .map((it, i) => `${i + 1}. ${it.name} (${it.quantity} × ${Number(it.price).toLocaleString('en-US')}) = ${(it.quantity * it.price).toLocaleString('en-US')} ${cur}`)
      .join('\n');

    const msg = [
      `مرحباً ${customerName}،`,
      `شكراً لتعاملكم مع ${bizName}.`,
      `📄 فاتورة رقم: ${invoiceData.invoiceNo} | التاريخ: ${invoiceData.date}`,
      itemsLines ? `\n📦 المواد:\n${itemsLines}\n` : '',
      `💰 الصافي المطلوب: ${Number(invoiceData.netTotal || 0).toLocaleString('en-US')} ${cur}`,
      `✅ الواصل: ${Number(invoiceData.paidAmount || 0).toLocaleString('en-US')} ${cur}`,
      Number(invoiceData.remaining || 0) > 0 ? `📌 المتبقي: ${Number(invoiceData.remaining || 0).toLocaleString('en-US')} ${cur}` : '',
      `\nنظام دوبسار لإدارة المبيعات | 07858833838`
    ].filter(Boolean).join('\n');

    const waUrl = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[92vh] flex flex-col p-0 overflow-hidden rounded-[28px] border-none shadow-2xl bg-slate-100 dark:bg-slate-950">
        {/* Top Control Bar */}
        <DialogHeader className="p-4 bg-slate-900 text-white flex flex-row items-center justify-between border-b space-y-0 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
              <Printer className="h-5 w-5" />
            </div>
            <div className="text-right">
              <DialogTitle className="text-base font-black">معاينة وطباعة الفاتورة (Unified Template)</DialogTitle>
              <p className="text-[10px] text-slate-400">تصميم موحد متطابق 100% بين المعاينة والطباعة وملف PDF</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Format Toggles */}
            <div className="flex bg-slate-800 p-1 rounded-xl gap-1 border border-slate-700">
              <button
                type="button"
                onClick={() => setFormat('58mm')}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all',
                  format === '58mm' ? 'bg-primary text-white shadow' : 'text-slate-400 hover:text-white'
                )}
              >
                <Layout className="h-3.5 w-3.5" />
                <span>58mm حراري</span>
              </button>
              <button
                type="button"
                onClick={() => setFormat('80mm')}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all',
                  format === '80mm' ? 'bg-primary text-white shadow' : 'text-slate-400 hover:text-white'
                )}
              >
                <Layout className="h-3.5 w-3.5" />
                <span>80mm حراري</span>
              </button>
              <button
                type="button"
                onClick={() => setFormat('A4')}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all',
                  format === 'A4' ? 'bg-primary text-white shadow' : 'text-slate-400 hover:text-white'
                )}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>A4 القياسي</span>
              </button>
            </div>

            {/* Printers selector */}
            <select
              value={selectedPrinter}
              onChange={(e) => setSelectedPrinter(e.target.value)}
              className="h-8 px-2 text-xs font-bold rounded-lg border border-slate-700 bg-slate-800 text-white max-w-[180px]"
            >
              {printers.map((p, idx) => (
                <option key={idx} value={p.Name}>
                  {p.Name} {p.Default ? '(الافتراضية)' : ''}
                </option>
              ))}
            </select>

            {/* Test Print Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={testingPrinter}
              onClick={handleTestPrint}
              className="h-8 px-2.5 text-xs font-bold gap-1 bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
            >
              {testingPrinter ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wrench className="h-3.5 w-3.5" />}
              <span>اختبار</span>
            </Button>

            {/* Export Clean PDF Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={exportingPdf}
              onClick={handleExportPdf}
              className="h-8 px-3 text-xs font-black gap-1.5 bg-sky-600/20 text-sky-300 border-sky-500/40 hover:bg-sky-600 hover:text-white"
            >
              {exportingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              <span>حفظ PDF</span>
            </Button>

            {/* Share via WhatsApp Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleShareWhatsApp}
              className="h-8 px-3 text-xs font-black gap-1.5 bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-600 hover:text-white"
            >
              <Send className="h-3.5 w-3.5" />
              <span>واتساب</span>
            </Button>

            {/* Main Print Button */}
            <Button
              type="button"
              onClick={handlePrint}
              className="h-8 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs gap-1.5 shadow-md rounded-lg"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>طباعة الآن</span>
            </Button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-white/10 text-slate-400 hover:text-white transition-colors mr-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </DialogHeader>
        <DialogDescription className="sr-only">نافذة معاينة الطباعة للفاتورة الحالية</DialogDescription>

        {/* Live Interactive Paper Preview Area (Identical to Print Engine) */}
        <div className="flex-1 overflow-y-auto p-6 flex justify-center items-start bg-slate-200/70 dark:bg-slate-900/80 custom-scrollbar">
          <div className={cn(
            "bg-white shadow-2xl rounded-sm overflow-hidden flex justify-center transition-all",
            format === '58mm' ? "w-[58mm] max-w-[220px]" : format === '80mm' ? "w-[80mm] max-w-[302px]" : "w-[750px] max-w-full"
          )}>
            <iframe
              title="Print Preview Single Source of Truth"
              srcDoc={renderedHtml}
              className="w-full border-none block"
              onLoad={(e) => {
                if (format === '80mm' || format === '58mm') {
                  try {
                    const iframeEl = e.currentTarget;
                    const docBody = iframeEl.contentWindow?.document?.body;
                    if (docBody) {
                      const contentHeight = Math.max(docBody.scrollHeight, docBody.offsetHeight, 180);
                      iframeEl.style.height = `${contentHeight + 12}px`;
                    }
                  } catch {}
                }
              }}
              style={{
                height: format === 'A4' ? '900px' : '420px',
                minHeight: format === 'A4' ? '400px' : '180px'
              }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
