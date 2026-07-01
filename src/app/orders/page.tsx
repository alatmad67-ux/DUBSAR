
"use client";

import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, ChevronLeft, Package, Clock, CheckCircle2, Truck, XCircle } from "lucide-react";
import Link from "next/link";
import { useFirestore, useCollection, useUser } from "@/firebase";
import { collection, query, where, orderBy } from "firebase/firestore";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const statusConfig = {
  pending: { label: "قيد الانتظار", color: "bg-orange-100 text-orange-700", icon: Clock },
  confirmed: { label: "مؤكد", color: "bg-blue-100 text-blue-700", icon: CheckCircle2 },
  preparing: { label: "جاري التجهيز", color: "bg-purple-100 text-purple-700", icon: Package },
  ready: { label: "جاهز للاستلام", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  shipped: { label: "تم الشحن", color: "bg-indigo-100 text-indigo-700", icon: Truck },
  delivered: { label: "تم التسليم", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  cancelled: { label: "ملغي", color: "bg-red-100 text-red-700", icon: XCircle },
};

export default function OrdersPage() {
  const db = useFirestore();
  const { user, loading: userLoading } = useUser();

  const ordersQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "orders"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
  }, [db, user]);

  const { data: orders, loading: ordersLoading } = useCollection(ordersQuery);

  return (
    <div className="flex min-h-screen bg-[#FDF8F5]">
      <main className="flex-1 pb-24">
        <Header />
        
        <div className="container p-6 space-y-6">
          <h1 className="text-3xl font-black tracking-tight">طلباتي</h1>

          {userLoading || ordersLoading ? (
            <div className="space-y-4">
               {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-40 rounded-[28px]" />)}
            </div>
          ) : !user ? (
            <div className="flex flex-col items-center justify-center pt-20 text-center gap-4">
               <Package className="h-16 w-16 opacity-20" />
               <p className="font-bold">يرجى تسجيل الدخول لعرض طلباتك</p>
               <Link href="/login"><Button className="rounded-full">تسجيل الدخول</Button></Link>
            </div>
          ) : orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order: any) => {
                const config = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
                const Icon = config.icon;
                return (
                  <div key={order.id} className="bg-white p-5 rounded-[28px] shadow-sm border border-transparent hover:border-primary/20 transition-all flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Package className="h-5 w-5 text-primary" />
                          <span className="font-black text-sm">{order.orderNumber}</span>
                        </div>
                        <Badge className={cn("border-none gap-1 py-1", config.color)}>
                          <Icon className="h-3 w-3" />
                          {config.label}
                        </Badge>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                        <span>التاريخ: {new Date(order.createdAt).toLocaleDateString("ar-EG")}</span>
                        <span>عدد المنتجات: {order.items?.length || 0}</span>
                    </div>

                    <div className="h-px bg-muted" />

                    <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-muted-foreground font-bold">إجمالي المبلغ</p>
                          <p className="text-xl font-black text-primary">{order.total?.toLocaleString()} د.ع</p>
                        </div>
                        <Button variant="outline" className="rounded-full border-2 border-primary/20 text-xs font-bold px-6">
                          تفاصيل الطلب
                        </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center pt-20 text-center gap-4">
               <Package className="h-16 w-16 opacity-20" />
               <p className="font-bold">لا توجد طلبات سابقة</p>
               <Link href="/"><Button className="rounded-full">ابدأ التسوق</Button></Link>
            </div>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
