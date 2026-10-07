
'use client';

import { use, useState, useMemo } from "react";
import { useTenantData } from "@/hooks/use-tenant-data";
import { useFirestore, useDoc, useCollection, useUser } from "@/firebase";
import { doc, collection, query, where, limit } from "firebase/firestore";
import { StoreHeader } from "@/components/store/store-header";
import { StoreBottomNav } from "@/components/store/store-bottom-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  Share2, 
  Minus, 
  Plus, 
  ShoppingCart, 
  Star,
  ChevronLeft,
  ImageIcon,
  ArrowRight
} from "lucide-react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCart } from "@/context/cart-context";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { getOptimizedUrl } from "@/lib/cloudinary";
import { StoreProductCard } from "@/components/store/store-product-card";

export default function StoreProductDetailsPage({ params }: { params: Promise<{ slug: string, id: string }> }) {
  const { slug, id } = use(params);
  const router = useRouter();
  const db = useFirestore();
  const { profile } = useUser();
  const { addToCart } = useCart();
  const { tenant, loading: tenantLoading } = useTenantData(slug);
  
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const productRef = useMemo(() => id ? doc(db, 'products', id) : null, [db, id]);
  const { data: product, loading: productLoading } = useDoc<any>(productRef);

  const relatedQuery = useMemo(() => 
    (product && tenant?.tenantId) ? query(
      collection(db, 'products'), 
      where('tenantId', '==', tenant.tenantId),
      where('category', '==', product.category), 
      limit(4)
    ) : null,
    [db, product, tenant]
  );
  const { data: relatedProducts, loading: relatedLoading } = useCollection(relatedQuery);

  const displayPrice = product?.retailPrice || 0;
  const oldPrice = displayPrice ? Math.round(displayPrice * 1.15) : 0;

  const handleAddToCart = () => {
    if (!product) return;
    addToCart({
      id: product.id,
      name: product.name,
      price: displayPrice,
      quantity: quantity,
      image: product.images?.[0] || ""
    });
    toast({ title: "تمت الإضافة", description: `تم إضافة ${product.name} إلى السلة.` });
  };

  if (tenantLoading || productLoading) {
    return (
      <div className="min-h-screen bg-white" dir="rtl">
        <div className="p-8 space-y-6 text-right">
          <Skeleton className="aspect-square w-full rounded-[40px]" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (!product || product.tenantId !== tenant?.tenantId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-[#FDF8F5]" dir="rtl">
        <ImageIcon className="h-20 w-20 opacity-10 mb-4" />
        <h2 className="text-2xl font-black text-slate-900">عذراً، المنتج غير متوفر</h2>
        <p className="text-muted-foreground mt-2">يبدو أن هذا المنتج ينتمي لمتجر آخر أو تم حذفه.</p>
        <Button onClick={() => router.push(`/store/${slug}`)} className="mt-8 rounded-full px-10">العودة للمتجر</Button>
      </div>
    );
  }

  const images = product?.images || [];

  return (
    <div className="pb-44 min-h-screen bg-[#F8F9FA]" dir="rtl">
      <StoreHeader tenant={tenant} />
      
      <main className="max-w-4xl mx-auto bg-white md:mt-8 md:rounded-[48px] md:shadow-sm overflow-hidden">
        {/* Gallery */}
        <div className="relative aspect-square w-full bg-[#fcfcfc] flex items-center justify-center group">
           {images.length > 0 ? (
             <Image 
              src={getOptimizedUrl(images[activeImage], { width: 1000 })} 
              alt={product.name} 
              fill 
              className="object-contain p-10"
              priority
             />
           ) : (
             <ImageIcon className="h-24 w-24 opacity-5" />
           )}
           
           <div className="absolute top-6 right-6 flex flex-col gap-3">
              <button onClick={() => setIsFavorite(!isFavorite)} className="h-12 w-12 rounded-2xl bg-white shadow-xl flex items-center justify-center transition-all active:scale-90">
                 <Heart className={cn("h-6 w-6", isFavorite ? "fill-red-500 text-red-500" : "text-slate-300")} />
              </button>
              <button className="h-12 w-12 rounded-2xl bg-white shadow-xl flex items-center justify-center">
                 <Share2 className="h-6 w-6 text-slate-400" />
              </button>
           </div>

           {images.length > 0 && (
             <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                {activeImage + 1} / {images.length}
             </div>
           )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
           <div className="flex gap-4 p-8 overflow-x-auto no-scrollbar justify-center">
              {images.map((img: string, i: number) => (
                <button 
                  key={i} 
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    "relative h-20 w-20 shrink-0 rounded-[20px] overflow-hidden border-2 transition-all",
                    i === activeImage ? 'border-primary ring-4 ring-primary/10' : 'border-transparent opacity-40 hover:opacity-100'
                  )}
                >
                  <Image src={getOptimizedUrl(img, { thumbnail: true })} alt="Thumb" fill className="object-cover" />
                </button>
              ))}
           </div>
        )}

        {/* Content */}
        <div className="p-8 md:p-12 pt-4 space-y-10">
           <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <Badge variant="secondary" className="rounded-full bg-primary/5 text-primary border-none font-black px-4">{product.category}</Badge>
                 <div className="flex text-orange-400 gap-0.5">
                    <Star className="h-3 w-3 fill-current" />
                    <span className="text-[10px] font-black text-slate-400">4.8</span>
                 </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">{product.name}</h1>
           </div>

           <div className="flex items-center justify-between border-y py-10">
              <div className="space-y-1">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">السعر الحالي</p>
                 <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-primary">{displayPrice.toLocaleString()}</span>
                    <span className="text-sm font-bold text-slate-400">د.ع</span>
                    <span className="text-sm font-bold text-slate-300 line-through mr-3">{oldPrice.toLocaleString()}</span>
                 </div>
              </div>
              <div className={cn(
                "px-5 py-2 rounded-2xl border-2 font-black text-xs flex items-center gap-2",
                product.stock > 0 ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"
              )}>
                 <div className={cn("h-2.5 w-2.5 rounded-full", product.stock > 0 ? "bg-emerald-500 animate-pulse" : "bg-red-500")} />
                 {product.stock > 0 ? "متوفر في المخزن" : "نفذت الكمية"}
              </div>
           </div>

           <div className="space-y-6">
              <h3 className="text-xl font-black text-slate-800">وصف المنتج</h3>
              <p className="text-slate-500 leading-relaxed font-medium text-lg whitespace-pre-line">
                 {product.description || "لا يوجد وصف إضافي متوفر لهذا المنتج حالياً."}
              </p>
           </div>
        </div>
      </main>

      {/* Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-2xl border-t p-6 pb-10 shadow-[0_-20px_50px_rgba(0,0,0,0.1)]">
         <div className="max-w-4xl mx-auto flex items-center gap-6">
            <div className="flex items-center justify-between bg-slate-100 rounded-3xl h-16 px-2 w-[160px] border shadow-inner">
               <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="h-12 w-12 flex items-center justify-center rounded-2xl bg-white text-slate-900 shadow-sm active:scale-90 transition-all"
               >
                  <Minus className="h-5 w-5" />
               </button>
               <span className="text-2xl font-black w-8 text-center">{quantity}</span>
               <button 
                onClick={() => setQuantity(quantity + 1)}
                className="h-12 w-12 flex items-center justify-center rounded-2xl bg-white text-primary shadow-sm active:scale-90 transition-all"
               >
                  <Plus className="h-5 w-5" />
               </button>
            </div>

            <Button 
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              className="flex-1 h-16 rounded-3xl text-xl font-black shadow-2xl shadow-primary/30 gap-4 active:scale-95 transition-all bg-primary"
            >
              <ShoppingCart className="h-6 w-6" />
              {product.stock <= 0 ? "نفذت الكمية" : "إضافة إلى السلة"}
            </Button>
         </div>
      </div>

      <section className="container mx-auto px-6 py-16 max-w-4xl space-y-8">
         <h3 className="text-2xl font-black tracking-tight">منتجات مشابهة قد تعجبك</h3>
         <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {relatedLoading ? (
               Array(4).fill(0).map((_, i) => <Skeleton key={i} className="aspect-[4/5] rounded-[32px]" />)
            ) : relatedProducts.map((p: any) => (
               <StoreProductCard key={p.id} slug={slug} product={p} />
            ))}
         </div>
      </section>

      <StoreBottomNav slug={slug} />
    </div>
  );
}
