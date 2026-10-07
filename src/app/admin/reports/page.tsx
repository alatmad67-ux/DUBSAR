'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { 
  DollarSign, 
  ShoppingCart, 
  TrendingUp, 
  Download, 
  Calendar, 
  Loader2, 
  TrendingDown,
  ShoppingBag,
  Eye,
  FileText,
  Printer,
  Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Area, 
  AreaChart 
} from "recharts";
import { StatsCard } from "@/components/admin/stats-card";
import { POSService } from "@/services/pos-service";
import { InventoryService } from "@/services/inventory-service";
import { InvoiceDetailDialog } from "@/components/admin/invoice-detail-dialog";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";
import { PrintEngine } from "@/services/print-engine";

export default function ReportsPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected invoice for detail modal
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    loadReportsData();
  }, []);

  const loadReportsData = async () => {
    setLoading(true);
    try {
      const [saleRows, purchaseRows, customerRows] = await Promise.all([
        POSService.getRecentSales(),
        InventoryService.getPurchases(),
        InventoryService.getCustomers()
      ]);
      setSales(saleRows || []);
      setPurchases(purchaseRows || []);
      setCustomers(customerRows || []);
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'فشل تحميل بيانات التقارير' });
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const totalSales = sales.reduce((acc, s) => acc + (Number(s.totalAmount) || 0), 0);
    const totalPurchases = purchases.reduce((acc, p) => acc + (Number(p.totalAmount) || 0), 0);
    const totalDebts = customers.reduce((acc, c) => acc + (Number(c.balance) || 0), 0);
    const estimatedProfit = Math.max(0, totalSales - totalPurchases);

    return { 
      totalSales, 
      totalPurchases, 
      totalDebts, 
      salesCount: sales.length, 
      purchasesCount: purchases.length, 
      estimatedProfit 
    };
  }, [sales, purchases, customers]);

  const chartData = useMemo(() => {
    const days = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
    const salesByDay = new Array(7).fill(0);
    const profitByDay = new Array(7).fill(0);
    const now = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 7);

    sales.forEach((s: any) => {
      const date = new Date(Number(s.createdAt) || 0);
      if (date >= oneWeekAgo) {
        const dayIndex = date.getDay();
        const total = Number(s.totalAmount) || 0;
        salesByDay[dayIndex] += total;
        profitByDay[dayIndex] += total * 0.2; // approx 20% margin
      }
    });

    return days.map((day, i) => ({ 
      name: day, 
      sales: salesByDay[i], 
      profit: profitByDay[i] 
    }));
  }, [sales]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
      </div>
    );
  }

  const handlePrint = async () => {
    try {
      const appSettings = JSON.parse(localStorage.getItem('dubsar_app_settings') || '{}');
      await PrintEngine.printGeneralReport({
        title: 'التقرير المالي والتحليلي العام',
        stats,
        recentSales: sales.slice(0, 50),
        businessSettings: appSettings
      });
    } catch (e) {
      console.error('Failed to print general report', e);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 select-none" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
            <FileText className="h-7 w-7 text-primary" />
            <span>التقارير المالية والتحليلات الشاملة</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1 font-bold">
            تحليل دقيق لأداء المبيعات والمشتريات وحركة الصندوق المحلية
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/reports/daily">
            <Button variant="outline" className="rounded-xl font-bold h-11 gap-2 border-primary/30 text-primary">
              <Calendar className="h-4 w-4" /> تقرير الحركة اليومية
            </Button>
          </Link>
          <Button onClick={handlePrint} className="rounded-xl font-black h-11 gap-2 bg-primary text-white shadow-md">
            <Printer className="h-4 w-4" /> طباعة التقرير
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard 
          title="إجمالي المبيعات" 
          value={`${stats.totalSales.toLocaleString()} د.ع`} 
          icon={DollarSign} 
          color="green" 
        />
        <StatsCard 
          title="صافي الأرباح التقديرية" 
          value={`${stats.estimatedProfit.toLocaleString()} د.ع`} 
          icon={TrendingUp} 
          color="blue" 
        />
        <StatsCard 
          title="عدد فواتير المبيعات" 
          value={stats.salesCount.toString()} 
          icon={ShoppingCart} 
          color="orange" 
        />
        <StatsCard 
          title="إجمالي فواتير التوريد" 
          value={stats.purchasesCount.toString()} 
          icon={ShoppingBag} 
          color="purple" 
        />
      </div>

      {/* Sales Chart & Highlights */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl border shadow-sm bg-card">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-base font-black">أداء المبيعات الأسبوعي</CardTitle>
            <CardDescription className="text-xs">توزيع المبيعات على أيام الأسبوع الحالية</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px] p-6 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700 }} dy={10} />
                <YAxis hide />
                <Tooltip />
                <Area type="monotone" dataKey="sales" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={0.15} fill="hsl(var(--primary))" />
                <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4">
          <Card className="rounded-2xl p-6 bg-gradient-to-br from-rose-600 to-rose-700 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10 space-y-2">
              <p className="text-xs font-black uppercase opacity-80">إجمالي ديون الزبائن والذمم</p>
              <h3 className="text-3xl font-black font-mono">{stats.totalDebts.toLocaleString()} د.ع</h3>
              <p className="text-[11px] opacity-80">مجموع الأرصدة المستحقة بذمة العملاء</p>
              <div className="pt-2">
                <Link href="/admin/finance/debts">
                  <Button size="sm" className="rounded-xl bg-white text-rose-700 hover:bg-white/90 font-black text-xs">
                    استعراض ديون الزبائن
                  </Button>
                </Link>
              </div>
            </div>
            <Wallet className="absolute -left-4 -bottom-4 h-28 w-28 opacity-10" />
          </Card>

          <Card className="rounded-2xl p-6 bg-slate-900 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10 space-y-2">
              <p className="text-xs font-black uppercase opacity-80">إجمالي فواتير الشراء والتوريد</p>
              <h3 className="text-3xl font-black font-mono">{stats.totalPurchases.toLocaleString()} د.ع</h3>
              <p className="text-[11px] opacity-80">تكلفة البضائع الموردة للمخازن</p>
              <div className="pt-2">
                <Link href="/admin/purchases">
                  <Button size="sm" className="rounded-xl bg-white text-slate-900 hover:bg-white/90 font-black text-xs">
                    سجل المشتريات
                  </Button>
                </Link>
              </div>
            </div>
            <ShoppingBag className="absolute -left-4 -bottom-4 h-28 w-28 opacity-10" />
          </Card>
        </div>
      </div>

      {/* Interactive Sales Table */}
      <Card className="rounded-2xl border shadow-sm">
        <CardHeader className="p-4 pb-2 border-b flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-black">أحدث فواتير المبيعات</CardTitle>
            <CardDescription className="text-xs">اضغط على أي فاتورة لفتح تفاصيلها أو إعادة طباعتها</CardDescription>
          </div>
          <Link href="/admin/sales">
            <Button variant="ghost" size="sm" className="text-xs font-bold gap-1 text-primary">
              <span>شاشة البيع</span>
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse">
            <thead className="bg-muted/50 font-black border-b">
              <tr>
                <th className="p-3">رقم الفاتورة</th>
                <th className="p-3">العميل</th>
                <th className="p-3">التاريخ</th>
                <th className="p-3 text-center">طريقة الدفع</th>
                <th className="p-3 text-left">المبلغ الإجمالي</th>
                <th className="p-3 text-left">المدفوع</th>
              </tr>
            </thead>
            <tbody className="divide-y font-bold">
              {sales.length > 0 ? (
                sales.slice(0, 15).map(s => (
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
                    <td className="p-3 text-muted-foreground font-mono">
                      {new Date(Number(s.createdAt)).toLocaleDateString('ar-IQ')}
                    </td>
                    <td className="p-3 text-center">
                      <Badge variant={s.paymentMethod === 'credit' ? 'outline' : 'secondary'} className="text-[10px]">
                        {s.paymentMethod === 'credit' ? 'آجل' : 'نقدي'}
                      </Badge>
                    </td>
                    <td className="p-3 text-left font-mono font-black">{Number(s.totalAmount || 0).toLocaleString()} د.ع</td>
                    <td className="p-3 text-left font-mono text-emerald-600">{Number(s.paidAmount || 0).toLocaleString()} د.ع</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground font-bold">
                    لا توجد فواتير مبيعات مسجلة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Invoice Detail Dialog */}
      <InvoiceDetailDialog
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        invoice={selectedInvoice}
      />
    </div>
  );
}
