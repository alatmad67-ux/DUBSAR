'use client';

import { 
  UserPlus, 
  ShieldCheck, 
  Trash2, 
  Loader2,
  Lock,
  User,
  Shield,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { LocalAuthService } from "@/services/local-auth-service";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function LocalEmployeesPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await LocalAuthService.getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error("Failed to load users:", e);
      toast({ variant: "destructive", title: "خطأ", description: "تعذر تحميل قائمة المستخدمين من قاعدة البيانات." });
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    const username = (formData.get('username') as string || '').trim().toLowerCase();
    const displayName = (formData.get('displayName') as string || '').trim();
    const pin = (formData.get('pin') as string || '').trim();
    const role = (formData.get('role') as string || 'staff');

    if (!username || !displayName || !pin) {
      toast({ variant: "destructive", title: "بيانات ناقصة", description: "يرجى ملء كافة الحقول المطلوبة." });
      setIsSaving(false);
      return;
    }

    if (pin.length < 4) {
      toast({ variant: "destructive", title: "رمز غير صالح", description: "رمز الدخول (PIN) يجب أن يكون 4 أرقام أو أحرف على الأقل." });
      setIsSaving(false);
      return;
    }
    
    try {
      const permissions = role === 'manager' 
        ? ['*'] 
        : ['sales.view', 'sales.create', 'inventory.view', 'warehouse.view'];

      await LocalAuthService.createUser({
        username,
        displayName,
        pin,
        role,
        permissions
      });

      setIsAddOpen(false);
      toast({ title: "تم الحفظ بنجاح", description: `تم تسجيل المستخدم ${displayName} في النظام المحلي.` });
      await loadUsers();
    } catch (e: any) {
      console.error("Create user error:", e);
      const errMsg = e?.message || (typeof e === 'string' ? e : "فشل إنشاء المستخدم.");
      toast({ variant: "destructive", title: "خطأ في إنشاء المستخدم", description: errMsg });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من رغبتك بحذف المستخدم (${name}) نهائياً من النظام؟`)) return;
    try {
      await LocalAuthService.deleteUser(id);
      toast({ title: "تم الحذف", description: `تم حذف المستخدم ${name}.` });
      await loadUsers();
    } catch (e: any) {
      console.error("Delete user error:", e);
      toast({ variant: "destructive", title: "خطأ", description: e?.message || "تعذر حذف المستخدم." });
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 font-black text-[11px] px-2.5 py-0.5">مالك النظام (Owner)</Badge>;
      case 'manager':
        return <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/40 font-black text-[11px] px-2.5 py-0.5">مدير فرع / نظام</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-700 dark:text-slate-300 border border-slate-500/30 font-black text-[11px] px-2.5 py-0.5">موظف مبيعات / كاشير</Badge>;
    }
  };

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-300 pb-20" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">إدارة المستخدمين والصلاحيات</h1>
            <Badge className="bg-primary/10 text-primary border-none font-black text-xs px-2.5 py-0.5 rounded-full">
              محلي SQLite
            </Badge>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground font-medium">إنشاء حسابات الموظفين، تعيين الصلاحيات، ورموز الدخول السريعة.</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl font-black h-11 px-5 gap-2 shadow-md bg-primary hover:bg-primary/90 text-white">
              <UserPlus className="h-4 w-4" /> إضافة مستخدم جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-primary">إنشاء حساب مستخدم جديد</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddEmployee} className="space-y-4 pt-3">
               <div className="space-y-1.5">
                  <Label className="font-bold text-xs">اسم المستخدم لتسجيل الدخول (Username) <span className="text-destructive">*</span></Label>
                  <Input name="username" required placeholder="مثال: ali99 أو user1" className="rounded-xl h-11 bg-slate-50 dark:bg-slate-800 text-sm font-bold font-mono" dir="ltr" />
                  <p className="text-[10px] text-muted-foreground">يُستخدم هذا الاسم في شاشة الدخول مع رمز PIN.</p>
               </div>
               <div className="space-y-1.5">
                  <Label className="font-bold text-xs">الاسم المعروض (Display Name) <span className="text-destructive">*</span></Label>
                  <Input name="displayName" required placeholder="مثال: علي محمد" className="rounded-xl h-11 bg-slate-50 dark:bg-slate-800 text-sm font-bold" />
               </div>
               <div className="space-y-1.5">
                  <Label className="font-bold text-xs">رمز الدخول السري (PIN) <span className="text-destructive">*</span></Label>
                  <Input name="pin" required type="password" placeholder="••••" className="rounded-xl h-11 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-center tracking-widest font-mono" dir="ltr" />
                  <p className="text-[10px] text-muted-foreground">4 أرقام أو حروف على الأقل لتسجيل الدخول السريع.</p>
               </div>
               <div className="space-y-1.5">
                  <Label className="font-bold text-xs">الدور والصلاحيات <span className="text-destructive">*</span></Label>
                  <Select name="role" defaultValue="staff">
                    <SelectTrigger className="rounded-xl h-11 bg-slate-50 dark:bg-slate-800 text-sm font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                       <SelectItem value="manager" className="font-bold text-xs">مدير فرع (كافة الصلاحيات ما عدا إعدادات النظام الحساسة)</SelectItem>
                       <SelectItem value="staff" className="font-bold text-xs">موظف مبيعات / كاشير (فواتير البيع والمخزن فقط)</SelectItem>
                    </SelectContent>
                  </Select>
               </div>
               <DialogFooter className="pt-2">
                  <Button type="submit" disabled={isSaving} className="w-full h-11 rounded-xl font-black text-sm gap-2">
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                    <span>إنشاء الحساب وحفظه</span>
                  </Button>
               </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="rounded-xl border shadow-sm bg-white dark:bg-slate-900">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-muted-foreground">إجمالي الحسابات المفعلة</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">{users.length}</p>
              <p className="text-[11px] text-emerald-600 font-bold">مستخدمين مسجلين في النظام</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
              <User className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border shadow-sm bg-white dark:bg-slate-900">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-muted-foreground">أمان البيانات والتوثيق</span>
              <p className="text-sm font-black text-slate-900 dark:text-white">تشفير محلي متوافق مع Argon2</p>
              <p className="text-[11px] text-blue-600 font-bold">رموز المرور مشفرة ومحمية محلياً 100%</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600">
              <Shield className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-black border-y text-xs">
              <TableHead className="text-right py-3.5 px-4">المستخدم</TableHead>
              <TableHead className="text-right">اسم الدخول (Username)</TableHead>
              <TableHead className="text-right">المستوى والصلاحية</TableHead>
              <TableHead className="text-right">آخر تسجيل دخول</TableHead>
              <TableHead className="text-left px-4">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="px-4 py-3"><Skeleton className="h-6 w-36 rounded-lg" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24 rounded-lg" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24 rounded-lg" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-28 rounded-lg" /></TableCell>
                  <TableCell className="px-4 text-left"><Skeleton className="h-8 w-12 rounded-lg" /></TableCell>
                </TableRow>
              ))
            ) : users.length > 0 ? (
              users.map((u: any) => (
                <TableRow key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors text-xs font-bold">
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center font-black text-primary text-sm">
                        {u.displayName?.[0] || u.username?.[0] || 'U'}
                      </div>
                      <div>
                        <span className="font-black text-sm block text-slate-800 dark:text-slate-200">{u.displayName}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">ID: {u.id.substring(0, 8)}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-slate-700 dark:text-slate-300 font-black">
                    @{u.username}
                  </TableCell>
                  <TableCell>
                    {getRoleBadge(u.role)}
                  </TableCell>
                  <TableCell className="text-slate-500 font-mono text-[11px]">
                    {u.lastLogin ? new Date(Number(u.lastLogin)).toLocaleString("ar-IQ") : 'لم يسجل دخول بعد'}
                  </TableCell>
                  <TableCell className="text-left px-4">
                    {u.role !== 'owner' ? (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10" 
                        onClick={() => handleDelete(u.id, u.displayName)}
                        title="حذف المستخدم"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : (
                      <span className="text-[10px] text-muted-foreground font-bold px-2">المدير الأساسي</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-36 text-center text-muted-foreground font-bold text-xs">
                  لا يوجد مستخدمون مسجلون بعد.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
