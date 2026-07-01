
'use client';

import { 
  ChevronRight, 
  Wrench, 
  Clock, 
  User, 
  Bike, 
  ClipboardList, 
  Package, 
  BadgeDollarSign, 
  Printer, 
  MessageCircle,
  Save,
  Search,
  Trash2,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFirestore, useDoc, useCollection } from "@/firebase";
import { doc, updateDoc, collection, query, where, serverTimestamp } from "firebase/firestore";
import { useMemo, useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const statusConfig = {
  received: { label: "تم الاستلام", color: "bg-blue-100 text-blue-700 border-blue-200" },
  inspection: { label: "قيد الفحص", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  waiting_parts: { label: "انتظار قطع", color: "bg-orange-100 text-orange-700 border-orange-200" },
  in_progress: { label: "قيد التصليح", color: "bg-purple-100 text-purple-700 border-purple-200" },
  quality_check: { label: "فحص الجودة", color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  ready: { label: "جاهز للاستلام", color: "bg-green-100 text-green-700 border-green-200" },
  delivered: { label: "تم التسليم", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  cancelled: { label: "ملغي", color: "bg-red-100 text-red-700 border-red-200" },
};

export default function RepairOrderDetailsPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const db = useFirestore();
  const orderRef = useMemo(() => doc(db, 'repairOrders', id), [db, id]);
  const { data: order, loading } = useDoc<any>(orderRef);
  
  const [laborCost, setLaborCost] = useState(0);
  const [usedParts, setUsedParts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Load Inventory for spare parts
  const inventoryQuery = useMemo(() => query(collection(db, 'products')), [db]);
  const { data: products } = useCollection(inventoryQuery);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.barcode?.includes(searchTerm)
  ).slice(0, 5);

  useEffect(() => {
    if (order) {
      setLaborCost(order.laborCost || 0);
      setUsedParts(order.partsUsed || []);
    }
  }, [order]);

  const subtotalParts = usedParts.reduce((acc, p) => acc + (p.price * p.quantity), 0);
  const total = subtotalParts + Number(laborCost);

  const addPart = (product: any) => {
    if (usedParts.find(p => p.productId === product.id)) {
       toast({ title: "موجود مسبقاً", description: "هذه القطعة مضافة بالفعل للفاتورة." });
       return;
    }
    setUsedParts([...usedParts, {
      productId: product.id,
      name: product.name,
      price: product.retailPrice,
      quantity: 1
    }]);
    setSearchTerm("");
  };

  const removePart = (productId: string) => {
    setUsedParts(usedParts.filter(p => p.productId !== productId));
  };

  const updateStatus = async (newStatus: string) => {
    try {
      await updateDoc(orderRef, { status: newStatus, updatedAt: serverTimestamp() });
      toast({ title: "تم التحديث", description: "تم تغيير حالة المهمة بنجاح." });
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل تحديث الحالة." });
    }
  };

  const saveInvoice = async () => {
    setIsSaving(true);
    try {
      await updateDoc(orderRef, {
        partsUsed: usedParts,
        laborCost: Number(laborCost),
        totalAmount: total,
        updatedAt: serverTimestamp()
      });
      toast({ title: "تم الحفظ", description: "تم حفظ بيانات التكاليف والفاتورة." });
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل حفظ البيانات." });
    } finally {
      setIsSaving(false);
    }
  };

  const notifyCustomer = () => {
    const statusLabel = statusConfig[order.status as keyof typeof statusConfig]?.label || order.status;
    const message = `مرحباً ${order.customerName}،
نود إعلامكم بأن حالة دراجتكم (${order.bikeBrand} ${order.bikeModel}) تحت رقم الطلب ${order.orderNumber} هي الآن: *${statusLabel}*.
المبلغ الكلي حتى الآن: ${total.toLocaleString()} د.ع.
شكراً لتعاملكم مع مجمع محمد علاء.`;
    
    window.open(`https://wa.me/${order.phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (loading) return <div className="p-8"><Skeleton className="h-[600px] rounded-[32px]" /></div>;
  if (!order) return <div className="p-8 text-center font-bold">لم يتم العثور على أمر التصليح.</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
           <Link href="/admin/workshop">
              <Button variant="ghost" size="icon" className="rounded-xl bg-white shadow-sm">
                <ChevronRight className="h-5 w-5 rotate-180" />
              </Button>
           </Link>
           <div>
              <div className="flex items-center gap-2">
                 <h1 className="text-2xl font-black">{order.orderNumber}</h1>
                 <Badge className={cn("rounded-full px-3 py-1 font-bold text-[10px]", statusConfig[order.status as keyof typeof statusConfig]?.color)}>
                    {statusConfig[order.status as keyof typeof statusConfig]?.label}
                 </Badge>
              </div>
              <p className="text-xs text-muted-foreground font-medium">آخر تحديث: قبل 5 دقائق</p>
           </div>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" className="rounded-xl border-2 font-bold h-11 gap-2" onClick={notifyCustomer}>
             <MessageCircle className="h-5 w-5 text-emerald-600" /> إبلاغ العميل
           </Button>
           <Button variant="outline" className="rounded-xl border-2 font-bold h-11 gap-2">
             <Printer className="h-5 w-5" /> طباعة الفاتورة
           </Button>
           <Button className="rounded-xl font-bold h-11 shadow-lg shadow-primary/20 gap-2 px-8" onClick={saveInvoice} disabled={isSaving}>
             <Save className="h-5 w-5" /> {isSaving ? "جاري الحفظ..." : "حفظ التغييرات"}
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Info & Status */}
        <div className="lg:col-span-1 space-y-6">
           <Card className="rounded-[32px] border-none shadow-sm">
              <CardHeader>
                 <CardTitle className="text-lg font-black flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" /> العميل والدراجة
                 </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                 <div className="p-4 rounded-2xl bg-muted/30 space-y-3">
                    <div className="flex justify-between">
                       <span className="text-xs text-muted-foreground font-bold">الاسم:</span>
                       <span className="text-sm font-black">{order.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                       <span className="text-xs text-muted-foreground font-bold">الهاتف:</span>
                       <span className="text-sm font-black text-left" dir="ltr">{order.phoneNumber}</span>
                    </div>
                 </div>
                 <div className="space-y-4">
                    <div className="flex items-center gap-3">
                       <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                          <Bike className="h-5 w-5" />
                       </div>
                       <div>
                          <p className="text-sm font-black">{order.bikeBrand} {order.bikeModel}</p>
                          <p className="text-[10px] text-muted-foreground font-bold">{order.plateNumber} | {order.bikeColor}</p>
                       </div>
                    </div>
                    <div className="p-4 rounded-2xl border-2 border-dashed border-muted-foreground/10 space-y-2">
                       <p className="text-xs font-black flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-orange-500" /> وصف المشكلة:
                       </p>
                       <p className="text-xs text-muted-foreground leading-relaxed">{order.problemDescription}</p>
                    </div>
                 </div>
              </CardContent>
           </Card>

           <Card className="rounded-[32px] border-none shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/30">
                 <CardTitle className="text-lg font-black flex items-center gap-2">
                    <Settings2 className="h-5 w-5 text-primary" /> تحديث حالة المهمة
                 </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                 <div className="flex flex-col">
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <button 
                        key={key}
                        onClick={() => updateStatus(key)}
                        className={cn(
                          "flex items-center justify-between p-4 hover:bg-muted/50 transition-colors border-b last:border-0",
                          order.status === key ? "bg-primary/5 border-primary/20" : "opacity-60"
                        )}
                      >
                         <div className="flex items-center gap-3">
                            <div className={cn("h-3 w-3 rounded-full", config.color.split(' ')[0])} />
                            <span className="text-sm font-bold">{config.label}</span>
                         </div>
                         {order.status === key && <CheckCircle2 className="h-4 w-4 text-primary" />}
                      </button>
                    ))}
                 </div>
              </CardContent>
           </Card>
        </div>

        {/* Right Column: Parts & Costs */}
        <div className="lg:col-span-2 space-y-6">
           <Card className="rounded-[32px] border-none shadow-sm min-h-[400px]">
              <CardHeader className="flex flex-row items-center justify-between">
                 <div className="space-y-1">
                    <CardTitle className="text-lg font-black flex items-center gap-2">
                       <Package className="h-5 w-5 text-primary" /> قطع الغيار المستخدمة
                    </CardTitle>
                    <CardDescription className="font-medium text-xs">إضافة قطع من المخزون مباشرة للطلب.</CardDescription>
                 </div>
              </CardHeader>
              <CardContent className="space-y-6">
                 <div className="relative">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                      placeholder="ابحث عن قطعة غيار لإضافتها (الاسم أو الباركود)..." 
                      className="h-14 rounded-2xl pr-12 bg-muted/20 border-none shadow-inner"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-card rounded-2xl shadow-xl border z-50 p-2 space-y-1">
                         {filteredProducts.map(p => (
                           <button 
                            key={p.id}
                            onClick={() => addPart(p)}
                            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors text-right"
                           >
                              <div className="flex items-center gap-3">
                                 <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center font-black text-xs">
                                    {p.name[0]}
                                 </div>
                                 <div>
                                    <p className="text-sm font-bold">{p.name}</p>
                                    <p className="text-[10px] text-muted-foreground">{p.barcode}</p>
                                 </div>
                              </div>
                              <div className="flex items-center gap-4">
                                 <span className="text-sm font-black text-primary">{p.retailPrice?.toLocaleString()} د.ع</span>
                                 <Badge variant="outline" className="rounded-full text-[8px]">{p.stock} متوفر</Badge>
                              </div>
                           </button>
                         ))}
                      </div>
                    )}
                 </div>

                 <div className="space-y-3">
                    {usedParts.length > 0 ? (
                      usedParts.map((part) => (
                        <div key={part.productId} className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-transparent hover:border-primary/20 transition-all">
                           <div className="flex items-center gap-4">
                              <span className="h-8 w-8 rounded-lg bg-white flex items-center justify-center text-xs font-black shadow-sm">{part.quantity}x</span>
                              <span className="text-sm font-bold">{part.name}</span>
                           </div>
                           <div className="flex items-center gap-4">
                              <span className="text-sm font-black">{ (part.price * part.quantity).toLocaleString() } د.ع</span>
                              <button onClick={() => removePart(part.productId)} className="text-destructive hover:bg-destructive/10 p-2 rounded-xl transition-colors">
                                 <Trash2 className="h-4 w-4" />
                              </button>
                           </div>
                        </div>
                      ))
                    ) : (
                      <div className="h-32 flex flex-col items-center justify-center text-muted-foreground opacity-30 gap-2">
                         <Package className="h-12 w-12" />
                         <p className="font-bold">لم يتم إضافة أي قطع بعد</p>
                      </div>
                    )}
                 </div>
              </CardContent>
           </Card>

           <Card className="rounded-[32px] border-none shadow-sm bg-primary/5 border-2 border-primary/10 overflow-hidden">
              <CardHeader>
                 <CardTitle className="text-lg font-black flex items-center gap-2">
                    <BadgeDollarSign className="h-5 w-5 text-primary" /> تفاصيل التكلفة
                 </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                       <Label className="font-bold">أجور اليد (Labor Cost)</Label>
                       <div className="relative">
                          <Input 
                            type="number" 
                            value={laborCost}
                            onChange={(e) => setLaborCost(Number(e.target.value))}
                            className="h-14 rounded-2xl text-2xl font-black bg-white border-none shadow-sm pr-6" 
                          />
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">د.ع</span>
                       </div>
                       <p className="text-[10px] text-muted-foreground font-medium">تشمل أجور الفحص والتصليح والتنظيف.</p>
                    </div>

                    <div className="bg-white dark:bg-card p-6 rounded-3xl shadow-sm space-y-4">
                       <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground font-medium">مجموع القطع:</span>
                          <span className="font-bold">{subtotalParts.toLocaleString()} د.ع</span>
                       </div>
                       <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground font-medium">أجور العمل:</span>
                          <span className="font-bold">{Number(laborCost).toLocaleString()} د.ع</span>
                       </div>
                       <div className="h-px bg-muted" />
                       <div className="flex items-center justify-between">
                          <span className="text-lg font-black">الإجمالي:</span>
                          <span className="text-3xl font-black text-primary underline decoration-primary/20 underline-offset-8">
                             {total.toLocaleString()} <span className="text-sm">د.ع</span>
                          </span>
                       </div>
                    </div>
                 </div>
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
