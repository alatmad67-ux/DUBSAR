
'use client';

import { useState, useEffect, useMemo, useRef } from "react";
import { 
  Search, 
  Barcode, 
  UserPlus, 
  Trash2, 
  Minus, 
  Plus, 
  CreditCard, 
  Printer, 
  X, 
  ShoppingCart,
  User,
  Tags,
  Zap,
  ChevronDown,
  Loader2,
  Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, orderBy, addDoc, serverTimestamp } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export default function POSPage() {
  const db = useFirestore();
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<{ name: string; type: 'retail' | 'wholesale'; id?: string }>({ name: "زبون نقدي", type: 'retail' });
  const [discount, setDiscount] = useState(0);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [processingOrder, setProcessingOrder] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Firestore Data - Optimized with safe references
  const productsQuery = useMemo(() => query(collection(db, 'products'), orderBy('name')), [db]);
  const { data: products, loading } = useCollection(productsQuery);
  
  const categoriesQuery = useMemo(() => collection(db, 'categories'), [db]);
  const { data: categories } = useCollection(categoriesQuery);

  // Filtering - Added safety checks for p.name and p.barcode
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!searchQuery) return products;
    const lowerQuery = searchQuery.toLowerCase();
    return products.filter((p: any) => 
      (p.name?.toLowerCase() || "").includes(lowerQuery) || 
      (p.barcode || "").includes(lowerQuery)
    );
  }, [products, searchQuery]);

  // Calculations - Added fallback for missing prices to avoid NaN
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => {
      const retail = item.retailPrice || 0;
      const wholesale = item.wholesalePrice || retail;
      const price = selectedCustomer.type === 'wholesale' ? wholesale : retail;
      return acc + (price * (item.quantity || 1));
    }, 0);
  }, [cart, selectedCustomer.type]);
  
  const total = Math.max(0, subtotal - discount);

  // Handlers
  const addToCart = (product: any) => {
    if (!product) return;
    if ((product.stock || 0) <= 0) {
      toast({ variant: "destructive", title: "نفذ المخزون", description: "لا يمكن إضافة منتج غير متوفر حالياً." });
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= (product.stock || 0)) {
           toast({ variant: "destructive", title: "تجاوز المخزون", description: "لا يمكن إضافة كمية أكبر من المتوفر." });
           return prev;
        }
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        if (delta > 0 && newQty > (item.stock || 0)) {
          toast({ variant: "destructive", title: "تجاوز المخزون", description: "وصلت للحد الأقصى للمخزون." });
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handleCompleteSale = async () => {
    if (cart.length === 0) return;
    setProcessingOrder(true);
    try {
      const orderData = {
        orderNumber: `POS-${Date.now().toString().slice(-6)}`,
        customerName: selectedCustomer.name,
        customerType: selectedCustomer.type,
        items: cart.map(item => ({
          productId: item.id,
          name: item.name || "منتج غير مسمى",
          price: selectedCustomer.type === 'wholesale' ? (item.wholesalePrice || item.retailPrice || 0) : (item.retailPrice || 0),
          quantity: item.quantity
        })),
        subtotal,
        discount,
        total,
        paymentMethod: 'cash',
        createdAt: serverTimestamp(),
        status: 'delivered',
        source: 'pos'
      };

      await addDoc(collection(db, "orders"), orderData);
      toast({ title: "تم بنجاح", description: "تم تسجيل العملية وطباعة الفاتورة." });
      setCart([]);
      setDiscount(0);
      setIsCheckoutOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل تسجيل العملية في النظام." });
    } finally {
      setProcessingOrder(false);
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'F4' && cart.length > 0) {
        e.preventDefault();
        setIsCheckoutOpen(true);
      }
      if (e.key === 'F8') {
        e.preventDefault();
        setCart([]);
        setDiscount(0);
        setSelectedCustomer({ name: "زبون نقدي", type: 'retail' });
        toast({ title: "فاتورة جديدة", description: "تم تصفير السلة." });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart.length]);

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden gap-4 -m-4 md:-m-8 bg-background">
      {/* Products Grid (70%) */}
      <div className="flex-1 flex flex-col min-w-0 p-4 md:p-6 lg:p-8">
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              ref={searchInputRef}
              placeholder="البحث (F2)..." 
              className="h-14 rounded-2xl pr-12 text-lg shadow-sm border-none bg-white dark:bg-card focus:ring-2 focus:ring-primary/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" className="h-14 w-14 rounded-2xl border-none shadow-sm bg-white dark:bg-card">
            <Barcode className="h-6 w-6" />
          </Button>
        </div>

        {/* Categories Tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-2">
           <Button variant="default" className="rounded-full font-black px-8">الكل</Button>
           {categories?.map((cat: any) => (
             <Button key={cat.id} variant="outline" className="rounded-full font-bold px-8 bg-white dark:bg-card border-none shadow-sm transition-all hover:bg-primary/5">{cat.name}</Button>
           ))}
        </div>

        {/* Products Scrollable Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar pr-1">
           <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-10">
             {loading ? (
               Array(12).fill(0).map((_, i) => <Skeleton key={i} className="h-56 rounded-[32px]" />)
             ) : filteredProducts.length > 0 ? (
               filteredProducts.map((p: any) => (
               <Card 
                key={p.id} 
                className={cn(
                  "group cursor-pointer overflow-hidden rounded-[32px] border-none shadow-sm hover:shadow-xl transition-all duration-300 bg-white dark:bg-card active:scale-95",
                  (p.stock || 0) <= 0 && "opacity-60 grayscale"
                )}
                onClick={() => addToCart(p)}
               >
                 <div className="relative aspect-square h-32 w-full overflow-hidden bg-muted/50">
                    <Image 
                      src={p.images?.[0] || `https://picsum.photos/seed/${p.id}/300/300`} 
                      alt={p.name || "Product"} 
                      fill 
                      className="object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute top-3 left-3">
                       <Badge variant={(p.stock || 0) > 10 ? "secondary" : "destructive"} className="rounded-full text-[10px] px-2 font-black shadow-sm">
                          {(p.stock || 0) > 0 ? `${p.stock} قطعة` : 'نفذت'}
                       </Badge>
                    </div>
                 </div>
                 <CardContent className="p-4 space-y-2">
                    <h3 className="font-bold text-sm leading-tight line-clamp-2 min-h-[2.5rem]">{p.name || "منتج بدون اسم"}</h3>
                    <div className="flex items-end justify-between">
                       <p className="text-primary font-black text-lg">{(p.retailPrice || 0).toLocaleString()} <span className="text-[10px]">د.ع</span></p>
                       <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                          <Plus className="h-5 w-5" />
                       </div>
                    </div>
                 </CardContent>
               </Card>
             ))) : (
               <div className="col-span-full h-64 flex flex-col items-center justify-center text-muted-foreground">
                  <Package className="h-16 w-16 opacity-20 mb-4" />
                  <p className="font-black text-xl">لا توجد منتجات مطابقة</p>
               </div>
             )}
           </div>
        </div>
      </div>

      {/* Invoice Panel (30%) */}
      <div className="w-[420px] flex flex-col bg-white dark:bg-card border-r shadow-2xl z-20">
        {/* Invoice Header */}
        <div className="p-6 border-b space-y-4">
           <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black flex items-center gap-2">
                <ShoppingCart className="h-6 w-6 text-primary" />
                الفاتورة
              </h2>
              <Button variant="ghost" size="icon" className="rounded-full text-destructive hover:bg-destructive/10" onClick={() => setCart([])}>
                <Trash2 className="h-5 w-5" />
              </Button>
           </div>
           
           <DropdownMenu>
              <DropdownMenuTrigger asChild>
                 <Button variant="outline" className="w-full h-16 rounded-[24px] justify-between border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all font-bold group px-4">
                    <div className="flex items-center gap-3">
                       <div className="h-10 w-10 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg">
                          <User className="h-5 w-5" />
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] uppercase font-black tracking-widest opacity-60">العميل</p>
                          <p className="text-base">{selectedCustomer.name}</p>
                       </div>
                    </div>
                    <ChevronDown className="h-5 w-5 opacity-40 transition-transform group-data-[state=open]:rotate-180" />
                 </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80 rounded-[24px] p-2" align="end">
                 <DropdownMenuItem className="rounded-xl gap-3 h-14 font-bold cursor-pointer" onClick={() => setSelectedCustomer({ name: "زبون نقدي", type: 'retail' })}>
                    <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center"><User className="h-5 w-5" /></div>
                    زبون نقدي (مفرد)
                 </DropdownMenuItem>
                 <DropdownMenuItem className="rounded-xl gap-3 h-14 font-bold cursor-pointer text-primary" onClick={() => setSelectedCustomer({ name: "شركة النور للقطع", type: 'wholesale' })}>
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"><Tags className="h-5 w-5" /></div>
                    جملة - شركة النور
                 </DropdownMenuItem>
                 <div className="h-px bg-muted my-2 mx-2" />
                 <Button variant="ghost" className="w-full rounded-xl gap-2 text-primary font-black h-12">
                    <UserPlus className="h-5 w-5" /> إضافة عميل جديد
                 </Button>
              </DropdownMenuContent>
           </DropdownMenu>
        </div>

        {/* Invoice Body (Cart) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/10">
           {cart.length > 0 ? (
             cart.map((item) => {
               const itemRetail = item.retailPrice || 0;
               const itemWholesale = item.wholesalePrice || itemRetail;
               const currentPrice = selectedCustomer.type === 'wholesale' ? itemWholesale : itemRetail;

               return (
               <div key={item.id} className="flex gap-3 p-4 rounded-[24px] bg-white dark:bg-card shadow-sm border border-transparent hover:border-primary/20 transition-all group animate-in slide-in-from-left-4 duration-300">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[18px] bg-muted shadow-inner border">
                     <Image src={item.images?.[0] || `https://picsum.photos/seed/${item.id}/150/150`} alt={item.name || "Item"} fill className="object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                     <h4 className="text-xs font-black leading-tight line-clamp-1">{item.name || "منتج"}</h4>
                     <div className="flex items-center justify-between mt-1">
                        <span className="text-sm font-black text-primary">
                          {currentPrice.toLocaleString()} <span className="text-[10px]">د.ع</span>
                        </span>
                        <div className="flex items-center gap-3 bg-muted/50 rounded-xl p-1 px-2 border">
                           <button onClick={() => updateQuantity(item.id, -1)} className="h-7 w-7 flex items-center justify-center rounded-lg bg-white shadow-sm active:scale-90 transition-transform"><Minus className="h-4 w-4" /></button>
                           <span className="text-xs font-black w-6 text-center">{item.quantity}</span>
                           <button onClick={() => updateQuantity(item.id, 1)} className="h-7 w-7 flex items-center justify-center rounded-lg bg-primary text-white shadow-sm active:scale-90 transition-transform"><Plus className="h-4 w-4" /></button>
                        </div>
                     </div>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="opacity-0 group-hover:opacity-100 transition-all text-destructive hover:bg-destructive/10 p-2 rounded-xl">
                    <Trash2 className="h-5 w-5" />
                  </button>
               </div>
             )})
           ) : (
             <div className="h-full flex flex-col items-center justify-center text-center opacity-20 gap-6">
                <ShoppingCart className="h-24 w-24" strokeWidth={1} />
                <p className="font-black text-2xl">الفاتورة فارغة</p>
             </div>
           )}
        </div>

        {/* Invoice Footer */}
        <div className="p-8 bg-white dark:bg-card border-t shadow-[0_-15px_40px_rgba(0,0,0,0.08)] space-y-6">
           <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                 <span className="text-muted-foreground font-bold uppercase tracking-widest">المجموع الفرعي:</span>
                 <span className="font-black text-lg">{subtotal.toLocaleString()} د.ع</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                 <div className="flex items-center gap-3">
                    <span className="text-muted-foreground font-bold uppercase tracking-widest">الخصم:</span>
                    <Input 
                      type="number" 
                      value={discount} 
                      onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                      className="h-10 w-24 rounded-xl bg-muted/40 border-none text-sm font-black text-center focus:ring-primary/20"
                    />
                 </div>
                 <span className="font-black text-destructive text-lg">-{discount.toLocaleString()} د.ع</span>
              </div>
           </div>
           
           <div className="h-px bg-muted" />

           <div className="flex flex-col gap-1">
              <span className="text-sm font-black text-muted-foreground uppercase tracking-widest">إجمالي الفاتورة:</span>
              <div className="flex items-baseline justify-between">
                <span className="text-5xl font-black text-primary tracking-tighter">
                  {total.toLocaleString()}
                </span>
                <span className="text-xl font-black text-primary">د.ع</span>
              </div>
           </div>

           <Button 
            disabled={cart.length === 0}
            className="w-full h-20 rounded-[32px] text-2xl font-black gap-4 shadow-2xl shadow-primary/30 group relative overflow-hidden transition-all hover:scale-[1.02] active:scale-95"
            onClick={() => setIsCheckoutOpen(true)}
           >
              <Zap className="h-8 w-8 transition-all group-hover:scale-125 group-hover:rotate-12" />
              إتمام العملية (F4)
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
           </Button>
        </div>
      </div>

      {/* Checkout Dialog */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white dark:bg-card w-full max-w-2xl rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-400">
              <div className="p-10 border-b flex items-center justify-between bg-primary text-white">
                 <div className="space-y-1">
                   <h3 className="text-3xl font-black">تأكيد الدفع</h3>
                   <p className="text-primary-foreground/80 font-bold">يرجى التأكد من المبلغ المستلم</p>
                 </div>
                 <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 hover:bg-white/20 text-white" onClick={() => setIsCheckoutOpen(false)}>
                    <X className="h-8 w-8" />
                 </Button>
              </div>
              <div className="p-10 space-y-10">
                 <div className="grid grid-cols-2 gap-10">
                    <div className="space-y-2">
                       <p className="text-sm font-black uppercase tracking-widest opacity-60">المبلغ المطلوب</p>
                       <p className="text-5xl font-black text-primary">{total.toLocaleString()} <span className="text-xl">د.ع</span></p>
                    </div>
                    <div className="space-y-4">
                       <p className="text-sm font-black uppercase tracking-widest opacity-60">طريقة الدفع</p>
                       <div className="flex items-center gap-4 p-5 rounded-[28px] bg-primary/5 border-2 border-primary shadow-sm">
                          <CreditCard className="h-8 w-8 text-primary" />
                          <span className="font-black text-lg">نقداً (Cash)</span>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <p className="text-sm font-black uppercase tracking-widest opacity-60">المبلغ المدفوع من قبل العميل</p>
                    <div className="relative">
                       <Input 
                        placeholder="0.00" 
                        className="h-28 rounded-[36px] text-6xl font-black text-center bg-muted/20 border-none focus:ring-8 focus:ring-primary/10 transition-all shadow-inner" 
                        autoFocus
                       />
                       <span className="absolute left-8 top-1/2 -translate-y-1/2 text-2xl font-black opacity-20">د.ع</span>
                    </div>
                 </div>

                 <div className="flex items-center justify-between p-8 rounded-[32px] bg-muted/40 border border-muted-foreground/10">
                    <p className="text-xl font-bold">المتبقي (الخردة):</p>
                    <p className="text-4xl font-black text-emerald-600">0 <span className="text-sm">د.ع</span></p>
                 </div>

                 <div className="flex gap-6">
                    <Button variant="outline" className="flex-1 h-18 rounded-[24px] border-2 font-black text-lg h-16" onClick={() => setIsCheckoutOpen(false)}>
                       إلغاء
                    </Button>
                    <Button 
                      disabled={processingOrder}
                      className="flex-[2] h-18 rounded-[24px] font-black text-xl gap-3 h-16 shadow-xl shadow-primary/20" 
                      onClick={handleCompleteSale}
                    >
                       {processingOrder ? <Loader2 className="h-6 w-6 animate-spin" /> : <Printer className="h-6 w-6" />}
                       تأكيد وطباعة الفاتورة
                    </Button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
