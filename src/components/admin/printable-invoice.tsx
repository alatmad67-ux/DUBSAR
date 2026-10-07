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
  format?: 'A4' | '80mm';
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

  // 1. 80mm THERMAL RECEIPT LAYOUT
  if (format === '80mm') {
    return (
      <div
        className={cn(
          'bg-white text-black p-4 text-xs font-sans leading-relaxed select-none',
          'w-[80mm] max-w-[80mm] mx-auto border border-dashed border-slate-300 print:border-none print:m-0 print:p-2',
          className
        )}
        dir="rtl"
      >
        {/* Header */}
        <div className="text-center space-y-1 pb-2 border-b border-dashed border-slate-400">
          {activeSettings?.logo && (
            <div className="flex justify-center mb-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeSettings.logo}
                alt="شعار"
                className="h-12 w-auto object-contain max-w-[120px]"
              />
            </div>
          )}
          <h2 className="text-base font-black tracking-tight">{activeSettings?.businessName || 'مؤسسة دوبسار التجارية'}</h2>
          {activeSettings?.address && (
            <p className="text-[10px] text-slate-700">{activeSettings.address} {activeSettings.province ? `- ${activeSettings.province}` : ''}</p>
          )}
          {(activeSettings?.phone1 || activeSettings?.phone2) && (
            <p className="text-[10px] font-mono dir-ltr font-bold text-slate-700">
              {activeSettings?.phone1} {activeSettings?.phone2 ? `| ${activeSettings.phone2}` : ''}
            </p>
          )}
          <div className="inline-block px-3 py-0.5 mt-1 bg-black text-white text-[10px] font-black rounded">
            فاتورة مبيعات نقدية / ذمم
          </div>
        </div>

        {/* Meta info */}
        <div className="py-2 text-[11px] space-y-0.5 border-b border-dashed border-slate-400">
          <div className="flex justify-between">
            <span className="font-bold">رقم القائمة:</span>
            <span className="font-mono font-black">{invoiceNo}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold">التاريخ:</span>
            <span>{date} {formattedTime}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold">العميل:</span>
            <span className="font-black">{customer?.name || 'زبون نقدي'}</span>
          </div>
          {customer?.phone && (
            <div className="flex justify-between text-[10px]">
              <span>الهاتف:</span>
              <span className="font-mono">{customer.phone}</span>
            </div>
          )}
          <div className="flex justify-between text-[10px]">
            <span>الموظف:</span>
            <span>{cashierName}</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span>السعر:</span>
            <span>{priceTypeArabic}</span>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full text-right my-2 text-[11px]">
          <thead>
            <tr className="border-b border-black font-black">
              <th className="py-1">المادة</th>
              <th className="py-1 text-center w-10">العدد</th>
              <th className="py-1 text-center w-16">السعر</th>
              <th className="py-1 text-left w-16">المجموع</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dotted divide-slate-300">
            {items.map((item, idx) => (
              <tr key={idx} className="py-1">
                <td className="py-1 font-bold">
                  <div>{item.name}</div>
                  {item.serialNo && <div className="text-[9px] text-slate-600 font-mono">سيريال: {item.serialNo}</div>}
                </td>
                <td className="py-1 text-center font-bold font-mono">{item.quantity}</td>
                <td className="py-1 text-center font-mono">{Number(item.price).toLocaleString()}</td>
                <td className="py-1 text-left font-black font-mono">{(item.quantity * item.price).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="pt-2 border-t-2 border-black space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="font-bold">المجموع:</span>
            <span className="font-mono">{subtotal.toLocaleString()} {currencySymbol}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-emerald-800">
              <span className="font-bold">الخصم:</span>
              <span className="font-mono">-{discountAmount.toLocaleString()} {currencySymbol}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-black border-t border-b border-black py-1">
            <span>الصافي المطلوب:</span>
            <span className="font-mono">{netTotal.toLocaleString()} {currencySymbol}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold">الواصل (المدفوع):</span>
            <span className="font-mono font-bold">{paidAmount.toLocaleString()} {currencySymbol}</span>
          </div>
          {remaining > 0 && (
            <div className="flex justify-between text-red-700 font-bold">
              <span>الباقي (ذمة):</span>
              <span className="font-mono">{remaining.toLocaleString()} {currencySymbol}</span>
            </div>
          )}
          {previousBalance > 0 && (
            <div className="flex justify-between text-[11px] text-slate-700 border-t border-dotted border-slate-300 pt-1">
              <span>الرصيد السابق:</span>
              <span className="font-mono">{previousBalance.toLocaleString()} {currencySymbol}</span>
            </div>
          )}
          {currentBalance > 0 && (
            <div className="flex justify-between font-black text-xs">
              <span>الرصيد الكلي:</span>
              <span className="font-mono">{currentBalance.toLocaleString()} {currencySymbol}</span>
            </div>
          )}
        </div>

        {/* Mandatory DUBSAR Footer */}
        <div className="mt-3 pt-2 border-t border-dashed border-slate-400 text-center space-y-0.5">
          <div className="font-mono text-xs tracking-widest font-black">*{invoiceNo}*</div>
          <p className="text-[10px] text-slate-700 font-medium">{activeSettings?.footerText || 'شكراً لتعاملكم معنا • البضاعة المباعة لا ترد ولا تستبدل بعد 3 أيام'}</p>
          <div className="pt-1 border-t border-slate-200 mt-1">
            <p className="text-[10px] font-black text-slate-900">نظام DUBSAR لإدارة المبيعات</p>
            <p className="text-[10px] font-mono font-bold text-slate-800">07858833838</p>
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
      <div className="flex justify-between items-start pb-6 border-b-2 border-primary/80">
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
              <h1 className="text-2xl font-black tracking-tight text-primary">
                {activeSettings?.businessName || 'مؤسسة دوبسار التجارية'}
              </h1>
              {activeSettings?.ownerName && (
                <p className="text-xs font-bold text-slate-600">بإدارة: {activeSettings.ownerName}</p>
              )}
            </div>
          </div>
          {activeSettings?.address && (
            <p className="text-xs text-slate-600">
              {activeSettings.address} {activeSettings.province ? `• ${activeSettings.province}` : ''}
            </p>
          )}
          {(activeSettings?.phone1 || activeSettings?.phone2) && (
            <p className="text-xs font-mono font-bold text-slate-700 dir-ltr text-right">
              الهاتف: {activeSettings?.phone1} {activeSettings?.phone2 ? `| ${activeSettings.phone2}` : ''}
            </p>
          )}
        </div>

        <div className="text-left space-y-1 min-w-[220px]">
          <div className="inline-block px-4 py-1 bg-primary text-white text-sm font-black rounded-lg text-center mb-1 w-full">
            فاتورة مبيعات
          </div>
          <div className="flex justify-between text-xs border-b border-slate-200 py-0.5">
            <span className="font-bold text-slate-500">رقم الفاتورة:</span>
            <span className="font-mono font-black text-sm text-primary">{invoiceNo}</span>
          </div>
          <div className="flex justify-between text-xs border-b border-slate-200 py-0.5">
            <span className="font-bold text-slate-500">التاريخ:</span>
            <span className="font-bold">{date}</span>
          </div>
          <div className="flex justify-between text-xs border-b border-slate-200 py-0.5">
            <span className="font-bold text-slate-500">الوقت:</span>
            <span>{formattedTime}</span>
          </div>
          <div className="flex justify-between text-xs py-0.5">
            <span className="font-bold text-slate-500">منظم الفاتورة:</span>
            <span className="font-bold">{cashierName}</span>
          </div>
        </div>
      </div>

      {/* Customer Info Card */}
      <div className="my-5 p-4 rounded-xl border border-slate-200 bg-slate-50/60 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <span className="block text-[10px] font-bold text-slate-500">اسم العميل:</span>
          <span className="text-sm font-black text-slate-900">{customer?.name || 'زبون نقدي'}</span>
        </div>
        <div>
          <span className="block text-[10px] font-bold text-slate-500">رقم الهاتف:</span>
          <span className="text-xs font-mono font-bold text-slate-800">{customer?.phone || '-'}</span>
        </div>
        <div>
          <span className="block text-[10px] font-bold text-slate-500">العنوان:</span>
          <span className="text-xs font-bold text-slate-800">{customer?.address || '-'}</span>
        </div>
        <div>
          <span className="block text-[10px] font-bold text-slate-500">نوع السعر والعملة:</span>
          <span className="text-xs font-bold text-primary">{priceTypeArabic} • {currency === 'USD' ? 'دولار ($)' : 'دينار (د.ع)'}</span>
        </div>
      </div>

      {/* Items Table */}
      <div className="border border-slate-300 rounded-lg overflow-hidden my-4">
        <table className="w-full text-right border-collapse text-xs">
          <thead className="bg-slate-100 text-slate-700 font-black border-b border-slate-300">
            <tr>
              <th className="p-2.5 w-12 text-center border-l border-slate-300">#</th>
              <th className="p-2.5 w-32 border-l border-slate-300">الباركود</th>
              <th className="p-2.5 border-l border-slate-300">اسم المادة والمواصفات</th>
              <th className="p-2.5 w-20 text-center border-l border-slate-300">الوحدة</th>
              <th className="p-2.5 w-20 text-center border-l border-slate-300">الكمية</th>
              <th className="p-2.5 w-28 text-center border-l border-slate-300">السعر المفرد</th>
              <th className="p-2.5 w-32 text-center border-l border-slate-300">الإجمالي</th>
              <th className="p-2.5 w-40">ملاحظات / سيريال</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.map((item, idx) => (
              <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}>
                <td className="p-2 text-center font-bold text-slate-500 border-l border-slate-200">{idx + 1}</td>
                <td className="p-2 font-mono text-[11px] text-slate-600 border-l border-slate-200">{item.barcode || '-'}</td>
                <td className="p-2 font-black text-slate-900 border-l border-slate-200">{item.name}</td>
                <td className="p-2 text-center text-slate-600 border-l border-slate-200">{item.unit || 'قطعة'}</td>
                <td className="p-2 text-center font-black font-mono border-l border-slate-200">{item.quantity}</td>
                <td className="p-2 text-center font-mono font-bold border-l border-slate-200">{Number(item.price).toLocaleString()}</td>
                <td className="p-2 text-center font-mono font-black text-primary border-l border-slate-200">
                  {(item.quantity * item.price).toLocaleString()}
                </td>
                <td className="p-2 text-[10px] text-slate-600">
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
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <span className="font-black block mb-1 text-slate-700">ملاحظات وشروط الفاتورة:</span>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              {activeSettings?.footerText || '1. البضاعة المباعة خاضعة للفحص والاستلام في موقع المنشأة.\n2. لا تقبل المرتجعات إلا بوجود أصل هذه الفاتورة وبحالتها الأصلية.'}
            </p>
          </div>

          <div className="pt-6 grid grid-cols-2 gap-4 text-center text-xs">
            <div className="space-y-8">
              <span className="font-bold text-slate-600">توقيع المستلم:</span>
              <div className="border-b border-dashed border-slate-400 w-36 mx-auto"></div>
            </div>
            <div className="space-y-8">
              <span className="font-bold text-slate-600">توقيع وخاتم المنشأة:</span>
              <div className="border-b border-dashed border-slate-400 w-36 mx-auto"></div>
            </div>
          </div>
        </div>

        {/* Totals Table */}
        <div className="border border-slate-300 rounded-xl overflow-hidden bg-slate-50/40">
          <table className="w-full text-xs">
            <tbody className="divide-y divide-slate-200 font-bold">
              <tr>
                <td className="p-2 text-slate-600">مجموع القائمة:</td>
                <td className="p-2 text-left font-mono font-black">{subtotal.toLocaleString()} {currencySymbol}</td>
              </tr>
              {discountAmount > 0 && (
                <tr className="text-emerald-700">
                  <td className="p-2">الخصم الممنوح:</td>
                  <td className="p-2 text-left font-mono font-black">-{discountAmount.toLocaleString()} {currencySymbol}</td>
                </tr>
              )}
              <tr className="bg-primary/10 text-primary text-sm font-black">
                <td className="p-2.5">المجموع الصافي المطلوب:</td>
                <td className="p-2.5 text-left font-mono font-black text-base">{netTotal.toLocaleString()} {currencySymbol}</td>
              </tr>
              <tr>
                <td className="p-2 text-emerald-800">المبلغ الواصل (المدفوع):</td>
                <td className="p-2 text-left font-mono font-black text-emerald-800">{paidAmount.toLocaleString()} {currencySymbol}</td>
              </tr>
              <tr>
                <td className="p-2 text-red-600">المبلغ المتبقي (الذمة):</td>
                <td className="p-2 text-left font-mono font-black text-red-600">{remaining.toLocaleString()} {currencySymbol}</td>
              </tr>
              {previousBalance > 0 && (
                <tr className="text-slate-600 border-t-2 border-slate-300">
                  <td className="p-2">الرصيد السابق للعميل:</td>
                  <td className="p-2 text-left font-mono">{previousBalance.toLocaleString()} {currencySymbol}</td>
                </tr>
              )}
              <tr className="bg-slate-200/70 text-slate-900 font-black">
                <td className="p-2.5">الرصيد الكلي الحالي للعميل:</td>
                <td className="p-2.5 text-left font-mono text-sm">{currentBalance.toLocaleString()} {currencySymbol}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Corporate Page Footer */}
      <div className="pt-3 border-t border-slate-300 flex items-center justify-between text-xs font-bold text-slate-700">
        <span className="font-black">نظام DUBSAR لإدارة المبيعات</span>
        <span className="font-mono">هاتف الدعم الفني: 07858833838</span>
        <span className="text-[11px] text-slate-500 font-mono">{date} {formattedTime}</span>
      </div>
    </div>
  );
}
