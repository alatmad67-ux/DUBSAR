
'use client';

import { use } from "react";
import { useCart } from "@/context/cart-context";
import { StoreHeader } from "@/components/store/store-header";
import { StoreBottomNav } from "@/components/store/store-bottom-nav";
import { useTenantData } from "@/hooks/use-tenant-data";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ChevronRight, ShoppingBag, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function StoreCartPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { tenant, loading: tenantLoading } = useTenantData(slug);
  const { cart, removeFromCart, updateQuantity, subtotal } = useCart();

  const deliveryFee = cart.length > 0 ? 5000 : 0;
  const total = subtotal + deliveryFee;

  if (tenantLoading) return null;

  return (
    <div className="pb-40 min-h-screen bg-background" dir="rtl">
      <StoreHeader tenant={tenant} />
      
      <main className="container mx-auto px-4 py-8 max-w-2xl space-y-8">
        <div className="flex items-center justify-between">
           <h1 className="text-3xl font-black tracking-tight">سلة المشتريات</h1>
           <span className="text-xs font-bold opacity-40">{cart.length} منتجات</span>
        </div>

        {cart.length === 0 ? (
          <div className="py-24 text-center space-y-6 animate-in fade-in slide-in-from-bottom-4">
             <div className="h-40 w-40 bg-muted/20 rounded-full flex items-center justify-center mx-auto">
                <ShoppingBag className="h-16 w-16 opacity-10" />
             </div>
             <div className="space-y-2">
                <h2 className="text-2xl font-black">السلة فارغة حالياً</h2>
                <p className="text-sm font-medium opacity-50">تصفح المنتجات وأضف ما يعجبك هنا.</p>
             </div>
             <Link href={`/store/${slug}`}>
                <Button className="rounded-full h-14 px-10 font-black text-lg gap-3">ابدأ التسوق الآن</Button>
             </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="bg-white rounded-[32px] p-4 flex gap-4 shadow-sm border border-black/5 group">
                 <div className="relative h-24 w-24 rounded-2xl overflow-hidden bg-muted/30 shrink-0">
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                 </div>
                 <div className="flex-1 flex flex-col justify-between py-1">
                    <div className="flex justify-between items-start">
                       <h3 className="font-black text-sm line-clamp-2 leading-tight">{item.name}</h3>
                       <button onClick={() => removeFromCart(item.id)} className="text-red-500/20 hover:text-red-500 transition-colors"><Trash2 className="h-4 w-4" /></button>
                    </div>
                    <div className="flex justify-between items-center">
                       <p className="font-black text-primary">{item.price.toLocaleString()} د.ع</p>
                       <div className="flex items-center gap-4 bg-muted/50 rounded-xl p-1 px-2 border">
                          <button onClick={() => updateQuantity(item.id, -1)} className="h-7 w-7 rounded-lg bg-white shadow-sm flex items-center justify-center"><Minus className="h-3.5 w-3.5" /></button>
                          <span className="font-black text-sm w-4 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="h-7 w-7 rounded-lg bg-primary text-white shadow-sm flex items-center justify-center"><Plus className="h-3.5 w-3.5" /></button>
                       </div>
                    </div>
                 </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {cart.length > 0 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[95%] max-w-lg bg-white/90 backdrop-blur-2xl rounded-[40px] p-8 shadow-2xl border border-black/5 z-40 space-y-6">
           <div className="space-y-3">
              <div className="flex justify-between items-center text-sm font-bold opacity-60">
                 <span>المجموع الفرعي:</span>
                 <span>{subtotal.toLocaleString()} د.ع</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold opacity-60">
                 <span>رسوم التوصيل:</span>
                 <span>{deliveryFee.toLocaleString()} د.ع</span>
              </div>
              <div className="h-px bg-black/5 my-2" />
              <div className="flex justify-between items-center">
                 <span className="text-xl font-black">الإجمالي الكلي:</span>
                 <span className="text-3xl font-black text-primary">{total.toLocaleString()} <span className="text-xs">د.ع</span></span>
              </div>
           </div>
           <Link href={`/store/${slug}/checkout`}>
              <Button className="w-full h-16 rounded-[24px] text-xl font-black gap-4 shadow-xl shadow-primary/20">
                 إتمام الطلب الآن <ArrowRight className="h-6 w-6 rotate-180" />
              </Button>
           </Link>
        </div>
      )}

      <StoreBottomNav slug={slug} />
    </div>
  );
}
