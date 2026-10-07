
'use client';

import { 
  Plus, 
  Search, 
  Image as ImageIcon,
  Download,
  Trash2,
  Edit2,
  Eye,
  Loader2,
  X,
  Package,
  Camera,
  Upload,
  History,
  Save,
  Zap,
  MoreHorizontal,
  Barcode,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMemo, useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { toast } from "@/hooks/use-toast";
import { InventoryService } from "@/services/inventory-service";
import { cn } from "@/lib/utils";

export default function ProductsManagementPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Real-time duplicate check states
  const [formName, setFormName] = useState("");
  const [formBarcode, setFormBarcode] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([
        InventoryService.getProducts(),
        InventoryService.getCategories()
      ]);
      setProducts(p);
      setCategories(c);
    } catch (e) {
      toast({ variant: "destructive", title: "فشل تحميل البيانات المحلية" });
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p: any) => 
      (p.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) || 
      (p.barcode || "").includes(searchQuery)
    );
  }, [products, searchQuery]);

  // Real-time duplicate finder to avoid re-adding existing items
  const potentialDuplicates = useMemo(() => {
    const trimmedName = formName.trim().toLowerCase();
    const trimmedBarcode = formBarcode.trim();
    if (!trimmedName && !trimmedBarcode) return [];
    if (trimmedName.length < 2 && !trimmedBarcode) return [];

    return products.filter((p: any) => {
      if (editingProduct?.id && p.id === editingProduct.id) return false;
      const matchName = trimmedName && p.name && p.name.toLowerCase().includes(trimmedName);
      const matchBarcode = trimmedBarcode && p.barcode && p.barcode === trimmedBarcode;
      return matchName || matchBarcode;
    }).slice(0, 3);
  }, [products, formName, formBarcode, editingProduct]);

  const handleAction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    
    const productData = {
      id: editingProduct?.id,
      name: formName || formData.get('name'),
      barcode: formBarcode || formData.get('barcode'),
      categoryId: formData.get('categoryId'),
      brand: formData.get('brand'),
      retailPrice: Number(formData.get('retailPrice')),
      wholesalePrice: Number(formData.get('wholesalePrice')),
      agentPrice: Number(formData.get('agentPrice')),
      unit: formData.get('unit'),
      purchasePrice: Number(formData.get('purchasePrice')),
      stockQuantity: Number(formData.get('stock')),
      minStockLevel: Number(formData.get('minStockLevel')),
      description: formData.get('description'),
    };

    try {
      if (editingProduct?.id) {
        await InventoryService.updateProduct(editingProduct.id, productData);
      } else {
        await InventoryService.saveProduct(productData);
      }
      toast({ title: "تم حفظ بيانات المادة بنجاح" });
      setIsDialogOpen(false);
      setEditingProduct(null);
      setFormName('');
      setFormBarcode('');
      loadData();
    } catch (error) {
      toast({ variant: "destructive", title: "تعذر حفظ المادة، حاول مرة أخرى" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه المادة؟")) return;
    await InventoryService.deleteProduct(id);
    loadData();
  };

  const openCreateDialog = () => {
    setEditingProduct(null);
    setFormName('');
    setFormBarcode('');
    setIsDialogOpen(true);
  };

  const openEditDialog = (p: any) => {
    setEditingProduct(p);
    setFormName(p.name || '');
    setFormBarcode(p.barcode || '');
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">إدارة المواد والمنتجات</h1>
          <p className="text-muted-foreground font-medium text-sm">سجل المواد والأسعار والمخزون</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/products/barcode">
            <Button variant="outline" className="rounded-xl font-bold h-11 gap-2 border-primary/30 text-primary hover:bg-primary/5">
              <Barcode className="h-4 w-4" /> استوديو طباعة الباركود
            </Button>
          </Link>

          <Button onClick={openCreateDialog} className="rounded-xl font-bold h-11 gap-2 shadow-sm">
            <Plus className="h-5 w-5" /> إضافة مادة جديدة
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-2xl rounded-[32px]">
              <form onSubmit={handleAction} className="space-y-6">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black">
                    {editingProduct ? 'تعديل بيانات المادة' : 'إضافة مادة جديدة للمخزن'}
                  </DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4" dir="rtl">
                  <div className="space-y-2">
                    <Label>الاسم</Label>
                    <Input 
                      name="name" 
                      value={formName} 
                      onChange={(e) => setFormName(e.target.value)} 
                      placeholder="اكتب اسم المادة..." 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الباركود</Label>
                    <Input 
                      name="barcode" 
                      value={formBarcode} 
                      onChange={(e) => setFormBarcode(e.target.value)} 
                      placeholder="امسح أو اكتب الباركود..." 
                    />
                  </div>

                  {/* Real-time duplicate prevention warning */}
                  {potentialDuplicates.length > 0 && (
                    <div className="col-span-2 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-100 space-y-2">
                      <div className="flex items-center gap-2 font-black text-xs">
                        <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                        <span>تنبيه: توجد مواد مسجلة مسبقاً بنفس الاسم لمنع تكرار المادة!</span>
                      </div>
                      <div className="divide-y divide-amber-200 dark:divide-amber-800/50 text-xs">
                        {potentialDuplicates.map(dup => (
                          <div key={dup.id} className="py-2 flex items-center justify-between">
                            <div>
                              <span className="font-black">{dup.name}</span>
                              <span className="text-[11px] text-muted-foreground mr-2 font-mono">باركود: {dup.barcode || 'بدون'} | الرصيد: {dup.stockQuantity} | السعر: {Number(dup.retailPrice).toLocaleString()} د.ع</span>
                            </div>
                            <Button 
                              type="button" 
                              size="sm" 
                              variant="outline" 
                              className="h-7 text-xs font-bold border-amber-400 bg-white dark:bg-slate-900"
                              onClick={() => {
                                setEditingProduct(dup);
                                setFormName(dup.name || '');
                                setFormBarcode(dup.barcode || '');
                              }}
                            >
                              تعديل هذه المادة بدلاً من الإضافة
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>الماركة</Label>
                    <Input name="brand" defaultValue={editingProduct?.brand} />
                  </div>
                    <div className="space-y-2">
                      <Label>الحد الأدنى للمخزون</Label>
                      <Input name="minStockLevel" type="number" defaultValue={editingProduct?.minStockLevel || 5} />
                    </div>
                    <div className="space-y-2">
                      <Label>سعر الشراء</Label>
                      <Input name="purchasePrice" type="number" defaultValue={editingProduct?.purchasePrice} />
                    </div>
                    <div className="space-y-2">
                      <Label>سعر البيع</Label>
                      <Input name="retailPrice" type="number" defaultValue={editingProduct?.retailPrice} />
                    </div>
                    <div className="space-y-2">
                      <Label>سعر الجملة</Label>
                      <Input name="wholesalePrice" type="number" defaultValue={editingProduct?.wholesalePrice} />
                    </div>
                    <div className="space-y-2">
                      <Label>سعر الوكيل</Label>
                      <Input name="agentPrice" type="number" defaultValue={editingProduct?.agentPrice} />
                    </div>
                    <div className="space-y-2">
                      <Label>الوحدة</Label>
                      <Input name="unit" defaultValue={editingProduct?.unit || "قطعة"} />
                    </div>
                    <div className="space-y-2">
                      <Label>الكمية</Label>
                      <Input name="stock" type="number" defaultValue={editingProduct?.stockQuantity} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isSaving}>{isSaving ? <Loader2 className="animate-spin" /> : "حفظ في القاعدة المحلية"}</Button>
                  </DialogFooter>
                </form>
             </DialogContent>
           </Dialog>
        </div>
      </div>

      <div className="relative max-w-md" dir="rtl">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input placeholder="بحث..." className="h-14 rounded-2xl pr-12 border-none shadow-sm bg-white" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
      </div>

      <div className="rounded-[32px] border-none bg-white shadow-sm overflow-hidden" dir="rtl">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="text-right py-6 px-6 font-black">المنتج</TableHead>
              <TableHead className="text-right font-black">الأسعار</TableHead>
              <TableHead className="text-right font-black">المخزون</TableHead>
              <TableHead className="text-left px-6 font-black">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array(3).fill(0).map((_, i) => <TableRow key={i}><TableCell colSpan={4} className="p-8"><Skeleton className="h-10 w-full" /></TableCell></TableRow>)
            ) : filteredProducts.map((p: any) => (
              <TableRow key={p.id} className="hover:bg-muted/5">
                <TableCell className="px-6 font-bold">{p.name}</TableCell>
                <TableCell className="font-black text-primary">{p.retailPrice?.toLocaleString()} د.ع</TableCell>
                <TableCell className="font-black">{p.stockQuantity} قطعة</TableCell>
                <TableCell className="text-left px-6">
                  <div className="flex gap-2">
                    <Link href={`/admin/products/barcode?productId=${p.id}`}>
                      <Button variant="ghost" size="icon" title="طباعة ملصق باركود">
                        <Barcode className="h-4 w-4 text-primary" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon" title="تعديل المادة" onClick={() => openEditDialog(p)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" title="حذف" onClick={() => handleDelete(p.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
