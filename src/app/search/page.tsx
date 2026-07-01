
"use client";

import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Input } from "@/components/ui/input";
import { Search, History, TrendingUp, X, ChevronLeft } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const RECENT_SEARCHES = ["فلتر هوندا", "خوذة LS2", "إطارات دنلوب", "زيوت"];
const TRENDING = ["دراجة CBR 600", "خلفيات دراجات", "تعديل محرك", "إكسسوارات مطرية"];

export default function SearchPage() {
  const [query, setQuery] = useState("");

  return (
    <div className="flex min-h-screen bg-background">
      <main className="flex-1 pb-24">
        <div className="p-4 bg-white border-b flex flex-col gap-4 sticky top-0 z-30">
           <div className="flex items-center gap-4">
             <Link href="/">
               <Button variant="ghost" size="icon" className="rounded-full bg-muted/50">
                  <ChevronLeft className="h-6 w-6 rotate-180" />
               </Button>
             </Link>
             <h1 className="text-xl font-black">البحث عن منتجات</h1>
           </div>
           <div className="relative">
              <Search className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input 
                autoFocus
                placeholder="ابحث عن قطع غيار، دراجة..." 
                className="h-14 rounded-full bg-muted/50 pr-12 pl-12 border-none focus:bg-white focus:ring-2 focus:ring-primary/20 text-lg font-medium"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button 
                  onClick={() => setQuery("")}
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded-full bg-muted text-muted-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
           </div>
        </div>

        <div className="container p-6 space-y-8 animate-in fade-in duration-500">
          {!query ? (
            <>
              {/* Recent Searches */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                   <h3 className="font-black flex items-center gap-2">
                      <History className="h-4 w-4 text-primary" />
                      عمليات البحث الأخيرة
                   </h3>
                   <button className="text-xs font-bold text-muted-foreground">مسح الكل</button>
                </div>
                <div className="flex flex-wrap gap-2">
                   {RECENT_SEARCHES.map((item) => (
                     <Badge key={item} variant="secondary" className="px-4 py-2 rounded-full cursor-pointer hover:bg-primary/10 hover:text-primary border-none transition-all">
                        {item}
                     </Badge>
                   ))}
                </div>
              </section>

              {/* Trending Now */}
              <section className="space-y-4">
                 <h3 className="font-black flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    الأكثر بحثاً الآن
                 </h3>
                 <div className="grid gap-2">
                    {TRENDING.map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 cursor-pointer hover:bg-muted/50 transition-all">
                         <span className="font-bold text-sm">{item}</span>
                         <Search className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))}
                 </div>
              </section>

              {/* Categories Quick Link */}
              <div className="p-6 rounded-[32px] bg-primary text-white flex flex-col gap-2 relative overflow-hidden">
                 <h4 className="text-lg font-black relative z-10">هل تبحث عن فئة محددة؟</h4>
                 <p className="text-white/80 text-sm relative z-10">تصفح أقسامنا الكاملة للعثور على ما تحتاجه بدقة.</p>
                 <Link href="/catalog" className="w-fit">
                    <Button className="mt-2 rounded-full bg-white text-primary font-black px-8">تصفح الأقسام</Button>
                 </Link>
                 <div className="absolute -right-5 -bottom-5 h-24 w-24 bg-white/10 rounded-full blur-xl" />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center pt-20 text-center gap-4">
               <div className="h-32 w-32 relative opacity-20">
                  <Search className="h-full w-full" strokeWidth={1} />
               </div>
               <h3 className="text-xl font-bold">لا توجد نتائج لـ "{query}"</h3>
               <p className="text-muted-foreground max-w-xs">تأكد من كتابة الكلمة بشكل صحيح أو حاول البحث عن منتج آخر.</p>
            </div>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}

function Button({ children, ...props }: any) {
  return <button {...props}>{children}</button>;
}
