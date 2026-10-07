'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { 
  Barcode, 
  Check, 
  CreditCard, 
  FileText, 
  Loader2, 
  Minus, 
  Plus, 
  Printer, 
  RotateCcw, 
  Save, 
  Search, 
  Trash2, 
  UserPlus, 
  Users 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InventoryService } from '@/services/inventory-service';
import { POSService } from '@/services/pos-service';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { PrintPreviewModal } from '@/components/admin/print-preview-modal';
import { PrintableInvoice } from '@/components/admin/printable-invoice';
import { PrintEngine } from '@/services/print-engine';

interface CartItem {
  id: string;
  name: string;
  barcode: string;
  unit: string;
  quantity: number;
  price: number;
  serialNo?: string;
  expiryDate?: string;
  notes?: string;
  stockQuantity: number;
}

export default function ModernSalesPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [warehouseId, setWarehouseId] = useState('default-warehouse');

  // Top header fields
  const [invoiceDate, setInvoiceDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [invoiceNo, setInvoiceNo] = useState<string>(() => {
    try {
      const appSettings = JSON.parse(localStorage.getItem('dubsar_app_settings') || '{}');
      const prefix = appSettings.invoicePrefix || 'INV-';
      const lastSeq = Number(localStorage.getItem('dubsar_last_invoice_seq') || appSettings.invoiceStartNumber || 1000);
      const nextSeq = lastSeq + 1;
      localStorage.setItem('dubsar_last_invoice_seq', String(nextSeq));
      return `${prefix}${nextSeq}`;
    } catch {
      return `INV-1001`;
    }
  });
  const [currency, setCurrency] = useState<'IQD' | 'USD'>('IQD');
  const [priceType, setPriceType] = useState<'retail' | 'wholesale' | 'agent'>('retail');

  // Customer fields
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('زبون نقدي');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerAddress, setCustomerAddress] = useState<string>('');
  const [customerDebtor, setCustomerDebtor] = useState<string>('');

  // Quick entry row state
  const [quickQuery, setQuickQuery] = useState('');
  const [quickSelectedProduct, setQuickSelectedProduct] = useState<any | null>(null);
  const [quickQuantity, setQuickQuantity] = useState<number>(1);
  const [quickPrice, setQuickPrice] = useState<number>(0);
  const [quickSerial, setQuickSerial] = useState<string>('');
  const [quickExpiry, setQuickExpiry] = useState<string>('');
  const [quickNotes, setQuickNotes] = useState<string>('');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);

  // Quick barcode scan input
  const [barcodeInput, setBarcodeInput] = useState('');

  // Cart and amounts
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [isPaidManuallySet, setIsPaidManuallySet] = useState<boolean>(false);
  const [autoPrint, setAutoPrint] = useState<boolean>(true);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState<boolean>(false);
  const [lastCompletedInvoice, setLastCompletedInvoice] = useState<any | null>(null);

  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>({});

  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const quickQueryInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    try {
      const [productRows, customerRows, warehouseRows] = await Promise.all([
        InventoryService.getProducts(),
        InventoryService.getCustomers(),
        InventoryService.getWarehouses()
      ]);
      setProducts(productRows || []);
      setCustomers(customerRows || []);
      setWarehouses(warehouseRows || []);
      if (warehouseRows && warehouseRows.length > 0 && warehouseId === 'default-warehouse') {
        setWarehouseId(warehouseRows[0].id);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'خطأ في تحميل البيانات',
        description: String(error)
      });
    }
  };

  useEffect(() => {
    try {
      setCurrentUser(JSON.parse(localStorage.getItem('dubsar_session') || '{}'));
    } catch {
      setCurrentUser({});
    }
    loadData();
  }, []);

  const priceFor = (product: any, type = priceType) => {
    if (!product) return 0;
    if (type === 'wholesale') return Number(product.wholesalePrice || 0);
    if (type === 'agent') return Number(product.agentPrice || 0);
    return Number(product.retailPrice || 0);
  };

  // Selected customer previous balance
  const activeCustomer = customers.find((c) => c.id === selectedCustomerId);
  const previousBalance = activeCustomer ? Number(activeCustomer.balance || 0) : 0;

  // Handle customer selection change
  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
    if (!customerId) {
      setCustomerName('زبون نقدي');
      setCustomerPhone('');
      setCustomerAddress('');
      setCustomerDebtor('');
      return;
    }
    const found = customers.find((c) => c.id === customerId);
    if (found) {
      setCustomerName(found.name || '');
      setCustomerPhone(found.phone || '');
      setCustomerAddress(found.address || '');
    }
  };

  // Autocomplete products filter
  const filteredProducts = useMemo(() => {
    const normalized = quickQuery.trim().toLowerCase();
    if (!normalized) return [];
    const terms = normalized.split(/\s+/).filter(Boolean);
    return products.filter((product) => {
      const haystack = `${product.name || ''} ${product.barcode || ''} ${product.sku || ''} ${product.brand || ''}`.toLowerCase();
      return terms.every((term) => haystack.includes(term));
    }).slice(0, 15);
  }, [products, quickQuery]);

  // Handle selecting an item from the suggestions
  const selectSuggestion = (product: any) => {
    setQuickSelectedProduct(product);
    setQuickQuery(product.name || '');
    setQuickPrice(priceFor(product));
    setQuickQuantity(1);
    setHighlightedIndex(0);
  };

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (discountType === 'percent') {
      return (subtotal * Math.min(100, Math.max(0, discountValue))) / 100;
    }
    return Math.min(subtotal, Math.max(0, discountValue));
  }, [subtotal, discountType, discountValue]);

  const netTotal = Math.max(0, subtotal - discountAmount);

  // Auto-sync paidAmount with netTotal if user hasn't explicitly customized it
  useEffect(() => {
    if (!isPaidManuallySet) {
      setPaidAmount(netTotal);
    }
  }, [netTotal, isPaidManuallySet]);

  const remaining = Math.max(0, netTotal - paidAmount);
  const currentBalance = previousBalance + remaining;

  // Add line to cart
  const addQuickLine = () => {
    if (!quickSelectedProduct && !quickQuery.trim()) {
      toast({ variant: 'destructive', title: 'يرجى اختيار مادة أولاً' });
      return;
    }

    const targetProduct = quickSelectedProduct || products.find((p) => p.name?.toLowerCase() === quickQuery.trim().toLowerCase() || p.barcode === quickQuery.trim());
    if (!targetProduct) {
      toast({ variant: 'destructive', title: 'المادة غير مسجلة في النظام' });
      return;
    }

    const availableStock = Number(targetProduct.stockQuantity || 0);
    if (availableStock <= 0) {
      toast({ variant: 'destructive', title: 'الكمية نفذت في المخزن' });
      return;
    }

    const qtyToAdd = Math.max(1, Number(quickQuantity) || 1);
    const existingInCart = cart.find((i) => i.id === targetProduct.id);
    const totalDesiredQty = (existingInCart ? existingInCart.quantity : 0) + qtyToAdd;

    if (totalDesiredQty > availableStock) {
      toast({
        variant: 'destructive',
        title: 'الكمية المطلوبة تتجاوز المخزون',
        description: `المتوفر حالياً: ${availableStock}`
      });
      return;
    }

    setCart((current) => {
      if (existingInCart) {
        return current.map((item) =>
          item.id === targetProduct.id
            ? {
                ...item,
                quantity: item.quantity + qtyToAdd,
                price: quickPrice > 0 ? quickPrice : item.price,
                serialNo: quickSerial || item.serialNo,
                expiryDate: quickExpiry || item.expiryDate,
                notes: quickNotes || item.notes
              }
            : item
        );
      }
      return [
        ...current,
        {
          id: targetProduct.id,
          name: targetProduct.name,
          barcode: targetProduct.barcode || '',
          unit: targetProduct.unit || 'قطعة',
          quantity: qtyToAdd,
          price: quickPrice > 0 ? quickPrice : priceFor(targetProduct),
          serialNo: quickSerial,
          expiryDate: quickExpiry,
          notes: quickNotes,
          stockQuantity: availableStock
        }
      ];
    });

    // Reset quick entry bar
    setQuickQuery('');
    setQuickSelectedProduct(null);
    setQuickQuantity(1);
    setQuickPrice(0);
    setQuickSerial('');
    setQuickExpiry('');
    setQuickNotes('');
    setHighlightedIndex(0);
    quickQueryInputRef.current?.focus();
  };

  // Instant Barcode Scan
  const handleBarcodeScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = barcodeInput.trim();
      if (!code) return;

      const product = products.find((p) => p.barcode === code);
      if (!product) {
        toast({ variant: 'destructive', title: 'الباركود غير معرف', description: code });
        setBarcodeInput('');
        return;
      }

      const availableStock = Number(product.stockQuantity || 0);
      if (availableStock <= 0) {
        toast({ variant: 'destructive', title: 'نفذت كمية المادة في المخزن' });
        setBarcodeInput('');
        return;
      }

      const existing = cart.find((item) => item.id === product.id);
      const currentQty = existing ? existing.quantity : 0;
      if (currentQty + 1 > availableStock) {
        toast({
          variant: 'destructive',
          title: 'الكمية المطلوبة تتجاوز المخزون',
          description: `المتاح: ${availableStock}`
        });
        setBarcodeInput('');
        return;
      }

      setCart((items) => {
        if (existing) {
          return items.map((i) => (i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
        }
        return [
          ...items,
          {
            id: product.id,
            name: product.name,
            barcode: product.barcode || '',
            unit: product.unit || 'قطعة',
            quantity: 1,
            price: priceFor(product),
            stockQuantity: availableStock
          }
        ];
      });

      setBarcodeInput('');
    }
  };

  // Update item quantity in grid
  const updateItemQty = (id: string, newQty: number) => {
    const target = cart.find((i) => i.id === id);
    if (!target) return;

    if (newQty <= 0) {
      setCart((items) => items.filter((i) => i.id !== id));
      return;
    }

    if (newQty > target.stockQuantity) {
      toast({
        variant: 'destructive',
        title: 'الكمية المطلوبة تتجاوز المتوفر',
        description: `المتوفر: ${target.stockQuantity}`
      });
      return;
    }

    setCart((items) => items.map((i) => (i.id === id ? { ...i, quantity: newQty } : i)));
  };

  // Update item price in grid
  const updateItemPrice = (id: string, newPrice: number) => {
    setCart((items) => items.map((i) => (i.id === id ? { ...i, price: Math.max(0, newPrice) } : i)));
  };

  // Price type change
  const handlePriceTypeChange = (newType: typeof priceType) => {
    setPriceType(newType);
    setCart((items) =>
      items.map((item) => {
        const product = products.find((p) => p.id === item.id);
        return product ? { ...item, price: priceFor(product, newType) } : item;
      })
    );
    if (quickSelectedProduct) {
      setQuickPrice(priceFor(quickSelectedProduct, newType));
    }
  };

  // Start a fresh new invoice
  const handleNewInvoice = () => {
    setCart([]);
    setSelectedCustomerId('');
    setCustomerName('زبون نقدي');
    setCustomerPhone('');
    setCustomerAddress('');
    setCustomerDebtor('');
    setDiscountValue(0);
    setPaidAmount(0);
    setIsPaidManuallySet(false);
    const appSettings = JSON.parse(localStorage.getItem('dubsar_app_settings') || '{}');
    const prefix = appSettings.invoicePrefix || 'INV-';
    const lastSeq = Number(localStorage.getItem('dubsar_last_invoice_seq') || appSettings.invoiceStartNumber || 1000);
    const nextSeq = lastSeq + 1;
    localStorage.setItem('dubsar_last_invoice_seq', String(nextSeq));
    setInvoiceNo(`${prefix}${nextSeq}`);
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    quickQueryInputRef.current?.focus();
  };

  // Save invoice
  const handleSaveInvoice = async () => {
    if (saving) return;
    if (cart.length === 0) {
      toast({ variant: 'destructive', title: 'سلة الفاتورة فارغة', description: 'أضف مواد أولاً قبل الحفظ' });
      return;
    }

    const isCredit = remaining > 0.01;
    const finalCustomerName = customerName.trim() || 'زبون نقدي';

    if (isCredit && finalCustomerName === 'زبون نقدي' && !selectedCustomerId) {
      toast({
        variant: 'destructive',
        title: 'البيع الآجل يتطلب تحديد العميل',
        description: 'يرجى كتابة اسم الزبون أو اختياره من القائمة لحفظ الذمة المالية.'
      });
      return;
    }

    setSaving(true);
    try {
      const session = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('dubsar_session') || '{}') : {};

      const customerPayload = {
        id: selectedCustomerId || undefined,
        name: finalCustomerName,
        phone: customerPhone.trim() || undefined,
        address: customerAddress.trim() || undefined,
        debtor: customerDebtor.trim() || undefined
      };

      const paymentPayload = {
        method: isCredit ? 'credit' : 'cash',
        paidAmount: Number(paidAmount) || 0,
        discount: Number(discountAmount) || 0,
        priceType,
        warehouseId,
        currency,
        invoiceNo
      };

      const cartPayload = cart.map((item) => ({
        id: item.id,
        productId: item.id,
        name: item.name,
        barcode: item.barcode,
        quantity: Number(item.quantity) || 1,
        price: Number(item.price) || 0,
        serialNo: item.serialNo || '',
        expiryDate: item.expiryDate || '',
        notes: item.notes || ''
      }));

      const result = await POSService.processSale(cartPayload, customerPayload, paymentPayload, session);

      const savedSnapshot = {
        invoiceNo: result?.invoiceNo || invoiceNo,
        date: invoiceDate,
        customerName: finalCustomerName,
        customerPhone,
        customerAddress,
        cart: [...cart],
        subtotal,
        discountAmount,
        netTotal,
        paidAmount,
        remaining,
        previousBalance,
        currentBalance
      };
      setLastCompletedInvoice(savedSnapshot);

      toast({
        title: 'تم حفظ الفاتورة بنجاح',
        description: `رقم القائمة: ${result.invoiceNo || invoiceNo}`
      });

      if (autoPrint) {
        setTimeout(async () => {
          try {
            const appSettings = JSON.parse(localStorage.getItem('dubsar_app_settings') || '{}');
            const format = appSettings.defaultPrintFormat || '80mm';
            const printPayload = {
              invoiceNo: savedSnapshot.invoiceNo,
              date: savedSnapshot.date,
              customerName: savedSnapshot.customerName,
              customerPhone: savedSnapshot.customerPhone,
              customerAddress: savedSnapshot.customerAddress,
              cashierName: currentUser?.displayName || 'المسؤول',
              priceType,
              currency,
              items: savedSnapshot.cart.map(it => ({
                name: it.name,
                barcode: it.barcode,
                quantity: it.quantity,
                price: it.price,
                unit: it.unit,
                serialNo: it.serialNo
              })),
              subtotal: savedSnapshot.subtotal,
              discountAmount: savedSnapshot.discountAmount,
              netTotal: savedSnapshot.netTotal,
              paidAmount: savedSnapshot.paidAmount,
              remaining: savedSnapshot.remaining,
              previousBalance: savedSnapshot.previousBalance,
              currentBalance: savedSnapshot.currentBalance,
              businessSettings: appSettings
            };

            if (format === '80mm') {
              await PrintEngine.printThermalReceipt(printPayload);
            } else {
              await PrintEngine.printA4Invoice(printPayload);
            }
          } catch (err) {
            console.error(err);
            window.print();
          }
        }, 150);
      }

      handleNewInvoice();
      await loadData();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'فشل حفظ الفاتورة',
        description: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex flex-col h-[calc(100vh-100px)] select-none bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 screen-only" dir="rtl">
      {/* 1. TOP HEADER BAR: Invoice Metadata & Customer Info */}
      <div className="p-3 bg-white dark:bg-slate-900 border-b shadow-sm space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Right: Date and Invoice No */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-600 dark:text-slate-400">التاريخ:</span>
            <Input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="h-8 w-36 text-xs font-bold bg-slate-100 dark:bg-slate-800"
            />
            <span className="text-xs font-black text-slate-600 dark:text-slate-400 mr-2">رقم القائمة:</span>
            <Input
              type="text"
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
              className="h-8 w-28 text-xs font-black text-center bg-slate-100 dark:bg-slate-800 text-primary"
            />
          </div>

          {/* Center: Currency & Price Type & Warehouse */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-600 dark:text-slate-400">العملة:</span>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as any)}
              className="h-8 px-2 text-xs font-bold rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              <option value="IQD">دينار عراقي (د.ع)</option>
              <option value="USD">دولار أمريكي ($)</option>
            </select>

            <span className="text-xs font-black text-slate-600 dark:text-slate-400 mr-2">نوع السعر:</span>
            <select
              value={priceType}
              onChange={(e) => handlePriceTypeChange(e.target.value as any)}
              className="h-8 px-2 text-xs font-bold rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              <option value="retail">مفرد</option>
              <option value="wholesale">جملة</option>
              <option value="agent">وكيل</option>
            </select>

            <span className="text-xs font-black text-slate-600 dark:text-slate-400 mr-2">المخزن:</span>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              className="h-8 px-2 text-xs font-bold rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* Left: Quick Barcode Input */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">الباركود السريع:</span>
            <div className="relative">
              <Input
                ref={barcodeInputRef}
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={handleBarcodeScan}
                placeholder="مسح الباركود والضغط Enter..."
                className="h-8 w-48 text-xs pr-7 bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 focus-visible:ring-emerald-500"
              />
              <Barcode className="h-3.5 w-3.5 text-emerald-600 absolute right-2 top-1/2 -translate-y-1/2 opacity-70" />
            </div>
          </div>
        </div>

        {/* Customer Quick Fields Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            <Label className="text-xs font-bold text-slate-600 dark:text-slate-400 shrink-0">الحساب:</Label>
            <div className="flex-1 flex gap-1">
              <select
                value={selectedCustomerId}
                onChange={(e) => handleSelectCustomer(e.target.value)}
                className="h-8 w-32 px-1.5 text-xs font-bold rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0"
              >
                <option value="">زبون نقدي</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <Input
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  if (selectedCustomerId && e.target.value !== activeCustomer?.name) {
                    setSelectedCustomerId('');
                  }
                }}
                placeholder="اسم الزبون..."
                className="h-8 text-xs font-bold bg-white dark:bg-slate-800 flex-1"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Label className="text-xs font-bold text-slate-600 dark:text-slate-400 shrink-0">الهاتف:</Label>
            <Input
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="رقم الهاتف..."
              className="h-8 text-xs font-bold bg-white dark:bg-slate-800"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Label className="text-xs font-bold text-slate-600 dark:text-slate-400 shrink-0">العنوان:</Label>
            <Input
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              placeholder="العنوان أو المنطقة..."
              className="h-8 text-xs font-bold bg-white dark:bg-slate-800"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Label className="text-xs font-bold text-slate-600 dark:text-slate-400 shrink-0">المدين:</Label>
            <Input
              value={customerDebtor}
              onChange={(e) => setCustomerDebtor(e.target.value)}
              placeholder="بيانات الكفيل / ملاحظة حساب..."
              className="h-8 text-xs font-bold bg-white dark:bg-slate-800"
            />
          </div>
        </div>
      </div>

      {/* 2. MINT GREEN ACCENT ROW: Fast Item Entry (Matching Reference Design) */}
      <div className="bg-[#e8f5e9] dark:bg-emerald-950/40 border-b border-[#c8e6c9] dark:border-emerald-800/50 p-2.5 shadow-sm">
        <div className="grid grid-cols-12 gap-2 items-center">
          {/* Item Search Autocomplete (5 Cols) */}
          <div className="col-span-12 lg:col-span-5 relative">
            <div className="relative">
              <Input
                ref={quickQueryInputRef}
                value={quickQuery}
                onChange={(e) => {
                  setQuickQuery(e.target.value);
                  setQuickSelectedProduct(null);
                  setHighlightedIndex(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setHighlightedIndex((idx) => Math.min(idx + 1, Math.max(0, filteredProducts.length - 1)));
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setHighlightedIndex((idx) => Math.max(0, idx - 1));
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (filteredProducts[highlightedIndex]) {
                      selectSuggestion(filteredProducts[highlightedIndex]);
                    } else if (quickSelectedProduct) {
                      addQuickLine();
                    }
                  }
                }}
                placeholder="المادة: اكتب الاسم أو الباركود..."
                className="h-9 pr-8 text-xs font-black bg-white dark:bg-slate-900 border-emerald-400/80 shadow-sm"
              />
              <Search className="h-4 w-4 text-emerald-700 absolute right-2.5 top-1/2 -translate-y-1/2 opacity-70" />
            </div>

            {/* Suggestions Dropdown */}
            {quickQuery && !quickSelectedProduct && (
              <div className="absolute z-50 top-10 right-0 left-0 max-h-60 overflow-y-auto rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl divide-y divide-slate-100 dark:divide-slate-800">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((p, idx) => (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => selectSuggestion(p)}
                      className={cn(
                        'w-full px-3 py-2 text-right flex items-center justify-between text-xs transition-colors',
                        idx === highlightedIndex
                          ? 'bg-emerald-100/70 dark:bg-emerald-900/60 font-black'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800/80'
                      )}
                    >
                      <div>
                        <span className="font-black text-slate-900 dark:text-slate-100">{p.name}</span>
                        <span className="text-[10px] text-muted-foreground mr-2 font-mono">
                          {p.barcode || p.sku || ''} | مخزون: {Number(p.stockQuantity || 0)}
                        </span>
                      </div>
                      <span className="font-black text-emerald-700 dark:text-emerald-400">
                        {Number(priceFor(p)).toLocaleString()} {currency === 'USD' ? '$' : 'د.ع'}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-center text-xs font-bold text-muted-foreground">لا توجد مادة مطابقة</div>
                )}
              </div>
            )}
          </div>

          {/* Quantity (2 Cols) */}
          <div className="col-span-4 lg:col-span-2 flex items-center gap-1.5">
            <span className="text-xs font-black text-emerald-900 dark:text-emerald-300 shrink-0">العدد:</span>
            <Input
              type="number"
              min="1"
              value={quickQuantity}
              onChange={(e) => setQuickQuantity(Math.max(1, Number(e.target.value) || 1))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addQuickLine();
              }}
              className="h-9 text-xs font-black text-center bg-white dark:bg-slate-900 border-emerald-400/80"
            />
          </div>

          {/* Unit Price (2 Cols) */}
          <div className="col-span-4 lg:col-span-2 flex items-center gap-1.5">
            <span className="text-xs font-black text-emerald-900 dark:text-emerald-300 shrink-0">سعر البيع:</span>
            <Input
              type="number"
              min="0"
              value={quickPrice}
              onChange={(e) => setQuickPrice(Math.max(0, Number(e.target.value) || 0))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addQuickLine();
              }}
              className="h-9 text-xs font-black text-center bg-white dark:bg-slate-900 border-emerald-400/80"
            />
          </div>

          {/* Line Total Preview (2 Cols) */}
          <div className="col-span-4 lg:col-span-2 flex items-center gap-1.5">
            <span className="text-xs font-black text-emerald-900 dark:text-emerald-300 shrink-0">المجموع:</span>
            <div className="h-9 px-2 flex-1 rounded-md bg-emerald-200/60 dark:bg-emerald-900/60 border border-emerald-400 flex items-center justify-center font-black text-xs text-emerald-900 dark:text-emerald-200">
              {(Number(quickQuantity) * Number(quickPrice)).toLocaleString()}
            </div>
          </div>

          {/* Add Button (1 Col) */}
          <div className="col-span-12 lg:col-span-1 flex items-center justify-end">
            <Button
              type="button"
              onClick={addQuickLine}
              className="h-9 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs gap-1 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>إضافة</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 3. CENTER TABLE: Grid of Invoice Line Items */}
      <div className="flex-1 overflow-auto bg-white dark:bg-slate-900">
        <table className="w-full text-right border-collapse text-xs">
          <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-b shadow-sm font-black">
            <tr>
              <th className="p-2.5 w-10 text-center border-l">ت</th>
              <th className="p-2.5 w-32 border-l">الباركود</th>
              <th className="p-2.5 border-l">اسم المادة</th>
              <th className="p-2.5 w-24 text-center border-l">العدد</th>
              <th className="p-2.5 w-28 text-center border-l">سعر البيع</th>
              <th className="p-2.5 w-28 text-center border-l">المجموع</th>
              <th className="p-2.5 w-28 border-l">الرقم التسلسلي</th>
              <th className="p-2.5 w-24 border-l">تاريخ النفاذية</th>
              <th className="p-2.5 border-l">الملاحظة</th>
              <th className="p-2.5 w-12 text-center">حذف</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-bold">
            {cart.map((item, idx) => (
              <tr
                key={item.id}
                className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
              >
                <td className="p-2 text-center text-muted-foreground border-l">{idx + 1}</td>
                <td className="p-2 font-mono text-[11px] text-slate-600 dark:text-slate-400 border-l">
                  {item.barcode || '-'}
                </td>
                <td className="p-2 font-black text-slate-900 dark:text-slate-100 border-l">
                  {item.name}
                  <span className="text-[10px] text-muted-foreground mr-1.5 font-normal">({item.unit})</span>
                </td>
                <td className="p-1 border-l text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      type="button"
                      onClick={() => updateItemQty(item.id, item.quantity - 1)}
                      className="h-6 w-6 rounded bg-slate-200 dark:bg-slate-700 flex items-center justify-center hover:bg-slate-300 text-slate-700 dark:text-slate-300 font-black"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItemQty(item.id, Number(e.target.value))}
                      className="w-11 h-6 text-center font-black rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => updateItemQty(item.id, item.quantity + 1)}
                      className="h-6 w-6 rounded bg-slate-200 dark:bg-slate-700 flex items-center justify-center hover:bg-slate-300 text-slate-700 dark:text-slate-300 font-black"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </td>
                <td className="p-1 border-l text-center">
                  <input
                    type="number"
                    min="0"
                    value={item.price}
                    onChange={(e) => updateItemPrice(item.id, Number(e.target.value))}
                    className="w-24 h-6 px-1.5 text-center font-black rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-primary"
                  />
                </td>
                <td className="p-2 border-l text-center font-black text-emerald-700 dark:text-emerald-400">
                  {(item.quantity * item.price).toLocaleString()}
                </td>
                <td className="p-1 border-l">
                  <input
                    type="text"
                    value={item.serialNo || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCart((items) => items.map((i) => (i.id === item.id ? { ...i, serialNo: val } : i)));
                    }}
                    placeholder="سيريال..."
                    className="w-full h-6 px-1.5 text-[11px] font-medium rounded border border-slate-200 dark:border-slate-700 bg-transparent"
                  />
                </td>
                <td className="p-1 border-l">
                  <input
                    type="date"
                    value={item.expiryDate || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCart((items) => items.map((i) => (i.id === item.id ? { ...i, expiryDate: val } : i)));
                    }}
                    className="w-full h-6 px-1 text-[10px] font-medium rounded border border-slate-200 dark:border-slate-700 bg-transparent"
                  />
                </td>
                <td className="p-1 border-l">
                  <input
                    type="text"
                    value={item.notes || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCart((items) => items.map((i) => (i.id === item.id ? { ...i, notes: val } : i)));
                    }}
                    placeholder="ملاحظات..."
                    className="w-full h-6 px-1.5 text-[11px] font-medium rounded border border-slate-200 dark:border-slate-700 bg-transparent"
                  />
                </td>
                <td className="p-1 text-center">
                  <button
                    type="button"
                    onClick={() => setCart((items) => items.filter((i) => i.id !== item.id))}
                    className="h-6 w-6 rounded hover:bg-red-100 dark:hover:bg-red-950/50 text-red-600 inline-flex items-center justify-center transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {cart.length === 0 && (
          <div className="h-48 flex flex-col items-center justify-center text-muted-foreground gap-2">
            <FileText className="h-10 w-10 opacity-30 stroke-1" />
            <p className="text-xs font-bold">لم يتم إضافة مواد إلى الفاتورة حتى الآن</p>
            <p className="text-[11px] opacity-70">امسح الباركود أو ابحث عن المادة في الشريط العلوي الأخضر واضغط Enter</p>
          </div>
        )}
      </div>

      {/* 4. BOTTOM SUMMARY & ACTION BUTTONS BAR (Exact Model Matching) */}
      <div className="bg-white dark:bg-slate-900 border-t p-3 shadow-lg flex flex-wrap items-center justify-between gap-4">
        {/* Left Side: Green Badge Boxes for Subtotal & Net Total */}
        <div className="flex items-center gap-2">
          <div className="px-4 py-2 rounded-lg border-2 border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/50 text-center min-w-[130px]">
            <span className="block text-[10px] font-black text-emerald-800 dark:text-emerald-300">مجموع القائمة</span>
            <span className="text-base font-black text-emerald-900 dark:text-emerald-100 font-mono">
              {subtotal.toLocaleString()}
            </span>
          </div>

          <div className="px-4 py-2 rounded-lg border-2 border-emerald-600 bg-emerald-100/80 dark:bg-emerald-900/60 text-center min-w-[140px] shadow-sm">
            <span className="block text-[10px] font-black text-emerald-900 dark:text-emerald-200">المجموع بعد الخصم</span>
            <span className="text-lg font-black text-emerald-950 dark:text-white font-mono">
              {netTotal.toLocaleString()} {currency === 'USD' ? '$' : 'د.ع'}
            </span>
          </div>
        </div>

        {/* Center: Financial Balances & Discount */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Discount Inputs */}
          <div className="flex items-center gap-1.5 border rounded-lg p-1 bg-slate-50 dark:bg-slate-800">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">نوع الخصم:</span>
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as any)}
              className="h-7 px-1.5 text-xs font-bold rounded border bg-white dark:bg-slate-900"
            >
              <option value="fixed">مقطوعة</option>
              <option value="percent">نسبة %</option>
            </select>
            <Input
              type="number"
              min="0"
              value={discountValue}
              onChange={(e) => setDiscountValue(Number(e.target.value) || 0)}
              className="h-7 w-20 text-center text-xs font-black bg-white dark:bg-slate-900"
              placeholder="0"
            />
          </div>

          {/* Previous Balance */}
          <div className="flex items-center gap-1 text-xs">
            <span className="font-bold text-slate-600 dark:text-slate-400">الرصيد السابق:</span>
            <span className="h-7 px-2 flex items-center font-black rounded bg-slate-100 dark:bg-slate-800 border text-slate-800 dark:text-slate-200">
              {previousBalance.toLocaleString()}
            </span>
          </div>

          {/* Paid Amount (الواصل) */}
          <div className="flex items-center gap-1 text-xs">
            <span className="font-bold text-emerald-700 dark:text-emerald-400">الواصل:</span>
            <Input
              type="number"
              min="0"
              value={paidAmount}
              onChange={(e) => {
                setIsPaidManuallySet(true);
                setPaidAmount(Number(e.target.value) || 0);
              }}
              className="h-7 w-24 text-center text-xs font-black text-emerald-700 bg-white dark:bg-slate-800 border-emerald-300"
            />
            <button
              type="button"
              onClick={() => {
                setIsPaidManuallySet(false);
                setPaidAmount(netTotal);
              }}
              className="h-7 px-2 text-[10px] font-black rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition-colors"
            >
              كامل المبلغ
            </button>
          </div>

          {/* Remaining (الباقي) */}
          <div className="flex items-center gap-1 text-xs">
            <span className="font-bold text-red-600 dark:text-red-400">الباقي:</span>
            <span className="h-7 px-2 flex items-center font-black rounded bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600">
              {remaining.toLocaleString()}
            </span>
          </div>

          {/* Current Balance (الرصيد الحالي) */}
          <div className="flex items-center gap-1 text-xs">
            <span className="font-bold text-slate-600 dark:text-slate-400">الرصيد الحالي:</span>
            <span className="h-7 px-2 flex items-center font-black rounded bg-slate-100 dark:bg-slate-800 border">
              {currentBalance.toLocaleString()}
            </span>
          </div>

          {/* Auto Print Checkbox */}
          <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={autoPrint}
              onChange={(e) => setAutoPrint(e.target.checked)}
              className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
            />
            <span>طباعة تلقائية</span>
          </label>
        </div>

        {/* Right Side: Primary Action Buttons (جديد، حفظ، حذف، طباعة) */}
        <div className="flex items-center gap-2">
          {/* New Invoice Button (Navy Blue) */}
          <Button
            type="button"
            onClick={handleNewInvoice}
            className="h-10 px-4 bg-[#1e293b] hover:bg-[#0f172a] text-white font-black text-xs gap-1.5 shadow-sm rounded-lg"
          >
            <Plus className="h-4 w-4" />
            <span>جديد</span>
          </Button>

          {/* Save Button (Deep Blue / Indigo) */}
          <Button
            type="button"
            disabled={saving || cart.length === 0}
            onClick={handleSaveInvoice}
            className="h-10 px-6 bg-[#0f172a] hover:bg-[#1e1e2f] text-white font-black text-xs gap-1.5 shadow-md rounded-lg"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>حفظ</span>
          </Button>

          {/* Delete / Clear Button (Red / Rose) */}
          <Button
            type="button"
            disabled={cart.length === 0}
            onClick={() => {
              if (window.confirm('هل أنت متأكد من مسح بنود الفاتورة الحالية؟')) {
                setCart([]);
              }
            }}
            className="h-10 px-4 bg-[#ef4444] hover:bg-[#dc2626] text-white font-black text-xs gap-1.5 shadow-sm rounded-lg"
          >
            <Trash2 className="h-4 w-4" />
            <span>حذف</span>
          </Button>

          {/* Print Button (Slate / White) */}
          <Button
            type="button"
            disabled={cart.length === 0}
            onClick={() => setIsPrintPreviewOpen(true)}
            variant="outline"
            className="h-10 px-4 font-black text-xs gap-1.5 rounded-lg border-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Printer className="h-4 w-4" />
            <span>معاينة وطباعة</span>
          </Button>

          {/* WhatsApp Share Button */}
          <Button
            type="button"
            disabled={cart.length === 0}
            onClick={() => {
              const appSettings = JSON.parse(localStorage.getItem('dubsar_app_settings') || '{}');
              const businessName = appSettings.businessName || 'مؤسسة دوبسار';
              let phone = (customerPhone || '').replace(/\D/g, '');
              if (phone.startsWith('07')) {
                phone = '964' + phone.substring(1);
              } else if (phone.startsWith('7')) {
                phone = '964' + phone;
              }
              const msg = `مرحباً ${customerName || 'زبوننا الكريم'}،\nشكراً لتعاملكم مع ${businessName}.\nتفاصيل الفاتورة رقم: ${invoiceNo}\nالمجموع الصافي: ${netTotal.toLocaleString()} ${currency === 'USD' ? '$' : 'د.ع'}\nالواصل: ${paidAmount.toLocaleString()}\nالمتبقي: ${remaining.toLocaleString()}`;
              const waUrl = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
              window.open(waUrl, '_blank');
            }}
            variant="outline"
            className="h-10 px-3.5 font-black text-xs gap-1.5 rounded-lg border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-200"
          >
            <span>واتساب</span>
          </Button>
        </div>
      </div>
    </div>

    {/* Printable Invoice Container (Hidden on screen, ONLY visible to printer) */}
    <div className="printable-invoice-wrapper hidden print:block">
      <PrintableInvoice
        invoiceNo={lastCompletedInvoice?.invoiceNo || invoiceNo}
        date={lastCompletedInvoice?.date || invoiceDate}
        customer={{
          name: lastCompletedInvoice?.customerName || customerName,
          phone: lastCompletedInvoice?.customerPhone || customerPhone,
          address: lastCompletedInvoice?.customerAddress || customerAddress,
          debtor: customerDebtor
        }}
        cashierName={currentUser?.displayName || 'المسؤول'}
        priceType={priceType}
        currency={currency}
        items={lastCompletedInvoice?.cart || cart}
        subtotal={lastCompletedInvoice?.subtotal || subtotal}
        discountAmount={lastCompletedInvoice?.discountAmount || discountAmount}
        netTotal={lastCompletedInvoice?.netTotal || netTotal}
        paidAmount={lastCompletedInvoice?.paidAmount || paidAmount}
        remaining={lastCompletedInvoice?.remaining || remaining}
        previousBalance={previousBalance}
        currentBalance={currentBalance}
      />
    </div>

    {/* Print Preview & Printer Management Modal */}
    <PrintPreviewModal
      isOpen={isPrintPreviewOpen}
      onClose={() => setIsPrintPreviewOpen(false)}
      invoiceData={{
        invoiceNo,
        date: invoiceDate,
        customer: {
          name: customerName,
          phone: customerPhone,
          address: customerAddress,
          debtor: customerDebtor
        },
        cashierName: currentUser?.displayName || 'المسؤول',
        priceType,
        currency,
        items: cart,
        subtotal,
        discountAmount,
        netTotal,
        paidAmount,
        remaining,
        previousBalance,
        currentBalance
      }}
    />
  </>
);
}
