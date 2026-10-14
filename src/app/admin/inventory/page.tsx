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

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">إدارة المخزون والجرد</h1>
          <p className="text-sm font-bold text-muted-foreground">متابعة الكميات وحركات المستودعات والجرد الفعلي</p>
        </div>
        <Button variant="outline" className="gap-2 font-black rounded-xl h-10 px-4 bg-white dark:bg-slate-900 shadow-sm" onClick={load}>
          <RefreshCw className="h-4 w-4" /> تحديث البيانات
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border bg-white dark:bg-slate-900 p-4 shadow-sm">
          <p className="text-xs font-bold text-muted-foreground">إجمالي الأصناف</p>
          <p className="text-2xl font-black mt-1 font-mono">{filtered.length}</p>
        </div>
        <div className="rounded-2xl border bg-white dark:bg-slate-900 p-4 shadow-sm">
          <p className="text-xs font-bold text-muted-foreground">المخزون المنخفض</p>
          <p className="text-2xl font-black text-orange-600 mt-1 font-mono">
            {filtered.filter((row) => row.quantity > 0 && row.quantity <= row.minStockLevel).length}
          </p>
        </div>
        <div className="rounded-2xl border bg-white dark:bg-slate-900 p-4 shadow-sm">
          <p className="text-xs font-bold text-muted-foreground">الأصناف النافدة</p>
          <p className="text-2xl font-black text-red-600 mt-1 font-mono">
            {filtered.filter((row) => row.quantity === 0).length}
          </p>
        </div>
        <div className="rounded-2xl border bg-white dark:bg-slate-900 p-4 shadow-sm">
          <p className="text-xs font-bold text-muted-foreground">إجمالي قيمة الشراء</p>
          <p className="text-2xl font-black text-primary mt-1 font-mono">{inventoryValue.toLocaleString()} د.ع</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border shadow-sm">
        <div className="relative flex-1 min-w-[240px] max-w-xl">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="h-10 pr-10 rounded-xl font-bold text-xs"
            placeholder="بحث بالاسم أو الباركود أو الماركة..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <select
          className="h-10 min-w-[170px] rounded-xl border bg-white dark:bg-slate-800 px-3 text-xs font-bold"
          value={warehouseId}
          onChange={(event) => setWarehouseId(event.target.value)}
        >
          {warehouses.map((warehouse) => (
            <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
          ))}
        </select>
        <select
          className="h-10 min-w-[150px] rounded-xl border bg-white dark:bg-slate-800 px-3 text-xs font-bold"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="all">كل الحالات</option>
          <option value="available">متوفر</option>
          <option value="low">مخزون منخفض</option>
          <option value="out">نافد</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-white dark:bg-slate-900 shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-100/80 dark:bg-slate-800/80 border-b text-xs font-black">
            <tr>
              <th className="p-3.5 text-right min-w-[220px]">المادة والماركة</th>
              <th className="p-3.5 text-right w-40">الباركود</th>
              <th className="p-3.5 text-center w-28">الوحدة</th>
              <th className="p-3.5 text-center w-32">الكمية المتوفرة</th>
              <th className="p-3.5 text-center w-36">سعر الشراء</th>
              <th className="p-3.5 text-center w-40">القيمة الإجمالية</th>
              <th className="p-3.5 text-center w-32">الحالة</th>
              <th className="p-3.5 text-left w-28">إجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-10 text-center">
                  <Loader2 className="mx-auto animate-spin text-primary" />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-10 text-center text-muted-foreground font-bold text-xs">
                  لا توجد أصناف مطابقة للبحث
                </td>
              </tr>
            ) : (
              filtered.map((row) => {
                const low = row.quantity > 0 && row.quantity <= row.minStockLevel;
                return (
                  <tr key={`${row.id}-${warehouseId}`} className="hover:bg-muted/20 transition-colors">
                    <td className="p-3.5 font-black">
                      <div>{row.name}</div>
                      <span className="block text-[11px] text-muted-foreground font-bold">{row.brand || 'بدون ماركة'}</span>
                    </td>
                    <td className="p-3.5 text-xs font-mono text-muted-foreground">{row.barcode || '-'}</td>
                    <td className="p-3.5 text-center text-xs font-bold">{row.unit || 'قطعة'}</td>
                    <td className="p-3.5 text-center font-black font-mono text-base">{row.quantity}</td>
                    <td className="p-3.5 text-center font-mono text-xs font-bold">{Number(row.purchasePrice || 0).toLocaleString()} د.ع</td>
                    <td className="p-3.5 text-center font-mono font-black text-primary">
                      {(Number(row.purchasePrice || 0) * Number(row.quantity || 0)).toLocaleString()} د.ع
                    </td>
                    <td className="p-3.5 text-center">
                      <span className={`inline-block rounded-full px-3 py-1 text-xs font-black ${row.quantity === 0 ? 'bg-red-100 text-red-700' : low ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                        {row.quantity === 0 ? 'نافد' : low ? 'منخفض' : 'متوفر'}
                      </span>
                    </td>
                    <td className="p-3.5 text-left">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 font-bold rounded-lg h-8 text-xs"
                        onClick={() => { setSelected(row); setActual(Number(row.quantity)); }}
                      >
                        <ClipboardCheck className="h-3.5 w-3.5 text-primary" />جرد
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-5 border">
            <div className="flex items-center gap-3">
              <Warehouse className="text-primary h-6 w-6" />
              <div>
                <h2 className="text-xl font-black">جرد المادة</h2>
                <p className="text-sm font-bold text-muted-foreground">{selected.name}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm font-bold">
              <div className="rounded-xl bg-muted/30 p-3 border">النظام: <span className="font-mono font-black">{selected.quantity}</span></div>
              <div className="rounded-xl bg-muted/30 p-3 border">الفرق: <span className="font-mono font-black">{actual - selected.quantity}</span></div>
            </div>
            <div>
              <Label className="font-black">الكمية الفعلية</Label>
              <Input
                type="number"
                min="0"
                value={actual}
                onChange={(event) => setActual(Number(event.target.value))}
                className="mt-2 h-11 rounded-xl font-mono font-black"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 rounded-xl font-bold" onClick={() => setSelected(null)}>إلغاء</Button>
              <Button className="flex-1 gap-2 font-black rounded-xl" disabled={saving} onClick={approveCount}>
                {saving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}اعتماد الجرد
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
