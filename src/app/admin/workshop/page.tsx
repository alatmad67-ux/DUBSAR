
'use client';

import { 
  Wrench, 
  Clock, 
  Settings2, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  ChevronRight,
  ClipboardList,
  BadgeDollarSign,
  TrendingUp,
  MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/admin/stats-card";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const statusConfig = {
  received: { label: "تم الاستلام", color: "bg-blue-100 text-blue-700", icon: ClipboardList },
  inspection: { label: "قيد الفحص", color: "bg-yellow-100 text-yellow-700", icon: AlertCircle },
  waiting_parts: { label: "انتظار قطع", color: "bg-orange-100 text-orange-700", icon: Clock },
  in_progress: { label: "قيد التصليح", color: "bg-purple-100 text-purple-700", icon: Wrench },
  quality_check: { label: "فحص الجودة", color: "bg-indigo-100 text-indigo-700", icon: Settings2 },
  ready: { label: "جاهز للاستلام", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  delivered: { label: "تم التسليم", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  cancelled: { label: "ملغي", color: "bg-red-100 text-red-700", icon: AlertCircle },
};

export default function WorkshopDashboardPage() {
  const db = useFirestore();
  const repairOrdersQuery = useMemo(() => query(collection(db, 'repairOrders'), orderBy('createdAt', 'desc'), limit(5)), [db]);
  const { data: recentRepairs, loading } = useCollection(repairOrdersQuery);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight">إدارة الورشة</h1>
          <p className="text-muted-foreground font-medium text-sm">متابعة عمليات الصيانة وتكليف الفنيين بالمهام.</p>
        </div>
        <div className="flex items-center gap-3">
           <Link href="/admin/workshop/orders">
              <Button variant="outline" className="rounded-xl border-2 font-bold h-11">عرض كل المهام</Button>
           </Link>
           <Link href="/admin/workshop/new">
              <Button className="rounded-xl font-bold h-11 shadow-lg shadow-primary/20 gap-2">
                <Plus className="h-5 w-5" /> أمر تصليح جديد
              </Button>
           </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard 
          title="مهام اليوم" 
          value="12" 
          icon={Wrench} 
          color="blue"
        />
        <StatsCard 
          title="قيد العمل" 
          value="5" 
          icon={TrendingUp} 
          color="purple"
        />
        <StatsCard 
          title="بانتظار قطع" 
          value="3" 
          icon={Clock} 
          color="orange"
        />
        <StatsCard 
          title="إيرادات الورشة" 
          value="450,000 د.ع" 
          icon={BadgeDollarSign} 
          trend={{ value: "8%+", isUp: true }}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4 rounded-[32px] border-none shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
             <div className="space-y-1">
               <CardTitle className="text-xl font-black">أحدث أوامر التصليح</CardTitle>
               <CardDescription className="font-medium">آخر الدراجات التي دخلت الورشة</CardDescription>
             </div>
             <Button variant="ghost" size="icon" className="rounded-xl"><MoreVertical className="h-5 w-5" /></Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)
            ) : recentRepairs.length > 0 ? (
              recentRepairs.map((order: any) => {
                const config = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.received;
                const Icon = config.icon;
                return (
                  <Link key={order.id} href={`/admin/workshop/${order.id}`}>
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-all group">
                       <div className="flex items-center gap-4">
                          <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", config.color)}>
                             <Icon className="h-6 w-6" />
                          </div>
                          <div>
                             <p className="text-sm font-black">{order.bikeBrand} {order.bikeModel}</p>
                             <p className="text-[10px] text-muted-foreground font-bold uppercase">{order.orderNumber}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-4">
                          <div className="text-left hidden md:block">
                             <p className="text-xs font-bold">{order.customerName}</p>
                             <p className="text-[10px] text-muted-foreground">07/10/2023</p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                       </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="h-40 flex flex-col items-center justify-center text-muted-foreground gap-2">
                 <Wrench className="h-10 w-10 opacity-20" />
                 <p className="font-bold">لا توجد مهام حالياً</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 rounded-[32px] border-none shadow-sm overflow-hidden">
           <CardHeader>
              <CardTitle className="text-xl font-black">حالة الورشة</CardTitle>
              <CardDescription className="font-medium">توزيع المهام حسب الحالة</CardDescription>
           </CardHeader>
           <CardContent className="space-y-6">
              {Object.entries(statusConfig).slice(0, 6).map(([key, config]) => (
                <div key={key} className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <div className={cn("h-2 w-2 rounded-full", config.color.split(' ')[0])} />
                      <span className="text-sm font-bold">{config.label}</span>
                   </div>
                   <Badge variant="outline" className="rounded-full font-black border-none bg-muted/50 px-3">
                      {Math.floor(Math.random() * 5)}
                   </Badge>
                </div>
              ))}
           </CardContent>
        </Card>
      </div>
    </div>
  );
}
