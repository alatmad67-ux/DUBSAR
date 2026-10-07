'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InventoryService } from '@/services/inventory-service';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function PurchasesPage() {
  const [rows, setRows] = useState<any[]>([]); const [search, setSearch] = useState('');
  useEffect(() => { InventoryService.getPurchases().then(setRows).catch((error) => toast({ variant: 'destructive', title: 'فشل تحميل المشتريات', description: String(error) })); }, []);
  const filtered = useMemo(() => rows.filter((row) => `${row.purchaseNo} ${row.supplierName} ${row.warehouseName}`.toLowerCase().includes(search.toLowerCase())), [rows, search]);
  return <div className="space-y-6" dir="rtl"><div className="flex items-end justify-between"><div><h1 className="text-3xl font-black">فواتير الشراء</h1><p className="text-sm font-bold text-muted-foreground">فواتير محلية مرتبطة بالمخزون وذمم الموردين</p></div><Link href="/admin/purchases/new"><Button className="gap-2 font-black"><Plus className="h-4 w-4" />فاتورة شراء جديدة</Button></Link></div><div className="relative max-w-lg"><Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4" /><Input className="pr-10" placeholder="بحث برقم الفاتورة أو المورد أو المستودع" value={search} onChange={(event) => setSearch(event.target.value)} /></div><div className="overflow-x-auto rounded-xl border bg-white"><table className="w-full text-sm"><thead className="bg-muted/40"><tr><th className="p-4 text-right">رقم الفاتورة</th><th className="p-4 text-right">المورد</th><th className="p-4 text-right">المستودع</th><th className="p-4 text-right">الإجمالي</th><th className="p-4 text-right">الدفع</th><th className="p-4 text-right">التاريخ</th></tr></thead><tbody>{filtered.map((row) => <tr key={row.id} className="border-t"><td className="p-4 font-black text-primary">{row.purchaseNo}</td><td className="p-4">{row.supplierName}</td><td className="p-4">{row.warehouseName}</td><td className="p-4 font-black">{Number(row.totalAmount).toLocaleString()} د.ع</td><td className="p-4">{row.paymentStatus === 'paid' ? 'نقدي' : 'آجل'}</td><td className="p-4 text-xs">{new Date(row.createdAt).toLocaleString('ar-IQ')}</td></tr>)}</tbody></table>{!filtered.length && <div className="p-10 text-center text-muted-foreground">لا توجد فواتير شراء</div>}</div></div>;
}
