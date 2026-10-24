'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface PrintableInvoiceProps {
  businessSettings?: {
    businessName?: string;
    ownerName?: string;
    phone1?: string;
    phone2?: string;
    address?: string;
    province?: string;
    logo?: string;
    footerText?: string;
    headerNotice?: string;
  };
  invoiceNo: string;
  date: string;
  time?: string;
  cashierName?: string;
  customer?: {
    name?: string;
    phone?: string;
    address?: string;
    debtor?: string;
  };
  priceType?: 'retail' | 'wholesale' | 'agent';
  currency?: 'IQD' | 'USD';
  items: Array<{
    id?: string;
    barcode?: string;
    name: string;
    unit?: string;
    quantity: number;
    price: number;
    total?: number;
    serialNo?: string;
    expiryDate?: string;
    notes?: string;
  }>;
  subtotal: number;
  discountAmount: number;
  netTotal: number;
  paidAmount: number;
  remaining: number;
  previousBalance?: number;
  currentBalance?: number;
  format?: 'A4' | '80mm' | '58mm';
  paymentMethod?: string;
  className?: string;
}

export function PrintableInvoice({
  businessSettings,
  invoiceNo,
  date,
  time,
  cashierName = 'المسؤول',
  customer,
  priceType = 'retail',
  currency = 'IQD',
  items,
  subtotal,
  discountAmount,
  netTotal,
  paidAmount,
  remaining,
  previousBalance = 0,
  currentBalance = 0,
  format = '80mm',
  paymentMethod,
  className
}: PrintableInvoiceProps) {
  const [localSettings, setLocalSettings] = React.useState<any>(businessSettings || {});

  React.useEffect(() => {
    if (businessSettings && Object.keys(businessSettings).length > 0) {
      setLocalSettings(businessSettings);
      return;
    }
    try {
      const stored = localStorage.getItem('dubsar_app_settings');
      if (stored) {
        setLocalSettings(JSON.parse(stored));
      }
    } catch {}
  }, [businessSettings]);

  const activeSettings = {
    ...localSettings,
    ...businessSettings
  };

  const currencySymbol = currency === 'USD' ? '$' : 'د.ع';
  const priceTypeArabic = priceType === 'wholesale' ? 'جملة' : priceType === 'agent' ? 'وكيل' : 'مفرد';
  const formattedTime = time || new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' });

  // 1. 80mm THERMAL RECEIPT LAYOUT (71mm safe printable zone for all 80mm printer drivers)
  if (format === '80mm' || format === '58mm') {
    const is58 = format === '58mm';
    return (
      <div
        className={cn(
          'bg-white text-black px-2 py-1.5 text-[11px] font-sans leading-snug select-none',
          is58
            ? 'w-full max-w-[50mm] mx-auto border border-dashed border-slate-300 print:border-none print:m-0 print:px-[1.5mm] print:py-[1mm] print:max-w-[50mm] print:h-auto overflow-hidden'
            : 'w-full max-w-[71mm] mx-auto border border-dashed border-slate-300 print:border-none print:m-0 print:px-[2mm] print:py-[1.5mm] print:max-w-[71mm] print:h-auto overflow-hidden',
          className
        )}
        dir="rtl"
      >
        {/* Header */}
        <div className="text-center space-y-0.5 pb-1.5 border-b border-dashed border-black">
          {activeSettings?.logo && (
            <div className="flex justify-center mb-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeSettings.logo}
                alt="شعار"
                className="h-10 w-auto object-contain max-w-[110px]"
              />
            </div>
          )}
          <h2 className="text-sm font-black tracking-tight break-words">{activeSettings?.businessName || 'مؤسسة دوبسار التجارية'}</h2>
          {activeSettings?.address && (
            <p className="text-[9.5px] text-slate-800 break-words">{activeSettings.address} {activeSettings.province ? `- ${activeSettings.province}` : ''}</p>
          )}
          {(activeSettings?.phone1 || activeSettings?.phone2) && (
            <p className="text-[9.5px] font-mono font-bold text-slate-900" dir="ltr">
              {activeSettings?.phone1} {activeSettings?.phone2 ? `| ${activeSettings.phone2}` : ''}
            </p>
          )}
          <div className="inline-block px-2.5 py-0.5 mt-0.5 border border-black text-black text-[10px] font-black rounded">
            فاتورة مبيعات
          </div>
        </div>

        {/* Meta info */}
        <div className="py-1.5 text-[10px] space-y-0.5 border-b border-dashed border-black">
          <div className="flex justify-between items-start gap-1.5">
            <span className="font-bold shrink-0">رقم القائمة:</span>
            <span className="font-mono font-black text-left" dir="ltr">{invoiceNo}</span>
          </div>
          <div className="flex justify-between items-start gap-1.5">
            <span className="font-bold shrink-0">التاريخ:</span>
            <span className="font-mono text-left">{date} {formattedTime}</span>
          </div>
          <div className="flex justify-between items-start gap-1.5">
            <span className="font-bold shrink-0">العميل:</span>
            <span className="font-black text-left break-words min-w-0">{customer?.name || 'زبون نقدي'}</span>
          </div>
          {customer?.phone && (
            <div className="flex justify-between items-start gap-1.5 text-[9.5px]">
              <span className="shrink-0">الهاتف:</span>
              <span className="font-mono text-left" dir="ltr">{customer.phone}</span>
            </div>
          )}
          <div className="flex justify-between items-start gap-1.5 text-[9.5px]">
            <span className="shrink-0">المسؤول:</span>
            <span className="text-left break-words">{cashierName} ({priceTypeArabic})</span>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full table-fixed text-right my-1.5 text-[9.5px] border-collapse">
          <colgroup>
            <col className="w-[42%]" />
            <col className="w-[14%]" />
            <col className="w-[21%]" />
            <col className="w-[23%]" />
          </colgroup>
          <thead>
            <tr className="border-y border-black font-black bg-slate-100">
              <th className="py-1 px-0.5 text-right">المادة</th>
              <th className="py-1 px-0.5 text-center">العدد</th>
              <th className="py-1 px-0.5 text-center">السعر</th>
              <th className="py-1 px-0.5 text-left">المجموع</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dashed divide-slate-400">
            {items.map((item, idx) => (
              <tr key={idx} className="align-top">
                <td className="py-1 pl-1 font-bold break-words whitespace-normal leading-tight">
                  <div className="break-words">{item.name}</div>
                  {item.serialNo && <div className="text-[8px] text-slate-700 font-mono" dir="ltr">S/N: {item.serialNo}</div>}
                </td>
                <td className="py-1 px-0.5 text-center font-bold font-mono whitespace-nowrap" dir="ltr">{item.quantity}</td>
                <td className="py-1 px-0.5 text-center font-mono whitespace-nowrap" dir="ltr">{Number(item.price).toLocaleString()}</td>
                <td className="py-1 px-0.5 text-left font-black font-mono whitespace-nowrap" dir="ltr">{(item.quantity * item.price).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="pt-1.5 border-t-[1.5px] border-black space-y-0.5 text-[11px]">
          <div className="flex justify-between items-center gap-1.5">
            <span className="font-bold shrink-0">إجمالي المواد (عدد الفقرات):</span>
            <span className="font-mono font-black whitespace-nowrap" dir="ltr">{items.length}</span>
          </div>
          <div className="flex justify-between items-center gap-1.5">
            <span className="font-bold shrink-0">مجموع القائمة:</span>
            <span className="font-mono whitespace-nowrap" dir="ltr">{subtotal.toLocaleString('en-US')} {currencySymbol}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between items-center gap-1.5 text-black">
              <span className="font-bold shrink-0">الخصم:</span>
              <span className="font-mono whitespace-nowrap" dir="ltr">-{discountAmount.toLocaleString('en-US')} {currencySymbol}</span>
            </div>
          )}
          <div className="flex justify-between items-center gap-1.5 text-xs font-black border-y-[1.5px] border-black py-1 my-0.5">
            <span className="shrink-0">الصافي المطلوب:</span>
            <span className="font-mono whitespace-nowrap" dir="ltr">{netTotal.toLocaleString('en-US')} {currencySymbol}</span>
          </div>
          {paymentMethod && (
            <div className="flex justify-between items-center gap-1.5 text-[10px]">
              <span className="font-bold shrink-0">طريقة الدفع:</span>
              <span className="font-black text-black">
                {paymentMethod === 'cash' ? 'نقدي' : paymentMethod === 'card' ? 'Mastercard / بطاقة' : paymentMethod === 'transfer' ? 'تحويل' : paymentMethod === 'credit' ? 'آجل' : paymentMethod === 'split' ? 'دفع مختلط' : paymentMethod}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center gap-1.5">
            <span className="font-bold shrink-0">المدفوع (الواصل):</span>
            <span className="font-mono font-bold whitespace-nowrap" dir="ltr">{paidAmount.toLocaleString('en-US')} {currencySymbol}</span>
          </div>
          {remaining > 0 && (
            <div className="flex justify-between items-center gap-1.5 text-black font-black">
              <span className="shrink-0">المتبقي (ذمة):</span>
              <span className="font-mono whitespace-nowrap" dir="ltr">{remaining.toLocaleString('en-US')} {currencySymbol}</span>
            </div>
          )}
          {previousBalance > 0 && (
            <div className="flex justify-between items-center gap-1.5 text-[10px] text-black border-t border-dotted border-black pt-0.5">
              <span className="shrink-0">الرصيد السابق:</span>
              <span className="font-mono whitespace-nowrap" dir="ltr">{previousBalance.toLocaleString('en-US')} {currencySymbol}</span>
            </div>
          )}
          {currentBalance > 0 && (
            <div className="flex justify-between items-center gap-1.5 font-black text-[10.5px] text-black">
              <span className="shrink-0">الرصيد الكلي:</span>
              <span className="font-mono whitespace-nowrap" dir="ltr">{currentBalance.toLocaleString('en-US')} {currencySymbol}</span>
            </div>
          )}
        </div>

        {/* Mandatory DUBSAR Footer */}
        <div className="mt-2 pt-1.5 border-t border-dashed border-black text-center space-y-0.5">
          <p className="text-[9px] text-black font-medium break-words leading-tight">{activeSettings?.footerText || 'شكراً لتعاملكم معنا • البضاعة المباعة لا ترد ولا تستبدل إلا بموجب هذه الفاتورة'}</p>
          <div className="pt-1 border-t border-dotted border-black mt-1">
            <p className="text-[9px] font-black text-black">نظام دوبسار لإدارة المبيعات | 07858833838</p>
          </div>
        </div>
      </div>
    );
  }

  // 2. A4 STANDARD CORPORATE INVOICE LAYOUT
  return (
    <div
      className={cn(
        'bg-white text-slate-900 p-8 text-xs font-sans leading-normal select-none',
        'w-[210mm] min-h-[297mm] max-w-[210mm] mx-auto border border-slate-200 print:border-none print:m-0 print:p-6 print:w-full',
        className
      )}
      dir="rtl"
    >
      {/* Top Header: Branding & Invoice Metadata */}
      <div className="flex justify-between items-start pb-6 border-b-2 border-black">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            {activeSettings?.logo && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={activeSettings.logo}
                alt="شعار"
                className="h-16 w-auto object-contain max-w-[140px]"
              />
            )}
            <div>
              <h1 className="text-2xl font-black tracking-tight text-black">
                {activeSettings?.businessName || 'مؤسسة دوبسار التجارية'}
              </h1>
              {activeSettings?.ownerName && (
                <p className="text-xs font-bold text-black">بإدارة: {activeSettings.ownerName}</p>
              )}
            </div>
          </div>
          {activeSettings?.address && (
            <p className="text-xs text-black">
              {activeSettings.address} {activeSettings.province ? `• ${activeSettings.province}` : ''}
            </p>
          )}
          {(activeSettings?.phone1 || activeSettings?.phone2) && (
            <p className="text-xs font-mono font-bold text-black dir-ltr text-right">
              الهاتف: {activeSettings?.phone1} {activeSettings?.phone2 ? `| ${activeSettings.phone2}` : ''}
            </p>
          )}
        </div>

        <div className="text-left font-mono text-xs text-black">
          <div className="font-black text-black">DUBSAR</div>
          <div className="text-[10px] text-black">نظام إدارة المبيعات والمخزون</div>
        </div>
      </div>

      {/* Reference Invoice Information Bar */}
      <div className="relative my-4 border-2 border-black rounded-lg bg-white p-3 pt-3.5">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-black text-white text-[11px] font-black px-6 py-0.5 rounded-full shadow-sm">
            فاتورة مبيعات
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2 text-[11px] pt-1 text-black">
          {/* Row 1 */}
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span className="text-black font-bold shrink-0">رقم الفاتورة:</span>
            <span className="font-mono font-black text-black">{invoiceNo}</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span className="text-black font-bold shrink-0">التاريخ:</span>
            <span className="font-mono font-bold text-black">{date}</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span className="text-black font-bold shrink-0">الوقت:</span>
            <span className="font-mono font-bold text-black">{formattedTime}</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span className="text-black font-bold shrink-0">نوع البيع:</span>
            <span className="font-bold text-black">{remaining > 0 ? (paidAmount > 0 ? 'نقدي + آجل' : 'آجل') : 'نقدي'}</span>
          </div>

          {/* Row 2 */}
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span className="text-black font-bold shrink-0">اسم الزبون:</span>
            <span className="font-black text-black truncate">{customer?.name || 'زبون نقدي'}</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span className="text-black font-bold shrink-0">هاتف الزبون:</span>
            <span className="font-mono text-black">{customer?.phone || '---'}</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span className="text-black font-bold shrink-0">العنوان:</span>
            <span className="text-black truncate">{customer?.address || '---'}</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span className="text-black font-bold shrink-0">المستودع:</span>
            <span className="text-black font-bold truncate">المستودع الرئيسي</span>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="border-2 border-black rounded-lg overflow-hidden my-4">
        <table className="w-full text-right border-collapse text-xs">
          <thead className="bg-black text-white font-black border-b-2 border-black">
            <tr>
              <th className="p-2.5 w-12 text-center border-l border-white/30 text-white">#</th>
              <th className="p-2.5 w-32 border-l border-white/30 text-white">الباركود</th>
              <th className="p-2.5 border-l border-white/30 text-white">اسم المادة والمواصفات</th>
              <th className="p-2.5 w-20 text-center border-l border-white/30 text-white">الوحدة</th>
              <th className="p-2.5 w-20 text-center border-l border-white/30 text-white">الكمية</th>
              <th className="p-2.5 w-28 text-center border-l border-white/30 text-white">السعر المفرد</th>
              <th className="p-2.5 w-32 text-center border-l border-white/30 text-white">الإجمالي</th>
              <th className="p-2.5 w-40 text-white">ملاحظات / سيريال</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black text-black">
            {items.map((item, idx) => (
              <tr key={idx} className="bg-white">
                <td className="p-2 text-center font-bold text-black border-l border-black">{idx + 1}</td>
                <td className="p-2 font-mono text-[11px] text-black border-l border-black">{item.barcode || '-'}</td>
                <td className="p-2 font-black text-black border-l border-black">{item.name}</td>
                <td className="p-2 text-center text-black border-l border-black">{item.unit || 'قطعة'}</td>
                <td className="p-2 text-center font-black font-mono text-black border-l border-black">{item.quantity}</td>
                <td className="p-2 text-center font-mono font-bold text-black border-l border-black">{Number(item.price).toLocaleString()}</td>
                <td className="p-2 text-center font-mono font-black text-black border-l border-black">
                  {(item.quantity * item.price).toLocaleString()}
                </td>
                <td className="p-2 text-[10px] text-black">
                  {item.serialNo ? `S/N: ${item.serialNo}` : ''} {item.notes || ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Financial Summary & Signatures Row */}
      <div className="grid grid-cols-2 gap-8 my-6 items-start">
        {/* Notes and Signatures */}
        <div className="space-y-4">
          <div className="p-3 bg-white rounded-lg border-2 border-black text-xs text-black">
            <span className="font-black block mb-1 text-black">ملاحظات وشروط الفاتورة:</span>
            <p className="text-[11px] text-black leading-relaxed">
              {activeSettings?.footerText || '1. البضاعة المباعة خاضعة للفحص والاستلام في موقع المنشأة.\n2. لا تقبل المرتجعات إلا بوجود أصل هذه الفاتورة وبحالتها الأصلية.'}
            </p>
          </div>

          <div className="pt-6 grid grid-cols-2 gap-4 text-center text-xs text-black">
            <div className="space-y-8">
              <span className="font-bold text-black">توقيع المستلم:</span>
              <div className="border-b border-dashed border-black w-36 mx-auto"></div>
            </div>
            <div className="space-y-8">
              <span className="font-bold text-black">توقيع وخاتم المنشأة:</span>
              <div className="border-b border-dashed border-black w-36 mx-auto"></div>
            </div>
          </div>
        </div>

        {/* Totals Table */}
        <div className="border-2 border-black rounded-lg overflow-hidden bg-white">
          <table className="w-full text-xs text-black">
            <tbody className="divide-y divide-black font-bold">
              <tr>
                <td className="p-2 text-black">إجمالي المواد (عدد الفقرات):</td>
                <td className="p-2 text-left font-mono font-black text-black">{items.length}</td>
              </tr>
              <tr>
                <td className="p-2 text-black">مجموع القائمة:</td>
                <td className="p-2 text-left font-mono font-black text-black">{subtotal.toLocaleString('en-US')} {currencySymbol}</td>
              </tr>
              {discountAmount > 0 && (
                <tr className="text-black">
                  <td className="p-2">الخصم الممنوح:</td>
                  <td className="p-2 text-left font-mono font-black text-black">-{discountAmount.toLocaleString('en-US')} {currencySymbol}</td>
                </tr>
              )}
              <tr className="bg-black text-white text-sm font-black">
                <td className="p-2.5 text-white">المجموع الصافي المطلوب:</td>
                <td className="p-2.5 text-left font-mono font-black text-base text-white">{netTotal.toLocaleString('en-US')} {currencySymbol}</td>
              </tr>
              {paymentMethod && (
                <tr className="text-black font-bold text-xs bg-slate-50">
                  <td className="p-2 text-black">طريقة الدفع:</td>
                  <td className="p-2 text-left font-black text-black">
                    {paymentMethod === 'cash' ? 'نقدي' : paymentMethod === 'card' ? 'Mastercard / بطاقة' : paymentMethod === 'transfer' ? 'تحويل' : paymentMethod === 'credit' ? 'آجل' : paymentMethod === 'split' ? 'دفع مختلط' : paymentMethod}
                  </td>
                </tr>
              )}
              <tr>
                <td className="p-2 text-black">المبلغ الواصل (المدفوع):</td>
                <td className="p-2 text-left font-mono font-black text-black">{paidAmount.toLocaleString('en-US')} {currencySymbol}</td>
              </tr>
              <tr>
                <td className="p-2 text-black">المبلغ المتبقي (الذمة):</td>
                <td className="p-2 text-left font-mono font-black text-black">{remaining.toLocaleString('en-US')} {currencySymbol}</td>
              </tr>
              {previousBalance > 0 && (
                <tr className="text-black border-t-2 border-black">
                  <td className="p-2">الرصيد السابق للعميل:</td>
                  <td className="p-2 text-left font-mono text-black">{previousBalance.toLocaleString('en-US')} {currencySymbol}</td>
                </tr>
              )}
              <tr className="bg-black/5 text-black font-black border-t border-black">
                <td className="p-2.5 text-black">الرصيد الكلي الحالي للعميل:</td>
                <td className="p-2.5 text-left font-mono text-sm text-black">{currentBalance.toLocaleString('en-US')} {currencySymbol}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Corporate Page Footer */}
      <div className="pt-3 border-t-2 border-black flex items-center justify-between text-xs font-bold text-black">
        <span className="font-black">نظام دوبسار لإدارة المبيعات | 07858833838</span>
        <span className="text-[11px] text-black font-mono">{date} {formattedTime}</span>
      </div>
    </div>
  );
}
