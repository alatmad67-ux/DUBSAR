'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  Printer, 
  Share2, 
  X, 
  Calendar, 
  User, 
  Phone, 
  CreditCard, 
  CheckCircle2, 
  Clock,
  Send,
  Loader2,
  Edit
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PrintEngine } from '@/services/print-engine';
import { toast } from '@/hooks/use-toast';

export interface InvoiceDetailProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any | null;
}

export function InvoiceDetailDialog({ isOpen, onClose, invoice }: InvoiceDetailProps) {
  const router = useRouter();
  const [printingFormat, setPrintingFormat] = useState<'80mm' | 'A4' | null>(null);

  if (!invoice) return null;

  const rawItems = Array.isArray(invoice.items) 
    ? invoice.items 
    : (Array.isArray(invoice.cart) ? invoice.cart : []);

  const items = rawItems.map((item: any) => ({
    name: item.name || item.productName || 'مادة',
    barcode: item.barcode,
    quantity: Number(item.quantity) || 1,
    price: Number(item.price || item.unitPrice || item.unitCost) || 0,
    unit: item.unit,
    serialNo: item.serialNo
  }));

  const invoiceNo = invoice.invoiceNo || invoice.orderNumber || invoice.id || '---';
  const customerName = invoice.customerName || invoice.customer?.name || 'زبون نقدي';
  const customerPhone = invoice.customerPhone || invoice.customer?.phone || '';
  const date = invoice.date || (invoice.createdAt ? new Date(Number(invoice.createdAt)).toLocaleDateString('ar-IQ') : '---');
  const time = invoice.time || (invoice.createdAt ? new Date(Number(invoice.createdAt)).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }) : '');
  const totalAmount = Number(invoice.totalAmount || invoice.total || invoice.netTotal) || 0;
  const paidAmount = Number(invoice.paidAmount ?? totalAmount);
  const remaining = Number(invoice.remaining ?? (totalAmount - paidAmount));
  const paymentMethod = invoice.paymentMethod === 'credit' ? 'آجل' : 'نقدي';

  const handlePrint = async (format: '80mm' | 'A4') => {
    setPrintingFormat(format);
    try {
      const appSettings = JSON.parse(localStorage.getItem('dubsar_app_settings') || '{}');
      const printData = {
        invoiceNo,
        date,
        time,
        customerName,
        customerPhone,
        cashierName: invoice.cashierName || invoice.createdBy || 'المسؤول',
        currency: invoice.currency || 'IQD',
        items,
        subtotal: Number(invoice.subtotal || totalAmount),
        discountAmount: Number(invoice.discountAmount || 0),
        netTotal: totalAmount,
        paidAmount,
        remaining,
        previousBalance: Number(invoice.previousBalance || 0),
        currentBalance: Number(invoice.currentBalance || 0),
        businessSettings: appSettings
      };

      if (format === '80mm') {
        await PrintEngine.printThermalReceipt(printData);
      } else {
        await PrintEngine.printA4Invoice(printData);
      }
      toast({ title: `تم إرسال الفاتورة للطابعة (${format})` });
    } catch (e) {
      console.error(e);
      window.print();
    } finally {
      setPrintingFormat(null);
    }
  };

  const handleWhatsApp = () => {
    const appSettings = JSON.parse(localStorage.getItem('dubsar_app_settings') || '{}');
    const businessName = appSettings.businessName || 'مؤسسة دوبسار';
    let phone = (customerPhone || '').replace(/\D/g, '');
    if (phone.startsWith('07')) {
      phone = '964' + phone.substring(1);
    } else if (phone.startsWith('7')) {
      phone = '964' + phone;
    }
    const msg = `مرحباً ${customerName}،\nشكراً لتعاملكم مع ${businessName}.\nتفاصيل الفاتورة رقم: ${invoiceNo}\nالمبلغ الصافي: ${totalAmount.toLocaleString()} د.ع\nالواصل: ${paidAmount.toLocaleString()} د.ع\nالمتبقي: ${remaining.toLocaleString()} د.ع`;
    const waUrl = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl rounded-[32px] p-0 overflow-hidden border-none shadow-2xl" dir="rtl">
        {/* Header */}
        <DialogHeader className="p-6 bg-slate-900 text-white flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-primary/20 text-primary-foreground flex items-center justify-center">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black flex items-center gap-2">
                <span>فاتورة رقم:</span>
                <span className="font-mono text-primary">{invoiceNo}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-300 font-bold mt-0.5">
                {date} {time && `• ${time}`}
              </DialogDescription>
            </div>
          </div>
          <Badge variant={invoice.paymentMethod === 'credit' ? 'outline' : 'secondary'} className="text-xs px-3 py-1 font-bold">
            {paymentMethod}
          </Badge>
        </DialogHeader>

        {/* Invoice Metadata */}
        <div className="p-6 space-y-5 bg-card">
          <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-muted/40 border text-xs">
            <div className="space-y-1">
              <span className="text-muted-foreground font-bold block">العميل / الزبون:</span>
              <span className="font-black text-sm text-foreground flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-primary" />
                <span>{customerName}</span>
              </span>
            </div>
            {customerPhone && (
              <div className="space-y-1">
                <span className="text-muted-foreground font-bold block">رقم الهاتف:</span>
                <span className="font-mono font-bold text-foreground flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-primary" />
                  <span>{customerPhone}</span>
                </span>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="rounded-2xl border overflow-hidden">
            <table className="w-full text-xs text-right">
              <thead className="bg-muted/60 font-black border-b">
                <tr>
                  <th className="p-3">المادة</th>
                  <th className="p-3 text-center">الكمية</th>
                  <th className="p-3 text-center">السعر</th>
                  <th className="p-3 text-left">الإجمالي</th>
                </tr>
              </thead>
              <tbody className="divide-y font-bold">
                {items.length > 0 ? (
                  items.map((it: any, idx: number) => (
                    <tr key={idx} className="hover:bg-muted/20">
                      <td className="p-3 font-black">
                        <div>{it.name}</div>
                        {it.serialNo && <div className="text-[10px] text-muted-foreground font-mono">سيريال: {it.serialNo}</div>}
                      </td>
                      <td className="p-3 text-center font-mono">{it.quantity}</td>
                      <td className="p-3 text-center font-mono">{it.price.toLocaleString()} د.ع</td>
                      <td className="p-3 text-left font-mono font-black">{(it.quantity * it.price).toLocaleString()} د.ع</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-muted-foreground font-bold">
                      فاتورة مجملة بقيمة {totalAmount.toLocaleString()} د.ع
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Financial Summary Cards */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-muted/30 border text-center">
            <div>
              <span className="text-[11px] font-bold text-muted-foreground block">إجمالي الفاتورة</span>
              <span className="text-base font-black font-mono text-foreground mt-0.5 block">{totalAmount.toLocaleString()} د.ع</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-muted-foreground block">المبلغ الواصل (المدفوع)</span>
              <span className="text-base font-black font-mono text-emerald-600 mt-0.5 block">{paidAmount.toLocaleString()} د.ع</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-muted-foreground block">المتبقي (الذمة)</span>
              <span className={`text-base font-black font-mono mt-0.5 block ${remaining > 0 ? 'text-rose-600' : 'text-foreground'}`}>
                {remaining.toLocaleString()} د.ع
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <DialogFooter className="p-4 bg-muted/20 border-t flex flex-wrap gap-2 justify-between items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handlePrint('80mm')}
              disabled={printingFormat !== null}
              className="gap-1.5 font-bold h-10 rounded-xl"
            >
              {printingFormat === '80mm' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4 text-primary" />}
              <span>طباعة كاشير (80mm)</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handlePrint('A4')}
              disabled={printingFormat !== null}
              className="gap-1.5 font-bold h-10 rounded-xl"
            >
              {printingFormat === 'A4' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4 text-primary" />}
              <span>طباعة A4 رسمية</span>
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => {
                onClose();
                router.push(`/admin/pos?editInvoiceId=${encodeURIComponent(invoice.id || invoice.invoiceNo)}`);
              }}
              className="gap-1.5 font-bold h-10 rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
            >
              <Edit className="h-4 w-4" />
              <span>تعديل القائمة في الكاشير</span>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleWhatsApp}
              className="gap-1.5 font-bold h-10 rounded-xl text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800"
            >
              <Send className="h-4 w-4" />
              <span>مشاركة واتساب</span>
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onClose} className="h-10 rounded-xl font-bold">
              إغلاق
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
