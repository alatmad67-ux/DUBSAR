
'use client';

import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function CatalogPage() {
  const db = useFirestore();
  const categoriesQuery = useMemo(() => query(collection(db, 'categories'), orderBy('name')), [db]);
  const { data: categories, loading } = useCollection(categoriesQuery);

  return (
    <div className="flex min-h-screen bg-background">
      <main className="flex-1 pb-24">
        <Header />
        
        <div className="container space-y-6 p-4">
          <div className="flex flex-col gap-4">
            <h2 className="text-3xl font-black tracking-tight">الأقسام</h2>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="ابحث عن قسم..." 
                  className="rounded-full bg-muted/50 pr-10 border-none h-12"
                />
              </div>
              <button className="h-12 w-12 flex items-center justify-center rounded-full bg-primary text-white shadow-lg">
                <SlidersHorizontal className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            {loading ? (
              Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-48 rounded-[28px]" />)
            ) : categories.map((cat: any) => (
              <Link key={cat.id} href={`/catalog/${cat.id}`}>
                <div className="group relative h-48 overflow-hidden rounded-[28px] bg-white shadow-sm hover:shadow-md transition-all">
                  <Image 
                    src={cat.image || `https://picsum.photos/seed/${cat.id}/400/400`} 
                    alt={cat.name} 
                    fill 
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5">
                    <Badge variant="secondary" className="w-fit mb-2 bg-white/20 text-white border-none backdrop-blur-md">
                      {cat.itemsCount || 0} منتج
                    </Badge>
                    <h3 className="text-xl font-black text-white">{cat.name}</h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
