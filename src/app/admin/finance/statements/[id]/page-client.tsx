'use client';

import { useState, useMemo } from "react";
import { 
  FileText, 
  Printer, 
  Download, 
  ChevronRight,
  TrendingDown,
  TrendingUp,
  ArrowRightLeft,
  Calendar,
  User,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFirestore, useDoc, useCollection, useUser } from "@/firebase";
import { doc, collection, query, where, orderBy } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { PrintEngine } from "@/services/print-engine";

export default function AccountStatementPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const db = useFirestore();
  const { tenantId } = useUser();

  const userRef = useMemo(() => doc(db, 'users', id), [db, id]);
  const { data: customer, loading: userLoading } = useDoc<any>(userRef);

  // FIXED: Scoped to tenantId and userId
  const transactionsQuery = useMemo(() => 
    query(
      collection(db, 'financialTransactions'), 
      where('tenantId', '==', tenantId),
      where('userId', '==', id), 
      orderBy('timestamp', 'desc')
    ), 
  [db, id, tenantId]);
  const { data: transactions, loading: transLoading } = useCollection(transactionsQuery);

  const handlePrint = async () => {
    try {
      const appSettings = JSON.parse(localStorage.getItem('dubsar_app_settings') || '{}');
      await PrintEngine.printAccountStatement({
        customerName: customer?.displayName || 'زبون عام',
        customerPhone: customer?.phoneNumber || '',
        currentBalance: Number(customer?.currentBalance || 0),
        totalPaid: Number(customer?.totalPaid || 0),
        transactions: (transactions || []).map((t: any) => ({
          id: t.id,
          date: new Date(t.timestamp).toLocaleString("ar-IQ"),
          type: t.type,
          description: t.description,
          amount: t.amount,
        })),
        businessSettings: appSettings
      });
    } catch (e) {
      console.error('Failed to print account statement', e);
    }
  };

  if (userLoading) return <div className="p-10 text-center"><Loader2 className="h-10 w-10 animate-spin mx-auto opacity-20" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between no-print">
        <div className="flex items-center gap-4">
           <Button variant="ghost" size="icon" className="rounded-xl bg-white shadow-sm" onClick={() => router.back()}>
              <ChevronRight className="h-5 w-5 rotate-180" />
           </Button>
           <div>
              <h1 className="text-3xl font-black">كشف حساب العميل</h1>
              <p className="text-muted-foreground font-medium">سجل الحركات المالية للفواتير والمدفوعات.</p>
           </div>
        </div>
        <div className="flex gap-3">
           <Button variant="outline" className="rounded-xl border-2 font-bold h-11 gap-2" onClick={handlePrint}>
              <Printer className="h-4 w-4" /> طباعة الكشف
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-[32px] bg-white border shadow-sm space-y-4">
           <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><User className="h-5 w-5" /></div>
              <span className="font-black">بيانات العميل</span>
           </div>
           <div className="space-y-1">
              <p className="text-lg font-black">{customer?.displayName}</p>
              <p className="text-xs text-muted-foreground font-bold" dir="ltr">{customer?.phoneNumber}</p>
           </div>
        </div>

        <div className="p-6 rounded-[32px] bg-red-50 border-red-100 border shadow-sm space-y-2">
           <p className="text-[10px] font-black text-red-800 uppercase tracking-widest">الرصيد المستحق (الدين)</p>
           <h3 className="text-3xl font-black text-red-900">{customer?.currentBalance?.toLocaleString()} د.ع</h3>
           <div className="flex items-center gap-1 text-red-700 text-[10px] font-bold">
              <TrendingUp className="h-3 w-3" /> ذمة مالية مفتوحة
           </div>
        </div>

        <div className="p-6 rounded-[32px] bg-green-50 border-green-100 border shadow-sm space-y-2">
           <p className="text-[10px] font-black text-green-800 uppercase tracking-widest">إجمالي التسديدات</p>
           <h3 className="text-3xl font-black text-green-900">{customer?.totalPaid?.toLocaleString()} د.ع</h3>
           <div className="flex items-center gap-1 text-green-700 text-[10px] font-bold">
              <TrendingDown className="h-3 w-3" /> تم استلامها بنجاح
           </div>
        </div>
      </div>

      <div className="rounded-[40px] overflow-hidden bg-white shadow-sm border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="text-right py-6 px-8">التاريخ والوقت</TableHead>
              <TableHead className="text-right">نوع الحركة</TableHead>
              <TableHead className="text-right">التفاصيل</TableHead>
              <TableHead className="text-right">المبلغ</TableHead>
              <TableHead className="text-right">الرصيد المتبقي</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transLoading ? (
               Array(6).fill(0).map((_, i) => (
                 <TableRow key={i}>
                    <TableCell colSpan={5} className="px-8 py-4"><Skeleton className="h-10 w-full rounded-xl" /></TableCell>
                 </TableRow>
               ))
            ) : transactions.length > 0 ? (
              transactions.map((t: any) => (
                <TableRow key={t.id} className="hover:bg-muted/5 transition-colors">
                  <TableCell className="px-8 py-5">
                    <div className="flex items-center gap-2">
                       <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                       <span className="text-xs font-bold">{new Date(t.timestamp).toLocaleString("ar-EG")}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase",
                      t.type === 'sale' || t.type === 'purchase' ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
                    )}>
                      {t.type === 'sale' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {t.type === 'sale' ? 'فاتورة مبيعات' : t.type === 'purchase' ? 'فاتورة مشتريات' : 'دفعة مادية'}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-medium max-w-[200px] truncate">{t.description}</TableCell>
                  <TableCell className={cn("font-black", t.amount > 0 ? "text-red-600" : "text-green-600")}>
                    {Math.abs(t.amount)?.toLocaleString()} د.ع
                  </TableCell>
                  <TableCell className="font-bold text-sm text-slate-900">
                    -
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                   <div className="flex flex-col items-center gap-4 opacity-20">
                      <ArrowRightLeft className="h-16 w-16" strokeWidth={1} />
                      <p className="font-black text-xl">لا توجد حركات مسجلة</p>
                   </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .rounded-[40px] { border-radius: 0 !important; }
          table { border-collapse: collapse !important; width: 100% !important; }
          th, td { border: 1px solid #eee !important; }
        }
      `}</style>
    </div>
  );
}
