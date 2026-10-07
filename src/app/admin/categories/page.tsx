'use client';

import { useEffect, useState } from 'react';
import { Edit2, Loader2, Plus, Save, Search, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InventoryService } from '@/services/inventory-service';
import { toast } from '@/hooks/use-toast';

export default function CategoriesPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<any>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const load = async () => { try { setRows(await InventoryService.getCategories()); } catch (error) { toast({ variant: 'destructive', title: 'فشل تحميل التصنيفات', description: String(error) }); } };
  useEffect(() => { load(); }, []);
  const save = async () => { if (!name.trim()) return; setSaving(true); try { if (editing) await InventoryService.updateCategory(editing.id, { name: name.trim() }); else await InventoryService.saveCategory(name.trim()); setName(''); setEditing(null); await load(); toast({ title: 'تم حفظ التصنيف محلياً' }); } catch (error) { toast({ variant: 'destructive', title: 'فشل حفظ التصنيف', description: String(error) }); } finally { setSaving(false); } };
  const toggle = async (row: any) => { try { await InventoryService.updateCategory(row.id, { active: !row.active }); await load(); } catch (error) { toast({ variant: 'destructive', title: 'فشل تغيير حالة التصنيف', description: String(error) }); } };
  const filtered = rows.filter((row) => row.name.toLowerCase().includes(search.toLowerCase()));
  return <div className="space-y-6" dir="rtl"><div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-black">التصنيفات</h1><p className="text-sm font-bold text-muted-foreground">أقسام وتصنيفات المواد</p></div><div className="flex gap-2"><Input placeholder="بحث" value={search} onChange={(event) => setSearch(event.target.value)} /><Button className="gap-2 font-black" onClick={() => { setEditing(null); setName(''); }}><Plus className="h-4 w-4" />تصنيف</Button></div></div><div className="flex gap-2 rounded-xl border bg-white p-4"><Label className="self-center font-black">{editing ? 'تعديل التصنيف' : 'اسم تصنيف جديد'}</Label><Input value={name} onChange={(event) => setName(event.target.value)} className="max-w-sm" /><Button disabled={saving} onClick={save} className="gap-2 font-black">{saving ? <Loader2 className="animate-spin" /> : <Save className="h-4 w-4" />}حفظ</Button></div><div className="overflow-x-auto rounded-xl border bg-white"><table className="w-full text-sm"><thead className="bg-muted/40"><tr><th className="p-4 text-right">التصنيف</th><th className="p-4 text-right">عدد المواد</th><th className="p-4 text-right">الحالة</th><th /></tr></thead><tbody>{filtered.map((row) => <tr key={row.id} className="border-t"><td className="p-4 font-black">{row.name}</td><td className="p-4">{row.productCount || 0}</td><td className="p-4">{row.active ? 'فعال' : 'معطل'}</td><td className="p-4 flex gap-1"><Button size="icon" variant="ghost" onClick={() => { setEditing(row); setName(row.name); }}><Edit2 className="h-4 w-4" /></Button><Button size="icon" variant="ghost" onClick={() => toggle(row)}><Power className="h-4 w-4" /></Button></td></tr>)}</tbody></table>{!filtered.length && <div className="p-10 text-center text-muted-foreground">لا توجد تصنيفات</div>}</div></div>;
}
