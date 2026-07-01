
'use client';

import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  Share2, 
  Minus, 
  Plus, 
  ShoppingCart, 
  ShieldCheck,
  Truck,
  RotateCcw,
  Star,
  Tags
} from "lucide-react";
import Image from "next/image";
import { useState, useMemo } from "react";
import { ProductCard } from "@/components/product-card";
import { useFirestore, useDoc, useCollection, useUser } from "@/firebase";
import { doc, collection, query, where, limit } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function ProductDetailsPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const db = useFirestore();
  const { user, profile } = useUser();
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const productRef = useMemo(() => doc(db, 'products', id), [db, id]);
  const { data: product, loading: productLoading } = useDoc<any>(productRef);

  const relatedQuery = useMemo(() => 
    product ? query(collection(db, 'products'), where('category', '==', product.category), limit(4)) : null,
    [db, product]
  );
  const { data: relatedProducts, loading: relatedLoading } = useCollection(relatedQuery);

  const isWholesale = profile?.role === 'wholesale_customer';
  const displayPrice = isWholesale ? (product?.wholesalePrice || product?.retailPrice) : product?.retailPrice;

  if (productLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <main className="flex-1 pb-24">
          <Header />
          <div className="container p-6 space-y-6">
            <Skeleton className="aspect-square w-full rounded-[32px]" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <h2 className="text-xl font-bold">المنتج غير موجود</h2>
      </div>
    );
  }

  const images = product.images?.length > 0 ? product.images : ["https://picsum.photos/seed/placeholder/800/800"];

  return (
    <div className="flex min-h-screen bg-background">
      <main className="flex-1 pb-24">
        <Header />
        
        <div className="container p-0 md:p-4">
          <div className="grid md:grid-cols-2 gap-8 md:p-6">
            <div className="flex flex-col gap-4">
               <div className="relative aspect-square w-full overflow-hidden md:rounded-[32px] bg-muted shadow-lg">
                 <Image src={images[activeImage]} alt={product.name} fill className="object-cover transition-all duration-500" />
                 <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <button 
                      onClick={() => setIsFavorite(!isFavorite)}
                      className="h-10 w-10 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md shadow-md"
                    >
                      <Heart className={cn(isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground")} />
                    </button>
                    <button className="h-10 w-10 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md shadow-md">
                      <Share2 className="h-5 w-5 text-muted-foreground" />
                    </button>
                 </div>
               </div>
               <div className="flex gap-4 px-4 md:px-0 overflow-x-auto no-scrollbar">
                 {images.map((img: string, i: number) => (
                   <button 
                    key={i} 
                    onClick={() => setActiveImage(i)}
                    className={cn(
                      "relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-4 transition-all",
                      i === activeImage ? 'border-primary' : 'border-transparent'
                    )}
                   >
                     <Image src={img} alt="Thumb" fill className="object-cover" />
                   </button>
                 ))}
               </div>
            </div>

            <div className="flex flex-col gap-6 p-6 md:p-0">
               <div className="space-y-2">
                 <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-bold">
                      {product.motorcycleType || "أصلي"}
                    </Badge>
                    <div className="flex items-center gap-1 text-orange-400 font-bold">
                       <Star className="h-4 w-4 fill-current" />
                       <span>4.9</span>
                       <span className="text-xs text-muted-foreground font-normal">(120 مراجعة)</span>
                    </div>
                 </div>
                 <h1 className="text-3xl font-black leading-tight text-foreground">{product.name}</h1>
                 
                 <div className="flex items-center gap-4 pt-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-primary">
                        {displayPrice?.toLocaleString()}
                      </span>
                      <span className="text-xl text-muted-foreground font-bold">د.ع</span>
                    </div>
                    {isWholesale && (
                       <Badge variant="outline" className="rounded-full border-primary/20 text-primary gap-1 font-bold h-7">
                          <Tags className="h-3 w-3" /> سعر الجملة
                       </Badge>
                    )}
                 </div>
               </div>

               <div className="h-px bg-border/50" />

               <div className="space-y-4">
                  <h4 className="font-bold">الوصف</h4>
                  <p className="text-muted-foreground leading-relaxed">{product.description}</p>
               </div>

               <div className="grid grid-cols-3 gap-4 py-4">
                 <div className="flex flex-col items-center gap-2 text-center p-3 rounded-2xl bg-muted/30">
                   <ShieldCheck className="h-6 w-6 text-green-600" />
                   <span className="text-[10px] font-bold">ضمان أصلي</span>
                 </div>
                 <div className="flex flex-col items-center gap-2 text-center p-3 rounded-2xl bg-muted/30">
                   <Truck className="h-6 w-6 text-blue-600" />
                   <span className="text-[10px] font-bold">توصيل سريع</span>
                 </div>
                 <div className="flex flex-col items-center gap-2 text-center p-3 rounded-2xl bg-muted/30">
                   <RotateCcw className="h-6 w-6 text-orange-600" />
                   <span className="text-[10px] font-bold">إرجاع خلال 7 أيام</span>
                 </div>
               </div>

               <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="flex items-center gap-4 rounded-full border-2 border-primary/20 p-1 bg-muted/10 h-14 px-6 w-full sm:w-auto justify-between sm:justify-center">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="h-8 w-8 flex items-center justify-center rounded-full bg-white shadow-sm"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="text-xl font-black w-8 text-center">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(quantity + 1)}
                      className="h-8 w-8 flex items-center justify-center rounded-full bg-primary text-white shadow-sm"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  <Button className="w-full h-14 rounded-full text-lg font-black shadow-lg shadow-primary/20 gap-3">
                    <ShoppingCart className="h-6 w-6" />
                    إضافة إلى السلة
                  </Button>
               </div>
            </div>
          </div>

          <section className="p-6 space-y-4">
            <h3 className="text-xl font-black">منتجات قد تعجبك</h3>
            <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 px-6 pb-6">
              {relatedLoading ? (
                Array(4).fill(0).map((_, i) => <Skeleton key={i} className="min-w-[180px] h-[250px] rounded-[24px]" />)
              ) : relatedProducts.map((p: any) => (
                <div key={p.id} className="min-w-[180px]">
                  <ProductCard 
                    id={p.id}
                    name={p.name}
                    category={p.category}
                    price={isWholesale ? (p.wholesalePrice || p.retailPrice).toLocaleString() : p.retailPrice.toLocaleString()}
                    image={p.images?.[0] || `https://picsum.photos/seed/${p.id}/400/400`}
                  />
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
