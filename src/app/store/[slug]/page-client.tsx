
'use client';

import { use, useMemo, useEffect } from "react";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, where, limit, orderBy } from "firebase/firestore";
import { useTenantData } from "@/hooks/use-tenant-data";
import { StoreHeader } from "@/components/store/store-header";
import { StoreBottomNav } from "@/components/store/store-bottom-nav";
import { StoreCategoryItem } from "@/components/store/store-category-item";
import { StoreProductCard } from "@/components/store/store-product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import Image from "next/image";
import Link from "next/link";
import { Search, Package, AlertCircle, Zap, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StoreHomePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const db = useFirestore();
  const { tenant, loading: tenantLoading, error: tenantError } = useTenantData(slug);
  const baseUrl = `/store/${slug}`;

  const bannersQuery = useMemo(() => 
    tenant?.tenantId ? query(
      collection(db, 'banners'), 
      where('tenantId', '==', tenant.tenantId), 
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    ) : null, 
  [db, tenant]);
  
  const categoriesQuery = useMemo(() => 
    tenant?.tenantId ? query(
      collection(db, 'categories'), 
      where('tenantId', '==', tenant.tenantId), 
      orderBy('name'),
      limit(10)
    ) : null, 
  [db, tenant]);
  
  const productsQuery = useMemo(() => 
    tenant?.tenantId ? query(
      collection(db, 'products'), 
      where('tenantId', '==', tenant.tenantId), 
      orderBy('createdAt', 'desc'),
      limit(12)
    ) : null, 
  [db, tenant]);

  const { data: banners, loading: bannersLoading } = useCollection(bannersQuery);
  const { data: categories, loading: categoriesLoading } = useCollection(categoriesQuery);
  const { data: products, loading: productsLoading } = useCollection(productsQuery);

  if (tenantLoading) return (
    <div className="flex h-screen items-center justify-center bg-white">
      <Skeleton className="h-12 w-12 rounded-full" />
    </div>
  );

  if (tenantError || !tenant) return (
    <div className="h-screen flex flex-col items-center justify-center p-8 text-center gap-6 bg-[#FDF8F5]">
       <AlertCircle className="h-12 w-12 text-red-500" />
       <h2 className="text-2xl font-black">{tenantError || 'المتجر غير متاح'}</h2>
       <Link href="/"><Button className="rounded-full px-10 h-12 font-bold">العودة للمنصة</Button></Link>
    </div>
  );

  return (
    <div className="pb-40 animate-in fade-in duration-500 min-h-screen bg-[#F8F9FA]" dir="rtl">
      <StoreHeader tenant={tenant} />
      
      <main className="container mx-auto px-4 space-y-10 mt-6 max-w-4xl">
        <div className="relative group">
          <Search className="absolute right-6 top-1/2 -translate-y-1/2 h-5 w-5 opacity-30" />
          <input 
            type="text" 
            placeholder="ابحث عن منتج أو قسم في هذا المتجر..." 
            onClick={() => window.location.href = `${baseUrl}/search`}
            readOnly
            className="w-full h-16 rounded-[28px] border-none shadow-sm pr-14 pl-12 font-bold text-base bg-white cursor-pointer"
          />
        </div>

        <section className="relative overflow-hidden rounded-[40px] shadow-lg bg-white">
          {bannersLoading ? (
            <Skeleton className="aspect-[2.4/1] w-full" />
          ) : banners.length > 0 ? (
            <Carousel opts={{ loop: true, direction: 'rtl' }}>
              <CarouselContent>
                {banners.map((b: any) => (
                  <CarouselItem key={b.id}>
                    <div className="relative aspect-[2.4/1] w-full">
                       <Image src={b.image} alt={b.title} fill className="object-cover" />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent p-6 md:p-10 flex flex-col justify-end text-white">
                          <h2 className="text-2xl md:text-5xl font-black mb-1 md:mb-2">{b.title}</h2>
                          <p className="text-xs md:text-lg font-bold opacity-90">{b.subtitle}</p>
                       </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          ) : null}
        </section>

        <section className="space-y-6">
           <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black">الأقسام</h3>
              <Link href={`${baseUrl}/catalog`} className="text-xs font-black opacity-40 hover:opacity-100 flex items-center gap-1">
                عرض الكل <ChevronLeft className="h-3 w-3" />
              </Link>
           </div>
           <div className="flex gap-6 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4">
              {categoriesLoading ? (
                Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-24 w-24 rounded-full shrink-0" />)
              ) : categories.map((cat: any) => (
                <StoreCategoryItem key={cat.id} slug={slug} category={cat} />
              ))}
           </div>
        </section>

        <section className="space-y-8">
           <h3 className="text-2xl font-black flex items-center gap-3">
             <Zap className="h-6 w-6 text-yellow-500 fill-yellow-500" /> أحدث المنتجات
           </h3>
           
           {productsLoading ? (
             <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
               {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="aspect-[4/5] rounded-[32px]" />)}
             </div>
           ) : products.length > 0 ? (
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
               {products.map((p: any) => (
                 <StoreProductCard key={p.id} slug={slug} product={p} />
               ))}
             </div>
           ) : (
             <div className="py-24 text-center opacity-20 bg-white rounded-[40px] border-2 border-dashed">
                <Package className="h-16 w-16 mx-auto mb-4" />
                <p className="font-black text-xl">لا توجد منتجات حالياً</p>
             </div>
           )}
        </section>
      </main>

      <StoreBottomNav slug={slug} />
    </div>
  );
}
