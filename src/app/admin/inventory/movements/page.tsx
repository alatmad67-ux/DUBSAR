'use client';

import { useEffect, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InventoryService } from '@/services/inventory-service';
import { toast } from '@/hooks/use-toast';

export default function InventoryMovementsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const load = async () => { setLoading(true); try { setRows(await InventoryService.getStockMovements(undefined, undefined, 200)); } catch (error) { toast({ variant: 'destructive', title: 'فشل تحميل حركات المخزون', description: String(error) }); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  return <div className="space-y-6" dir="rtl"><div className="flex items-center justify-between"><div><h1 className="text-3xl font-black">حركات المخزون</h1><p className="text-sm font-bold text-muted-foreground">سجل موثق لكافة حركات المخزون والتحويلات</p></div><Button variant="outline" className="gap-2 font-black" onClick={load}><RefreshCw className="h-4 w-4" />تحديث</Button></div><div className="overflow-x-auto rounded-xl border bg-white"><table className="w-full text-sm"><thead className="bg-muted/40"><tr><th className="p-4 text-right">التاريخ</th><th className="p-4 text-right">المادة</th><th className="p-4 text-right">المستودع</th><th className="p-4 text-right">النوع</th><th className="p-4 text-right">قبل</th><th className="p-4 text-right">الكمية</th><th className="p-4 text-right">بعد</th><th className="p-4 text-right">المستخدم</th></tr></thead><tbody>{loading ? <tr><td colSpan={8} className="p-10 text-center"><Loader2 className="mx-auto animate-spin" /></td></tr> : rows.map((row) => <tr key={row.id} className="border-t"><td className="p-4 text-xs">{new Date(row.createdAt).toLocaleString('ar-IQ')}</td><td className="p-4 font-black">{row.productName}</td><td className="p-4">{row.warehouseName}</td><td className="p-4 font-bold">{row.movementType}</td><td className="p-4">{row.beforeQuantity}</td><td className="p-4 font-black">{row.quantity}</td><td className="p-4">{row.afterQuantity}</td><td className="p-4">{row.userName || '-'}</td></tr>)}</tbody></table></div></div>;
}
