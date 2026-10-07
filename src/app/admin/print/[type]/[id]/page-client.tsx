"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useFirestore, useDoc, useUser } from "@/firebase";
import { doc } from "firebase/firestore";
import { Printer, FileText, ChevronRight, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { PrintEngine } from "@/services/print-engine";

const collectionMap: Record<string, string> = {
  invoice: 'orders',
  purchase: 'purchases',
  receipt: 'receiptVouchers',
  payment: 'paymentVouchers',
  workshop: 'repairOrders',
  return: 'returns',
  statement: 'users' 
};

export default function PrintPreviewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const db = useFirestore();
  const { tenantId } = useUser();
  const LOGO_URL = "https://up6.cc/2026/07/178308238964931.png";
  
  const type = params?.type as string;
  const id = params?.id as string;
  const size = searchParams.get('size') || '80mm'; 

  const docRef = useMemo(() => id ? doc(db, collectionMap[type] || 'orders', id) : null, [db, type, id]);
  const { data, loading } = useDoc<any>(docRef);

  // FIXED: Fetch settings from the tenant document instead of global main settings
  const tenantRef = useMemo(() => tenantId ? doc(db, 'tenants', tenantId) : null, [db, tenantId]);
  const { data: settings } = useDoc<any>(tenantRef);

  const handlePrint = async () => {
    const el = document.getElementById('printable-document');
    if (!el) {
      window.print();
      return;
    }
    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>طباعة مستند</title>
        <style>
          @page {
            size: ${size === 'A4' ? 'A4 portrait' : size === '80mm' ? '80mm auto' : '58mm auto'};
            margin: ${size === 'A4' ? '8mm' : '0'};
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            margin: 0;
            padding: ${size === 'A4' ? '10mm' : '4mm'};
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, Tahoma, sans-serif;
            background: #ffffff;
            color: #0f172a;
            font-size: 11px;
            line-height: 1.4;
          }
          table { width: 100%; border-collapse: collapse; }
        </style>
      </head>
      <body>
        ${el.innerHTML}
      </body>
      </html>
    `;
    await PrintEngine.printIsolatedHtml(html);
  };

  if (loading) return <div className="p-20 text-center"><Skeleton className="h-64 w-full max-w-2xl mx-auto rounded-3xl" /></div>;
  if (!data) return <div className="p-20 text-center font-black">المستند غير موجود ⚠️</div>;

  return (
    <div className="min-h-screen bg-muted/30 pb-20 no-print" dir="rtl">
      {/* Control Bar */}
      <div className="sticky top-0 z-50 bg-white border-b shadow-sm p-4 flex items-center justify-between px-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => router.back()}>
            <X className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-black leading-none">معاينة الطباعة</h1>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Platform Print Engine v2.1</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden md:flex bg-muted/50 rounded-xl p-1 gap-1 border">
             {['58mm', '80mm', 'A4'].map((s) => (
               <Button 
                key={s} 
                variant={size === s ? "default" : "ghost"} 
                size="sm" 
                className="h-8 rounded-lg text-[10px] font-black"
                onClick={() => router.replace(`/admin/print/${type}/${id}?size=${s}`)}
               >
                 {s}
               </Button>
             ))}
          </div>
          <Button className="rounded-xl font-black gap-2 h-11 px-8 shadow-lg shadow-primary/20" onClick={handlePrint}>
            <Printer className="h-4 w-4" /> طباعة الآن
          </Button>
        </div>
      </div>

      {/* Print Paper Area */}
      <div className="flex justify-center p-4 md:p-8">
        <div 
          className={cn(
            "bg-white shadow-2xl transition-all duration-500 origin-top overflow-hidden",
            size === 'A4' ? "w-[210mm] min-h-[297mm]" : 
            size === '80mm' ? "w-[80mm] min-h-[150mm]" : 
            "w-[58mm] min-h-[100mm]"
          )}
          id="printable-document"
        >
          <div className="p-6 md:p-10 text-slate-900 printable-area">
             {/* Header */}
             <div className="text-center space-y-2 mb-8 border-b pb-6">
                <div className="relative h-20 w-40 mx-auto mb-2">
                  <Image 
                    src={settings?.logo || LOGO_URL} 
                    alt="Logo" 
                    fill 
                    className="object-contain"
                  />
                </div>
                <h2 className="text-xl font-black">{settings?.businessName || 'المنصة المتكاملة'}</h2>
                <p className="text-[10px] font-bold text-muted-foreground">{settings?.address || 'العراق'}</p>
                <p className="text-[10px] font-bold text-muted-foreground" dir="ltr">{settings?.phone || '07XXXXXXXXX'}</p>
             </div>

             {/* Doc Title & Info */}
             <div className="flex justify-between items-start mb-6">
                <div className="space-y-1">
                   <h3 className="font-black text-sm uppercase">
                      {type === 'invoice' ? 'فاتورة مبيعات' : 
                       type === 'purchase' ? 'فاتورة شراء' : 
                       type === 'receipt' ? 'سند قبض' : 
                       type === 'payment' ? 'سند صرف' : 
                       type === 'workshop' ? 'فاتورة صيانة' : 'مستند رسمي'}
                   </h3>
                   <p className="text-[10px] font-bold">الرقم: <span className="text-primary">#{data.orderNumber || data.voucherNumber || data.invoiceNumber || id.slice(-6)}</span></p>
                </div>
                <div className="text-left space-y-1">
                   <p className="text-[10px] font-bold">{new Date(data.createdAt || data.timestamp).toLocaleDateString("ar-EG")}</p>
                   <p className="text-[10px] font-bold">{new Date(data.createdAt || data.timestamp).toLocaleTimeString("ar-EG")}</p>
                </div>
             </div>

             {/* Customer/Supplier Info */}
             <div className="bg-muted/30 p-4 rounded-xl mb-6 text-xs space-y-2 border">
                <div className="flex justify-between">
                   <span className="opacity-60 font-bold">الطرف الآخر:</span>
                   <span className="font-black">{data.customerName || data.targetName || data.supplierName || 'زبون نقدي'}</span>
                </div>
                {(data.phoneNumber || data.phone) && (
                  <div className="flex justify-between">
                    <span className="opacity-60 font-bold">الهاتف:</span>
                    <span className="font-bold" dir="ltr">{data.phoneNumber || data.phone}</span>
                  </div>
                )}
             </div>

             {/* Items Table */}
             {(data.items || data.partsUsed) && (
               <table className="w-full text-xs mb-8 border-collapse">
                  <thead>
                     <tr className="border-b-2 border-slate-900 bg-slate-50">
                        <th className="text-right py-3 px-1 font-black">البيان</th>
                        <th className="text-center py-3 px-1 font-black">سعر</th>
                        <th className="text-center py-3 px-1 font-black">عدد</th>
                        <th className="text-left py-3 px-1 font-black">إجمالي</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y">
                     {(data.items || data.partsUsed).map((item: any, i: number) => (
                       <tr key={i} className="border-b last:border-0">
                          <td className="py-3 px-1 font-bold">{item.name}</td>
                          <td className="py-3 px-1 text-center">{item.price?.toLocaleString()}</td>
                          <td className="py-3 px-1 text-center font-black">x{item.quantity}</td>
                          <td className="py-3 px-1 text-left font-black">{ (item.price * item.quantity).toLocaleString() }</td>
                       </tr>
                     ))}
                  </tbody>
               </table>
             )}

             {/* Payment Details (Vouchers) */}
             {type.includes('receipt') || type.includes('payment') ? (
                <div className="p-6 border-2 border-dashed rounded-2xl text-center space-y-4 mb-8">
                   <p className="text-sm font-bold opacity-60">المبلغ</p>
                   <p className="text-3xl font-black text-primary">{data.amount?.toLocaleString()} د.ع</p>
                   <p className="text-xs font-bold leading-relaxed">{data.notes || 'لا يوجد ملاحظات إضافية'}</p>
                </div>
             ) : null}

             {/* Totals Section */}
             <div className="space-y-3 pt-6 border-t border-slate-900">
                <div className="flex justify-between items-center text-[10px] font-bold opacity-60">
                   <span>المجموع الفرعي:</span>
                   <span>{(data.total || data.totalAmount || 0).toLocaleString()} د.ع</span>
                </div>
                <div className="flex justify-between items-center bg-slate-900 text-white p-4 rounded-xl">
                   <span className="text-sm font-black uppercase">الإجمالي النهائي</span>
                   <span className="text-xl font-black">{(data.total || data.totalAmount || data.amount || 0).toLocaleString()} د.ع</span>
                </div>
                
                {data.unpaidAmount > 0 && (
                  <div className="flex justify-between items-center text-red-600 font-black p-2 border-2 border-red-100 rounded-xl mt-2">
                    <span className="text-[10px]">المتبقي (ذمة):</span>
                    <span className="text-sm">{data.unpaidAmount.toLocaleString()} د.ع</span>
                  </div>
                )}
             </div>

             {/* Footer Barcode & QR */}
             <div className="mt-12 text-center space-y-4 opacity-70">
                <div className="flex flex-col items-center gap-1">
                   <p className="text-[8px] font-black uppercase tracking-[0.3em]">Quality & Professional Service</p>
                   <p className="text-[10px] font-black">{settings?.businessName || 'MMA Platform'} 🏍️</p>
                </div>
                <div className="pt-4 border-t flex justify-between items-center">
                   <div className="text-right">
                      <p className="text-[8px] font-bold">بواسطة: {data.employeeName || 'النظام'}</p>
                      <p className="text-[8px] font-bold opacity-50">تاريخ الطباعة: {new Date().toLocaleString("ar-EG")}</p>
                   </div>
                   <div className="relative h-12 w-12 bg-slate-100 rounded flex items-center justify-center">
                      <Image src={settings?.logo || LOGO_URL} alt="QR" fill className="object-contain p-1" />
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body { 
            background: white !important; 
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print { display: none !important; }
          #printable-document {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            min-height: initial !important;
          }
          @page {
            margin: 0;
            size: ${size === 'A4' ? 'A4' : '80mm auto'};
          }
          .printable-area {
            padding: ${size === 'A4' ? '20mm' : '5mm'} !important;
          }
        }
      `}</style>
    </div>
  );
}
