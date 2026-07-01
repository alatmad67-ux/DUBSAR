
'use client';

import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  Star, 
  ChevronLeft,
  Settings2,
  TrendingUp,
  Tags
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, where, limit, orderBy } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function Home() {
  const db = useFirestore();
  const [activeBanner, setActiveBanner] = useState(0);

  // Dynamic Queries
  const bannersQuery = useMemo(() => collection(db, 'banners'), [db]);
  const typesQuery = useMemo(() => collection(db, 'motorcycleTypes'), [db]);
  const categoriesQuery = useMemo(() => collection(db, 'categories'), [db]);
  const featuredQuery = useMemo(() => query(collection(db, 'products'), where('isFeatured', '==', true), limit(6)), [db]);
  const newArrivalsQuery = useMemo(() => query(collection(db, 'products'), where('isNewArrival', '==', true), limit(4)), [db]);
  const offersQuery = useMemo(() => collection(db, 'offers'), [db]);

  const { data: banners, loading: bannersLoading } = useCollection(bannersQuery);
  const { data: types, loading: typesLoading } = useCollection(typesQuery);
  const { data: categories, loading: categoriesLoading } = useCollection(categoriesQuery);
  const { data: featuredProducts, loading: featuredLoading } = useCollection(featuredQuery);
  const { data: newArrivals, loading: newLoading } = useCollection(newArrivalsQuery);
  const { data: offers, loading: offersLoading } = useCollection(offersQuery);

  useEffect(() => {
    if (banners.length > 0) {
      const timer = setInterval(() => {
        setActiveBanner((prev) => (prev + 1) % banners.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [banners.length]);

  return (
    <div className="flex min-h-screen bg-[#FDF8F5] text-foreground">
      <main className="flex-1 pb-24">
        <Header />
        
        <div className="container space-y-8 animate-fade-in pb-10">
          {/* Hero Banner Section */}
          <section className="relative px-4 pt-6">
            <div className="relative h-[220px] md:h-[350px] w-full overflow-hidden rounded-[32px] shadow-2xl transition-all duration-1000 bg-muted">
              {bannersLoading ? (
                <Skeleton className="h-full w-full rounded-[32px]" />
              ) : banners.length > 0 ? (
                banners.map((banner: any, idx) => (
                  <div 
                    key={banner.id}
                    className={cn(
                      "absolute inset-0 transition-opacity duration-1000",
                      idx === activeBanner ? 'opacity-100 z-10' : 'opacity-0 z-0'
                    )}
                  >
                    <Image 
                      src={banner.image || "https://picsum.photos/seed/moto_banner/1200/500"} 
                      alt={banner.title}
                      fill
                      className="object-cover"
                      priority={idx === 0}
                    />
                    <div className={cn("absolute inset-0 p-6 flex flex-col justify-center gap-2 bg-gradient-to-r from-black/70 via-black/20 to-transparent")}>
                      <Badge className="w-fit bg-primary text-white border-none text-[10px] px-3 py-1 rounded-full uppercase tracking-widest">
                        عرض حصري
                      </Badge>
                      <h2 className="text-2xl md:text-5xl font-black text-white max-w-xs leading-tight">
                        {banner.title}
                      </h2>
                      <p className="text-sm md:text-xl text-white/90 max-w-sm">
                        {banner.subtitle}
                      </p>
                      <Button className="w-fit mt-4 rounded-full bg-white text-black hover:bg-white/90 font-bold px-8 shadow-lg">
                        اكتشف الآن
                      </Button>
                    </div>
                  </div>
                ))
              ) : null}
              {banners.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
                  {banners.map((_, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300",
                        i === activeBanner ? 'w-6 bg-primary' : 'w-1.5 bg-white/50'
                      )} 
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Motorcycle Types */}
          <section className="space-y-4 px-4 overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-black tracking-tight">أنواع الدراجات</h3>
              </div>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
              {typesLoading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-3 shrink-0">
                    <Skeleton className="h-20 w-20 rounded-full" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))
              ) : types.map((type: any) => (
                <div key={type.id} className="flex flex-col items-center gap-3 shrink-0 group cursor-pointer">
                  <div className="relative h-20 w-20 rounded-full border-2 border-primary/20 p-1 transition-all group-hover:border-primary">
                    <div className="relative h-full w-full overflow-hidden rounded-full bg-white shadow-inner">
                      <Image src={type.image || `https://picsum.photos/seed/${type.id}/200/200`} alt={type.name} fill className="object-cover" />
                    </div>
                  </div>
                  <span className="text-xs font-bold">{type.name}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Featured Categories Grid */}
          <section className="space-y-4 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-black tracking-tight">التصنيفات المميزة</h3>
              </div>
              <Link href="/catalog">
                <Button variant="link" className="text-primary font-bold text-sm">
                  عرض الكل <ChevronLeft className="h-4 w-4 mr-1" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {categoriesLoading ? (
                Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-40 rounded-[24px]" />)
              ) : categories.map((cat: any) => (
                <Link key={cat.id} href={`/catalog/${cat.id}`}>
                  <div className="relative h-40 overflow-hidden rounded-[24px] bg-white group cursor-pointer shadow-sm">
                    <Image 
                      src={cat.image || `https://picsum.photos/seed/${cat.id}/300/300`} 
                      alt={cat.name} 
                      fill 
                      className="object-cover opacity-80 transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/20 flex flex-col justify-end p-4">
                      <h4 className="text-white font-black text-lg">{cat.name}</h4>
                      <p className="text-white/80 text-[10px] font-medium">{cat.itemsCount} منتج</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Featured Products Scroll */}
          <section className="space-y-4 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-black tracking-tight">منتجات مختارة</h3>
              </div>
            </div>
            <div className="flex gap-5 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4">
              {featuredLoading ? (
                Array(4).fill(0).map((_, i) => <Skeleton key={i} className="min-w-[200px] h-[300px] rounded-[24px]" />)
              ) : featuredProducts.map((p: any) => (
                <div key={p.id} className="min-w-[200px] md:min-w-[250px]">
                  <ProductCard 
                    id={p.id}
                    name={p.name}
                    category={p.category}
                    price={p.retailPrice.toLocaleString()}
                    image={p.images?.[0] || `https://picsum.photos/seed/${p.id}/500/500`}
                    isNew={p.isNewArrival}
                    inStock={p.stock > 0}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Special Offers Section */}
          <section className="px-4">
            {offersLoading ? (
              <Skeleton className="h-[200px] w-full rounded-[32px]" />
            ) : offers.map((offer: any) => (
              <div key={offer.id} className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#1A1A1A] to-primary p-8 text-white shadow-xl mb-4">
                <div className="relative z-10 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Tags className="h-5 w-5 text-primary-foreground" />
                    <span className="text-[10px] font-black uppercase tracking-widest">عرض خاص</span>
                  </div>
                  <h3 className="text-3xl font-black max-w-[200px] leading-tight">{offer.title}</h3>
                  <p className="text-sm text-white/80 max-w-xs">{offer.description}</p>
                  <Button className="w-fit mt-2 rounded-full bg-white text-primary font-bold hover:bg-white/90">
                    {offer.buttonText || "اكتشف المزيد"}
                  </Button>
                </div>
                <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
                <div className="absolute -top-10 -right-10 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
                {offer.image && <Image src={offer.image} alt={offer.title} fill className="object-cover opacity-30 -z-10" />}
              </div>
            ))}
          </section>

          {/* New Arrivals Grid */}
          <section className="space-y-4 px-4">
             <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-black tracking-tight">أحدث المنتجات</h3>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {newLoading ? (
                Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-[300px] rounded-[24px]" />)
              ) : newArrivals.map((p: any) => (
                <ProductCard 
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  category={p.category}
                  price={p.retailPrice.toLocaleString()}
                  image={p.images?.[0] || `https://picsum.photos/seed/${p.id}/500/500`}
                />
              ))}
            </div>
            <Link href="/catalog" className="block w-full">
              <Button variant="outline" className="w-full rounded-full border-2 border-primary/20 font-bold text-primary py-6">
                مشاهدة المزيد من المنتجات
              </Button>
            </Link>
          </section>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
