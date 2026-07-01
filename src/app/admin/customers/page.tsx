
'use client';

import { 
  Users, 
  Search, 
  UserPlus, 
  Filter, 
  MoreHorizontal, 
  Mail, 
  Phone,
  ArrowUpRight,
  Tags,
  BadgeDollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function CustomersManagementPage() {
  const db = useFirestore();
  const customersQuery = useMemo(() => query(collection(db, 'users'), orderBy('createdAt', 'desc')), [db]);
  const { data: customers, loading } = useCollection(customersQuery);
  const [search, setSearch] = useState("");

  const filtered = customers.filter((c: any) => 
    (c.displayName?.toLowerCase() || "").includes(search.toLowerCase()) ||
    (c.phoneNumber || "").includes(search)
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight">إدارة العملاء</h1>
          <p className="text-muted-foreground font-medium text-sm">متابعة سجلات الزبائن، أنواع العضوية، وإحصائيات الشراء.</p>
        </div>
        <Button className="rounded-xl font-bold h-11 shadow-lg shadow-primary/20 gap-2">
          <UserPlus className="h-5 w-5" /> إضافة عميل يدوياً
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="بحث باسم العميل أو رقم الهاتف..." 
            className="h-14 rounded-2xl bg-white dark:bg-card pr-12 border-none shadow-sm text-lg"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" className="h-14 rounded-2xl border-none shadow-sm bg-white dark:bg-card px-8 gap-2 font-black">
           <Filter className="h-5 w-5" /> تصفية النوع
        </Button>
      </div>

      <div className="rounded-[32px] border-none bg-white dark:bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b bg-muted/30 hover:bg-muted/30">
              <TableHead className="text-right font-black text-xs uppercase tracking-widest py-6 px-6">العميل</TableHead>
              <TableHead className="text-right font-black text-xs uppercase tracking-widest">نوع الحساب</TableHead>
              <TableHead className="text-right font-black text-xs uppercase tracking-widest">رقم الهاتف</TableHead>
              <TableHead className="text-right font-black text-xs uppercase tracking-widest">تاريخ الانضمام</TableHead>
              <TableHead className="text-right font-black text-xs uppercase tracking-widest">إجمالي المشتريات</TableHead>
              <TableHead className="text-left font-black text-xs uppercase tracking-widest px-6">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array(6).fill(0).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="px-6"><div className="flex items-center gap-3"><Skeleton className="h-12 w-12 rounded-full" /><Skeleton className="h-4 w-32" /></div></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="px-6 text-left"><Skeleton className="h-8 w-8 rounded-lg" /></TableCell>
                </TableRow>
              ))
            ) : filtered.length > 0 ? (
              filtered.map((customer: any) => (
                <TableRow key={customer.id} className="hover:bg-muted/5 transition-colors group">
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-lg shadow-inner">
                        {customer.displayName?.[0] || <Users className="h-5 w-5" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-sm">{customer.displayName || 'بدون اسم'}</span>
                        <span className="text-[10px] text-muted-foreground font-bold">{customer.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn(
                      "rounded-full px-4 py-1 border-none font-black text-[10px] gap-1.5",
                      customer.role === 'wholesale_customer' ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
                    )}>
                       {customer.role === 'wholesale_customer' ? <Tags className="h-3 w-3" /> : <Users className="h-3 w-3" />}
                       {customer.role === 'wholesale_customer' ? 'عميل جملة' : 'عميل مفرد'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-bold text-sm" dir="ltr">{customer.phoneNumber || 'غير مسجل'}</TableCell>
                  <TableCell className="text-muted-foreground text-xs font-bold">
                    {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString("ar-EG") : '-'}
                  </TableCell>
                  <TableCell className="font-black text-primary">
                    <div className="flex items-center gap-1">
                      <BadgeDollarSign className="h-4 w-4 opacity-50" />
                      {(Math.random() * 500000).toLocaleString(undefined, { maximumFractionDigits: 0 })} د.ع
                    </div>
                  </TableCell>
                  <TableCell className="text-left px-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-2xl"><MoreHorizontal className="h-5 w-5" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-[24px] p-2 w-52 shadow-2xl border-none">
                        <DropdownMenuItem className="rounded-xl gap-3 p-3 font-bold cursor-pointer"><ArrowUpRight className="h-4 w-4" /> عرض السجل الكامل</DropdownMenuItem>
                        <DropdownMenuItem className="rounded-xl gap-3 p-3 font-bold cursor-pointer"><Phone className="h-4 w-4" /> اتصل الآن</DropdownMenuItem>
                        <DropdownMenuItem className="rounded-xl gap-3 p-3 font-bold cursor-pointer text-orange-600"><Tags className="h-4 w-4" /> تحويل إلى جملة</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center opacity-30">
                   <div className="flex flex-col items-center gap-4">
                      <Users className="h-16 w-16" strokeWidth={1} />
                      <p className="font-black text-xl">لا يوجد عملاء مطابقين للبحث</p>
                   </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

