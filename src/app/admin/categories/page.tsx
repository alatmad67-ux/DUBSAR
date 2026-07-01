
'use client';

import { useState, useMemo } from "react";
import { Plus, Search, Layers, Edit2, Trash2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import Image from "next/image";

export default function CategoriesPage() {
  const db = useFirestore();
  const [search, setSearch] = useState("");
  const categoriesQuery = useMemo(() => query(collection(db, 'categories'), orderBy('name')), [db]);
  const { data: categories, loading } = useCollection(categoriesQuery);

  const filtered = categories.filter((c: any) => c.name.toLowerCase().includes(search.toLowerCase()));

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا القسم؟ سيتم حذف التصنيف فقط ولن تُحذف المنتجات المرتبطة به.")) return;
    try {
      await deleteDoc(doc(db, "categories", id));
      toast({ title: "تم الحذف", description: "تم حذف القسم بنجاح." });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل الحذف." });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black">الأقسام</h1>
          <p className="text-muted-foreground font-medium">إدارة تصنيفات المنتجات في المتجر.</p>
        </div>
        <Button className="rounded-xl gap-2 h-12 px-6">
          <Plus className="h-5 w-5" /> إضافة قسم جديد
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="ابحث عن قسم..." 
          className="h-12 rounded-xl pr-10 border-none shadow-sm bg-white"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-[32px] overflow-hidden bg-white shadow-sm border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="text-right py-5">القسم</TableHead>
              <TableHead className="text-right">عدد المنتجات</TableHead>
              <TableHead className="text-left">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array(4).fill(0).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-10 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded-lg" /></TableCell>
                </TableRow>
              ))
            ) : filtered.map((cat: any) => (
              <TableRow key={cat.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden relative">
                      <Image src={cat.image || `https://picsum.photos/seed/${cat.id}/100/100`} alt={cat.name} fill className="object-cover" />
                    </div>
                    <span className="font-bold">{cat.name}</span>
                  </div>
                </TableCell>
                <TableCell className="font-bold">{cat.itemsCount || 0}</TableCell>
                <TableCell className="text-left">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" className="rounded-lg"><Edit2 className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="rounded-lg text-destructive" onClick={() => handleDelete(cat.id)}><Trash2 className="h-4 w-4" /></Button>
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
