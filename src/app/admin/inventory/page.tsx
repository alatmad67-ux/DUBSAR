'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ClipboardCheck, Loader2, RefreshCw, Save, Search, Warehouse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InventoryService } from '@/services/inventory-service';
import { toast } from '@/hooks/use-toast';

export default function InventoryPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [warehouseId, setWarehouseId] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [actual, setActual] = useState(0);
  const [saving, setSaving] = useState(false);

  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('dubsar_session') || '{}') : {};
  const load = async () => {
    setLoading(true);
    try {
      const [warehouseRows, stockRows] = await Promise.all([InventoryService.getWarehouses(), InventoryService.getWarehouseStock(warehouseId || undefined)]);
      setWarehouses(warehouseRows);
      setRows(stockRows);
      if (!warehouseId && warehouseRows[0]) setWarehouseId(warehouseRows[0].id);
    } catch (error) {
      toast({ variant: 'destructive', title: 'فشل تحميل المخزون المحلي', description: String(error) });
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [warehouseId]);

  const filtered = useMemo(() => rows.filter((row) => {
    const matchesSearch = `${row.name} ${row.barcode || ''} ${row.brand || ''}`.toLowerCase().includes(search.toLowerCase());
    const rowStatus = row.quantity === 0 ? 'out' : row.quantity <= row.minStockLevel ? 'low' : 'available';
    return matchesSearch && (status === 'all' || status === rowStatus);
  }), [rows, search, status]);
  const inventoryValue = filtered.reduce((sum, row) => sum + Number(row.quantity || 0) * Number(row.purchasePrice || 0), 0);

  const approveCount = async () => {
    if (!selected || actual < 0 || !warehouseId) return;
    setSaving(true);
    try {
      await InventoryService.countStock(warehouseId, selected.id, actual, user, 'جرد من شاشة المخزون');
      toast({ title: 'تم اعتماد الجرد', description: 'تم تسجيل الفرق وحركة المخزون.' });
      setSelected(null);
      await load();
    } catch (error) { toast({ variant: 'destructive', title: 'فشل اعتماد الجرد', description: String(error) }); }
    finally { setSaving(false); }
  };

  return <div className="space-y-6" dir="rtl">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-3xl font-black">إدارة المخزون</h1><p className="text-sm font-bold text-muted-foreground">متابعة الكميات وحركات المستودعات والجرد</p></div><Button variant="outline" className="gap-2 font-black" onClick={load}><RefreshCw className="h-4 w-4" /> تحديث</Button></div>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3"><div className="rounded-xl border bg-white p-4"><p className="text-xs font-bold text-muted-foreground">الأصناف</p><p className="text-2xl font-black">{filtered.length}</p></div><div className="rounded-xl border bg-white p-4"><p className="text-xs font-bold text-muted-foreground">المخزون المنخفض</p><p className="text-2xl font-black text-orange-600">{filtered.filter((row) => row.quantity > 0 && row.quantity <= row.minStockLevel).length}</p></div><div className="rounded-xl border bg-white p-4"><p className="text-xs font-bold text-muted-foreground">النافد</p><p className="text-2xl font-black text-red-600">{filtered.filter((row) => row.quantity === 0).length}</p></div><div className="rounded-xl border bg-white p-4"><p className="text-xs font-bold text-muted-foreground">قيمة الشراء</p><p className="text-2xl font-black text-primary">{inventoryValue.toLocaleString()} د.ع</p></div></div>
    <div className="flex flex-wrap gap-3"><div className="relative flex-1 min-w-[260px]"><Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4" /><Input className="h-11 pr-10" placeholder="بحث بالاسم أو الباركود أو الماركة" value={search} onChange={(event) => setSearch(event.target.value)} /></div><select className="h-11 rounded-lg border bg-white px-3 font-bold" value={warehouseId} onChange={(event) => setWarehouseId(event.target.value)}>{warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}</select><select className="h-11 rounded-lg border bg-white px-3 font-bold" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">كل الحالات</option><option value="available">متوفر</option><option value="low">مخزون منخفض</option><option value="out">نافد</option></select></div>
    <div className="overflow-x-auto rounded-xl border bg-white"><table className="w-full text-sm"><thead className="bg-muted/40"><tr><th className="p-4 text-right">المادة</th><th className="p-4 text-right">الباركود</th><th className="p-4 text-right">الوحدة</th><th className="p-4 text-right">الكمية</th><th className="p-4 text-right">سعر الشراء</th><th className="p-4 text-right">القيمة</th><th className="p-4 text-right">الحالة</th><th /></tr></thead><tbody>{loading ? <tr><td colSpan={8} className="p-10 text-center"><Loader2 className="mx-auto animate-spin" /></td></tr> : filtered.map((row) => { const low = row.quantity > 0 && row.quantity <= row.minStockLevel; return <tr key={`${row.id}-${warehouseId}`} className="border-t hover:bg-muted/20"><td className="p-4 font-black">{row.name}<span className="block text-xs text-muted-foreground">{row.brand || 'بدون ماركة'}</span></td><td className="p-4 text-xs">{row.barcode || '-'}</td><td className="p-4">{row.unit || 'قطعة'}</td><td className="p-4 font-black">{row.quantity}</td><td className="p-4">{Number(row.purchasePrice || 0).toLocaleString()}</td><td className="p-4 font-bold">{(Number(row.purchasePrice || 0) * Number(row.quantity || 0)).toLocaleString()}</td><td className="p-4"><span className={`rounded-full px-3 py-1 text-xs font-black ${row.quantity === 0 ? 'bg-red-100 text-red-700' : low ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>{row.quantity === 0 ? 'نافد' : low ? 'منخفض' : 'متوفر'}</span></td><td className="p-4"><Button size="sm" variant="outline" className="gap-2 font-bold" onClick={() => { setSelected(row); setActual(Number(row.quantity)); }}><ClipboardCheck className="h-4 w-4" />جرد</Button></td></tr>; })}</tbody></table></div>
    {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-5"><div className="flex items-center gap-3"><Warehouse className="text-primary" /><div><h2 className="text-xl font-black">جرد المادة</h2><p className="text-sm font-bold text-muted-foreground">{selected.name}</p></div></div><div className="grid grid-cols-2 gap-3 text-sm font-bold"><div className="rounded-lg bg-muted/30 p-3">النظام: {selected.quantity}</div><div className="rounded-lg bg-muted/30 p-3">الفرق: {actual - selected.quantity}</div></div><div><Label className="font-black">الكمية الفعلية</Label><Input type="number" min="0" value={actual} onChange={(event) => setActual(Number(event.target.value))} className="mt-2 h-12" /></div><div className="flex gap-2"><Button variant="outline" className="flex-1" onClick={() => setSelected(null)}>إلغاء</Button><Button className="flex-1 gap-2 font-black" disabled={saving} onClick={approveCount}>{saving ? <Loader2 className="animate-spin" /> : <Save className="h-4 w-4" />}اعتماد الجرد</Button></div></div></div>}
  </div>;
}
