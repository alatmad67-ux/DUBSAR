
"use client";

import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ChevronLeft, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const INITIAL_CART = [
  { id: 1, name: "فلتر زيت هوندا أصلي", price: 25000, qty: 1, image: "https://picsum.photos/seed/p1/200/200" },
  { id: 2, name: "خوذة رياضية LS2", price: 115000, qty: 1, image: "https://picsum.photos/seed/p2/200/200" },
];

export default function CartPage() {
  const [items, setItems] = useState(INITIAL_CART);

  const subtotal = items.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const delivery = 5000;
  const total = subtotal + delivery;

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen bg-background">
        <main className="flex-1 flex flex-col items-center justify-center p-10 text-center gap-6">
          <div className="h-40 w-40 relative">
             <ShoppingBag className="h-full w-full text-muted/30" strokeWidth={1} />
          </div>
          <h2 className="text-2xl font-black">سلة التسوق فارغة</h2>
          <p className="text-muted-foreground max-w-xs">يبدو أنك لم تقم بإضافة أي منتجات إلى سلتك بعد.</p>
          <Link href="/">
             <Button className="rounded-full px-10 font-bold h-12 shadow-lg">ابدأ التسوق الآن</Button>
          </Link>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#FDF8F5]">
      <main className="flex-1 pb-40">
        <div className="p-6 flex items-center gap-4 bg-white border-b sticky top-0 z-30">
          <Link href="/">
             <Button variant="ghost" size="icon" className="rounded-full bg-muted/50">
                <ChevronLeft className="h-6 w-6 rotate-180" />
             </Button>
          </Link>
          <h1 className="text-2xl font-black">سلة التسوق</h1>
        </div>

        <div className="p-4 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4 p-4 rounded-[28px] bg-white shadow-sm">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-muted">
                 <Image src={item.image} alt={item.name} fill className="object-cover" />
              </div>
              <div className="flex flex-1 flex-col justify-between">
                 <div className="flex items-start justify-between">
                    <h3 className="font-bold text-sm leading-tight line-clamp-2">{item.name}</h3>
                    <button 
                      onClick={() => setItems(items.filter(i => i.id !== item.id))}
                      className="text-muted-foreground hover:text-destructive p-1"
                    >
                       <Trash2 className="h-5 w-5" />
                    </button>
                 </div>
                 <div className="flex items-center justify-between mt-2">
                    <span className="text-primary font-black">{item.price.toLocaleString()} د.ع</span>
                    <div className="flex items-center gap-3 rounded-full bg-muted/50 p-1 px-3">
                       <button onClick={() => setItems(items.map(i => i.id === item.id ? {...i, qty: Math.max(1, i.qty - 1)} : i))}>
                          <Minus className="h-4 w-4" />
                       </button>
                       <span className="font-black text-sm">{item.qty}</span>
                       <button onClick={() => setItems(items.map(i => i.id === item.id ? {...i, qty: i.qty + 1} : i))}>
                          <Plus className="h-4 w-4" />
                       </button>
                    </div>
                 </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Order Summary Floating Card */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-white border-t rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-40 md:bottom-0">
         <div className="container space-y-4">
            <div className="flex items-center justify-between text-sm">
               <span className="text-muted-foreground">المجموع الفرعي:</span>
               <span className="font-bold">{subtotal.toLocaleString()} د.ع</span>
            </div>
            <div className="flex items-center justify-between text-sm">
               <span className="text-muted-foreground">خدمة التوصيل:</span>
               <span className="font-bold">{delivery.toLocaleString()} د.ع</span>
            </div>
            <div className="h-px bg-border/50" />
            <div className="flex items-center justify-between text-xl">
               <span className="font-black">الإجمالي:</span>
               <span className="font-black text-primary">{total.toLocaleString()} د.ع</span>
            </div>
            <Link href="/checkout">
              <Button className="w-full h-14 rounded-full text-lg font-black shadow-lg shadow-primary/20 mt-2">
                إتمام الطلب
              </Button>
            </Link>
         </div>
      </div>
      
      <div className="hidden md:block">
        <BottomNav />
      </div>
    </div>
  );
}
