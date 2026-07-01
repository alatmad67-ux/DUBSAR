
'use client';

import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Wrench, 
  ArrowUpRight,
  Download,
  Calendar,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  Line,
  LineChart,
  Area,
  AreaChart
} from "recharts";
import { StatsCard } from "@/components/admin/stats-card";

const SALES_DATA = [
  { name: "سبت", sales: 4000, profit: 2400 },
  { name: "أحد", sales: 3000, profit: 1398 },
  { name: "اثنين", sales: 2000, profit: 9800 },
  { name: "ثلاثاء", sales: 2780, profit: 3908 },
  { name: "أربعاء", sales: 1890, profit: 4800 },
  { name: "خميس", sales: 2390, profit: 3800 },
  { name: "جمعة", sales: 3490, profit: 4300 },
];

export default function ReportsPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight">التقارير والتحليلات</h1>
          <p className="text-muted-foreground font-medium text-sm">تحليل دقيق لأداء المبيعات، الأرباح، ونشاط الورشة.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" className="rounded-xl border-2 font-bold h-11 gap-2">
              <Calendar className="h-4 w-4" /> تصفية التاريخ
           </Button>
           <Button className="rounded-xl font-bold h-11 shadow-lg shadow-primary/20 gap-2 px-8">
             <Download className="h-5 w-5" /> تصدير PDF
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard 
          title="إجمالي المبيعات" 
          value="45,250,000 د.ع" 
          icon={DollarSign} 
          trend={{ value: "15%+", isUp: true }}
          color="green"
        />
        <StatsCard 
          title="صافي الأرباح" 
          value="12,400,000 د.ع" 
          icon={TrendingUp} 
          trend={{ value: "8%+", isUp: true }}
          color="blue"
        />
        <StatsCard 
          title="عدد الطلبات" 
          value="854" 
          icon={ShoppingCart} 
          trend={{ value: "4%-", isUp: false }}
          color="orange"
        />
        <StatsCard 
          title="إنتاجية الورشة" 
          value="240 مهمة" 
          icon={Wrench} 
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="rounded-[32px] border-none shadow-sm overflow-hidden bg-white dark:bg-card">
          <CardHeader className="p-8 pb-0">
             <CardTitle className="text-xl font-black">أداء المبيعات الأسبوعي</CardTitle>
             <CardDescription className="font-medium">مقارنة بين إجمالي المبيعات وصافي الأرباح باليوم.</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px] p-8">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={SALES_DATA}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700 }} dy={10} />
                <YAxis hide />
                <Tooltip 
                  cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 2, strokeDasharray: '5 5' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-2xl bg-white dark:bg-card p-4 shadow-2xl border border-border">
                          <p className="text-xs font-black text-muted-foreground uppercase mb-2">{payload[0].payload.name}</p>
                          <div className="space-y-1">
                             <p className="text-sm font-bold flex items-center justify-between gap-4">المبيعات: <span className="text-primary font-black">{payload[0].value?.toLocaleString()} د.ع</span></p>
                             <p className="text-sm font-bold flex items-center justify-between gap-4">الأرباح: <span className="text-green-600 font-black">{payload[1].value?.toLocaleString()} د.ع</span></p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="sales" stroke="hsl(var(--primary))" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
                <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={4} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border-none shadow-sm overflow-hidden bg-white dark:bg-card">
          <CardHeader className="p-8 pb-0">
             <CardTitle className="text-xl font-black">أكثر التصنيفات طلباً</CardTitle>
             <CardDescription className="font-medium">توزيع المبيعات بناءً على فئة المنتج.</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px] p-8">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={SALES_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700 }} dy={10} />
                <YAxis hide />
                <Tooltip cursor={{ fill: 'hsl(var(--primary) / 0.05)' }} />
                <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[12, 12, 12, 12]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="rounded-[32px] p-8 bg-primary text-white border-none shadow-xl shadow-primary/20 relative overflow-hidden group">
            <div className="relative z-10 space-y-2">
               <p className="text-xs font-black uppercase tracking-widest opacity-80">تقرير الجرد</p>
               <h3 className="text-2xl font-black leading-tight">حالة المخزون الحالي</h3>
               <p className="text-sm opacity-90 font-medium">85% من المنتجات متوفرة بكثرة.</p>
               <Button className="mt-4 rounded-full bg-white text-primary font-black hover:bg-white/90">عرض تفاصيل الجرد</Button>
            </div>
            <BarChart3 className="absolute -right-6 -bottom-6 h-32 w-32 opacity-10 group-hover:scale-110 transition-transform" />
         </Card>
         <Card className="rounded-[32px] p-8 bg-slate-900 text-white border-none shadow-xl relative overflow-hidden group">
            <div className="relative z-10 space-y-2">
               <p className="text-xs font-black uppercase tracking-widest opacity-80">أداء الفنيين</p>
               <h3 className="text-2xl font-black leading-tight">كفاءة عمل الورشة</h3>
               <p className="text-sm opacity-90 font-medium">تم إنجاز 98% من المهام في الوقت المحدد.</p>
               <Button className="mt-4 rounded-full bg-white text-slate-900 font-black hover:bg-white/90">تقرير الفنيين</Button>
            </div>
            <Wrench className="absolute -right-6 -bottom-6 h-32 w-32 opacity-10 group-hover:scale-110 transition-transform" />
         </Card>
         <Card className="rounded-[32px] p-8 bg-emerald-600 text-white border-none shadow-xl relative overflow-hidden group">
            <div className="relative z-10 space-y-2">
               <p className="text-xs font-black uppercase tracking-widest opacity-80">الإيرادات</p>
               <h3 className="text-2xl font-black leading-tight">نمو الدخل الشهري</h3>
               <p className="text-sm opacity-90 font-medium">زيادة قدرها 12% عن الشهر السابق.</p>
               <Button className="mt-4 rounded-full bg-white text-emerald-600 font-black hover:bg-white/90">تصدير التقرير المالي</Button>
            </div>
            <TrendingUp className="absolute -right-6 -bottom-6 h-32 w-32 opacity-10 group-hover:scale-110 transition-transform" />
         </Card>
      </div>
    </div>
  );
}

