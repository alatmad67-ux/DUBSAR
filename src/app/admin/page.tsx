'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { 
  BadgeDollarSign, 
  Receipt, 
  Users, 
  Warehouse, 
  ArrowUpRight, 
  Package, 
  Loader2, 
  PlusCircle, 
  Clock, 
  Calendar, 
  Sparkles, 
  AlertTriangle, 
  ShoppingBag, 
  ArrowDownLeft, 
  ArrowUpRight as ArrowUpRightIcon, 
  CreditCard, 
  BarChart3, 
  Monitor, 
  Eye, 
  Plus,
  ClipboardList
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { InventoryService } from '@/services/inventory-service';
import { POSService } from '@/services/pos-service';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { InvoiceDetailDialog } from '@/components/admin/invoice-detail-dialog';

export default function AdminDashboard() {
  const [currentUser, setCurrentUser] = useState<any>({});
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [greeting, setGreeting] = useState<string>('مرحباً بك');

  const [products, setProducts] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Live Updating Clock & Date & Greeting
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();

      // Greeting based on device time
      if (hours >= 4 && hours < 12) {
        setGreeting('صباح الخير');
      } else if (hours >= 12 && hours < 17) {
        setGreeting('طاب يومك');
      } else {
        setGreeting('مساء الخير');
      }

      // 12-hour time format with seconds
      setCurrentTime(
        now.toLocaleTimeString('ar-IQ', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        })
      );

      // Long Arabic date
      setCurrentDate(
        now.toLocaleDateString('ar-IQ', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      );
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load User Session & Local Data
  useEffect(() => {
    try {
      const sessionStr = localStorage.getItem('dubsar_session');
      if (sessionStr) {
        setCurrentUser(JSON.parse(sessionStr));
      }
    } catch {
      setCurrentUser({});
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const [productRows, saleRows, customerRows] = await Promise.all([
          InventoryService.getProducts(),
          POSService.getRecentSales(),
          InventoryService.getCustomers()
        ]);
        setProducts(productRows || []);
        setSales(saleRows || []);
        setCustomers(customerRows || []);
      } catch (e) {
        console.error('Failed to load dashboard data:', e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Calculations for Business Metrics
  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  const todaySales = useMemo(() => {
    return sales.filter((s) => Number(s.createdAt) >= todayStart);
  }, [sales, todayStart]);

  const todaySalesTotal = useMemo(() => {
    return todaySales.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);
  }, [todaySales]);

  const totalDebts = useMemo(() => {
    return customers.reduce((sum, c) => sum + Math.max(0, Number(c.balance) || 0), 0);
  }, [customers]);

  const totalStockQuantity = useMemo(() => {
    return products.reduce((sum, p) => sum + (Number(p.stockQuantity) || 0), 0);
  }, [products]);

  const lowStockItems = useMemo(() => {
    return products
      .filter((p) => {
        const stock = Number(p.stockQuantity) || 0;
        const minLevel = Number(p.minStockLevel) || 5;
        return stock <= minLevel;
      })
      .slice(0, 6);
  }, [products]);

  const recentSalesList = useMemo(() => {
    return todaySales.slice(0, 8);
  }, [todaySales]);

  // Dynamic Weekly Sales Chart Data
  const weeklyChartData = useMemo(() => {
    const daysArabic = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const last7Days = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const nextD = new Date(d);
      nextD.setDate(d.getDate() + 1);

      const dayName = daysArabic[d.getDay()];
      const daySales = sales.filter((s) => {
        const time = Number(s.createdAt) || 0;
        return time >= d.getTime() && time < nextD.getTime();
      });
      const dayTotal = daySales.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);

      last7Days.push({
        name: dayName,
        total: dayTotal
      });
    }

    return last7Days;
  }, [sales]);

  const displayName = currentUser?.displayName || currentUser?.userName || currentUser?.username || 'المسؤول';

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-300 pb-16" dir="rtl">
      {/* 1. TOP HEADER: Live Clock, Date & Dynamic Greeting */}
      <div className="p-6 rounded-2xl bg-gradient-to-l from-slate-900 via-slate-800 to-slate-900 text-white shadow-lg flex flex-wrap items-center justify-between gap-4 border border-slate-700">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xl md:text-2xl font-black tracking-tight">
              {greeting}، {displayName}
            </span>
            <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black px-2.5 py-0.5 rounded-full">
              النظام نشط
            </Badge>
          </div>
          <p className="text-xs text-slate-300 font-medium">
            مرحباً بك في نظام DUBSAR لإدارة الأعمال والمبيعات والمخازن.
          </p>
        </div>

        {/* Live Clock & Date Box */}
        <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700/80 shadow-inner">
          <div className="text-right">
            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-bold">
              <Calendar className="h-3.5 w-3.5 text-emerald-400" />
              <span>{currentDate || 'جاري التحميل...'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-lg font-black text-white font-mono tracking-wider">
              <Clock className="h-4 w-4 text-emerald-400" />
              <span>{currentTime || '00:00:00'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. FAST ACTION BUTTONS RIBBON */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        <Link href="/admin/sales" className="group">
          <div className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm flex flex-col items-center justify-center gap-1 text-center cursor-pointer">
            <Receipt className="h-4 w-4 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-black">فاتورة بيع</span>
          </div>
        </Link>

        <Link href="/admin/purchases/new" className="group">
          <div className="p-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white transition-all shadow-sm flex flex-col items-center justify-center gap-1 text-center cursor-pointer border border-slate-700">
            <ShoppingBag className="h-4 w-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-black">فاتورة شراء</span>
          </div>
        </Link>

        <Link href="/admin/customers" className="group">
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 transition-all shadow-sm flex flex-col items-center justify-center gap-1 text-center cursor-pointer border border-slate-200 dark:border-slate-800">
            <Users className="h-4 w-4 text-purple-600 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-black">زبون جديد</span>
          </div>
        </Link>

        <Link href="/admin/suppliers" className="group">
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 transition-all shadow-sm flex flex-col items-center justify-center gap-1 text-center cursor-pointer border border-slate-200 dark:border-slate-800">
            <Users className="h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-black">مورد جديد</span>
          </div>
        </Link>

        <Link href="/admin/finance/receipts" className="group">
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 transition-all shadow-sm flex flex-col items-center justify-center gap-1 text-center cursor-pointer border border-slate-200 dark:border-slate-800">
            <ArrowDownLeft className="h-4 w-4 text-emerald-600 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-black">سند قبض</span>
          </div>
        </Link>

        <Link href="/admin/finance/payments" className="group">
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 transition-all shadow-sm flex flex-col items-center justify-center gap-1 text-center cursor-pointer border border-slate-200 dark:border-slate-800">
            <ArrowUpRightIcon className="h-4 w-4 text-rose-600 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-black">سند صرف</span>
          </div>
        </Link>

        <Link href="/admin/inventory" className="group">
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 transition-all shadow-sm flex flex-col items-center justify-center gap-1 text-center cursor-pointer border border-slate-200 dark:border-slate-800">
            <ClipboardList className="h-4 w-4 text-amber-600 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-black">جرد مخزون</span>
          </div>
        </Link>

        <Link href="/admin/inventory/transfers" className="group">
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 transition-all shadow-sm flex flex-col items-center justify-center gap-1 text-center cursor-pointer border border-slate-200 dark:border-slate-800">
            <ArrowUpRight className="h-4 w-4 text-indigo-600 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-black">تحويل مخزني</span>
          </div>
        </Link>
      </div>

      {/* 3. BUSINESS STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today Sales */}
        <Card className="rounded-xl border shadow-sm bg-white dark:bg-slate-900">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-muted-foreground">مبيعات اليوم</span>
              <p className="text-xl font-black text-slate-900 dark:text-white font-mono">
                {todaySalesTotal.toLocaleString()} د.ع
              </p>
              <p className="text-[11px] text-emerald-600 font-bold">
                {todaySales.length} فواتير تم إصدارها اليوم
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
              <BadgeDollarSign className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Total Inventory Products */}
        <Card className="rounded-xl border shadow-sm bg-white dark:bg-slate-900">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-muted-foreground">المواد والمخزون</span>
              <p className="text-xl font-black text-slate-900 dark:text-white font-mono">
                {products.length.toLocaleString()} مادة
              </p>
              <p className="text-[11px] text-blue-600 font-bold">
                إجمالي القطع: {totalStockQuantity.toLocaleString()}
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600">
              <Warehouse className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Customers Debts */}
        <Card className="rounded-xl border shadow-sm bg-white dark:bg-slate-900">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-muted-foreground">ديون الزبائن والذمم</span>
              <p className="text-xl font-black text-slate-900 dark:text-white font-mono">
                {totalDebts.toLocaleString()} د.ع
              </p>
              <p className="text-[11px] text-purple-600 font-bold">
                عدد العملاء المسجلين: {customers.length}
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600">
              <CreditCard className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Low Stock Alert */}
        <Card className="rounded-xl border shadow-sm bg-white dark:bg-slate-900">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-muted-foreground">تنبيهات النواقص</span>
              <p className="text-xl font-black text-slate-900 dark:text-white font-mono">
                {lowStockItems.length} مواد
              </p>
              <p className="text-[11px] text-amber-600 font-bold">
                قاربت على النفاد من المخزن
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. RECENT SALES & WEEKLY CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        {/* Weekly Sales Chart (4 Cols) */}
        <Card className="lg:col-span-4 rounded-xl border shadow-sm bg-white dark:bg-slate-900">
          <CardHeader className="p-5 pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-black">حركة المبيعات خلال الأسبوع</CardTitle>
              <CardDescription className="text-xs">إجمالي المبيعات المحققة لكل يوم</CardDescription>
            </div>
            <div className="h-8 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center gap-1">
              <BarChart3 className="h-3.5 w-3.5" />
              <span>آخر 7 أيام</span>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-2 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fontWeight: 700 }}
                  dy={6}
                />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: 'rgba(16, 185, 129, 0.08)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-xl bg-white dark:bg-slate-800 p-3 shadow-xl border text-right text-xs" dir="rtl">
                          <p className="font-bold text-muted-foreground mb-0.5">{payload[0].payload.name}</p>
                          <p className="font-black text-emerald-600 text-sm">
                            {Number(payload[0].value).toLocaleString()} د.ع
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="total" fill="#059669" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Low Stock Alerts (3 Cols) */}
        <Card className="lg:col-span-3 rounded-xl border shadow-sm bg-white dark:bg-slate-900">
          <CardHeader className="p-5 pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-black">نواقص المخزون</CardTitle>
              <CardDescription className="text-xs">مواد وصلت إلى الحد الأدنى للطلب</CardDescription>
            </div>
            <Link href="/admin/inventory">
              <Button variant="ghost" size="sm" className="text-xs font-bold text-primary h-8 px-2">
                عرض المخزن
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-5 pt-1 divide-y divide-slate-100 dark:divide-slate-800">
            {lowStockItems.length > 0 ? (
              lowStockItems.map((p) => (
                <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-black block text-slate-800 dark:text-slate-200">{p.name}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      باركود: {p.barcode || '-'}
                    </span>
                  </div>
                  <div className="text-left">
                    <Badge variant="destructive" className="font-mono font-bold text-[10px] px-2">
                      متبقي: {Number(p.stockQuantity || 0)}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-44 flex flex-col items-center justify-center text-muted-foreground text-xs font-bold gap-1">
                <Sparkles className="h-6 w-6 text-emerald-500 opacity-60" />
                <span>المخزون بوضع ممتاز، لا توجد نواقص</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 5. RECENT SALES INVOICES TABLE */}
      <Card className="rounded-xl border shadow-sm bg-white dark:bg-slate-900">
        <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-black">أحدث فواتير المبيعات</CardTitle>
            <CardDescription className="text-xs">سجل العمليات الصادرة حديثاً في النظام</CardDescription>
          </div>
          <Link href="/admin/sales">
            <Button size="sm" className="h-8 px-3 text-xs font-bold gap-1 bg-primary text-white">
              <Plus className="h-3.5 w-3.5" />
              <span>قائمة بيع جديدة</span>
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-black border-y">
              <tr>
                <th className="p-3">رقم الفاتورة</th>
                <th className="p-3">العميل</th>
                <th className="p-3">التاريخ</th>
                <th className="p-3 text-center">طريقة الدفع</th>
                <th className="p-3 text-center">نوع السعر</th>
                <th className="p-3 text-left">المبلغ الإجمالي</th>
                <th className="p-3 text-left">المدفوع</th>
                <th className="p-3 text-left">المتبقي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-bold">
              {recentSalesList.length > 0 ? (
                recentSalesList.map((sale) => {
                  const remainingAmount = Math.max(0, (Number(sale.totalAmount) || 0) - (Number(sale.paidAmount) || 0));
                  return (
                    <tr 
                      key={sale.id} 
                      onClick={() => { setSelectedInvoice(sale); setIsDetailOpen(true); }}
                      className="hover:bg-primary/5 cursor-pointer transition-colors"
                    >
                      <td className="p-3 font-mono font-black text-primary flex items-center gap-1.5">
                        <Eye className="h-3.5 w-3.5 opacity-60" />
                        <span>{sale.invoiceNo}</span>
                      </td>
                      <td className="p-3 font-black text-slate-800 dark:text-slate-200">
                        {sale.customerName || (sale.customerId ? 'عميل مسجل' : 'زبون نقدي')}
                      </td>
                      <td className="p-3 text-muted-foreground font-mono text-[11px]">
                        {new Date(Number(sale.createdAt)).toLocaleDateString('ar-IQ')}
                      </td>
                      <td className="p-3 text-center">
                        <Badge
                          variant={sale.paymentMethod === 'credit' ? 'outline' : 'secondary'}
                          className="text-[10px] font-black"
                        >
                          {sale.paymentMethod === 'credit' ? 'آجل' : 'نقدي'}
                        </Badge>
                      </td>
                      <td className="p-3 text-center text-muted-foreground">
                        {sale.priceType === 'wholesale' ? 'جملة' : sale.priceType === 'agent' ? 'وكيل' : 'مفرد'}
                      </td>
                      <td className="p-3 text-left font-mono font-black text-emerald-700 dark:text-emerald-400">
                        {Number(sale.totalAmount || 0).toLocaleString()} د.ع
                      </td>
                      <td className="p-3 text-left font-mono text-slate-600 dark:text-slate-300">
                        {Number(sale.paidAmount || 0).toLocaleString()} د.ع
                      </td>
                      <td className="p-3 text-left font-mono">
                        {remainingAmount > 0 ? (
                          <span className="text-red-600 font-black">{remainingAmount.toLocaleString()} د.ع</span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground text-xs font-bold">
                    لا توجد فواتير مبيعات مسجلة حتى الآن.
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
