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
  Eye
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

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceData: Omit<PrintableInvoiceProps, 'format'>;
  initialFormat?: 'A4' | '80mm';
}

export function PrintPreviewModal({
  isOpen,
  onClose,
  invoiceData,
  initialFormat = '80mm'
}: PrintPreviewModalProps) {
  const [format, setFormat] = useState<'A4' | '80mm'>(initialFormat);
  const [printers, setPrinters] = useState<any[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>('');
  const [loadingPrinters, setLoadingPrinters] = useState(false);
  const [testingPrinter, setTestingPrinter] = useState(false);
  const [businessSettings, setBusinessSettings] = useState<any>({});

  const adapter = AdapterFactory.getAdapter();

  useEffect(() => {
    if (isOpen) {
      // Load business settings
      try {
        const savedSettings = localStorage.getItem('dubsar_app_settings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          setBusinessSettings(parsed);
          if (parsed.defaultPrintSize) {
            setFormat(parsed.defaultPrintSize);
          }
        }
      } catch {}

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

  // UNIFIED DOCUMENT TEMPLATE RENDERER (Single Source of Truth)
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
    } catch (e) {
      console.error(e);
      window.print();
    }
    onClose();
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
              <p className="text-[10px] text-slate-400">تصميم موحد متطابق 100% بين المعاينة والطباعة</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Format Toggles */}
            <div className="flex bg-slate-800 p-1 rounded-xl gap-1 border border-slate-700">
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
        <div className="flex-1 overflow-y-auto p-6 flex justify-center bg-slate-200/70 dark:bg-slate-900/80 custom-scrollbar">
          <div className={cn(
            "bg-white shadow-2xl rounded-sm overflow-hidden flex justify-center transition-all",
            format === '80mm' ? "w-[360px]" : "w-[750px] max-w-full"
          )}>
            <iframe
              title="Print Preview Single Source of Truth"
              srcDoc={renderedHtml}
              className="w-full border-none"
              style={{
                height: format === 'A4' ? '900px' : '650px',
                minHeight: '400px'
              }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
