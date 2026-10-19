'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowRight, Loader2, Minus, Plus, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { InventoryService } from '@/services/inventory-service';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface PurchaseItem {
  productId: string;
  name: string;
  barcode?: string;
  previousCost: number;
  unitCost: number;
  retailPrice: number;
  wholesalePrice: number;
  quantity: number;
}

export default function NewPurchasePage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [supplierId, setSupplierId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit'>('cash');
  const [discount, setDiscount] = useState(0);
  const [paid, setPaid] = useState(0);
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      InventoryService.getProducts(),
      InventoryService.getSuppliers(),
      InventoryService.getWarehouses()
    ])
      .then(([p, s, w]) => {
        setProducts(p || []);
        setSuppliers(s || []);
        setWarehouses(w || []);
        if (w && w.length > 0) {
          setWarehouseId(w[0].id);
        }
      })
      .catch((error) =>
        toast({
          variant: 'destructive',
          title: 'فشل تحميل بيانات الشراء',
          description: String(error)
        })
      );
  }, []);

  const suggestions = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.trim().toLowerCase();
    return products
      .filter((p) => `${p.name || ''} ${p.barcode || ''}`.toLowerCase().includes(q))
      .slice(0, 10);
  }, [products, search]);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitCost) || 0), 0);
  }, [items]);

  const total = Math.max(0, subtotal - (Number(discount) || 0));

  const addItem = (product: any) => {
    setItems((current) => {
      const existing = current.find((item) => item.productId === product.id);
      if (existing) {
        return current.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...current,
        {
          productId: product.id,
          name: product.name,
          barcode: product.barcode,
          previousCost: Number(product.purchasePrice || 0),
          unitCost: Number(product.purchasePrice || 0),
          retailPrice: Number(product.retailPrice || 0),
          wholesalePrice: Number(product.wholesalePrice || 0),
          quantity: 1
        }
      ];
    });
    setSearch('');
  };

  const updateItem = (productId: string, patch: Partial<PurchaseItem>) => {
    setItems((current) =>
      current.map((item) => (item.productId === productId ? { ...item, ...patch } : item))
    );
  };

  const save = async () => {
    if (!supplierId || !warehouseId || !items.length) {
      toast({ variant: 'destructive', title: 'بيانات غير مكتملة', description: 'يرجى اختيار المورد والمستودع وإضافة مادة واحدة على الأقل.' });
      return;
    }
    if (paymentMethod === 'cash') {
      setPaid(total);
    }
    if (paymentMethod === 'credit' && paid > total) {
      toast({ variant: 'destructive', title: 'خطأ في المبلغ', description: 'المبلغ المدفوع لا يمكن أن يتجاوز صافي الفاتورة.' });
      return;
    }

    setSaving(true);
    try {
      const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('dubsar_session') || '{}') : {};
      const result = await InventoryService.createPurchase(
        {
          supplierId,
          warehouseId,
          paymentMethod,
          discountAmount: Number(discount) || 0,
          paidAmount: paymentMethod === 'cash' ? total : Number(paid) || 0,
          updatePrices: true,
          items: items.map((i) => ({
            productId: i.productId,
            quantity: Number(i.quantity) || 1,
            unitCost: Number(i.unitCost) || 0,
            retailPrice: Number(i.retailPrice) || 0,
            wholesalePrice: Number(i.wholesalePrice) || 0
          }))
        },
        user
      );

      toast({
        title: 'تم اعتماد فاتورة الشراء بنجاح',
        description: `رقم القائمة: ${result?.purchaseNo || 'جديد'}`
      });
      router.push('/admin/purchases');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'فشل اعتماد فاتورة الشراء',
        description: String(error)
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 select-none animate-in fade-in duration-300" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/admin/purchases" className="text-muted-foreground hover:text-primary transition-colors">
              <ArrowRight className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">فاتورة شراء جديدة</h1>
          </div>
          <p className="text-xs md:text-sm font-bold text-muted-foreground mt-1">
            اعتماد الشراء مع تثبيت آخر كلفة، تنبيه بتغير الأسعار، وتحديث أسعار البيع مباشرة.
          </p>
        </div>
        <Button
          className="gap-2 font-black h-11 px-6 shadow-md bg-primary hover:bg-primary/90 text-white"
          disabled={saving || items.length === 0}
          onClick={save}
        >
          {saving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
          اعتماد واستلام الفاتورة
        </Button>
      </div>

      {/* Main Info Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-2xl border bg-white dark:bg-slate-900 p-5 shadow-sm">
        <div>
          <Label className="font-black text-sm">المورد</Label>
          <select
            className="mt-2 h-11 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background px-3 font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none"
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
          >
            <option value="">اختر المورد...</option>
            {suppliers.map((row) => (
              <option key={row.id} value={row.id}>
                {row.name} {row.phone ? `(${row.phone})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label className="font-black text-sm">المستودع المستلم</Label>
          <select
            className="mt-2 h-11 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background px-3 font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none"
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
          >
            {warehouses.map((row) => (
              <option key={row.id} value={row.id}>
                {row.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label className="font-black text-sm">طريقة الدفع</Label>
          <select
            className="mt-2 h-11 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-background px-3 font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'credit')}
          >
            <option value="cash">نقدي (تم تسديد كامل المبلغ)</option>
            <option value="credit">آجل (إضافة المتبقي لحساب المورد)</option>
          </select>
        </div>
      </div>

      {/* Search Product Box */}
      <div className="relative rounded-2xl border bg-white dark:bg-slate-900 p-4 shadow-sm">
        <Label className="font-black text-sm mb-2 block">إضافة مادة إلى قائمة الشراء</Label>
        <Input
          placeholder="ابحث عن مادة بالاسم أو الباركود ثم اضغط للإضافة..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 rounded-xl font-bold"
        />
        {search.trim() && suggestions.length > 0 && (
          <div className="absolute z-20 left-4 right-4 top-[84px] rounded-xl border bg-white dark:bg-slate-900 shadow-2xl overflow-hidden max-h-72 overflow-y-auto">
            {suggestions.map((product) => (
              <button
                type="button"
                key={product.id}
                className="w-full border-b last:border-b-0 p-3 text-right font-bold hover:bg-primary/5 flex items-center justify-between transition-colors"
                onClick={() => addItem(product)}
              >
                <div>
                  <span className="font-black text-slate-800 dark:text-slate-100">{product.name}</span>
                  {product.barcode && <span className="mr-2 text-xs text-muted-foreground font-mono">[{product.barcode}]</span>}
                </div>
                <div className="text-xs text-muted-foreground flex gap-3">
                  <span>الكلفة السابقة: {Number(product.purchasePrice || 0).toLocaleString()} د.ع</span>
                  <span>المتوفر: {product.stockQuantity || 0}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Items Table */}
      <div className="overflow-x-auto rounded-2xl border bg-white dark:bg-slate-900 shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-b">
            <tr>
              <th className="p-3 text-right font-black">المادة</th>
              <th className="p-3 text-center font-black w-36">الكمية</th>
              <th className="p-3 text-right font-black w-28">الكلفة السابقة</th>
              <th className="p-3 text-right font-black w-36">كلفة الشراء الجديدة</th>
              <th className="p-3 text-right font-black w-32">سعر المفرد</th>
              <th className="p-3 text-right font-black w-32">سعر الجملة</th>
              <th className="p-3 text-right font-black w-32">الإجمالي</th>
              <th className="p-3 text-center w-12"></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-muted-foreground font-bold">
                  لم يتم إضافة مواد بعد. استخدم شريط البحث أعلاه لإدراج المواد.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const costChanged = item.unitCost !== item.previousCost;
                const costDiff = item.unitCost - item.previousCost;
                return (
                  <tr key={item.productId} className="border-b last:border-b-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-3 font-black">
                      <div className="text-slate-900 dark:text-white">{item.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{item.barcode || 'بدون باركود'}</div>
                      {costChanged && (
                        <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                          <AlertCircle className="h-3 w-3 shrink-0" />
                          <span>
                            تغيرت كلفة الشراء (السابقة: {item.previousCost.toLocaleString()} ← الحالية: {item.unitCost.toLocaleString()})
                            {costDiff > 0 ? ` +${costDiff.toLocaleString()}` : ` ${costDiff.toLocaleString()}`}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-lg"
                          onClick={() => updateItem(item.productId, { quantity: Math.max(1, item.quantity - 1) })}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          className="h-8 w-16 text-center font-black rounded-lg"
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.productId, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-lg"
                          onClick={() => updateItem(item.productId, { quantity: item.quantity + 1 })}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-500">
                      {item.previousCost.toLocaleString()}
                    </td>
                    <td className="p-3">
                      <Input
                        className="h-9 w-32 font-mono font-bold rounded-lg"
                        type="number"
                        min="0"
                        value={item.unitCost}
                        onChange={(e) => updateItem(item.productId, { unitCost: Math.max(0, Number(e.target.value) || 0) })}
                      />
                    </td>
                    <td className="p-3">
                      <Input
                        className="h-9 w-28 font-mono font-bold rounded-lg text-emerald-700 dark:text-emerald-400"
                        type="number"
                        min="0"
                        value={item.retailPrice}
                        onChange={(e) => updateItem(item.productId, { retailPrice: Math.max(0, Number(e.target.value) || 0) })}
                      />
                    </td>
                    <td className="p-3">
                      <Input
                        className="h-9 w-28 font-mono font-bold rounded-lg text-blue-700 dark:text-blue-400"
                        type="number"
                        min="0"
                        value={item.wholesalePrice}
                        onChange={(e) => updateItem(item.productId, { wholesalePrice: Math.max(0, Number(e.target.value) || 0) })}
                      />
                    </td>
                    <td className="p-3 font-mono font-black text-slate-900 dark:text-white">
                      {(item.quantity * item.unitCost).toLocaleString()}
                    </td>
                    <td className="p-3 text-center">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-lg"
                        onClick={() => setItems((rows) => rows.filter((row) => row.productId !== item.productId))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Box */}
      <div className="ml-auto max-w-sm rounded-2xl border bg-white dark:bg-slate-900 p-5 space-y-3 shadow-sm">
        <div className="flex justify-between font-bold text-sm text-slate-600 dark:text-slate-300">
          <span>مجموع المواد:</span>
          <span className="font-mono">{subtotal.toLocaleString()} د.ع</span>
        </div>
        <div className="flex justify-between items-center font-bold text-sm">
          <span>الخصم الممنوح:</span>
          <Input
            className="w-28 h-9 font-mono font-bold rounded-lg text-center"
            type="number"
            min="0"
            value={discount}
            onChange={(e) => setDiscount(Number(e.target.value) || 0)}
          />
        </div>
        <div className="flex justify-between items-center text-lg font-black text-primary border-t pt-2">
          <span>الصافي المطلوب:</span>
          <span className="font-mono">{total.toLocaleString()} د.ع</span>
        </div>
        {paymentMethod === 'credit' && (
          <div className="flex justify-between items-center font-bold text-sm border-t pt-2">
            <span>المدفوع نقداً:</span>
            <Input
              className="w-28 h-9 font-mono font-bold rounded-lg text-center text-emerald-600"
              type="number"
              min="0"
              value={paid}
              onChange={(e) => setPaid(Number(e.target.value) || 0)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
