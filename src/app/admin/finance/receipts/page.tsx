'use client';

import { useState, useMemo, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Receipt, 
  User, 
  Banknote, 
  Calendar, 
  Printer,
  Loader2,
  Filter,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { InventoryService } from "@/services/inventory-service";
import { PrintEngine } from "@/services/print-engine";
import { Badge } from "@/components/ui/badge";

export default function ReceiptVouchersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [amountInput, setAmountInput] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<any>({});

  useEffect(() => {
    try {
      const sessionStr = localStorage.getItem('dubsar_session');
      if (sessionStr) setCurrentUser(JSON.parse(sessionStr));
    } catch {
      setCurrentUser({});
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [customerRows] = await Promise.all([
        InventoryService.getCustomers()
      ]);
      setCustomers(Array.isArray(customerRows) ? customerRows : []);

      const savedVouchers = localStorage.getItem('dubsar_receipt_vouchers');
      if (savedVouchers) {
        setVouchers(JSON.parse(savedVouchers));
      } else {
        setVouchers([]);
      }
    } catch (e) {
      console.error("Failed to load receipt vouchers data:", e);
    } finally {
      setLoading(false);
    }
  };

  const selectedCustomer = useMemo(() => {
    return customers.find(c => String(c.id) === String(selectedCustomerId));
  }, [customers, selectedCustomerId]);

  const filtered = useMemo(() => {
    return vouchers.filter((v: any) => 
      (v.customerName?.toLowerCase() || "").includes(search.toLowerCase()) || 
      (v.voucherNumber || "").includes(search)
    );
  }, [vouchers, search]);

  const handleAddVoucher = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCustomerId || !selectedCustomer) {
      toast({ variant: "destructive", title: "تنبيه", description: "يرجى اختيار العميل أولاً." });
      return;
    }

    const amount = Number(amountInput);
    if (!amount || amount <= 0) {
      toast({ variant: "destructive", title: "تنبيه", description: "يرجى إدخال مبلغ صحيح." });
      return;
    }

    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    const paymentMethod = String(formData.get('method') || 'cash');
    const notes = String(formData.get('notes') || '').trim();

    try {
      const currentBalance = Number(selectedCustomer.balance) || 0;
      const newBalance = Math.max(0, currentBalance - amount);

      // 1. Update customer balance in SQLite
      await InventoryService.updateCustomer(
        selectedCustomer.id,
        { ...selectedCustomer, balance: newBalance },
        currentUser
      );

      // 2. Create voucher record
      const voucherNumber = `RV-${Date.now().toString().slice(-6)}`;
      const newVoucher = {
        id: `rv_${Date.now()}`,
        voucherNumber,
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name || "غير معروف",
        customerPhone: selectedCustomer.phone || "",
        amount,
        paymentMethod,
        notes,
        employeeName: currentUser?.displayName || currentUser?.username || 'المسؤول',
        timestamp: Date.now(),
        previousBalance: currentBalance,
        currentBalance: newBalance
      };

      const updatedVouchers = [newVoucher, ...vouchers];
      setVouchers(updatedVouchers);
      localStorage.setItem('dubsar_receipt_vouchers', JSON.stringify(updatedVouchers));

      setIsAddOpen(false);
      setSelectedCustomerId("");
      setAmountInput("");
      toast({ title: "تم الحفظ بنجاح", description: `تم تسجيل سند القبض رقم ${voucherNumber} وتحديث حساب العميل.` });

      // 3. Print thermal receipt directly
      try {
        const appSettings = JSON.parse(localStorage.getItem('dubsar_app_settings') || '{}');
        await PrintEngine.printVoucher({
          voucherNo: voucherNumber,
          type: 'receipt',
          date: new Date().toLocaleDateString('ar-IQ'),
          time: new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }),
          partyName: selectedCustomer.name,
          partyPhone: selectedCustomer.phone,
          amount,
          paymentMethod,
          notes,
          employeeName: currentUser?.displayName || currentUser?.username || 'المسؤول',
          currentBalance: newBalance,
          businessSettings: appSettings
        }, '80mm');
      } catch (printErr) {
        console.error('Print voucher failed:', printErr);
      }

      await loadData();
    } catch (e: any) {
      console.error(e);
      toast({ variant: "destructive", title: "خطأ", description: e?.message || "فشل حفظ السند." });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrintExisting = async (voucher: any, format: '80mm' | 'A4') => {
    try {
      const appSettings = JSON.parse(localStorage.getItem('dubsar_app_settings') || '{}');
      await PrintEngine.printVoucher({
        voucherNo: voucher.voucherNumber,
        type: 'receipt',
        date: new Date(voucher.timestamp).toLocaleDateString('ar-IQ'),
        time: new Date(voucher.timestamp).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }),
        partyName: voucher.customerName,
        partyPhone: voucher.customerPhone,
        amount: voucher.amount,
        paymentMethod: voucher.paymentMethod,
        notes: voucher.notes,
        employeeName: voucher.employeeName,
        currentBalance: voucher.currentBalance,
        businessSettings: appSettings
      }, format);
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "خطأ في الطباعة" });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 select-none" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-2xl border shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black">سندات القبض (القبوضات)</h1>
              <p className="text-muted-foreground text-xs font-bold mt-0.5">تسجيل الدفعات النقدية والتحويلات المستلمة من الزبائن وتخفيض ديونهم</p>
            </div>
          </div>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl h-11 px-5 font-bold gap-2 shadow-sm">
              <Plus className="h-5 w-5" /> إنشاء سند قبض جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[28px] max-w-lg p-0 overflow-hidden border shadow-2xl" dir="rtl">
            <DialogHeader className="p-6 bg-slate-900 text-white">
              <DialogTitle className="text-xl font-black flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                <span>إنشاء سند قبض جديد</span>
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleAddVoucher} className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="font-bold text-xs">اختيار العميل / الزبون <span className="text-rose-500">*</span></Label>
                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId} required>
                  <SelectTrigger className="rounded-xl h-12 border bg-muted/20">
                    <SelectValue placeholder="اختر الزبون من القائمة..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl max-h-64">
                    {customers.length > 0 ? (
                      customers.map((c: any) => (
                        <SelectItem key={c.id} value={String(c.id)} className="rounded-xl font-bold py-2.5">
                          <div className="flex justify-between items-center gap-3 w-full">
                            <span>{c.name} {c.phone ? `(${c.phone})` : ''}</span>
                            <span className={`text-xs font-mono font-black ${(Number(c.balance) || 0) > 0 ? 'text-rose-600' : 'text-muted-foreground'}`}>
                              الذمة: {(Number(c.balance) || 0).toLocaleString()} د.ع
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-4 text-center text-xs text-muted-foreground font-bold">لا يوجد زبائن مسجلين حالياً</div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {selectedCustomer && (
                <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-muted-foreground font-bold block">الرصيد المستحق الحالي بذمة العميل:</span>
                    <span className="text-base font-black font-mono text-rose-600 mt-0.5 block">
                      {(Number(selectedCustomer.balance) || 0).toLocaleString()} د.ع
                    </span>
                  </div>
                  {(Number(selectedCustomer.balance) || 0) > 0 && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setAmountInput(String(selectedCustomer.balance || 0))}
                      className="text-xs font-bold rounded-lg h-8"
                    >
                      تسديد كامل المبلغ
                    </Button>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label className="font-bold text-xs">المبلغ المستلم (د.ع) <span className="text-rose-500">*</span></Label>
                <Input 
                  name="amount" 
                  type="number" 
                  required 
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder="0" 
                  className="rounded-xl h-12 text-lg font-black font-mono bg-muted/20" 
                />
              </div>

              <div className="space-y-2">
                <Label className="font-bold text-xs">طريقة القبض</Label>
                <Select name="method" defaultValue="cash">
                  <SelectTrigger className="rounded-xl h-12 bg-muted/20">
                    <SelectValue placeholder="اختر الطريقة" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="cash" className="rounded-xl font-bold">نقداً (كاش)</SelectItem>
                    <SelectItem value="transfer" className="rounded-xl font-bold">تحويل بنكي / إلكتروني</SelectItem>
                    <SelectItem value="check" className="rounded-xl font-bold">صك مصرفي</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="font-bold text-xs">البيان / ملاحظات</Label>
                <Input name="notes" placeholder="تسديد دفعة من حساب سابق..." className="rounded-xl h-12 bg-muted/20" />
              </div>

              <DialogFooter className="pt-2">
                <Button type="submit" disabled={isSaving} className="w-full h-12 rounded-xl font-black text-sm">
                  {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : "حفظ وطباعة السند"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="بحث برقم السند أو اسم العميل..." 
            className="h-11 rounded-xl pr-10 border shadow-sm bg-card font-bold text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden bg-card shadow-sm border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 font-black">
              <TableHead className="text-right py-4 px-6 text-xs font-black">رقم السند</TableHead>
              <TableHead className="text-right text-xs font-black">اسم العميل</TableHead>
              <TableHead className="text-left text-xs font-black">المبلغ المقبوض</TableHead>
              <TableHead className="text-center text-xs font-black">طريقة الدفع</TableHead>
              <TableHead className="text-right text-xs font-black">التاريخ والوقت</TableHead>
              <TableHead className="text-right text-xs font-black">المسؤول</TableHead>
              <TableHead className="text-center px-6 text-xs font-black">طباعة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array(4).fill(0).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="px-6"><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="px-6 text-center"><Skeleton className="h-8 w-16 rounded-lg mx-auto" /></TableCell>
                </TableRow>
              ))
            ) : filtered.length > 0 ? (
              filtered.map((v: any) => (
                <TableRow key={v.id} className="hover:bg-muted/10 font-bold transition-colors">
                  <TableCell className="font-mono text-primary font-black text-xs px-6">{v.voucherNumber}</TableCell>
                  <TableCell className="text-xs">{v.customerName}</TableCell>
                  <TableCell className="font-mono text-emerald-600 font-black text-left text-xs">
                    {Number(v.amount || 0).toLocaleString()} د.ع
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="text-[11px] font-bold">
                      {v.paymentMethod === 'cash' ? 'نقداً' : v.paymentMethod === 'transfer' ? 'تحويل' : v.paymentMethod === 'check' ? 'صك' : v.paymentMethod}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs font-mono">
                    {new Date(v.timestamp).toLocaleString("ar-IQ")}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{v.employeeName || 'المسؤول'}</TableCell>
                  <TableCell className="text-center px-6">
                    <div className="flex items-center justify-center gap-1.5">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 rounded-lg gap-1 text-[11px] font-bold" 
                        onClick={() => handlePrintExisting(v, '80mm')}
                        title="طباعة إيصال كاشير 80mm"
                      >
                        <Printer className="h-3.5 w-3.5 text-primary" />
                        <span>80mm</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 rounded-lg gap-1 text-[11px] font-bold" 
                        onClick={() => handlePrintExisting(v, 'A4')}
                        title="طباعة سند رسمي A4"
                      >
                        <FileText className="h-3.5 w-3.5 text-slate-700" />
                        <span>A4</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-xs font-bold">
                  لا توجد سندات قبض مسجلة حتى الآن.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
