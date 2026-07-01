
'use client';

import { StatsCard } from "@/components/admin/stats-card";
import { 
  BadgeDollarSign, 
  ShoppingCart, 
  Users, 
  Wrench, 
  ArrowUpRight, 
  Package, 
  MoreVertical 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const DATA = [
  { name: "سبت", sales: 4000 },
  { name: "أحد", sales: 3000 },
  { name: "اثنين", sales: 2000 },
  { name: "ثلاثاء", sales: 2780 },
  { name: "أربعاء", sales: 1890 },
  { name: "خميس", sales: 2390 },
  { name: "جمعة", sales: 3490 },
];

export default function AdminDashboard() {
  const db = useFirestore();
  
  const recentOrdersQuery = useMemo(() => 
    query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(5)), 
  [db]);
  const { data: recentOrders, loading: ordersLoading } = useCollection(recentOrdersQuery);

  const lowStockQuery = useMemo(() => 
    query(collection(db, 'products'), orderBy('stock', 'asc'), limit(4)), 
  [db]);
  const { data: lowStockProducts, loading: stockLoading } = useCollection(lowStockQuery);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-foreground">لوحة التحكم</h1>
          <p className="text-muted-foreground font-medium text-sm">مرحباً بك مجدداً، إليك ملخص أداء المجمع اليوم.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" className="rounded-xl border-2 font-bold h-11 px-6">تصدير التقارير</Button>
           <Button className="rounded-xl font-bold h-11 px-8 shadow-lg shadow-primary/20">إضافة طلب POS</Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard 
          title="مبيعات اليوم" 
          value="1,245,000 د.ع" 
          icon={BadgeDollarSign} 
          trend={{ value: "12%+", isUp: true }}
          color="green"
        />
        <StatsCard 
          title="الطلبات المعلقة" 
          value="14" 
          icon={ShoppingCart} 
          trend={{ value: "5%-", isUp: false }}
          color="orange"
        />
        <StatsCard 
          title="مهام الورشة" 
          value="8" 
          icon={Wrench} 
          color="blue"
        />
        <StatsCard 
          title="إجمالي العملاء" 
          value="1,120" 
          icon={Users} 
          trend={{ value: "24+", isUp: true }}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
        {/* Sales Chart */}
        <Card className="lg:col-span-4 rounded-[32px] border-none shadow-sm overflow-hidden bg-white dark:bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
             <div className="space-y-1">
               <CardTitle className="text-xl font-black">نظرة عامة على المبيعات</CardTitle>
               <CardDescription className="font-medium">تحليل المبيعات الأسبوعي للمجمع</CardDescription>
             </div>
             <Button variant="ghost" size="icon" className="rounded-xl"><MoreVertical className="h-5 w-5" /></Button>
          </CardHeader>
          <CardContent className="h-[350px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--primary) / 0.05)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-2xl bg-white dark:bg-card p-4 shadow-xl border border-border">
                          <p className="text-xs font-black text-muted-foreground uppercase mb-1">{payload[0].payload.name}</p>
                          <p className="text-lg font-black text-primary">{payload[0].value?.toLocaleString()} د.ع</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="sales" 
                  fill="hsl(var(--primary))" 
                  radius={[8, 8, 8, 8]} 
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Inventory Warning */}
        <Card className="lg:col-span-3 rounded-[32px] border-none shadow-sm overflow-hidden bg-white dark:bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
             <div className="space-y-1">
               <CardTitle className="text-xl font-black">تنبيهات المخزون</CardTitle>
               <CardDescription className="font-medium">منتجات أوشكت على النفاد</CardDescription>
             </div>
             <Button variant="link" className="text-primary font-bold">مشاهدة الكل</Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {stockLoading ? (
               Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)
            ) : lowStockProducts.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors">
                 <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white dark:bg-card border flex items-center justify-center">
                       <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                       <p className="text-sm font-bold truncate max-w-[120px]">{p.name}</p>
                       <p className="text-[10px] text-muted-foreground font-bold">{p.storageLocation || 'مخزن رئيسي'}</p>
                    </div>
                 </div>
                 <div className="text-left">
                    <p className={cn("text-xs font-black", p.stock === 0 ? "text-destructive" : "text-orange-600")}>
                      {p.stock === 0 ? "نفذت" : `تبقي ${p.stock} قطعة`}
                    </p>
                    <Badge variant="outline" className={cn("text-[8px] h-4 rounded-full border-none px-2", p.stock === 0 ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700")}>
                      {p.stock === 0 ? "خارج المخزون" : "منخفض"}
                    </Badge>
                 </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Latest Orders Table */}
      <Card className="rounded-[32px] border-none shadow-sm overflow-hidden bg-white dark:bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
           <div className="space-y-1">
             <CardTitle className="text-xl font-black">أحدث الطلبات</CardTitle>
             <CardDescription className="font-medium">آخر الطلبات التي تم استلامها عبر المنصة</CardDescription>
           </div>
           <Button variant="outline" className="rounded-xl font-bold h-10 border-2 px-6">عرض كل الطلبات</Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b bg-muted/30 hover:bg-muted/30">
                  <TableHead className="text-right font-black text-xs uppercase tracking-widest">رقم الطلب</TableHead>
                  <TableHead className="text-right font-black text-xs uppercase tracking-widest">العميل</TableHead>
                  <TableHead className="text-right font-black text-xs uppercase tracking-widest">المبلغ</TableHead>
                  <TableHead className="text-right font-black text-xs uppercase tracking-widest">الحالة</TableHead>
                  <TableHead className="text-right font-black text-xs uppercase tracking-widest">التاريخ</TableHead>
                  <TableHead className="text-left font-black text-xs uppercase tracking-widest">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordersLoading ? (
                   Array(5).fill(0).map((_, i) => (
                     <TableRow key={i}>
                       <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                       <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                       <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                       <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                       <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                       <TableCell><Skeleton className="h-8 w-8 rounded-lg" /></TableCell>
                     </TableRow>
                   ))
                ) : recentOrders.map((order: any) => (
                  <TableRow key={order.id} className="hover:bg-muted/10 transition-colors">
                    <TableCell className="font-bold text-sm">{order.orderNumber}</TableCell>
                    <TableCell className="font-medium">{order.customerName}</TableCell>
                    <TableCell className="font-black text-primary">{order.total?.toLocaleString()} د.ع</TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "rounded-full px-3 py-1 border-none font-bold text-[10px]",
                        order.status === 'pending' ? "bg-orange-100 text-orange-700" :
                        order.status === 'confirmed' ? "bg-blue-100 text-blue-700" :
                        order.status === 'preparing' ? "bg-purple-100 text-purple-700" :
                        "bg-green-100 text-green-700"
                      )}>
                         {order.status === 'pending' && "قيد الانتظار"}
                         {order.status === 'confirmed' && "مؤكد"}
                         {order.status === 'preparing' && "جاري التجهيز"}
                         {order.status === 'delivered' && "تم التسليم"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs font-bold">
                       {new Date(order.createdAt).toLocaleDateString("ar-EG")}
                    </TableCell>
                    <TableCell className="text-left">
                       <Button variant="ghost" size="icon" className="rounded-xl"><ArrowUpRight className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
