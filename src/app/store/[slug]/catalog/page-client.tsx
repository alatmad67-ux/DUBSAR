
'use client';

import { use, useMemo, useState } from "react";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, where, orderBy } from "firebase/firestore";
import { useTenantData } from "@/hooks/use-tenant-data";
import { StoreHeader } from "@/components/store/store-header";
import { StoreBottomNav } from "@/components/store/store-bottom-nav";
import { StoreProductCard } from "@/components/store/store-product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LayoutGrid, Package, Search, SlidersHorizontal } from "lucide-react";

export default function StoreCatalogPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const db = useFirestore();
  const { tenant, loading: tenantLoading } = useTenantData(slug);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const categoriesQuery = useMemo(() => 
    tenant?.tenantId ? query(collection(db, 'categories'), where('tenantId', '==', tenant.tenantId), orderBy('name')) : null,
  [db, tenant]);

  const productsQuery = useMemo(() => 
    tenant?.tenantId ? query(
      collection(db, 'products'), 
      where('tenantId', '==', tenant.tenantId),
      orderBy('name')
    ) : null,
  [db, tenant]);

  const { data: categories, loading: categoriesLoading } = useCollection(categoriesQuery);
  const { data: products, loading: productsLoading } = useCollection(productsQuery);

  const filteredProducts = useMemo(() => {
    let result = products;
    if (selectedCategory) {
      result = result.filter((p: any) => p.category === selectedCategory);
    }
    if (searchQuery) {
      result = result.filter((p: any) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return result;
  }, [products, selectedCategory, searchQuery]);

  if (tenantLoading) return null;

  return (
    <div className="pb-40 min-h-screen bg-background" dir="rtl">
      <StoreHeader tenant={tenant} />
      
      <main className="container mx-auto px-4 py-8 space-y-8 max-w-4xl">
        <div className="flex flex-col gap-6">
           <h1 className="text-3xl font-black tracking-tight">استكشف المنتجات</h1>
           
           <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 opacity-30" />
              <input 
                type="text" 
                placeholder="ابحث في هذا القسم..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-14 rounded-2xl bg-white shadow-sm border-none pr-12 pl-6 font-bold"
              />
           </div>

           <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
              <Button 
                variant={selectedCategory === null ? "default" : "outline"}
                onClick={() => setSelectedCategory(null)}
                className="rounded-full font-black px-8"
              >
                الكل
              </Button>
              {categoriesLoading ? (
                Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-10 w-24 rounded-full" />)
              ) : categories.map((cat: any) => (
                <Button 
                  key={cat.id}
                  variant={selectedCategory === cat.name ? "default" : "outline"}
                  onClick={() => setSelectedCategory(cat.name)}
                  className="rounded-full font-bold px-8 whitespace-nowrap bg-white border-none shadow-sm"
                >
                  {cat.name}
                </Button>
              ))}
           </div>
        </div>

        {productsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
             {Array(8).fill(0).map((_, i) => <Skeleton key={i} className="aspect-[4/5] rounded-[32px]" />)}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
             {filteredProducts.map((p: any) => (
               <StoreProductCard key={p.id} slug={slug} product={p} />
             ))}
          </div>
        ) : (
          <div className="py-32 text-center opacity-30 space-y-4">
             <Package className="h-16 w-16 mx-auto" strokeWidth={1} />
             <p className="font-black text-xl">لا توجد منتجات مطابقة لخياراتك</p>
          </div>
        )}
      </main>

      <StoreBottomNav slug={slug} />
    </div>
  );
}
