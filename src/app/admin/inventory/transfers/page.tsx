'use client';

import { useEffect, useState } from 'react';
import { ArrowLeftRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InventoryService } from '@/services/inventory-service';
import { toast } from '@/hooks/use-toast';

export default function InventoryTransfersPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [productId, setProductId] = useState('');
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [saving, setSaving] = useState(false);
  useEffect(() => { Promise.all([InventoryService.getProducts(), InventoryService.getWarehouses()]).then(([p, w]) => { setProducts(p); setWarehouses(w); setSourceId(w[0]?.id || ''); setTargetId(w[1]?.id || ''); }).catch((error) => toast({ variant: 'destructive', title: 'فشل تحميل النقل', description: String(error) })); }, []);
  const transfer = async () => {
    if (!productId || !sourceId || !targetId || sourceId === targetId || quantity <= 0) { toast({ variant: 'destructive', title: 'بيانات النقل غير مكتملة' }); return; }
    setSaving(true);
    try { const user = JSON.parse(localStorage.getItem('dubsar_session') || '{}'); await InventoryService.transferStock(sourceId, targetId, productId, quantity, user, 'نقل مخزون يدوي'); toast({ title: 'تم اعتماد النقل' }); setQuantity(1); } catch (error) { toast({ variant: 'destructive', title: 'فشل نقل المخزون', description: String(error) }); } finally { setSaving(false); }
  };
  return <div className="max-w-3xl space-y-6" dir="rtl"><div><h1 className="text-3xl font-black">نقل المخزون</h1><p className="text-sm font-bold text-muted-foreground">عملية ذرية بين مستودعين مع سجل حركتين</p></div><div className="rounded-xl border bg-white p-6 space-y-5"><div><Label>المادة</Label><select className="mt-2 h-12 w-full rounded-lg border px-3 font-bold" value={productId} onChange={(event) => setProductId(event.target.value)}><option value="">اختر المادة</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name} | مخزون {product.stockQuantity}</option>)}</select></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><Label>من المستودع</Label><select className="mt-2 h-12 w-full rounded-lg border px-3 font-bold" value={sourceId} onChange={(event) => setSourceId(event.target.value)}>{warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}</select></div><div><Label>إلى المستودع</Label><select className="mt-2 h-12 w-full rounded-lg border px-3 font-bold" value={targetId} onChange={(event) => setTargetId(event.target.value)}>{warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}</select></div></div><div><Label>الكمية</Label><Input className="mt-2 h-12" type="number" min="1" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} /></div><Button className="w-full h-14 gap-2 font-black" disabled={saving} onClick={transfer}>{saving ? <Loader2 className="animate-spin" /> : <ArrowLeftRight className="h-5 w-5" />}اعتماد النقل</Button></div></div>;
}
