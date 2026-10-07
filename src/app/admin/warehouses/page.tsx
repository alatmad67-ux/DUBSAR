'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus, Save, Warehouse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InventoryService } from '@/services/inventory-service';
import { toast } from '@/hooks/use-toast';

export default function WarehousesPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const load = async () => { try { setRows(await InventoryService.getWarehouses()); } catch (error) { toast({ variant: 'destructive', title: 'فشل تحميل المستودعات', description: String(error) }); } };
  useEffect(() => { load(); }, []);
  const create = async () => { if (!name.trim()) return; setSaving(true); try { const user = JSON.parse(localStorage.getItem('dubsar_session') || '{}'); await InventoryService.createWarehouse({ name: name.trim(), description }, user); setName(''); setDescription(''); await load(); toast({ title: 'تم إنشاء المستودع' }); } catch (error) { toast({ variant: 'destructive', title: 'فشل إنشاء المستودع', description: String(error) }); } finally { setSaving(false); } };
  return <div className="space-y-6" dir="rtl"><div><h1 className="text-3xl font-black">المستودعات</h1><p className="text-sm font-bold text-muted-foreground">إدارة المستودعات والفروع وتوزيع المخزون</p></div><div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end rounded-xl border bg-white p-4"><div><Label>اسم المستودع</Label><Input className="mt-2" value={name} onChange={(event) => setName(event.target.value)} /></div><div><Label>الوصف</Label><Input className="mt-2" value={description} onChange={(event) => setDescription(event.target.value)} /></div><Button className="gap-2 font-black" disabled={saving} onClick={create}>{saving ? <Loader2 className="animate-spin" /> : <Plus className="h-4 w-4" />}إنشاء</Button></div><div className="overflow-x-auto rounded-xl border bg-white"><table className="w-full text-sm"><thead className="bg-muted/40"><tr><th className="p-4 text-right">المستودع</th><th className="p-4 text-right">الوصف</th><th className="p-4 text-right">الحالة</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-t"><td className="p-4 font-black"><Warehouse className="inline ml-2 h-4 w-4 text-primary" />{row.name}</td><td className="p-4">{row.description || '-'}</td><td className="p-4 font-bold">{row.active ? 'فعال' : 'غير فعال'}</td></tr>)}</tbody></table>{!rows.length && <div className="p-10 text-center text-muted-foreground">لا توجد مستودعات</div>}</div></div>;
}
