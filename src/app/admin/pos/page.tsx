'use client';

import { useState, useMemo, useEffect } from "react";
import { 
  Search, Barcode, Trash2, Minus, Plus, ShoppingCart, User, 
  ChevronDown, Loader2, Package, Zap, Printer, CreditCard, Banknote, 
  UserPlus, Save, History, Edit, Eye, X, ArrowRight, AlertTriangle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useUser } from "@/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { InventoryService } from "@/services/inventory-service";
import { POSService } from "@/services/pos-service";
import { useRouter } from "next/navigation";
import { PrintEngine } from "@/services/print-engine";
import { InvoiceDetailDialog } from "@/components/admin/invoice-detail-dialog";

export default function POSPage() {
  const { profile } = useUser();
  const router = useRouter();
  
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [priceType, setPriceType] = useState<'retail' | 'wholesale' | 'agent'>('retail');
  const [customers, setCustomers] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>({ name: "زبون نقدي", id: undefined });
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paidAmount, setPaidAmount] = useState(0);
  const [receivedAmount, setReceivedAmount] = useState<number>(0);
  const [banknoteMode, setBanknoteMode] = useState<'replace' | 'add'>('replace');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit'>('cash');
  const [localUser, setLocalUser] = useState<any>(null);

  // Edit Sale & History Modal States
  const [editingSale, setEditingSale] = useState<any | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historySales, setHistorySales] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [selectedInvoiceForDetail, setSelectedInvoiceForDetail] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem('dubsar_session');
    if (session) setLocalUser(JSON.parse(session));
    loadLocalData();

    // Check if URL has editInvoiceId query parameter
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const editId = params.get('editInvoiceId');
      if (editId) {
        loadSaleForEditing(editId);
      }
    }
  }, []);

  const loadLocalData = async () => {
    try {
      const [p, c, customerRows] = await Promise.all([
        InventoryService.getProducts(),
        InventoryService.getCategories(),
        InventoryService.getCustomers()
      ]);
      setProducts(p || []);
      setCategories(c || []);
      setCustomers(customerRows || []);
    } finally {
      setLoading(false);
    }
  };

  const loadHistorySales = async () => {
    setHistoryLoading(true);
    try {
      const sales = await POSService.getRecentSales();
      setHistorySales(Array.isArray(sales) ? sales : []);
    } catch (e) {
      console.error("Failed to load history sales:", e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadSaleForEditing = async (saleOrId: any) => {
    try {
      let targetSale = saleOrId;
      if (typeof saleOrId === 'string') {
        const sales = await POSService.getRecentSales();
        targetSale = (sales || []).find((s: any) => s.id === saleOrId || s.invoiceNo === saleOrId);
      }

      if (!targetSale) {
        toast({ variant: "destructive", title: "خطأ", description: "تعذر العثور على الفاتورة المطلوبة للتعديل." });
        return;
      }

      setEditingSale(targetSale);

      // Populate cart with sale items
      const rawItems = Array.isArray(targetSale.items) ? targetSale.items : [];
      const newCart = rawItems.map((it: any) => ({
        id: it.productId || it.id,
        name: it.name,
        price: Number(it.price || it.unitPrice) || 0,
        priceType: it.priceType || targetSale.priceType || 'retail',
        quantity: Number(it.quantity) || 1,
        barcode: it.barcode || '',
        image: it.imageUrl || ''
      }));

      setCart(newCart);

      // Customer
      if (targetSale.customerId) {
        setSelectedCustomer({
          id: targetSale.customerId,
          name: targetSale.customerName || 'زبون مسجل',
          phone: targetSale.customerPhone || ''
        });
      } else {
        setSelectedCustomer({
          id: undefined,
          name: targetSale.customerName || 'زبون نقدي',
          phone: targetSale.customerPhone || ''
        });
      }

      setPriceType((targetSale.priceType as any) || 'retail');
      setPaymentMethod((targetSale.paymentMethod as any) || 'cash');
      setPaidAmount(Number(targetSale.paidAmount) || 0);

      setIsHistoryOpen(false);
      toast({ 
        title: "تم تحميل الفاتورة للتعديل", 
        description: `أنت الآن تعدل الفاتورة رقم: ${targetSale.invoiceNo || targetSale.id}` 
      });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "خطأ", description: "فشل تحميل الفاتورة للتعديل." });
    }
  };

  const cancelEditMode = () => {
    setEditingSale(null);
    setCart([]);
    setSelectedCustomer({ name: "زبون نقدي", id: undefined });
    setPriceType('retail');
    setPaymentMethod('cash');
    setPaidAmount(0);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', '/admin/pos');
    }
    toast({ title: "تم إلغاء التعديل", description: "تم الرجوع إلى وضع الكاشير العادي." });
  };

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter((p: any) => 
      (p.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) || 
      (p.barcode || "").includes(searchQuery)
    );
  }, [products, searchQuery]);

  const total = useMemo(() => cart.reduce((acc, item) => acc + (item.price * item.quantity), 0), [cart]);

  const priceFor = (product: any) => priceType === 'wholesale' ? product.wholesalePrice : priceType === 'agent' ? product.agentPrice : product.retailPrice;

  const addToCart = (product: any) => {
    if (!product) return;
    // In edit mode or normal mode, check stock
    if (Number(product.stockQuantity) <= 0 && !editingSale) {
      toast({ variant: "destructive", title: "المادة غير متوفرة", description: "لا توجد كمية كافية في المخزون." });
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1, price: priceFor(product) } : item);
      }
      return [...prev, { 
        id: product.id, 
        name: product.name, 
        price: priceFor(product),
        priceType,
        quantity: 1, 
        barcode: product.barcode || '',
        image: product.imageUrl || ""
      }];
    });
  };

  const handleBarcodeKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    const barcode = searchQuery.trim();
    const product = products.find((candidate) => candidate.barcode && candidate.barcode === barcode);
    if (!product) {
      toast({ variant: "destructive", title: "الباركود غير موجود", description: barcode });
      return;
    }
    addToCart(product);
    setSearchQuery("");
  };

  const changeQuantity = (id: string, delta: number) => {
    setCart((items) => items.flatMap((item) => {
      if (item.id !== id) return [item];
      const quantity = item.quantity + delta;
      if (quantity <= 0) return [];
      return [{ ...item, quantity }];
    }));
  };

  const handleCompleteSale = async () => {
    if (processing || cart.length === 0) return;
    setProcessing(true);
    try {
      const savedCart = [...cart];
      const paid = paymentMethod === 'cash' ? total : paidAmount;

      if (editingSale) {
        // UPDATE EXISTING SALE
        const result = await POSService.updateSale(
          editingSale.id,
          cart,
          selectedCustomer,
          {
            paidAmount: paid,
            method: paymentMethod,
            priceType,
            discountAmount: Number(editingSale.discountAmount || 0)
          },
          localUser || profile
        );

        toast({ 
          title: "تم حفظ التعديلات بنجاح", 
          description: `تم تحديث الفاتورة رقم: ${editingSale.invoiceNo || ''} وتحديث أرصدة المخزون والعميل.` 
        });

        // Thermal Print updated receipt
        try {
          const appSettings = JSON.parse(localStorage.getItem('dubsar_app_settings') || '{}');
          await PrintEngine.printThermalReceipt({
            invoiceNo: editingSale.invoiceNo || `POS-${Date.now().toString().slice(-6)}`,
            date: new Date().toLocaleDateString('ar-IQ'),
            time: new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }),
            customerName: selectedCustomer?.name || 'زبون نقدي',
            customerPhone: selectedCustomer?.phone || '',
            customerAddress: selectedCustomer?.address || '',
            cashierName: localUser?.displayName || localUser?.username || profile?.displayName || 'الكاشير',
            priceType,
            currency: 'IQD',
            items: savedCart.map(it => ({
              name: it.name,
              barcode: it.barcode,
              quantity: it.quantity,
              price: it.price,
              unit: it.unit
            })),
            subtotal: total,
            netTotal: total,
            paidAmount: paid,
            remaining: Math.max(0, total - paid),
            receivedAmount: paymentMethod === 'cash' ? (Number(receivedAmount) || total) : undefined,
            changeGiven: paymentMethod === 'cash' ? Math.max(0, (Number(receivedAmount) || total) - total) : undefined,
            businessSettings: appSettings
          });
        } catch (printErr) {
          console.error('Thermal print error:', printErr);
        }

        cancelEditMode();
        setIsCheckoutOpen(false);
        await loadLocalData();
      } else {
        // NEW SALE
        const result = await POSService.processSale(
          cart, 
          selectedCustomer, 
          { paidAmount: paid, method: paymentMethod, priceType }, 
          localUser || profile
        );

        toast({ title: "تم البيع وحفظ الفاتورة محلياً بنجاح", description: `رقم القائمة: ${result?.invoiceNo || ''}` });
        setCart([]);
        setIsCheckoutOpen(false);
        await loadLocalData(); // Refresh stock

        try {
          const appSettings = JSON.parse(localStorage.getItem('dubsar_app_settings') || '{}');
          const remaining = Math.max(0, total - paid);

          await PrintEngine.printThermalReceipt({
            invoiceNo: result?.invoiceNo || `POS-${Date.now().toString().slice(-6)}`,
            date: new Date().toLocaleDateString('ar-IQ'),
            time: new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }),
            customerName: selectedCustomer?.name || 'زبون نقدي',
            customerPhone: selectedCustomer?.phone || '',
            customerAddress: selectedCustomer?.address || '',
            cashierName: localUser?.displayName || localUser?.username || profile?.displayName || 'الكاشير',
            priceType,
            currency: 'IQD',
            items: savedCart.map(it => ({
              name: it.name,
              barcode: it.barcode,
              quantity: it.quantity,
              price: it.price,
              unit: it.unit
            })),
            subtotal: total,
            netTotal: total,
            paidAmount: paid,
            remaining,
            receivedAmount: paymentMethod === 'cash' ? (Number(receivedAmount) || total) : undefined,
            changeGiven: paymentMethod === 'cash' ? Math.max(0, (Number(receivedAmount) || total) - total) : undefined,
            businessSettings: appSettings
          });
        } catch (printError) {
          console.error('POS Thermal Print Error:', printError);
          toast({ variant: "destructive", title: "تنبيه الطباعة", description: "تم حفظ الفاتورة بنجاح، لكن تعذرت الطباعة الحرارية." });
        }
      }
    } catch (e) {
      toast({ variant: "destructive", title: "فشل إتمام العملية محلياً", description: e instanceof Error ? e.message : String(e) });
    } finally {
      setProcessing(false);
    }
  };

  const openCheckout = () => {
    if (cart.length === 0) return;
    setPaymentMethod(editingSale ? (editingSale.paymentMethod || 'cash') : 'cash');
    setPaidAmount(editingSale ? (Number(editingSale.paidAmount) || total) : total);
    setReceivedAmount(total);
    setBanknoteMode('replace');
    setIsCheckoutOpen(true);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F10') {
        e.preventDefault();
        if (cart.length > 0) {
          openCheckout();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, total]);

  const IRAQI_BANKNOTES = [
    {
      value: 50000,
      label: "50,000",
      arabicText: "خمسون ألف دينار",
      image: "/banknotes/50000.jpg",
      gradient: "from-purple-900 via-purple-800 to-indigo-950",
      borderColor: "border-purple-400/60",
      accent: "text-purple-200"
    },
    {
      value: 25000,
      label: "25,000",
      arabicText: "خمسة وعشرون ألفاً",
      image: "/banknotes/25000.jpg",
      gradient: "from-rose-900 via-red-800 to-rose-950",
      borderColor: "border-rose-400/60",
      accent: "text-rose-200"
    },
    {
      value: 10000,
      label: "10,000",
      arabicText: "عشرة آلاف دينار",
      image: "/banknotes/10000.jpg",
      gradient: "from-emerald-900 via-green-800 to-teal-950",
      borderColor: "border-emerald-400/60",
      accent: "text-emerald-200"
    },
    {
      value: 5000,
      label: "5,000",
      arabicText: "خمسة آلاف دينار",
      image: "/banknotes/5000.jpg",
      gradient: "from-blue-900 via-sky-800 to-indigo-950",
      borderColor: "border-blue-400/60",
      accent: "text-blue-200"
    },
    {
      value: 1000,
      label: "1,000",
      arabicText: "ألف دينار",
      image: "/banknotes/1000.jpg",
      gradient: "from-amber-800 via-yellow-700 to-amber-950",
      borderColor: "border-amber-400/60",
      accent: "text-amber-200"
    },
    {
      value: 500,
      label: "500",
      arabicText: "خمسمائة دينار",
      image: "/banknotes/500.jpg",
      gradient: "from-teal-900 via-cyan-800 to-emerald-950",
      borderColor: "border-teal-400/60",
      accent: "text-teal-200"
    },
    {
      value: 250,
      label: "250",
      arabicText: "مئتان وخمسون",
      image: "/banknotes/250.jpg",
      gradient: "from-sky-900 via-slate-800 to-blue-950",
      borderColor: "border-sky-400/60",
      accent: "text-sky-200"
    }
  ];

  const handleBanknoteClick = (val: number) => {
    if (banknoteMode === 'replace') {
      setReceivedAmount(val);
    } else {
      setReceivedAmount(prev => (Number(prev) || 0) + val);
    }
  };

  const cashChange = Math.max(0, (Number(receivedAmount) || 0) - total);
  const isCashUnderpaid = (Number(receivedAmount) || 0) < total;

  const filteredHistory = useMemo(() => {
    return historySales.filter((s: any) => 
      (s.invoiceNo?.toLowerCase() || "").includes(historySearch.toLowerCase()) ||
      (s.customerName?.toLowerCase() || "").includes(historySearch.toLowerCase())
    );
  }, [historySales, historySearch]);

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden bg-background -m-4 md:-m-8 select-none" dir="rtl">
      {/* Left/Main Products & Top Bar Area */}
      <div className="flex-1 flex flex-col p-3 md:p-6 overflow-y-auto">
        
        {/* EDIT MODE TOP BANNER */}
        {editingSale && (
          <div className="bg-amber-500/15 border-2 border-amber-500/50 rounded-2xl p-4 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-black text-amber-950 dark:text-amber-100 flex items-center gap-2">
                  <span>وضع تعديل القائمة:</span>
                  <span className="font-mono bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-500/30 text-amber-900 dark:text-amber-200">
                    {editingSale.invoiceNo || editingSale.id}
                  </span>
                </div>
                <div className="text-xs text-amber-800 dark:text-amber-300 font-bold mt-0.5">
                  العميل: <span className="font-black underline">{selectedCustomer?.name || 'زبون نقدي'}</span> • يمكنك إضافة مواد، حذفها، أو تعديل الكميات والأسعار ثم تأكيد الحفظ.
                </div>
              </div>
            </div>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={cancelEditMode}
              className="rounded-xl font-black text-xs h-9 border-amber-500/50 text-amber-900 hover:bg-amber-500/20 shrink-0 gap-1"
            >
              <X className="h-3.5 w-3.5" />
              <span>إلغاء وضع التعديل</span>
            </Button>
          </div>
        )}

        {/* Top Controls: Search & Previous Invoices Button */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="ابحث باسم المادة أو امسح الباركود ثم اضغط Enter..." 
              className="h-12 rounded-xl pr-11 bg-white dark:bg-slate-900 font-bold border shadow-sm" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              onKeyDown={handleBarcodeKeyDown} 
            />
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              loadHistorySales();
              setIsHistoryOpen(true);
            }}
            className="h-12 rounded-xl px-4 font-black gap-2 border bg-white dark:bg-slate-900 shadow-sm hover:bg-primary/5 hover:text-primary transition-all shrink-0"
            title="عرض قوائم البيع السابقة وتعديلها"
          >
            <History className="h-4 w-4 text-primary" />
            <span className="hidden sm:inline">القوائم السابقة</span>
          </Button>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
           {loading ? (
             Array(10).fill(0).map((_, i) => <Skeleton key={i} className="aspect-square rounded-3xl" />)
           ) : filteredProducts.map((p: any) => (
             <Card 
               key={p.id} 
               className="group cursor-pointer overflow-hidden rounded-[24px] border-none shadow-sm hover:shadow-xl transition-all active:scale-95 bg-white dark:bg-slate-900" 
               onClick={() => addToCart(p)}
             >
               <div className="relative aspect-square w-full bg-muted/40">
                  {p.imageUrl ? (
                    <Image src={p.imageUrl} alt={p.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                      <Package className="h-10 w-10" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <Badge className={cn("rounded-full text-[10px] font-black", (Number(p.stockQuantity) || 0) > 0 ? "bg-emerald-600" : "bg-rose-600")}>
                      {p.stockQuantity} متوفر
                    </Badge>
                  </div>
               </div>
               <CardContent className="p-3">
                  <h3 className="font-black text-xs line-clamp-1">{p.name}</h3>
                  <p className="text-primary font-black text-sm mt-1">{priceFor(p)?.toLocaleString()} د.ع</p>
               </CardContent>
             </Card>
           ))}
        </div>
      </div>

      {/* Right/Cart Sidebar Area */}
      <div className="hidden lg:flex w-[410px] flex-col bg-white dark:bg-slate-900 border-r shadow-2xl z-20">
         <div className="p-5 border-b flex items-center justify-between">
            <h2 className="text-lg font-black flex items-center gap-2">
              <ShoppingCart className="text-primary h-5 w-5" /> 
              <span>{editingSale ? `تعديل قائمة (${editingSale.invoiceNo})` : 'فاتورة البيع الحالية'}</span>
            </h2>
            {editingSale ? (
              <Badge variant="outline" className="font-black bg-amber-500/10 text-amber-700 border-amber-500/30 text-[11px]">
                تعديل نشط
              </Badge>
            ) : (
              <Badge variant="outline" className="font-black text-xs">DUBSAR 2.0</Badge>
            )}
         </div>

         {/* Cart Items List */}
         <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50 space-y-2 py-12">
                <ShoppingCart className="h-12 w-12 stroke-[1.5]" />
                <p className="text-xs font-bold">السلة فارغة، اختر المواد أو امسح الباركود</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex justify-between items-center p-3 rounded-2xl bg-muted/20 border">
                  <div className="flex-1 pr-1">
                    <p className="font-black text-xs text-foreground line-clamp-1">{item.name}</p>
                    <p className="text-[11px] font-bold text-primary font-mono mt-0.5">
                      {item.price.toLocaleString()} × {item.quantity} = {(item.price * item.quantity).toLocaleString()} د.ع
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <Button size="icon" variant="outline" className="h-7 w-7 rounded-lg" onClick={() => changeQuantity(item.id, -1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-xs font-black min-w-5 text-center font-mono">{item.quantity}</span>
                      <Button size="icon" variant="outline" className="h-7 w-7 rounded-lg" onClick={() => changeQuantity(item.id, 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50" onClick={() => setCart((items) => items.filter((line) => line.id !== item.id))}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
         </div>

         {/* Cart Summary & Actions Footer */}
         <div className="p-5 bg-slate-50 dark:bg-slate-950/60 border-t space-y-3.5">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="font-black text-[11px] text-muted-foreground block mb-1">نوع السعر</Label>
                <select 
                  className="w-full h-10 rounded-xl border bg-white dark:bg-slate-900 px-3 font-bold text-xs" 
                  value={priceType} 
                  onChange={(e) => { 
                    const newType = e.target.value as any;
                    setPriceType(newType); 
                    setCart((items) => items.map((item) => { 
                      const product = products.find((candidate) => candidate.id === item.id); 
                      return product ? { 
                        ...item, 
                        price: newType === 'wholesale' ? product.wholesalePrice : newType === 'agent' ? product.agentPrice : product.retailPrice, 
                        priceType: newType 
                      } : item; 
                    })); 
                  }}
                >
                  <option value="retail">مفرد</option>
                  <option value="wholesale">جملة</option>
                  <option value="agent">وكيل</option>
                </select>
              </div>

              <div>
                <Label className="font-black text-[11px] text-muted-foreground block mb-1">الزبون / العميل</Label>
                <select 
                  className="w-full h-10 rounded-xl border bg-white dark:bg-slate-900 px-3 font-bold text-xs" 
                  value={selectedCustomer.id || "cash"} 
                  onChange={(e) => setSelectedCustomer(e.target.value === "cash" ? { name: "زبون نقدي", id: undefined } : customers.find((customer) => String(customer.id) === e.target.value) || selectedCustomer)}
                >
                  <option value="cash">زبون نقدي</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>{customer.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-sm font-black text-muted-foreground">الإجمالي الكلي:</span>
              <span className="text-2xl font-black font-mono text-primary">{total.toLocaleString()} د.ع</span>
            </div>

            <Button 
              disabled={cart.length === 0} 
              className={cn(
                "w-full h-14 rounded-2xl text-base font-black shadow-lg transition-all",
                editingSale ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-primary hover:bg-primary/90 text-primary-foreground"
              )} 
              onClick={openCheckout}
            >
              {editingSale ? (
                <div className="flex items-center gap-2">
                  <Save className="h-5 w-5" />
                  <span>تأكيد وحفظ التعديلات (F10)</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Printer className="h-5 w-5" />
                  <span>إتمام البيع والدفع (F10)</span>
                </div>
              )}
            </Button>
         </div>
      </div>

      {/* Checkout / Payment Modal with Banknotes */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="rounded-[36px] max-w-xl w-[95vw] max-h-[92vh] overflow-y-auto p-5 sm:p-7 border shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-right flex items-center justify-between">
              <span>{editingSale ? `تأكيد تعديل الفاتورة (${editingSale.invoiceNo})` : 'إتمام البيع وحساب الباقي'}</span>
              <Badge variant="outline" className="text-xs font-mono font-bold">POS Cashier</Badge>
            </DialogTitle>
            <DialogDescription className="text-right text-xs font-bold text-muted-foreground">
              حدد فئات العملات المستلمة من الزبون لحساب الباقي الواجب إرجاعه تلقائياً
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2" dir="rtl">
            {/* Amount Summary & Payment Method */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-primary/5 border border-primary/20 p-4 rounded-2xl flex flex-col justify-center">
                <span className="text-xs font-bold text-muted-foreground">المبلغ المطلوب من الزبون:</span>
                <span className="text-2xl sm:text-3xl font-black text-primary font-mono">{total.toLocaleString()} د.ع</span>
              </div>
              <div className="p-3 rounded-2xl border bg-slate-50 dark:bg-slate-900/40 flex flex-col justify-center space-y-1.5">
                <Label className="text-xs font-black">طريقة الدفع:</Label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('cash');
                      setReceivedAmount(total);
                    }}
                    className={cn(
                      "h-10 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all",
                      paymentMethod === 'cash' 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "bg-white dark:bg-slate-800 border text-muted-foreground hover:bg-slate-100"
                    )}
                  >
                    <Banknote className="h-4 w-4" />
                    <span>نقدي</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('credit');
                      setPaidAmount(0);
                    }}
                    className={cn(
                      "h-10 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all",
                      paymentMethod === 'credit' 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "bg-white dark:bg-slate-800 border text-muted-foreground hover:bg-slate-100"
                    )}
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>آجل</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Cash Payment Mode with Iraqi Banknotes */}
            {paymentMethod === 'cash' && (
              <div className="space-y-4">
                {/* Banknotes Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Banknote className="h-4 w-4 text-emerald-600" />
                    فئات العملات العراقية المستلمة:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setBanknoteMode(prev => prev === 'replace' ? 'add' : 'replace')}
                      className="h-7 text-[11px] font-bold px-2 rounded-lg gap-1 border-dashed"
                      title={banknoteMode === 'replace' ? 'وضع الاستبدال: يغير القيمة إلى الفئة المضغوطة' : 'وضع التجميع: يضيف الفئة إلى المبلغ المستلم'}
                    >
                      <Zap className="h-3 w-3 text-amber-500" />
                      <span>{banknoteMode === 'replace' ? 'وضع: استبدال' : 'وضع: تجميع (+)'}</span>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => setReceivedAmount(total)}
                      className="h-7 text-[11px] font-bold px-2 rounded-lg"
                    >
                      المبلغ بالضبط
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setReceivedAmount(0)}
                      className="h-7 text-[11px] font-bold px-2 rounded-lg text-muted-foreground hover:text-destructive"
                    >
                      تصفير
                    </Button>
                  </div>
                </div>

                {/* Iraqi Banknotes Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {IRAQI_BANKNOTES.map((note) => {
                    const isSelected = banknoteMode === 'replace' && receivedAmount === note.value;
                    return (
                      <button
                        key={note.value}
                        type="button"
                        onClick={() => handleBanknoteClick(note.value)}
                        className={cn(
                          "relative flex flex-col justify-between p-2 rounded-2xl border-2 transition-all cursor-pointer shadow-md hover:shadow-xl hover:scale-[1.03] active:scale-95 text-right overflow-hidden group min-h-[76px] sm:min-h-[82px] bg-gradient-to-br",
                          note.gradient,
                          note.borderColor,
                          isSelected ? "ring-4 ring-offset-2 ring-primary border-white scale-[1.03]" : "opacity-95 hover:opacity-100"
                        )}
                      >
                        {note.image && (
                          <img
                            src={note.image}
                            alt={note.arabicText}
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                            }}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-all duration-300 pointer-events-none"
                          />
                        )}
                        <div className="relative z-10 flex justify-between items-start w-full bg-black/40 px-1.5 py-0.5 rounded-lg backdrop-blur-[2px]">
                          <span className={cn("text-xs sm:text-sm font-black font-mono tracking-tight drop-shadow-md", note.accent)}>
                            {note.label}
                          </span>
                          <span className="text-[9px] font-bold text-white/90 drop-shadow">
                            د.ع
                          </span>
                        </div>
                        <div className="relative z-10 bg-black/60 px-1.5 py-0.5 rounded-md backdrop-blur-[2px] mt-auto">
                          <span className="text-[10px] font-bold text-white block truncate drop-shadow">
                            {note.arabicText}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                  
                  {/* Quick Exact Match Card */}
                  <button
                    type="button"
                    onClick={() => setReceivedAmount(total)}
                    className="relative flex flex-col justify-between p-2.5 rounded-2xl border-2 border-primary/40 bg-gradient-to-br from-slate-800 to-slate-900 text-white transition-all cursor-pointer shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95 text-right"
                  >
                    <div className="text-[10px] font-bold opacity-80">المبلغ كامل</div>
                    <div className="my-1 text-center font-black text-sm text-primary-foreground">
                      المبلغ بالضبط
                    </div>
                    <div className="text-[9px] opacity-70 text-left font-mono">
                      {total.toLocaleString()} د.ع
                    </div>
                  </button>
                </div>

                {/* Received Amount Input Field */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-black text-slate-700 dark:text-slate-300">
                      المبلغ المستلم نقداً من الزبون (يدوياً أو عبر العملات):
                    </Label>
                    <span className="text-[11px] font-mono font-bold text-muted-foreground">
                      {Number(receivedAmount || 0).toLocaleString()} د.ع
                    </span>
                  </div>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      step="250"
                      value={receivedAmount || ''}
                      onChange={(e) => setReceivedAmount(Number(e.target.value))}
                      placeholder="أدخل المبلغ المستلم أو اضغط فئة العملة..."
                      className="h-12 rounded-xl text-lg font-black font-mono pr-4 pl-14 bg-white dark:bg-slate-900 border-2 border-primary/30 focus-visible:border-primary"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-muted-foreground">
                      د.ع
                    </span>
                  </div>
                </div>

                {/* Change to Return / Remaining Status Display */}
                {cashChange > 0 && (
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500 flex items-center justify-between text-emerald-950 dark:text-emerald-100 shadow-sm animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-0.5">
                      <p className="text-xs font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                        <Banknote className="h-4 w-4" />
                        الباقي للزبون (الفكة الواجب إرجاعها):
                      </p>
                      <p className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-emerald-600 dark:text-emerald-300">
                        {cashChange.toLocaleString()} <span className="text-sm font-bold">د.ع</span>
                      </p>
                      <p className="text-[11px] font-bold text-emerald-800/80 dark:text-emerald-400">
                        (مستلم: {Number(receivedAmount).toLocaleString()} - مطلوب: {total.toLocaleString()})
                      </p>
                    </div>
                    <div className="h-14 w-14 rounded-2xl bg-emerald-500 text-white flex flex-col items-center justify-center shadow-md">
                      <span className="text-[10px] font-black">إرجاع</span>
                      <span className="text-base font-black font-mono">↓</span>
                    </div>
                  </div>
                )}

                {receivedAmount === total && total > 0 && (
                  <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-300 text-blue-800 dark:text-blue-200 flex items-center justify-between text-xs font-bold">
                    <span>المبلغ المستلم مساوٍ تماماً لقيمة القائمة</span>
                    <Badge variant="outline" className="font-mono bg-blue-100 text-blue-900 border-blue-400">الباقي: 0 د.ع</Badge>
                  </div>
                )}

                {isCashUnderpaid && total > 0 && (
                  <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 text-amber-900 dark:text-amber-200 flex items-center justify-between text-xs font-bold">
                    <span>المبلغ المستلم أقل من القائمة! متبقي:</span>
                    <span className="font-mono font-black text-sm">{(total - (Number(receivedAmount) || 0)).toLocaleString()} د.ع</span>
                  </div>
                )}
              </div>
            )}

            {/* Credit Payment Mode */}
            {paymentMethod === 'credit' && (
              <div className="space-y-3 p-4 rounded-2xl border bg-slate-50 dark:bg-slate-900/40">
                <div className="space-y-1.5">
                  <Label className="text-xs font-black">المدفوع مقدماً (إن وجد):</Label>
                  <div className="relative">
                    <Input 
                      type="number" 
                      min="0" 
                      max={total} 
                      value={paidAmount} 
                      onChange={(e) => setPaidAmount(Number(e.target.value))}
                      className="h-11 rounded-xl text-base font-bold font-mono pl-12 bg-white dark:bg-slate-800"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">د.ع</span>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs font-bold pt-1 border-t">
                  <span className="text-muted-foreground">المتبقي كدين بذمة الزبون:</span>
                  <span className="font-mono font-black text-rose-600 text-sm">
                    {Math.max(0, total - paidAmount).toLocaleString()} د.ع
                  </span>
                </div>
              </div>
            )}

            {/* Confirm & Complete Button */}
            <Button 
              disabled={processing} 
              className={cn(
                "w-full h-14 rounded-2xl text-lg font-black shadow-lg gap-2 mt-2",
                editingSale ? "bg-amber-600 hover:bg-amber-700 text-white" : ""
              )} 
              onClick={handleCompleteSale}
            >
              {processing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>{editingSale ? 'جاري حفظ التعديل...' : 'جاري إتمام الفاتورة والطباعة...'}</span>
                </>
              ) : (
                <>
                  <Printer className="h-5 w-5" />
                  <span>{editingSale ? 'تأكيد وحفظ تعديل الفاتورة وطباعتها' : 'إتمام البيع وحفظ وطباعة الفاتورة'}</span>
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* History Invoices Dialog ("القوائم السابقة") */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="rounded-[32px] max-w-3xl w-[95vw] max-h-[90vh] overflow-hidden p-0 border shadow-2xl" dir="rtl">
          <DialogHeader className="p-6 bg-slate-900 text-white flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
                <History className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black">قوائم وفواتير البيع السابقة</DialogTitle>
                <DialogDescription className="text-xs text-slate-300 font-bold mt-0.5">
                  عرض تفاصيل أي فاتورة، طباعتها، أو تحميلها وتعديلها مباشرة في الكاشير
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-6 space-y-4">
            <div className="relative">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="ابحث برقم الفاتورة أو اسم الزبون..." 
                className="h-11 rounded-xl pr-10 border bg-muted/20 font-bold text-xs" 
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
              />
            </div>

            <div className="rounded-2xl border overflow-x-auto max-h-[50vh]">
              <table className="w-full text-right text-xs">
                <thead className="bg-muted/50 font-black border-b sticky top-0 bg-slate-100 dark:bg-slate-800 z-10">
                  <tr>
                    <th className="p-3">رقم الفاتورة</th>
                    <th className="p-3">الزبون</th>
                    <th className="p-3 text-center">طريقة الدفع</th>
                    <th className="p-3 text-left">المبلغ الإجمالي</th>
                    <th className="p-3 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-bold">
                  {historyLoading ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary mb-2" />
                        <span>جاري تحميل الفواتير...</span>
                      </td>
                    </tr>
                  ) : filteredHistory.length > 0 ? (
                    filteredHistory.map((s: any) => (
                      <tr key={s.id} className="hover:bg-muted/15 transition-colors">
                        <td className="p-3 font-mono text-primary font-black">{s.invoiceNo}</td>
                        <td className="p-3">{s.customerName || 'زبون نقدي'}</td>
                        <td className="p-3 text-center">
                          <Badge variant={s.paymentMethod === 'credit' ? 'outline' : 'secondary'} className="text-[10px]">
                            {s.paymentMethod === 'credit' ? 'آجل' : 'نقدي'}
                          </Badge>
                        </td>
                        <td className="p-3 text-left font-mono font-black text-foreground">
                          {Number(s.totalAmount || 0).toLocaleString()} د.ع
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                setSelectedInvoiceForDetail(s);
                                setIsDetailOpen(true);
                              }}
                              className="h-8 rounded-lg text-[11px] font-bold gap-1"
                              title="معاينة تفاصيل الفاتورة وطباعتها"
                            >
                              <Eye className="h-3.5 w-3.5 text-primary" />
                              <span>معاينة</span>
                            </Button>
                            <Button 
                              type="button" 
                              variant="default" 
                              size="sm" 
                              onClick={() => loadSaleForEditing(s)}
                              className="h-8 rounded-lg text-[11px] font-bold gap-1 bg-amber-600 hover:bg-amber-700 text-white"
                              title="تحميل الفاتورة في الكاشير لتعديل المواد أو الأسعار"
                            >
                              <Edit className="h-3.5 w-3.5" />
                              <span>تعديل في الكاشير</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground font-bold">
                        لا توجد فواتير مطابقة
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <DialogFooter className="p-4 bg-muted/20 border-t">
            <Button type="button" variant="ghost" onClick={() => setIsHistoryOpen(false)} className="rounded-xl font-bold">
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Detail Dialog for Preview and Printing */}
      {selectedInvoiceForDetail && (
        <InvoiceDetailDialog 
          isOpen={isDetailOpen} 
          onClose={() => setIsDetailOpen(false)} 
          invoice={selectedInvoiceForDetail} 
        />
      )}
    </div>
  );
}
