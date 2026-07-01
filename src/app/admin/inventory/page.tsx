
'use client';

import { useState, useMemo } from "react";
import { Search, Box, AlertTriangle, ArrowUpDown, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function InventoryPage() {
  const db = useFirestore();
  const [search, setSearch] = useState("");
  const productsQuery = useMemo(() => query(collection(db, 'products'), orderBy('stock', 'asc')), [db]);
  const { data: products, loading } = useCollection(productsQuery);

  const filtered = products.filter((p: any) => 
    p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search)
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black">إدارة المخزون</h1>
          <p className="text-muted-foreground font-medium">مراقبة مستويات المخزون وتنبيهات النقص.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-xl gap-2 h-11"><History className="h-4 w-4" /> سجل الحركات</Button>
          <Button className="rounded-xl gap-2 h-11"><Box className="h-5 w-5" /> جرد المخزن</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 rounded-[28px] border-none shadow-sm bg-orange-50">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-black text-orange-800 uppercase tracking-widest">مخزون منخفض</p>
              <h3 className="text-3xl font-black text-orange-900">{products.filter((p: any) => p.stock < 5 && p.stock > 0).length}</h3>
            </div>
          </div>
        </Card>
        <Card className="p-6 rounded-[28px] border-none shadow-sm bg-red-50">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-black text-red-800 uppercase tracking-widest">نفذت الكمية</p>
              <h3 className="text-3xl font-black text-red-900">{products.filter((p: any) => p.stock === 0).length}</h3>
            </div>
          </div>
        </Card>
        <Card className="p-6 rounded-[28px] border-none shadow-sm bg-blue-50">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Box className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-black text-blue-800 uppercase tracking-widest">إجمالي الأصناف</p>
              <h3 className="text-3xl font-black text-blue-900">{products.length}</h3>
            </div>
          </div>
        </Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="البحث بالاسم أو الباركود..." 
          className="h-12 rounded-xl pr-10 border-none shadow-sm bg-white"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-[32px] overflow-hidden bg-white shadow-sm border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="text-right py-5">المنتج</TableHead>
              <TableHead className="text-right">الموقع</TableHead>
              <TableHead className="text-right">الكمية الحالية</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-left">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array(6).fill(0).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-6 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))
            ) : filtered.map((p: any) => (
              <TableRow key={p.id}>
                <TableCell className="font-bold">{p.name}</TableCell>
                <TableCell className="text-muted-foreground text-xs">{p.storageLocation || 'غير محدد'}</TableCell>
                <TableCell className={cn("font-black", p.stock < 5 ? "text-destructive" : "")}>{p.stock}</TableCell>
                <TableCell>
                  <Badge className={cn(
                    "rounded-full border-none font-bold text-[10px]",
                    p.stock === 0 ? "bg-red-100 text-red-700" : p.stock < 5 ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"
                  )}>
                    {p.stock === 0 ? "نفذت" : p.stock < 5 ? "منخفض" : "متوفر"}
                  </Badge>
                </TableCell>
                <TableCell className="text-left">
                  <Button variant="ghost" size="sm" className="rounded-xl font-bold text-primary">تعديل الكمية</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function Card({ children, className, ...props }: any) {
  return <div className={cn("bg-card rounded-xl border p-4 shadow-sm", className)} {...props}>{children}</div>;
}
