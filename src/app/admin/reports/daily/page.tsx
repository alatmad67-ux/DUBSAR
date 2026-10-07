'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { 
  FileText, 
  Printer, 
  Calendar, 
  BadgeDollarSign, 
  ShoppingBag, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Wallet,
  Loader2,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { POSService } from '@/services/pos-service';
import { InventoryService } from '@/services/inventory-service';
import { Badge } from '@/components/ui/badge';
import { InvoiceDetailDialog } from '@/components/admin/invoice-detail-dialog';
import { PrintEngine } from '@/services/print-engine';

export default function DailyReportPage() {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [sales, setSales] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const loadDailyData = async () => {
    setLoading(true);
    try {
      const [saleRows, purchaseRows] = await Promise.all([
        POSService.getRecentSales(),
        InventoryService.getPurchases()
      ]);
      setSales(saleRows || []);
      setPurchases(purchaseRows || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDailyData();
  }, []);

  const dayRange = useMemo(() => {
    const start = new Date(selectedDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(selectedDate);
    end.setHours(23, 59, 59, 999);
    return { start: start.getTime(), end: end.getTime() };
  }, [selectedDate]);

  const dailySales = useMemo(() => {
    return sales.filter(s => {
      const t = Number(s.createdAt) || 0;
      return t >= dayRange.start && t <= dayRange.end;
    });
  }, [sales, dayRange]);

  const dailyPurchases = useMemo(() => {
    return purchases.filter(p => {
      const t = Number(p.createdAt) || 0;
      return t >= dayRange.start && t <= dayRange.end;
    });
  }, [purchases, dayRange]);

  const salesTotal = useMemo(() => dailySales.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0), [dailySales]);
  const salesPaidTotal = useMemo(() => dailySales.reduce((sum, s) => sum + (Number(s.paidAmount) || 0), 0), [dailySales]);
  const purchasesTotal = useMemo(() => dailyPurchases.reduce((sum, p) => sum + (Number(p.totalAmount) || 0), 0), [dailyPurchases]);
  const netCashFlow = salesPaidTotal - purchasesTotal;

  const handlePrint = async () => {
    try {
      const appSettings = JSON.parse(localStorage.getItem('dubsar_app_settings') || '{}');
      await PrintEngine.printDailyReport({
        date: selectedDate,
        salesTotal,
        salesPaidTotal,
        purchasesTotal,
        netCashFlow,
        dailySales,
        dailyPurchases,
        businessSettings: appSettings
      });
    } catch (e) {
      console.error('Failed to print daily report', e);
    }
  };

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-300 pb-16" dir="rtl">
      {/* Header */}
      <div className="chrome-tabs-bar flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <span>تقرير الحركة اليومية الشاملة</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            ملخص كامل لكافة مبيعات، مشتريات، وصندوق اليوم المحدد
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border rounded-xl px-3 py-1">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Input 
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="h-8 border-none bg-transparent text-xs font-bold w-36"
            />
          </div>

          <Button onClick={handlePrint} className="font-bold gap-2 bg-primary text-white">
            <Printer className="h-4 w-4" />
            <span>طباعة التقرير</span>
          </Button>
        </div>
      </div>

      {/* Printable Report Header */}
      <div className="hidden print:block text-center border-b pb-4 mb-4">
        <h2 className="text-2xl font-black">نظام دوبسAR 2.0 - تقرير الحركة اليومية</h2>
        <p className="text-sm font-bold">التاريخ: {selectedDate}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-xl border shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-muted-foreground">إجمالي مبيعات اليوم</span>
              <p className="text-xl font-black text-emerald-600 font-mono mt-1">{salesTotal.toLocaleString()} د.ع</p>
              <p className="text-[11px] text-muted-foreground">{dailySales.length} فواتير صادر</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <BadgeDollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-muted-foreground">النقد المحصل من المبيعات</span>
              <p className="text-xl font-black text-blue-600 font-mono mt-1">{salesPaidTotal.toLocaleString()} د.ع</p>
              <p className="text-[11px] text-muted-foreground">نقداً في الصندوق</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ArrowDownLeft className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-muted-foreground">مشتريات اليوم</span>
              <p className="text-xl font-black text-rose-600 font-mono mt-1">{purchasesTotal.toLocaleString()} د.ع</p>
              <p className="text-[11px] text-muted-foreground">{dailyPurchases.length} فواتير توريد</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-muted-foreground">صافي التدفق النقدي</span>
              <p className={`text-xl font-black font-mono mt-1 ${netCashFlow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {netCashFlow.toLocaleString()} د.ع
              </p>
              <p className="text-[11px] text-muted-foreground">رصيد الصندوق لليوم</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Wallet className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Table */}
      <Card className="rounded-xl border shadow-sm">
        <CardHeader className="p-4 pb-2 border-b">
          <CardTitle className="text-base font-black">فواتير مبيعات اليوم ({dailySales.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800 font-black border-b">
              <tr>
                <th className="p-3">رقم الفاتورة</th>
                <th className="p-3">العميل</th>
                <th className="p-3 text-center">طريقة الدفع</th>
                <th className="p-3 text-left">المبلغ الإجمالي</th>
                <th className="p-3 text-left">المدفوع</th>
              </tr>
            </thead>
            <tbody className="divide-y font-bold">
              {dailySales.length > 0 ? (
                dailySales.map(s => (
                  <tr 
                    key={s.id} 
                    onClick={() => { setSelectedInvoice(s); setIsDetailOpen(true); }}
                    className="hover:bg-primary/5 cursor-pointer transition-colors"
                  >
                    <td className="p-3 font-mono text-primary font-black flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5 opacity-60" />
                      <span>{s.invoiceNo}</span>
                    </td>
                    <td className="p-3">{s.customerName || 'زبون نقدي'}</td>
                    <td className="p-3 text-center">
                      <Badge variant={s.paymentMethod === 'credit' ? 'outline' : 'secondary'} className="text-[10px]">
                        {s.paymentMethod === 'credit' ? 'آجل' : 'نقدي'}
                      </Badge>
                    </td>
                    <td className="p-3 text-left font-mono">{Number(s.totalAmount || 0).toLocaleString()} د.ع</td>
                    <td className="p-3 text-left font-mono text-emerald-600">{Number(s.paidAmount || 0).toLocaleString()} د.ع</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted-foreground text-xs font-bold">
                    لا توجد فواتير مبيعات لهذا اليوم
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Purchases Table */}
      <Card className="rounded-xl border shadow-sm">
        <CardHeader className="p-4 pb-2 border-b">
          <CardTitle className="text-base font-black">فواتير مشتريات وتوريدات اليوم ({dailyPurchases.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800 font-black border-b">
              <tr>
                <th className="p-3">رقم فاتورة الشراء</th>
                <th className="p-3">المورد</th>
                <th className="p-3 text-center">طريقة الدفع</th>
                <th className="p-3 text-left">المبلغ الإجمالي</th>
                <th className="p-3 text-left">المدفوع</th>
              </tr>
            </thead>
            <tbody className="divide-y font-bold">
              {dailyPurchases.length > 0 ? (
                dailyPurchases.map(p => (
                  <tr 
                    key={p.id} 
                    onClick={() => { setSelectedInvoice({ ...p, invoiceNo: p.purchaseNo || p.id, customerName: p.supplierName || 'مورد' }); setIsDetailOpen(true); }}
                    className="hover:bg-primary/5 cursor-pointer transition-colors"
                  >
                    <td className="p-3 font-mono text-primary font-black flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5 opacity-60" />
                      <span>{p.purchaseNo || p.id}</span>
                    </td>
                    <td className="p-3">{p.supplierName || 'مورد عام'}</td>
                    <td className="p-3 text-center">
                      <Badge variant={p.paymentMethod === 'credit' ? 'outline' : 'secondary'} className="text-[10px]">
                        {p.paymentMethod === 'credit' ? 'آجل' : 'نقدي'}
                      </Badge>
                    </td>
                    <td className="p-3 text-left font-mono">{Number(p.totalAmount || 0).toLocaleString()} د.ع</td>
                    <td className="p-3 text-left font-mono text-emerald-600">{Number(p.paidAmount || 0).toLocaleString()} د.ع</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted-foreground text-xs font-bold">
                    لا توجد فواتير مشتريات لهذا اليوم
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Invoice Detail Modal */}
      <InvoiceDetailDialog
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        invoice={selectedInvoice}
      />

      {/* Mandatory DUBSAR Print Footer */}
      <div className="hidden print:block fixed bottom-4 right-0 left-0 text-center border-t pt-2 text-xs font-bold text-slate-600">
        <p>نظام DUBSAR لإدارة المبيعات | هاتف الدعم الفني: 07858833838</p>
      </div>
    </div>
  );
}
