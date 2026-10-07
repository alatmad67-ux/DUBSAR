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
  Star,
  ChevronLeft,
  Check,
  ImageIcon
} from "lucide-react";
import Image from "next/image";
import { useState, useMemo, useEffect } from "react";
import { ProductCard } from "@/components/product-card";
import { useFirestore, useDoc, useCollection, useUser } from "@/firebase";
import { doc, collection, query, where, limit } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCart } from "@/context/cart-context";
import { toast } from "@/hooks/use-toast";
import { useParams, useRouter } from "next/navigation";
import { getOptimizedUrl } from "@/lib/cloudinary";

export default function ProductDetailsPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const db = useFirestore();
  const { profile } = useUser();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const productRef = useMemo(() => id && id !== 'default' ? doc(db, 'products', id) : null, [db, id]);
  const { data: product, loading: productLoading } = useDoc<any>(productRef);

  const relatedQuery = useMemo(() => 
    product ? query(collection(db, 'products'), where('category', '==', product.category), limit(4)) : null,
    [db, product]
  );
  const { data: relatedProducts, loading: relatedLoading } = useCollection(relatedQuery);

  const isWholesale = profile?.role === 'wholesale_customer';
  const displayPrice = isWholesale ? (product?.wholesalePrice || product?.retailPrice) : product?.retailPrice;
  const oldPrice = displayPrice ? Math.round(displayPrice * 1.15) : 0;

  const handleAddToCart = () => {
    if (!product) return;
    addToCart({
      id: product.id,
      name: product.name,
      price: displayPrice || 0,
      quantity: quantity,
      image: product.images?.[0] || ""
    });
    toast({ title: "تمت الإضافة", description: `تم إضافة ${product.name} إلى السلة.` });
  };

  if (productLoading && id !== 'default') {
    return (
      <div className="flex min-h-screen bg-background">
        <main className="flex-1 pb-24">
          <div className="p-4 space-y-6 text-right" dir="rtl">
            <Skeleton className="aspect-square w-full rounded-[32px]" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-20 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center flex-col gap-4">
        <h2 className="text-xl font-black text-muted-foreground">المنتج غير موجود</h2>
        <Button onClick={() => router.back()}>العودة للخلف</Button>
      </div>
    );
  }

  const images = product?.images?.length > 0 ? product.images : [];

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] dark:bg-background text-foreground transition-colors duration-300" dir="rtl">
      <main className="flex-1 pb-44">
        {/* Header Navigation */}
        <div className="sticky top-0 z-50 flex items-center justify-between p-4 bg-white/80 dark:bg-card/80 backdrop-blur-md border-b">
           <button onClick={() => router.back()} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors">
              <ChevronLeft className="h-6 w-6" />
           </button>
           <span className="font-black text-sm">تفاصيل المنتج</span>
           <div className="flex gap-2">
              <button onClick={() => setIsFavorite(!isFavorite)} className="h-10 w-10 flex items-center justify-center rounded-full">
                 <Heart className={cn("h-5 w-5", isFavorite ? "fill-red-500 text-red-500" : "text-slate-400")} />
              </button>
              <button className="h-10 w-10 flex items-center justify-center rounded-full">
                 <Share2 className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </button>
           </div>
        </div>

        <div className="max-w-4xl mx-auto bg-white dark:bg-card md:mt-6 md:rounded-[40px] md:shadow-sm overflow-hidden">
          {/* Main Image & Badges */}
          <div className="relative aspect-square w-full bg-[#f8f8f8] dark:bg-muted/30 flex items-center justify-center group">
             {images.length > 0 ? (
               <Image 
                src={getOptimizedUrl(images[activeImage], { width: 1000 })} 
                alt={product.name} 
                fill 
                className="object-contain p-8 mix-blend-multiply dark:mix-blend-normal"
                priority
               />
             ) : (
               <ImageIcon className="h-20 w-20 opacity-10" />
             )}
             
             {/* Discount Badge */}
             <div className="absolute top-6 right-6 h-12 w-12 rounded-full bg-red-500 text-white flex items-center justify-center font-black text-sm shadow-lg animate-pulse">
                -15%
             </div>

             {/* Image Counter */}
             {images.length > 0 && (
               <div className="absolute bottom-6 left-6 bg-black/40 backdrop-blur-md text-white px-3 py-1 rounded-lg text-[10px] font-bold">
                  {activeImage + 1}/{images.length}
               </div>
             )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
             <div className="flex gap-3 p-6 overflow-x-auto no-scrollbar">
                {images.map((img: string, i: number) => (
                  <button 
                    key={i} 
                    onClick={() => setActiveImage(i)}
                    className={cn(
                      "relative h-20 w-20 shrink-0 rounded-2xl overflow-hidden border-2 transition-all shadow-sm",
                      i === activeImage ? 'border-primary ring-2 ring-primary/10' : 'border-transparent opacity-60'
                    )}
                  >
                    <Image src={getOptimizedUrl(img, { thumbnail: true })} alt={`Thumb ${i}`} fill className="object-cover" />
                  </button>
                ))}
             </div>
          )}

          {/* Product Identity Section */}
          <div className="p-6 pt-0 space-y-6">
             <div className="space-y-1">
                <h1 className="text-xl md:text-3xl font-black leading-tight text-slate-900 dark:text-white">{product.name}</h1>
                <div className="flex items-center gap-2">
                   <div className="flex text-orange-400">
                      {[1, 2, 3, 4].map(s => <Star key={s} className="h-3.5 w-3.5 fill-current" />)}
                      <Star className="h-3.5 w-3.5 text-slate-200 dark:text-slate-700 fill-current" />
                   </div>
                   <span className="text-[10px] font-bold text-slate-400">(32 تقييم)</span>
                </div>
             </div>

             {/* Brand & ID Boxes */}
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#F8F9FA] dark:bg-muted/10 p-4 rounded-2xl text-center space-y-1 border">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">الماركة</p>
                   <p className="font-black text-sm uppercase">{product.category || "YAMAHA"}</p>
                </div>
                <div className="bg-[#F8F9FA] dark:bg-muted/10 p-4 rounded-2xl text-center space-y-1 border">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">الباركود</p>
                   <p className="font-black text-sm text-slate-600 dark:text-slate-300 truncate">{product.barcode || "---"}</p>
                </div>
             </div>

             {/* Price & Stock */}
             <div className="flex items-center justify-between border-t border-b py-6">
                <div className="space-y-1">
                   <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-primary">{displayPrice?.toLocaleString()}</span>
                      <span className="text-sm font-bold text-slate-400">د.ع</span>
                      <span className="text-sm font-bold text-slate-300 dark:text-slate-600 line-through mr-2">{oldPrice.toLocaleString()}</span>
                   </div>
                   <p className="text-[10px] font-bold text-slate-400">السعر شامل الضريبة</p>
                </div>
                <div className={cn(
                  "flex items-center gap-2 font-bold text-xs px-3 py-1.5 rounded-full border",
                  product.stock > 0 ? "text-emerald-600 bg-emerald-50 border-emerald-100" : "text-red-600 bg-red-50 border-red-100"
                )}>
                   <div className={cn("h-2 w-2 rounded-full", product.stock > 0 ? "bg-emerald-500 animate-pulse" : "bg-red-500")} />
                   <span>{product.stock > 0 ? "متوفر" : "نفذت الكمية"}</span>
                </div>
             </div>

             {/* Description Section */}
             <div className="space-y-3 pb-6">
                <h4 className="font-black text-lg text-slate-800 dark:text-slate-100">الوصف والتفاصيل</h4>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium text-sm whitespace-pre-line">
                  {product.description || "لا يوجد وصف متوفر لهذا المنتج حالياً."}
                </p>
             </div>
          </div>
        </div>

        {/* Related Products */}
        <section className="p-6 md:mt-10 max-w-4xl mx-auto space-y-6">
          <h3 className="text-lg font-black tracking-tight">منتجات مشابهة</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {relatedLoading ? (
              Array(4).fill(0).map((_, i) => <Skeleton key={i} className="aspect-square rounded-[28px]" />)
            ) : relatedProducts.map((p: any) => (
              <ProductCard 
                key={p.id}
                id={p.id}
                name={p.name}
                category={p.category}
                price={isWholesale ? (p.wholesalePrice || p.retailPrice).toLocaleString() : p.retailPrice.toLocaleString()}
                image={p.images?.[0]}
              />
            ))}
          </div>
        </section>
      </main>

      {/* Modern Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-card/95 backdrop-blur-xl border-t p-4 pb-safe shadow-[0_-20px_50px_rgba(0,0,0,0.08)]">
         <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex flex-col gap-2">
               <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 mr-2 uppercase">الكمية</span>
               <div className="flex items-center gap-4">
                  {/* Quantity Selector */}
                  <div className="flex items-center justify-between bg-slate-100 dark:bg-muted/20 rounded-2xl h-14 px-2 w-[140px] border shadow-inner">
                     <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="h-10 w-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm active:scale-90 transition-transform"
                     >
                        <Minus className="h-4 w-4" />
                     </button>
                     <span className="text-xl font-black w-8 text-center">{quantity}</span>
                     <button 
                      onClick={() => setQuantity(quantity + 1)}
                      className="h-10 w-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 text-primary shadow-sm active:scale-90 transition-transform"
                     >
                        <Plus className="h-4 w-4" />
                     </button>
                  </div>

                  {/* Add to Cart Button */}
                  <Button 
                    onClick={handleAddToCart}
                    disabled={product.stock <= 0}
                    className="flex-1 h-14 rounded-2xl text-base font-black shadow-2xl shadow-primary/20 gap-3 active:scale-95 transition-all bg-primary"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    {product.stock <= 0 ? "نفذت الكمية" : "أضف إلى الطلب"}
                  </Button>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
