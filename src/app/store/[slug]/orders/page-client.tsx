
'use client';

import { use, useMemo, useState } from "react";
import { useFirestore, useCollection, useUser } from "@/firebase";
import { collection, query, where, orderBy } from "firebase/firestore";
import { useTenantData } from "@/hooks/use-tenant-data";
import { StoreHeader } from "@/components/store/store-header";
import { StoreBottomNav } from "@/components/store/store-bottom-nav";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  Clock, 
  CheckCircle2, 
  ChevronLeft, 
  Calendar, 
  ShoppingBag,
  MapPin,
  Phone,
  ArrowRight,
  XCircle,
  Truck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const statusMap: any = {
  pending: { label: "جديد", color: "bg-orange-100 text-orange-700", icon: Clock },
  processing: { label: "قيد المعالجة", color: "bg-blue-100 text-blue-700", icon: Package },
  preparing: { label: "جاري التجهيز", color: "bg-purple-100 text-purple-700", icon: Package },
  ready: { label: "جاهز للاستلام", color: "bg-indigo-100 text-indigo-700", icon: CheckCircle2 },
  shipped: { label: "تم الشحن", color: "bg-blue-100 text-blue-700", icon: Truck },
  delivered: { label: "تم التسليم", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  completed: { label: "مكتمل", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  cancelled: { label: "ملغي", color: "bg-red-100 text-red-700", icon: XCircle },
};

export default function StoreOrdersPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { tenant, loading: tenantLoading } = useTenantData(slug);
  const { user } = useUser();
  const db = useFirestore();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const ordersQuery = useMemo(() => {
    if (!tenant?.tenantId || !user) return null;
    return query(
      collection(db, 'orders'),
      where('tenantId', '==', tenant.tenantId),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
  }, [db, tenant, user]);

  const { data: orders, loading } = useCollection(ordersQuery);

  if (tenantLoading) return null;

  return (
    <div className="pb-40 min-h-screen bg-[#F8F9FA]" dir="rtl">
      <StoreHeader tenant={tenant} />
      
      <main className="container mx-auto px-4 py-8 max-w-2xl space-y-8">
        <div className="space-y-1">
           <h1 className="text-3xl font-black tracking-tight">طلباتي</h1>
           <p className="text-xs font-bold text-muted-foreground">تابع حالة مشترياتك في {tenant?.businessName}</p>
        </div>

        {loading ? (
          Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-44 w-full rounded-[32px]" />)
        ) : orders.length > 0 ? (
          <div className="space-y-6">
            {orders.map((order: any) => {
              const status = statusMap[order.status] || statusMap.pending;
              const Icon = status.icon;
              return (
                <div 
                  key={order.id} 
                  onClick={() => setSelectedOrder(order)}
                  className="bg-white rounded-[32px] p-6 shadow-sm border border-black/5 space-y-4 hover:shadow-md transition-all cursor-pointer group active:scale-[0.98]"
                >
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary"><Package className="h-5 w-5" /></div>
                         <div>
                            <p className="font-black text-sm">{order.orderNumber}</p>
                            <p className="text-[9px] font-bold opacity-40 uppercase">{new Date(order.createdAt).toLocaleString("ar-EG")}</p>
                         </div>
                      </div>
                      <Badge className={cn("rounded-full border-none font-black text-[9px] gap-1.5 px-3 py-1 shadow-none", status.color)}>
                         <Icon className="h-3 w-3" /> {status.label}
                      </Badge>
                   </div>

                   <div className="flex flex-wrap gap-2 pt-2">
                      {order.items?.slice(0, 2).map((item: any, idx: number) => (
                        <div key={idx} className="bg-muted/30 px-3 py-1.5 rounded-full text-[10px] font-bold text-slate-600">
                           {item.name} × {item.quantity}
                        </div>
                      ))}
                      {order.items?.length > 2 && <div className="px-3 py-1.5 rounded-full text-[10px] font-bold opacity-40">+{order.items.length - 2} أخرى</div>}
                   </div>

                   <div className="h-px bg-black/5" />

                   <div className="flex items-center justify-between pt-2">
                      <div>
                         <p className="text-[9px] font-black text-slate-400 uppercase">إجمالي القائمة</p>
                         <p className="text-xl font-black text-primary">{order.total?.toLocaleString()} <span className="text-xs">د.ع</span></p>
                      </div>
                      <div className="h-10 w-10 rounded-full border-2 flex items-center justify-center group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all">
                        <ChevronLeft className="h-5 w-5" />
                      </div>
                   </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-24 text-center space-y-6 animate-in fade-in">
             <div className="h-40 w-40 bg-muted/20 rounded-full flex items-center justify-center mx-auto">
                <ShoppingBag className="h-16 w-16 opacity-10" />
             </div>
             <div className="space-y-2">
                <h2 className="text-2xl font-black">لا توجد طلبات سابقة</h2>
                <p className="text-sm font-medium opacity-50">طلباتك التي تجريها في هذا المتجر ستظهر هنا.</p>
             </div>
             <Link href={`${baseUrl}`}>
                <Button className="rounded-full h-14 px-10 font-black">تسوق الآن</Button>
             </Link>
          </div>
        )}
      </main>

      {/* Order Details Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
         <DialogContent className="rounded-[40px] max-w-lg p-0 overflow-hidden border-none shadow-2xl">
            <DialogHeader className="p-8 bg-slate-900 text-white text-right space-y-4">
               <div className="flex items-center justify-between">
                  <Badge className={cn("rounded-full border-none px-4 py-1 font-black", statusMap[selectedOrder?.status]?.color)}>
                     {statusMap[selectedOrder?.status]?.label}
                  </Badge>
                  <DialogTitle className="text-2xl font-black">تفاصيل الطلب</DialogTitle>
               </div>
               <div className="flex justify-between items-center opacity-60 font-bold text-xs">
                  <span>{new Date(selectedOrder?.createdAt).toLocaleString("ar-EG")}</span>
                  <span>رقم الطلب: {selectedOrder?.orderNumber}</span>
               </div>
            </DialogHeader>
            <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar text-right space-y-8">
               <div className="space-y-4">
                  <h4 className="font-black text-sm uppercase tracking-widest opacity-40">المنتجات</h4>
                  <div className="space-y-3">
                     {selectedOrder?.items?.map((item: any, i: number) => (
                       <div key={i} className="flex justify-between items-center p-4 rounded-2xl bg-muted/20 border">
                          <div className="flex items-center gap-3">
                             <div className="h-10 w-10 rounded-lg bg-white shadow-sm flex items-center justify-center font-black text-xs">{item.quantity}x</div>
                             <span className="font-bold text-sm truncate max-w-[150px]">{item.name}</span>
                          </div>
                          <span className="font-black text-primary">{(item.price * item.quantity).toLocaleString()} د.ع</span>
                       </div>
                     ))}
                  </div>
               </div>

               <div className="space-y-4 border-t pt-6">
                  <h4 className="font-black text-sm uppercase tracking-widest opacity-40">معلومات التوصيل</h4>
                  <div className="grid gap-3">
                     <div className="flex items-center gap-3 text-sm font-bold"><MapPin className="h-4 w-4 opacity-30" /> {selectedOrder?.address}</div>
                     <div className="flex items-center gap-3 text-sm font-bold" dir="ltr"><Phone className="h-4 w-4 opacity-30" /> {selectedOrder?.phoneNumber}</div>
                  </div>
               </div>

               <div className="bg-slate-50 p-6 rounded-3xl space-y-3">
                  <div className="flex justify-between text-xs font-bold opacity-60"><span>المجموع الفرعي:</span><span>{selectedOrder?.subtotal?.toLocaleString()} د.ع</span></div>
                  <div className="flex justify-between text-xs font-bold opacity-60"><span>رسوم التوصيل:</span><span>{selectedOrder?.deliveryFee?.toLocaleString()} د.ع</span></div>
                  <div className="h-px bg-slate-200 my-1" />
                  <div className="flex justify-between items-baseline"><span className="text-lg font-black">الإجمالي الكلي:</span><span className="text-2xl font-black text-primary">{selectedOrder?.total?.toLocaleString()} د.ع</span></div>
               </div>
            </div>
            <div className="p-8 pt-0">
               <Button className="w-full h-14 rounded-2xl font-black gap-2" onClick={() => setSelectedOrder(null)}>إغلاق النافذة</Button>
            </div>
         </DialogContent>
      </Dialog>

      <StoreBottomNav slug={slug} />
    </div>
  );
}
