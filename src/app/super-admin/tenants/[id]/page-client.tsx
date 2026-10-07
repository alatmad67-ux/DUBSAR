
'use client';

import { use, useMemo, useState } from "react";
import { 
  Building2, 
  User, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  Calendar, 
  ShieldCheck, 
  History,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  Database,
  Users,
  Settings2,
  Trash2,
  ShieldAlert,
  Loader2,
  Zap,
  LayoutDashboard,
  Clock,
  ArrowRightLeft,
  ExternalLink,
  CreditCard,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useFirestore, useDoc, useCollection } from "@/firebase";
import { doc, collection, query, where, orderBy, limit, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";

export default function TenantDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const db = useFirestore();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  // Tenant Base Data
  const tenantRef = useMemo(() => doc(db, 'tenants', id), [db, id]);
  const { data: tenant, loading: tLoading } = useDoc<any>(tenantRef);

  // Store-specific metrics
  const { data: products } = useCollection(query(collection(db, 'products'), where('tenantId', '==', id)));
  const { data: orders } = useCollection(query(collection(db, 'orders'), where('tenantId', '==', id)));
  const { data: staff } = useCollection(query(collection(db, 'users'), where('tenantId', '==', id)));
  const { data: logs } = useCollection(query(collection(db, 'auditLogs'), where('tenantId', '==', id), orderBy('timestamp', 'desc'), limit(15)));
  const { data: invoices } = useCollection(query(collection(db, 'subscriptionInvoices'), where('tenantId', '==', id), orderBy('issueDate', 'desc')));

  const revenue = useMemo(() => orders.reduce((acc, o: any) => acc + (o.total || 0), 0), [orders]);

  const updateStatus = async (status: string) => {
    setIsSaving(true);
    try {
      await updateDoc(tenantRef, { status });
      toast({ title: "تم تحديث الحالة" });
    } catch (e) {
      toast({ variant: "destructive", title: "فشل التحديث" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleManualInvoice = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const fd = new FormData(e.currentTarget);
    const amount = Number(fd.get('amount'));
    const months = Number(fd.get('months'));
    
    try {
      const now = Date.now();
      const currentExpiry = tenant.currentPeriodEnd || now;
      const newExpiry = currentExpiry + (months * 30 * 24 * 60 * 60 * 1000);

      // 1. Update Tenant
      await updateDoc(tenantRef, {
        status: 'active',
        subscriptionPlan: fd.get('plan'),
        currentPeriodStart: now,
        currentPeriodEnd: newExpiry
      });

      // 2. Create Invoice
      await addDoc(collection(db, 'subscriptionInvoices'), {
        tenantId: id,
        invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
        planName: fd.get('plan'),
        amountIQD: amount,
        status: 'paid',
        issueDate: now,
        dueDate: now,
        paymentDate: now,
        notes: fd.get('notes') || 'تفعيل يدوي من السوبر أدمن'
      });

      toast({ title: "تم التفعيل بنجاح" });
      setIsInvoiceOpen(false);
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ في التفعيل" });
    } finally {
      setIsSaving(false);
    }
  };

  if (tLoading) return <div className="p-10 text-center"><Skeleton className="h-[600px] w-full rounded-[40px]" /></div>;
  if (!tenant) return <div className="p-20 text-center font-black">المتجر غير موجود ⚠️</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-xl bg-white shadow-sm" onClick={() => router.back()}>
            <ChevronRight className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
               <h1 className="text-3xl font-black text-slate-900">{tenant.businessName}</h1>
               <Badge className={cn(
                 "rounded-full px-3 py-1 font-black text-[10px] uppercase",
                 tenant.status === 'active' ? 'bg-green-100 text-green-700' : 
                 tenant.status === 'trial' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
               )}>{tenant.status}</Badge>
            </div>
            <p className="text-muted-foreground font-medium text-xs">معرف المتجر السحابي: {tenant.tenantId}</p>
          </div>
        </div>
        
        <div className="flex gap-3">
           <Dialog open={isInvoiceOpen} onOpenChange={setIsInvoiceOpen}>
              <DialogTrigger asChild>
                 <Button className="rounded-xl font-black h-11 shadow-lg shadow-primary/20 gap-2 px-6">
                    <Plus className="h-4 w-4" /> تفعيل اشتراك يدوي
                 </Button>
              </DialogTrigger>
              <DialogContent className="rounded-[32px] max-w-md">
                 <DialogHeader><DialogTitle className="text-xl font-black">تفعيل اشتراك المتجر</DialogTitle></DialogHeader>
                 <form onSubmit={handleManualInvoice} className="space-y-5 pt-4">
                    <div className="space-y-2">
                       <Label className="font-bold">الباقة</Label>
                       <Select name="plan" defaultValue="business">
                          <SelectTrigger className="rounded-xl h-12 bg-muted/20 border-none"><SelectValue /></SelectTrigger>
                          <SelectContent className="rounded-2xl">
                             <SelectItem value="starter">Starter</SelectItem>
                             <SelectItem value="business">Business</SelectItem>
                             <SelectItem value="enterprise">Enterprise</SelectItem>
                          </SelectContent>
                       </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <Label className="font-bold">المبلغ (IQD)</Label>
                          <Input name="amount" type="number" required placeholder="15000" className="rounded-xl h-12 bg-muted/20 border-none" />
                       </div>
                       <div className="space-y-2">
                          <Label className="font-bold">المدة (أشهر)</Label>
                          <Input name="months" type="number" required defaultValue="1" className="rounded-xl h-12 bg-muted/20 border-none" />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <Label className="font-bold">ملاحظات</Label>
                       <Input name="notes" placeholder="اختياري..." className="rounded-xl h-12 bg-muted/20 border-none" />
                    </div>
                    <DialogFooter>
                       <Button disabled={isSaving} type="submit" className="w-full h-14 rounded-2xl font-black text-lg">
                          {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : "إصدار فاتورة وتفعيل"}
                       </Button>
                    </DialogFooter>
                 </form>
              </DialogContent>
           </Dialog>

           <Button variant="outline" className="rounded-xl border-2 font-bold h-11" onClick={() => window.open(`/store/${tenant.slug}`, '_blank')}>
             <ExternalLink className="h-4 w-4 ml-2" /> معاينة
           </Button>
           <Button variant="destructive" size="icon" className="rounded-xl h-11 w-11" onClick={() => { if(confirm('هل تريد حذف المتجر بالكامل؟')) deleteDoc(tenantRef).then(()=>router.replace('/super-admin/tenants')) }}>
             <Trash2 className="h-4 w-4" />
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
           <Card className="rounded-[40px] border-none shadow-sm overflow-hidden bg-white">
              <CardHeader className="bg-primary/5 p-8 border-b border-primary/10">
                 <CardTitle className="text-xl font-black flex items-center gap-3">
                    <User className="h-6 w-6 text-primary" /> بيانات المالك
                 </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-4">
                 <div className="space-y-4">
                    <div className="flex items-center gap-4">
                       <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center"><User className="h-5 w-5 opacity-40" /></div>
                       <div><p className="text-[10px] font-black text-muted-foreground uppercase">الاسم الكامل</p><p className="font-bold">{tenant.ownerName}</p></div>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center"><Phone className="h-5 w-5 opacity-40" /></div>
                       <div><p className="text-[10px] font-black text-muted-foreground uppercase">رقم الهاتف</p><p className="font-bold" dir="ltr">{tenant.phone}</p></div>
                    </div>
                 </div>
              </CardContent>
           </Card>

           <Card className="rounded-[40px] border-none shadow-sm overflow-hidden bg-white">
              <CardHeader className="p-8 pb-4 border-b">
                 <CardTitle className="text-lg font-black flex items-center gap-3">
                    <History className="h-6 w-6 text-primary" /> تاريخ الفوترة
                 </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                 <div className="divide-y max-h-[300px] overflow-y-auto">
                    {invoices.map((inv: any) => (
                      <div key={inv.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                         <div>
                            <p className="text-xs font-black text-slate-800">{inv.planName} - {inv.amountIQD?.toLocaleString()} د.ع</p>
                            <p className="text-[9px] text-muted-foreground font-bold">{new Date(inv.issueDate).toLocaleDateString("ar-EG")}</p>
                         </div>
                         <Badge className="rounded-md text-[8px] bg-green-50 text-green-700 border-none font-black">{inv.status}</Badge>
                      </div>
                    ))}
                 </div>
              </CardContent>
           </Card>
        </div>

        <div className="lg:col-span-2 space-y-8">
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-6 rounded-[32px] bg-white border shadow-sm space-y-2">
                 <Package className="h-5 w-5 text-blue-600" />
                 <p className="text-[10px] font-black uppercase text-slate-400">المنتجات</p>
                 <p className="text-2xl font-black">{products.length}</p>
              </div>
              <div className="p-6 rounded-[32px] bg-white border shadow-sm space-y-2">
                 <ShoppingCart className="h-5 w-5 text-emerald-600" />
                 <p className="text-[10px] font-black uppercase text-slate-400">الطلبات</p>
                 <p className="text-2xl font-black">{orders.length}</p>
              </div>
              <div className="p-6 rounded-[32px] bg-white border shadow-sm space-y-2">
                 <Users className="h-5 w-5 text-purple-600" />
                 <p className="text-[10px] font-black uppercase text-slate-400">الموظفين</p>
                 <p className="text-2xl font-black">{staff.length}</p>
              </div>
              <div className="p-6 rounded-[32px] bg-white border shadow-sm space-y-2">
                 <TrendingUp className="h-5 w-5 text-orange-600" />
                 <p className="text-[10px] font-black uppercase text-slate-400">المبيعات</p>
                 <p className="text-xl font-black text-primary">{revenue.toLocaleString()}</p>
              </div>
           </div>

           <Card className="rounded-[40px] border-none shadow-sm overflow-hidden bg-white">
              <CardHeader className="p-8 border-b">
                 <CardTitle className="text-xl font-black flex items-center gap-3">
                    <History className="h-6 w-6 text-primary" /> سجل العمليات
                 </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                 <div className="divide-y max-h-[400px] overflow-y-auto">
                    {logs.map((log: any) => (
                      <div key={log.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                         <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 text-xs">
                               {log.action?.[0]}
                            </div>
                            <div>
                               <p className="text-sm font-bold text-slate-800">{log.action}</p>
                               <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-medium">
                                  <span>{new Date(log.timestamp).toLocaleString("ar-EG")}</span>
                                  <span className="opacity-30">•</span>
                                  <span className="font-black text-primary uppercase">{log.userName || 'System'}</span>
                               </div>
                            </div>
                         </div>
                         <div className="text-left hidden md:block max-w-[250px]">
                            <p className="text-[10px] font-medium text-slate-500 italic truncate">{log.details}</p>
                         </div>
                      </div>
                    ))}
                 </div>
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
