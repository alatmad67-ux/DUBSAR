
'use client';

import { 
  ChevronRight, 
  Wrench, 
  Clock, 
  User, 
  Bike, 
  Package, 
  BadgeDollarSign, 
  Printer, 
  MessageCircle,
  Save,
  Search,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Settings2,
  Zap,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { useFirestore, useDoc, useCollection, useUser } from "@/firebase";
import { doc, updateDoc, collection, query, serverTimestamp, increment, writeBatch, addDoc, where } from "firebase/firestore";
import { useMemo, useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useParams } from "next/navigation";
import { workshopDiagnosisAssistant } from "@/ai/flows/workshop-diagnosis-assistant";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

export default function RepairOrderDetailsPage() {
  const params = useParams();
  const id = params?.id as string;
  const db = useFirestore();
  const { profile, tenantId } = useUser();
  
  const orderRef = useMemo(() => id && id !== 'default' ? doc(db, 'repairOrders', id) : null, [db, id]);
  const { data: order, loading } = useDoc<any>(orderRef);
  
  const [laborCost, setLaborCost] = useState(0);
  const [usedParts, setUsedParts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDiagnosis, setAiDiagnosis] = useState<any>(null);

  // FIXED: Tenant scoping added to inventory query to prevent cross-tenant leakage
  const inventoryQuery = useMemo(() => query(
    collection(db, 'products'),
    where('tenantId', '==', tenantId)
  ), [db, tenantId]);
  const { data: products } = useCollection(inventoryQuery);

  const filteredProducts = products.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
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

  const addPart = async (product: any) => {
    if (usedParts.find(p => p.productId === product.id)) {
       toast({ title: "موجود مسبقاً", description: "هذه القطعة مضافة بالفعل." });
       return;
    }
    
    if (product.stock <= 0) {
      toast({ variant: "destructive", title: "نفذ المخزون", description: "هذه القطعة غير متوفرة حالياً." });
      return;
    }

    const batch = writeBatch(db);
    const newPart = {
      productId: product.id,
      name: product.name,
      price: product.retailPrice,
      quantity: 1
    };

    const updatedParts = [...usedParts, newPart];
    setUsedParts(updatedParts);
    setSearchTerm("");

    if (orderRef) {
      batch.update(orderRef, { 
        partsUsed: updatedParts, 
        updatedAt: Date.now(), 
        totalAmount: subtotalParts + Number(laborCost) + product.retailPrice 
      });
      batch.update(doc(db, "products", product.id), { stock: increment(-1) });
      
      batch.commit().catch(async (err) => {
        const perr = new FirestorePermissionError({ path: orderRef.path, operation: "write" });
        errorEmitter.emit('permission-error', perr);
      });
    }
  };

  const removePart = async (part: any) => {
    const updatedParts = usedParts.filter(p => p.productId !== part.productId);
    setUsedParts(updatedParts);

    if (orderRef) {
      const batch = writeBatch(db);
      batch.update(orderRef, { 
        partsUsed: updatedParts, 
        updatedAt: Date.now(), 
        totalAmount: total - (part.price * part.quantity) 
      });
      batch.update(doc(db, "products", part.productId), { stock: increment(part.quantity) });
      
      batch.commit().catch(async (err) => {
        const perr = new FirestorePermissionError({ path: orderRef.path, operation: "write" });
        errorEmitter.emit('permission-error', perr);
      });
    }
  };

  const handleAiDiagnosis = async () => {
    if (!order?.problemDescription) return;
    setAiLoading(true);
    try {
      const result = await workshopDiagnosisAssistant({ symptomsDescription: order.problemDescription });
      setAiDiagnosis(result.diagnoses);
      toast({ title: "اكتمل التشخيص", description: "قام الذكاء الاصطناعي بتحليل الأعطال." });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل استدعاء مساعد الذكاء الاصطناعي." });
    } finally {
      setAiLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!orderRef) return;
    updateDoc(orderRef, { status: newStatus, updatedAt: serverTimestamp() })
      .then(() => toast({ title: "تم التحديث", description: "تم تغيير حالة المهمة بنجاح." }));
  };

  const saveInvoice = async () => {
    if (!orderRef) return;
    setIsSaving(true);
    updateDoc(orderRef, { laborCost: Number(laborCost), totalAmount: total, updatedAt: serverTimestamp() })
    .then(() => {
      toast({ title: "تم الحفظ", description: "تم حفظ تكاليف العمل." });
      addDoc(collection(db, "auditLogs"), {
        tenantId,
        userId: profile?.uid || "workshop",
        userName: profile?.displayName || "فني الورشة",
        action: "تعديل فاتورة ورشة",
        target: order.orderNumber,
        details: `تحديث أجور اليد إلى ${laborCost} د.ع`,
        timestamp: Date.now()
      });
    })
    .finally(() => setIsSaving(false));
  };

  const notifyCustomer = () => {
    if (!order) return;
    const message = `مرحباً ${order.customerName}،\nحالة دراجتكم ${order.bikeBrand} هي الآن: *${order.status}*.\nالمبلغ: ${total.toLocaleString()} د.ع.\nشكراً لطلبكم.`;
    window.open(`https://wa.me/${order.phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (loading && id !== 'default') return <div className="p-8"><Skeleton className="h-[600px] rounded-[32px]" /></div>;
  if (!order && id !== 'default') return <div className="p-8 text-center font-bold">لم يتم العثور على الأمر.</div>;

  const statusConfig: any = {
    received: { label: "تم الاستلام", color: "bg-blue-100 text-blue-700 border-blue-200" },
    inspection: { label: "قيد الفحص", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
    waiting_parts: { label: "انتظار قطع", color: "bg-orange-100 text-orange-700 border-orange-200" },
    in_progress: { label: "قيد التصليح", color: "bg-purple-100 text-purple-700 border-purple-200" },
    quality_check: { label: "فحص الجودة", color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
    ready: { label: "جاهز للاستلام", color: "bg-green-100 text-green-700 border-green-200" },
    delivered: { label: "تم التسليم", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    cancelled: { label: "ملغي", color: "bg-red-100 text-red-700 border-red-200" },
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20" dir="rtl">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
           <Link href="/admin/workshop">
              <Button variant="ghost" size="icon" className="rounded-xl bg-white shadow-sm">
                <ChevronRight className="h-5 w-5" />
              </Button>
           </Link>
           <div>
              <div className="flex items-center gap-2">
                 <h1 className="text-2xl font-black">{order?.orderNumber}</h1>
                 <Badge className={cn("rounded-full px-3 py-1 font-bold text-[10px]", statusConfig[order?.status]?.color)}>
                    {statusConfig[order?.status]?.label}
                 </Badge>
              </div>
              <p className="text-xs text-muted-foreground font-medium">إدارة تفاصيل الصيانة والتكاليف</p>
           </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
           <Button variant="outline" className="rounded-xl border-2 font-bold h-11 gap-2 bg-purple-50 text-purple-700 border-purple-100" onClick={handleAiDiagnosis} disabled={aiLoading}>
             {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />} تشخيص AI
           </Button>
           <Button variant="outline" className="rounded-xl border-2 font-bold h-11 gap-2" onClick={notifyCustomer}>
             <MessageCircle className="h-5 w-5 text-emerald-600" /> إبلاغ العميل
           </Button>
           <Button className="rounded-xl font-bold h-11 shadow-lg shadow-primary/20 gap-2 px-8" onClick={saveInvoice} disabled={isSaving}>
             <Save className="h-5 w-5" /> {isSaving ? "جاري الحفظ..." : "حفظ الفاتورة"}
           </Button>
        </div>
      </div>

      {aiDiagnosis && (
        <div className="bg-purple-600 rounded-[32px] p-8 text-white space-y-6 shadow-xl relative overflow-hidden">
           <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3"><Zap className="h-8 w-8 text-yellow-400" /><h2 className="text-2xl font-black">تشخيص الذكاء الاصطناعي</h2></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {aiDiagnosis.map((d: any, i: number) => (
                   <div key={i} className="bg-white/10 rounded-2xl p-6 border border-white/20">
                      <h3 className="font-black text-lg mb-2">{d.diagnosis}</h3>
                      <p className="text-xs opacity-80 mb-1">الخطوات المقترحة:</p>
                      <ul className="text-xs list-disc list-inside opacity-90">{d.troubleshootingSteps.map((s: any, idx: number) => <li key={idx}>{s}</li>)}</ul>
                   </div>
                 ))}
              </div>
              <Button variant="secondary" className="rounded-full" onClick={() => setAiDiagnosis(null)}>إغلاق</Button>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
             <Card className="rounded-[32px] border-none shadow-sm">
                <CardHeader><CardTitle className="text-lg font-black flex items-center gap-2"><User className="h-5 w-5 text-primary" /> العميل والدراجة</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                   <div className="bg-muted/30 p-4 rounded-2xl space-y-2">
                      <p className="text-sm font-black">{order?.customerName}</p>
                      <p className="text-xs font-bold text-muted-foreground" dir="ltr">{order?.phoneNumber}</p>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Bike className="h-5 w-5" /></div>
                      <div><p className="text-sm font-black">{order?.bikeBrand} {order?.bikeModel}</p><p className="text-[10px] text-muted-foreground font-bold">{order?.plateNumber}</p></div>
                   </div>
                   <div className="p-4 rounded-2xl border-2 border-dashed text-xs text-muted-foreground leading-relaxed">
                      <span className="font-black text-foreground flex items-center gap-1 mb-1"><AlertTriangle className="h-3 w-3 text-orange-500" /> وصف العطل:</span>
                      {order?.problemDescription}
                   </div>
                </CardContent>
             </Card>

             <Card className="rounded-[32px] border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/30"><CardTitle className="text-lg font-black flex items-center gap-2"><Settings2 className="h-5 w-5 text-primary" /> حالة المهمة</CardTitle></CardHeader>
                <CardContent className="p-0">
                   <div className="flex flex-col">
                      {Object.entries(statusConfig).map(([key, config]: [string, any]) => (
                        <button key={key} onClick={() => updateStatus(key)} className={cn("flex items-center justify-between p-4 hover:bg-muted/50 border-b last:border-0", order?.status === key && "bg-primary/5")}>
                           <div className="flex items-center gap-3"><div className={cn("h-3 w-3 rounded-full", config.color.split(' ')[0])} /><span className="text-sm font-bold">{config.label}</span></div>
                           {order?.status === key && <CheckCircle2 className="h-4 w-4 text-primary" />}
                        </button>
                      ))}
                   </div>
                </CardContent>
             </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
             <Card className="rounded-[32px] border-none shadow-sm min-h-[400px]">
                <CardHeader><CardTitle className="text-lg font-black flex items-center gap-2"><Package className="h-5 w-5 text-primary" /> قطع الغيار</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                   <div className="relative">
                      <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input placeholder="بحث عن قطعة غيار لإضافتها..." className="h-14 rounded-2xl pr-12 bg-muted/20 border-none shadow-inner" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                      {searchTerm && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-card rounded-2xl shadow-xl border z-50 p-2">
                           {filteredProducts.map(p => (
                             <button key={p.id} onClick={() => addPart(p)} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors">
                                <div className="flex items-center gap-3 text-right">
                                   <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center font-black text-xs">{p.name?.[0]}</div>
                                   <div><p className="text-sm font-bold">{p.name}</p><p className="text-[10px] text-muted-foreground">{p.barcode}</p></div>
                                </div>
                                <div className="flex items-center gap-4"><span className="text-sm font-black text-primary">{p.retailPrice?.toLocaleString()} د.ع</span><Badge variant="outline" className="rounded-full text-[8px]">{p.stock} متوفر</Badge></div>
                             </button>
                           ))}
                        </div>
                      )}
                   </div>
                   <div className="space-y-3">
                      {usedParts.map((part) => (
                        <div key={part.productId} className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-transparent hover:border-primary/20 transition-all">
                           <div className="flex items-center gap-4"><span className="h-8 w-8 rounded-lg bg-white flex items-center justify-center text-xs font-black shadow-sm">{part.quantity}x</span><span className="text-sm font-bold">{part.name}</span></div>
                           <div className="flex items-center gap-4"><span className="text-sm font-black">{ (part.price * part.quantity).toLocaleString() } د.ع</span><button onClick={() => removePart(part)} className="text-destructive hover:bg-destructive/10 p-2 rounded-xl"><Trash2 className="h-4 w-4" /></button></div>
                        </div>
                      ))}
                   </div>
                </CardContent>
             </Card>

             <Card className="rounded-[32px] border-none shadow-sm bg-primary/5 border-2 border-primary/10 overflow-hidden">
                <CardHeader><CardTitle className="text-lg font-black flex items-center gap-2"><BadgeDollarSign className="h-5 w-5 text-primary" /> التكاليف</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                         <Label className="font-bold">أجور اليد</Label>
                         <div className="relative"><Input type="number" value={laborCost} onChange={(e) => setLaborCost(Number(e.target.value))} className="h-14 rounded-2xl text-2xl font-black bg-white border-none shadow-sm pr-6" /><span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">د.ع</span></div>
                      </div>
                      <div className="bg-white dark:bg-card p-6 rounded-3xl shadow-sm space-y-4 text-sm">
                         <div className="flex justify-between font-medium"><span className="text-muted-foreground">القطع:</span><span>{subtotalParts.toLocaleString()} د.ع</span></div>
                         <div className="flex justify-between font-medium"><span className="text-muted-foreground">العمل:</span><span>{Number(laborCost).toLocaleString()} د.ع</span></div>
                         <div className="h-px bg-muted" />
                         <div className="flex justify-between items-baseline"><span className="text-lg font-black">الإجمالي:</span><span className="text-3xl font-black text-primary">{total.toLocaleString()} د.ع</span></div>
                      </div>
                   </div>
                </CardContent>
             </Card>
          </div>
        </div>
    </div>
  );
}
