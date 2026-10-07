'use client';

import { 
  Users, 
  Search, 
  UserPlus, 
  Phone,
  MapPin,
  BadgeDollarSign,
  Loader2,
  Edit2,
  Save,
  MessageCircle,
  TrendingUp,
  CreditCard,
  Building2,
  UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { InventoryService } from "@/services/inventory-service";
import Link from "next/link";

export default function CustomersManagementPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>({});

  useEffect(() => {
    try {
      const sessionStr = localStorage.getItem('dubsar_session');
      if (sessionStr) {
        setCurrentUser(JSON.parse(sessionStr));
      }
    } catch {
      setCurrentUser({});
    }
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await InventoryService.getCustomers();
      setCustomers(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error("Failed to load customers:", e);
      toast({ variant: "destructive", title: "خطأ", description: "تعذر تحميل قائمة الزبائن من قاعدة البيانات." });
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return customers.filter((c: any) => 
      (c.name?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (c.phone || "").includes(search) ||
      (c.address?.toLowerCase() || "").includes(search.toLowerCase())
    );
  }, [customers, search]);

  const totalDebts = useMemo(() => {
    return customers.reduce((sum, c) => sum + Math.max(0, Number(c.balance) || 0), 0);
  }, [customers]);

  const debtorsCount = useMemo(() => {
    return customers.filter((c) => (Number(c.balance) || 0) > 0).length;
  }, [customers]);

  const handleAddCustomer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    const name = String(formData.get('name') || '').trim();
    const phone = String(formData.get('phone') || '').trim();
    const address = String(formData.get('address') || '').trim();

    if (!name) {
      toast({ variant: "destructive", title: "خطأ", description: "اسم العميل مطلوب." });
      setIsSaving(false);
      return;
    }

    try {
      await InventoryService.createCustomer({ name, phone, address }, currentUser);
      setIsAddOpen(false);
      toast({ title: "تم الحفظ بنجاح", description: `تمت إضافة العميل ${name} إلى قاعدة البيانات المحلية.` });
      await loadCustomers();
    } catch (e: any) {
      console.error("Add customer error:", e);
      toast({ variant: "destructive", title: "خطأ في الحفظ", description: e?.message || "فشلت إضافة العميل." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateCustomer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingCustomer) return;
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    const name = String(formData.get('name') || '').trim();
    const phone = String(formData.get('phone') || '').trim();
    const address = String(formData.get('address') || '').trim();

    try {
      await InventoryService.updateCustomer(editingCustomer.id, { name, phone, address }, currentUser);
      setIsEditOpen(false);
      setEditingCustomer(null);
      toast({ title: "تم التحديث", description: "تم تعديل بيانات العميل بنجاح." });
      await loadCustomers();
    } catch (e: any) {
      console.error("Update customer error:", e);
      toast({ variant: "destructive", title: "خطأ", description: e?.message || "فشل تحديث بيانات العميل." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-300 pb-20" dir="rtl">
      {/* Header & Actions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">إدارة الزبائن والعملاء</h1>
            <Badge className="bg-primary/10 text-primary border-none font-black text-xs px-2.5 py-0.5 rounded-full">
              محلي SQLite
            </Badge>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground font-medium">سجل العملاء، متابعة الذمم المالية والديون، وعناوين الاتصال.</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl font-black h-11 px-5 gap-2 shadow-md bg-primary hover:bg-primary/90 text-white">
              <UserPlus className="h-4 w-4" /> إضافة زبون جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-primary">تسجيل زبون جديد</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddCustomer} className="space-y-4 pt-3">
               <div className="space-y-1.5">
                  <Label className="font-bold text-xs">اسم الزبون / الشركة <span className="text-destructive">*</span></Label>
                  <Input name="name" required placeholder="مثال: أحمد عبد الله أو شركة الرافدين" className="rounded-xl h-11 bg-slate-50 dark:bg-slate-800 text-sm font-bold" autoFocus />
               </div>
               <div className="space-y-1.5">
                  <Label className="font-bold text-xs">رقم الهاتف</Label>
                  <Input name="phone" placeholder="07XXXXXXXXX" className="rounded-xl h-11 bg-slate-50 dark:bg-slate-800 text-sm font-bold font-mono" dir="ltr" />
               </div>
               <div className="space-y-1.5">
                  <Label className="font-bold text-xs">العنوان / المنطقة</Label>
                  <Input name="address" placeholder="مثال: بغداد - الكرادة" className="rounded-xl h-11 bg-slate-50 dark:bg-slate-800 text-sm font-bold" />
               </div>
               <DialogFooter className="pt-2">
                  <Button type="submit" disabled={isSaving} className="w-full h-11 rounded-xl font-black text-sm gap-2">
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    <span>حفظ الزبون في النظام</span>
                  </Button>
               </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-xl border shadow-sm bg-white dark:bg-slate-900">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-muted-foreground">إجمالي الزبائن المسجلين</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">{customers.length}</p>
              <p className="text-[11px] text-blue-600 font-bold">زبون في النظام المحلي</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border shadow-sm bg-white dark:bg-slate-900">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-muted-foreground">إجمالي الديون والذمم</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">{totalDebts.toLocaleString()} د.ع</p>
              <p className="text-[11px] text-purple-600 font-bold">مجموع المبالغ المتبقية في الذمة</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600">
              <CreditCard className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border shadow-sm bg-white dark:bg-slate-900">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-muted-foreground">العملاء المدينون</span>
              <p className="text-2xl font-black text-amber-600 font-mono">{debtorsCount}</p>
              <p className="text-[11px] text-amber-600 font-bold">زبائن لديهم رصيد ذمة مستحق</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600">
              <BadgeDollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="ابحث بالاسم أو رقم الهاتف أو العنوان..." 
          className="h-12 rounded-xl bg-white dark:bg-slate-900 pr-10 border shadow-sm text-sm font-bold"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Customers Table */}
      <div className="rounded-xl border bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-black border-y text-xs">
              <TableHead className="text-right py-3.5 px-4">اسم الزبون</TableHead>
              <TableHead className="text-right">رقم الهاتف</TableHead>
              <TableHead className="text-right">العنوان</TableHead>
              <TableHead className="text-left">الرصيد / الذمة المالية</TableHead>
              <TableHead className="text-left px-4">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array(4).fill(0).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="px-4 py-3"><Skeleton className="h-6 w-36 rounded-lg" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-28 rounded-lg" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32 rounded-lg" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24 rounded-lg" /></TableCell>
                  <TableCell className="px-4 text-left"><Skeleton className="h-8 w-16 rounded-lg" /></TableCell>
                </TableRow>
              ))
            ) : filtered.length > 0 ? (
              filtered.map((customer: any) => {
                const balance = Number(customer.balance) || 0;
                return (
                  <TableRow key={customer.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors text-xs font-bold">
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-sm">
                          {customer.name?.[0] || <Users className="h-4 w-4" />}
                        </div>
                        <div>
                          <span className="font-black text-sm block text-slate-800 dark:text-slate-200">{customer.name}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">ID: {customer.id.substring(0, 8)}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-slate-700 dark:text-slate-300">
                      {customer.phone ? (
                        <span dir="ltr">{customer.phone}</span>
                      ) : (
                        <span className="text-muted-foreground opacity-50">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400">
                      {customer.address ? (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          <span>{customer.address}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground opacity-50">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-left font-mono">
                      {balance > 0 ? (
                        <Badge variant="destructive" className="font-black font-mono text-xs px-2.5 py-0.5">
                          مدين: {balance.toLocaleString()} د.ع
                        </Badge>
                      ) : balance < 0 ? (
                        <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-black font-mono text-xs px-2.5 py-0.5">
                          دائن: {Math.abs(balance).toLocaleString()} د.ع
                        </Badge>
                      ) : (
                        <span className="text-slate-400 font-mono">0 د.ع</span>
                      )}
                    </TableCell>
                    <TableCell className="text-left px-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {customer.phone && (
                          <a 
                            href={`https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                            title="مراسلة عبر واتساب"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </a>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40" 
                          onClick={() => { setEditingCustomer(customer); setIsEditOpen(true); }}
                          title="تعديل بيانات العميل"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-44 text-center text-muted-foreground font-bold text-xs">
                  {search ? "لم يتم العثور على زبائن يطابقون عبارة البحث." : "لا يوجد زبائن مسجلون بعد. اضغط على 'إضافة زبون جديد' للإضافة."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Customer Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="rounded-2xl max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-primary">تعديل بيانات الزبون</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateCustomer} className="space-y-4 pt-3">
             <div className="space-y-1.5">
                <Label className="font-bold text-xs">اسم الزبون / الشركة <span className="text-destructive">*</span></Label>
                <Input name="name" defaultValue={editingCustomer?.name} required className="rounded-xl h-11 bg-slate-50 dark:bg-slate-800 text-sm font-bold" />
             </div>
             <div className="space-y-1.5">
                <Label className="font-bold text-xs">رقم الهاتف</Label>
                <Input name="phone" defaultValue={editingCustomer?.phone} placeholder="07XXXXXXXXX" className="rounded-xl h-11 bg-slate-50 dark:bg-slate-800 text-sm font-bold font-mono" dir="ltr" />
             </div>
             <div className="space-y-1.5">
                <Label className="font-bold text-xs">العنوان / المنطقة</Label>
                <Input name="address" defaultValue={editingCustomer?.address} placeholder="مثال: بغداد - الكرادة" className="rounded-xl h-11 bg-slate-50 dark:bg-slate-800 text-sm font-bold" />
             </div>
             <DialogFooter className="pt-2">
                <Button type="submit" disabled={isSaving} className="w-full h-11 rounded-xl font-black text-sm gap-2">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  <span>حفظ التعديلات</span>
                </Button>
             </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}