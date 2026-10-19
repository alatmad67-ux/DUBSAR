'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { 
  AlertCircle,
  Barcode, 
  Check, 
  CreditCard, 
  Edit,
  FileText, 
  Loader2, 
  Minus, 
  PackagePlus,
  Plus, 
  Printer, 
  RotateCcw, 
  Save, 
  Search, 
  Trash2, 
  UserPlus, 
  Users,
  X 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { InventoryService } from '@/services/inventory-service';
import { POSService } from '@/services/pos-service';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { PrintPreviewModal } from '@/components/admin/print-preview-modal';
import { PrintableInvoice } from '@/components/admin/printable-invoice';
import { PrintEngine } from '@/services/print-engine';
import { LocalAuthService } from '@/services/local-auth-service';

interface CartItem {
  id: string;
  name: string;
  barcode: string;
  unit: string;
  quantity: number;
  price: number;
  cost?: number;
  brand?: string;
  serialNo?: string;
  expiryDate?: string;
  notes?: string;
  stockQuantity: number;
}

interface SalesTab {
  id: string;
  title: string;
  invoiceNo: string;
  invoiceDate: string;
  cart: CartItem[];
  selectedCustomerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerDebtor: string;
  discountType: 'fixed' | 'percent';
  discountValue: number;
  paidAmount: number;
  isPaidManuallySet: boolean;
  priceType: 'retail' | 'wholesale' | 'agent';
  currency: 'IQD' | 'USD';
  warehouseId: string;
  editingSaleId?: string;
}

const STORAGE_TABS_KEY = 'dubsar_sales_tabs_v2';
const STORAGE_ACTIVE_TAB_KEY = 'dubsar_active_tab_id_v2';

function generateNextInvoiceNo(): string {
  try {
    const storedSeq = localStorage.getItem('dubsar_last_invoice_seq');
    let nextSeq = 1;
    if (storedSeq) {
      const parsed = Number(storedSeq);
      if (!isNaN(parsed) && parsed > 0) {
        nextSeq = parsed >= 1000 ? (parsed - 1000 + 1) : (parsed + 1);
      }
    }
    localStorage.setItem('dubsar_last_invoice_seq', String(nextSeq));
    return String(nextSeq).padStart(4, '0');
  } catch {
    return '0001';
  }
}

function createDefaultTab(index = 1): SalesTab {
  return {
    id: `tab-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: `قائمة ${index}`,
    invoiceNo: generateNextInvoiceNo(),
    invoiceDate: new Date().toISOString().split('T')[0],
    cart: [],
    selectedCustomerId: '',
    customerName: 'زبون نقدي',
    customerPhone: '',
    customerAddress: '',
    customerDebtor: '',
    discountType: 'fixed',
    discountValue: 0,
    paidAmount: 0,
    isPaidManuallySet: false,
    priceType: 'retail',
    currency: 'IQD',
    warehouseId: 'default-warehouse'
  };
}

export default function ModernSalesPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>({});
  const [saving, setSaving] = useState(false);

  // Tabs state with draft persistence
  const [tabs, setTabs] = useState<SalesTab[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_TABS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (e) {
        console.error('Failed to load sales tabs:', e);
      }
    }
    return [createDefaultTab(1)];
  });

  const [activeTabId, setActiveTabId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedId = localStorage.getItem(STORAGE_ACTIVE_TAB_KEY);
        if (storedId) return storedId;
      } catch {}
    }
    return '';
  });

  // Ensure activeTabId points to a valid tab
  useEffect(() => {
    if (!tabs.some((t) => t.id === activeTabId)) {
      if (tabs.length > 0) {
        setActiveTabId(tabs[0].id);
      }
    }
  }, [tabs, activeTabId]);

  // Persist tabs & active tab
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_TABS_KEY, JSON.stringify(tabs));
      if (activeTabId) {
        localStorage.setItem(STORAGE_ACTIVE_TAB_KEY, activeTabId);
      }
    } catch (e) {
      console.error('Failed to save sales tabs:', e);
    }
  }, [tabs, activeTabId]);

  const activeTab = useMemo(() => {
    return tabs.find((t) => t.id === activeTabId) || tabs[0] || createDefaultTab(1);
  }, [tabs, activeTabId]);

  // Helper to update active tab state
  const updateActiveTab = (patch: Partial<SalesTab> | ((current: SalesTab) => SalesTab)) => {
    setTabs((currentTabs) =>
      currentTabs.map((t) => {
        if (t.id === activeTab.id) {
          if (typeof patch === 'function') {
            return patch(t);
          }
          return { ...t, ...patch };
        }
        return t;
      })
    );
  };

  // Quick entry inputs (ephemeral, not in tab)
  const [quickQuery, setQuickQuery] = useState('');
  const [quickSelectedProduct, setQuickSelectedProduct] = useState<any | null>(null);
  const [quickQuantity, setQuickQuantity] = useState<number>(1);
  const [quickPrice, setQuickPrice] = useState<number>(0);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  const [barcodeInput, setBarcodeInput] = useState('');

  // Invoice Search State
  const [searchInvoiceNo, setSearchInvoiceNo] = useState('');
  const [searchedSale, setSearchedSale] = useState<any | null>(null);
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [searchingInvoice, setSearchingInvoice] = useState(false);

  // Quick Modals: New Product & New Customer
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [savingNewItem, setSavingNewItem] = useState(false);

  // Print Preview state
  const [autoPrint, setAutoPrint] = useState<boolean>(true);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState<boolean>(false);
  const [lastCompletedInvoice, setLastCompletedInvoice] = useState<any | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const quickQueryInputRef = useRef<HTMLInputElement>(null);

  // Load backend data
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

  // Settings: Negative Stock Allowance
  const allowNegativeStock = useMemo(() => {
    return LocalAuthService.getUnifiedSettingsSync().allowNegativeStock ?? true;
  }, []);

  const priceFor = (product: any, type = activeTab.priceType) => {
    if (!product) return 0;
    if (type === 'wholesale') return Number(product.wholesalePrice || 0);
    if (type === 'agent') return Number(product.agentPrice || 0);
    return Number(product.retailPrice || 0);
  };

  // Selected customer info & outstanding balance
  const activeCustomer = useMemo(() => {
    return customers.find((c) => c.id === activeTab.selectedCustomerId);
  }, [customers, activeTab.selectedCustomerId]);

  const previousBalance = activeCustomer ? Number(activeCustomer.balance || 0) : 0;

  // Handle customer selection change
  const handleSelectCustomer = (customerId: string) => {
    if (!customerId) {
      updateActiveTab({
        selectedCustomerId: '',
        customerName: 'زبون نقدي',
        customerPhone: '',
        customerAddress: '',
        customerDebtor: ''
      });
      return;
    }
    const found = customers.find((c) => c.id === customerId);
    if (found) {
      updateActiveTab({
        selectedCustomerId: customerId,
        customerName: found.name || '',
        customerPhone: found.phone || '',
        customerAddress: found.address || ''
      });
    }
  };

  // Autocomplete products filter: name, barcode, sku, brand
  const filteredProducts = useMemo(() => {
    const normalized = quickQuery.trim().toLowerCase();
    if (!normalized) return [];
    const terms = normalized.split(/\s+/).filter(Boolean);
    return products
      .filter((product) => {
        const haystack = `${product.name || ''} ${product.barcode || ''} ${product.sku || ''} ${product.brand || ''}`.toLowerCase();
        return terms.every((term) => haystack.includes(term));
      })
      .slice(0, 15);
  }, [products, quickQuery]);

  // Handle selecting an item from the suggestions
  const selectSuggestion = (product: any) => {
    setQuickSelectedProduct(product);
    setQuickQuery(product.name || '');
    setQuickPrice(priceFor(product));
    setQuickQuantity(1);
    setHighlightedIndex(0);
  };

  // Financial Calculations
  const subtotal = useMemo(() => {
    return activeTab.cart.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0);
  }, [activeTab.cart]);

  const discountAmount = useMemo(() => {
    if (activeTab.discountType === 'percent') {
      return (subtotal * Math.min(100, Math.max(0, activeTab.discountValue))) / 100;
    }
    return Math.min(subtotal, Math.max(0, activeTab.discountValue));
  }, [subtotal, activeTab.discountType, activeTab.discountValue]);

  const netTotal = Math.max(0, subtotal - discountAmount);

  // Auto-sync paidAmount with netTotal if user hasn't explicitly customized it
  useEffect(() => {
    if (!activeTab.isPaidManuallySet) {
      updateActiveTab({ paidAmount: netTotal });
    }
  }, [netTotal, activeTab.isPaidManuallySet]);

  const remaining = Math.max(0, netTotal - activeTab.paidAmount);
  const currentBalance = previousBalance + remaining;

  // Add line to cart (Enter-to-add / Quick Add)
  const addProductToCart = (targetProduct: any, desiredQty = 1, customPrice?: number) => {
    if (!targetProduct) return;

    const availableStock = Number(targetProduct.stockQuantity || 0);

    // Negative stock policy check
    if (!allowNegativeStock) {
      if (availableStock <= 0) {
        toast({
          variant: 'destructive',
          title: 'الكمية نفذت في المخزن',
          description: `المادة: ${targetProduct.name} - المخزون: ${availableStock}`
        });
        return;
      }
      const existingInCart = activeTab.cart.find((i) => i.id === targetProduct.id);
      const totalDesiredQty = (existingInCart ? existingInCart.quantity : 0) + desiredQty;
      if (totalDesiredQty > availableStock) {
        toast({
          variant: 'destructive',
          title: 'الكمية المطلوبة تتجاوز المخزون',
          description: `المتوفر حالياً: ${availableStock}`
        });
        return;
      }
    }

    const price = customPrice !== undefined && customPrice > 0 ? customPrice : priceFor(targetProduct);
    const cost = Number(targetProduct.purchasePrice || 0);

    updateActiveTab((currentTab) => {
      const existing = currentTab.cart.find((i) => i.id === targetProduct.id);
      if (existing) {
        return {
          ...currentTab,
          cart: currentTab.cart.map((item) =>
            item.id === targetProduct.id
              ? {
                  ...item,
                  quantity: item.quantity + desiredQty,
                  price: customPrice !== undefined && customPrice > 0 ? customPrice : item.price
                }
              : item
          )
        };
      }
      return {
        ...currentTab,
        cart: [
          ...currentTab.cart,
          {
            id: targetProduct.id,
            name: targetProduct.name,
            barcode: targetProduct.barcode || '',
            unit: targetProduct.unit || 'قطعة',
            quantity: desiredQty,
            price,
            cost,
            brand: targetProduct.brand || '',
            stockQuantity: availableStock
          }
        ]
      };
    });

    // Reset quick entry bar & refocus for rapid continuous entry
    setQuickQuery('');
    setQuickSelectedProduct(null);
    setQuickQuantity(1);
    setQuickPrice(0);
    setHighlightedIndex(0);
    quickQueryInputRef.current?.focus();
  };

  const addQuickLine = () => {
    if (!quickSelectedProduct && !quickQuery.trim()) {
      toast({ variant: 'destructive', title: 'يرجى اختيار مادة أولاً' });
      return;
    }

    const targetProduct =
      quickSelectedProduct ||
      products.find(
        (p) =>
          p.name?.toLowerCase() === quickQuery.trim().toLowerCase() ||
          p.barcode === quickQuery.trim()
      ) ||
      filteredProducts[0];

    if (!targetProduct) {
      toast({ variant: 'destructive', title: 'المادة غير مسجلة في النظام' });
      return;
    }

    addProductToCart(targetProduct, Math.max(1, Number(quickQuantity) || 1), quickPrice > 0 ? quickPrice : undefined);
  };

  // Instant Barcode Scan with Enter
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

      addProductToCart(product, 1);
      setBarcodeInput('');
    }
  };

  // Update item quantity in grid
  const updateItemQty = (id: string, newQty: number) => {
    const target = activeTab.cart.find((i) => i.id === id);
    if (!target) return;

    if (newQty <= 0) {
      updateActiveTab({
        cart: activeTab.cart.filter((i) => i.id !== id)
      });
      return;
    }

    if (!allowNegativeStock && newQty > target.stockQuantity) {
      toast({
        variant: 'destructive',
        title: 'الكمية المطلوبة تتجاوز المتوفر',
        description: `المتوفر: ${target.stockQuantity}`
      });
      return;
    }

    updateActiveTab({
      cart: activeTab.cart.map((i) => (i.id === id ? { ...i, quantity: newQty } : i))
    });
  };

  // Update item price in grid
  const updateItemPrice = (id: string, newPrice: number) => {
    updateActiveTab({
      cart: activeTab.cart.map((i) => (i.id === id ? { ...i, price: Math.max(0, newPrice) } : i))
    });
  };

  // Price type change
  const handlePriceTypeChange = (newType: typeof activeTab.priceType) => {
    updateActiveTab({
      priceType: newType,
      cart: activeTab.cart.map((item) => {
        const product = products.find((p) => p.id === item.id);
        return product ? { ...item, price: priceFor(product, newType) } : item;
      })
    });
    if (quickSelectedProduct) {
      setQuickPrice(priceFor(quickSelectedProduct, newType));
    }
  };

  // Multi-Tab Management
  const handleAddNewTab = () => {
    const newTab = createDefaultTab(tabs.length + 1);
    setTabs((current) => [...current, newTab]);
    setActiveTabId(newTab.id);
    quickQueryInputRef.current?.focus();
  };

  const handleCloseTab = (tabIdToClose: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length <= 1) {
      // Just clear the single tab
      handleNewInvoice();
      return;
    }
    const targetTab = tabs.find((t) => t.id === tabIdToClose);
    if (targetTab && targetTab.cart.length > 0) {
      if (!window.confirm(`القائمة (${targetTab.title}) تحتوي على مواد غير محفوظة، هل أنت متأكد من إغلاقها؟`)) {
        return;
      }
    }
    const remainingTabs = tabs.filter((t) => t.id !== tabIdToClose);
    setTabs(remainingTabs);
    if (activeTabId === tabIdToClose) {
      setActiveTabId(remainingTabs[0].id);
    }
  };

  // Start a fresh new invoice in active tab
  const handleNewInvoice = () => {
    updateActiveTab({
      cart: [],
      selectedCustomerId: '',
      customerName: 'زبون نقدي',
      customerPhone: '',
      customerAddress: '',
      customerDebtor: '',
      discountValue: 0,
      paidAmount: 0,
      isPaidManuallySet: false,
      invoiceNo: generateNextInvoiceNo(),
      invoiceDate: new Date().toISOString().split('T')[0],
      editingSaleId: undefined
    });
    quickQueryInputRef.current?.focus();
  };

  // Search Historical Invoice
  const handleSearchInvoice = async () => {
    const query = searchInvoiceNo.trim();
    if (!query) return;

    setSearchingInvoice(true);
    try {
      const sales = await POSService.getRecentSales();
      if (!Array.isArray(sales)) {
        toast({ variant: 'destructive', title: 'لم يتم العثور على فواتير' });
        return;
      }

      const cleanQuery = query.replace(/^0+/, '');
      const found = sales.find((s: any) => {
        const no = String(s.invoice_no || s.invoiceNo || '');
        const cleanNo = no.replace(/^0+/, '');
        return no === query || cleanNo === cleanQuery || s.id === query;
      });

      if (!found) {
        toast({
          variant: 'destructive',
          title: 'القائمة غير موجودة',
          description: `لم يتم العثور على قائمة بالرقم: ${query}`
        });
        return;
      }

      setSearchedSale(found);
      setIsSearchDialogOpen(true);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'خطأ أثناء البحث',
        description: String(err)
      });
    } finally {
      setSearchingInvoice(false);
    }
  };

  // Load Historical Invoice into Active Tab for Editing
  const handleLoadSaleForEditing = (sale: any) => {
    setIsSearchDialogOpen(false);
    setSearchInvoiceNo('');

    const saleItems: CartItem[] = (sale.items || sale.cart || []).map((it: any) => {
      const prod = products.find((p) => p.id === (it.productId || it.product_id || it.id));
      return {
        id: it.productId || it.product_id || it.id,
        name: it.product_name || it.name || prod?.name || 'مادة',
        barcode: prod?.barcode || it.barcode || '',
        unit: prod?.unit || it.unit || 'قطعة',
        quantity: Number(it.quantity) || 1,
        price: Number(it.unit_price || it.price) || 0,
        cost: Number(prod?.purchasePrice || 0),
        brand: prod?.brand || '',
        serialNo: it.serialNo || '',
        expiryDate: it.expiryDate || '',
        notes: it.notes || '',
        stockQuantity: Number(prod?.stockQuantity || 0)
      };
    });

    const isCredit = sale.payment_method === 'credit' || sale.paymentMethod === 'credit';
    const totalAmount = Number(sale.total_amount || sale.totalAmount || 0);
    const paid = Number(sale.paid_amount || sale.paidAmount || 0);

    updateActiveTab({
      editingSaleId: sale.id,
      title: `تعديل (${sale.invoice_no})`,
      invoiceNo: sale.invoice_no || sale.invoiceNo,
      invoiceDate: (sale.created_at || new Date().toISOString()).split('T')[0],
      selectedCustomerId: sale.customer_id || '',
      customerName: sale.customer_name || 'زبون نقدي',
      customerPhone: sale.customer_phone || '',
      customerAddress: sale.customer_address || '',
      discountValue: Number(sale.discount_amount || sale.discount || 0),
      discountType: 'fixed',
      paidAmount: paid,
      isPaidManuallySet: isCredit,
      priceType: (sale.price_type || 'retail') as any,
      cart: saleItems
    });

    toast({
      title: 'تم تحميل القائمة للتعديل',
      description: `القائمة رقم: ${sale.invoice_no}`
    });
  };

  // Cancel Editing mode
  const handleCancelEditing = () => {
    if (window.confirm('هل تريد إلغاء التعديل والعودة إلى قائمة جديدة؟')) {
      handleNewInvoice();
    }
  };

  // Save invoice (Handles both new sales and editing historical sales)
  const handleSaveInvoice = async () => {
    if (saving) return;
    if (activeTab.cart.length === 0) {
      toast({ variant: 'destructive', title: 'سلة الفاتورة فارغة', description: 'أضف مواد أولاً قبل الحفظ' });
      return;
    }

    const isCredit = remaining > 0.01;
    const finalCustomerName = activeTab.customerName.trim() || 'زبون نقدي';

    if (isCredit && finalCustomerName === 'زبون نقدي' && !activeTab.selectedCustomerId) {
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
        id: activeTab.selectedCustomerId || undefined,
        name: finalCustomerName,
        phone: activeTab.customerPhone.trim() || undefined,
        address: activeTab.customerAddress.trim() || undefined,
        debtor: activeTab.customerDebtor.trim() || undefined
      };

      const paymentPayload = {
        method: isCredit ? 'credit' : 'cash',
        paidAmount: Number(activeTab.paidAmount) || 0,
        discount: Number(discountAmount) || 0,
        priceType: activeTab.priceType,
        warehouseId: activeTab.warehouseId,
        currency: activeTab.currency,
        invoiceNo: activeTab.invoiceNo,
        allowNegativeStock
      };

      const cartPayload = activeTab.cart.map((item) => ({
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

      let result: any;
      if (activeTab.editingSaleId) {
        // Update existing historical sale
        result = await POSService.updateSale(
          activeTab.editingSaleId,
          cartPayload,
          customerPayload,
          paymentPayload,
          session
        );
        toast({
          title: 'تم تحديث الفاتورة بنجاح',
          description: `تم حفظ تعديلات القائمة: ${result?.invoiceNo || activeTab.invoiceNo}`
        });
      } else {
        // Create new sale
        result = await POSService.processSale(
          cartPayload,
          customerPayload,
          paymentPayload,
          session
        );
        toast({
          title: 'تم حفظ الفاتورة بنجاح',
          description: `رقم القائمة: ${result?.invoiceNo || activeTab.invoiceNo}`
        });
      }

      const savedSnapshot = {
        invoiceNo: result?.invoiceNo || activeTab.invoiceNo,
        date: activeTab.invoiceDate,
        customerName: finalCustomerName,
        customerPhone: activeTab.customerPhone,
        customerAddress: activeTab.customerAddress,
        cart: [...activeTab.cart],
        subtotal,
        discountAmount,
        netTotal,
        paidAmount: activeTab.paidAmount,
        remaining,
        previousBalance,
        currentBalance
      };
      setLastCompletedInvoice(savedSnapshot);

      if (autoPrint) {
        setTimeout(async () => {
          try {
            const appSettings = await LocalAuthService.getUnifiedSettings();
            const format = appSettings.defaultPrintFormat || '80mm';
            const printPayload = {
              invoiceNo: savedSnapshot.invoiceNo,
              date: savedSnapshot.date,
              customerName: savedSnapshot.customerName,
              customerPhone: savedSnapshot.customerPhone,
              customerAddress: savedSnapshot.customerAddress,
              cashierName: currentUser?.displayName || 'المسؤول',
              priceType: activeTab.priceType,
              currency: activeTab.currency,
              items: savedSnapshot.cart.map((it) => ({
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
            console.error('[Sales AutoPrint Error]:', err);
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

  // Quick Inline Save Product
  const handleQuickSaveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSavingNewItem(true);
    const form = new FormData(e.currentTarget);
    const name = String(form.get('name') || '').trim();
    const barcode = String(form.get('barcode') || '').trim();
    const unit = String(form.get('unit') || 'قطعة').trim();
    const purchasePrice = Number(form.get('purchasePrice')) || 0;
    const retailPrice = Number(form.get('retailPrice')) || 0;
    const wholesalePrice = Number(form.get('wholesalePrice')) || 0;
    const stockQuantity = Number(form.get('stockQuantity')) || 0;

    if (!name) {
      toast({ variant: 'destructive', title: 'اسم المادة مطلوب' });
      setSavingNewItem(false);
      return;
    }

    try {
      const saved = await InventoryService.saveProduct({
        name,
        barcode: barcode || undefined,
        unit,
        purchasePrice,
        retailPrice,
        wholesalePrice,
        stockQuantity
      });

      toast({ title: 'تمت إضافة المادة بنجاح', description: name });
      setIsAddProductOpen(false);

      // Reload products list and automatically add newly created product to active cart!
      const refreshed = await InventoryService.getProducts();
      setProducts(refreshed || []);

      const newProduct = (refreshed || []).find((p: any) => p.id === saved?.id || p.name === name);
      if (newProduct) {
        addProductToCart(newProduct, 1);
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'فشل حفظ المادة', description: String(err) });
    } finally {
      setSavingNewItem(false);
    }
  };

  // Quick Inline Save Customer
  const handleQuickSaveCustomer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSavingNewItem(true);
    const form = new FormData(e.currentTarget);
    const name = String(form.get('name') || '').trim();
    const phone = String(form.get('phone') || '').trim();
    const address = String(form.get('address') || '').trim();

    if (!name) {
      toast({ variant: 'destructive', title: 'اسم العميل مطلوب' });
      setSavingNewItem(false);
      return;
    }

    try {
      const saved = await InventoryService.createCustomer({ name, phone, address }, currentUser);
      toast({ title: 'تم تسجيل العميل بنجاح', description: name });
      setIsAddCustomerOpen(false);

      // Reload customers list and automatically select in active invoice
      const refreshed = await InventoryService.getCustomers();
      setCustomers(refreshed || []);

      const newCust = (refreshed || []).find((c: any) => c.id === saved?.id || (c.name === name && c.phone === phone));
      if (newCust) {
        handleSelectCustomer(newCust.id);
      } else {
        updateActiveTab({ customerName: name, customerPhone: phone, customerAddress: address });
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'فشل حفظ الزبون', description: String(err) });
    } finally {
      setSavingNewItem(false);
    }
  };

  // Currently focused product preview info card
  const previewProduct = quickSelectedProduct || filteredProducts[highlightedIndex];

  return (
    <>
      <div
        className="flex flex-col h-[calc(100vh-138px)] min-h-[560px] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm select-none bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 screen-only"
        dir="rtl"
      >
        {/* ========================================================================= */}
        {/* MULTI-TAB BAR: Multiple Open Invoices & Search Invoice Input             */}
        {/* ========================================================================= */}
        <div className="bg-slate-200/80 dark:bg-slate-900 border-b border-slate-300 dark:border-slate-800 px-3 py-1.5 flex items-center justify-between gap-2 shrink-0 overflow-x-auto">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 min-w-0 overflow-x-auto">
            {tabs.map((tab, idx) => {
              const isActive = tab.id === activeTab.id;
              const itemCount = tab.cart.length;
              return (
                <div
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  className={cn(
                    'group flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-black cursor-pointer transition-all border whitespace-nowrap',
                    isActive
                      ? 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-primary shadow-sm'
                      : 'bg-slate-100/70 dark:bg-slate-900/60 border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-200/60'
                  )}
                >
                  <FileText className="h-3.5 w-3.5 opacity-70" />
                  <span>{tab.title}</span>
                  {tab.editingSaleId && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-amber-500 text-amber-600">
                      تعديل
                    </Badge>
                  )}
                  {itemCount > 0 && (
                    <span className="bg-primary/10 text-primary px-1.5 py-0.2 rounded-full text-[10px] font-mono">
                      {itemCount}
                    </span>
                  )}
                  {tabs.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => handleCloseTab(tab.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded-full hover:bg-red-100 hover:text-red-600 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              );
            })}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAddNewTab}
              className="h-7 px-2.5 text-xs font-bold gap-1 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>قائمة جديدة</span>
            </Button>
          </div>

          {/* Quick Invoice Search & Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Search by Invoice Number */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border rounded-lg px-2 py-0.5 shadow-sm">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="بحث برقم القائمة..."
                value={searchInvoiceNo}
                onChange={(e) => setSearchInvoiceNo(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearchInvoice();
                }}
                className="w-28 text-xs font-bold outline-none bg-transparent"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={searchingInvoice || !searchInvoiceNo.trim()}
                onClick={handleSearchInvoice}
                className="h-6 px-1.5 text-[11px] font-black text-primary hover:bg-primary/10"
              >
                {searchingInvoice ? <Loader2 className="h-3 w-3 animate-spin" /> : 'بحث'}
              </Button>
            </div>

            {/* Quick Add Product Button */}
            <Button
              type="button"
              size="sm"
              onClick={() => setIsAddProductOpen(true)}
              className="h-7 px-2.5 text-xs font-black gap-1 bg-primary hover:bg-primary/90 text-white rounded-lg shadow-sm"
            >
              <PackagePlus className="h-3.5 w-3.5" />
              <span>+ إضافة مادة</span>
            </Button>
          </div>
        </div>

        {/* Editing Banner (Shown only when modifying a historical invoice) */}
        {activeTab.editingSaleId && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between text-xs font-black text-amber-700 dark:text-amber-400">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>أنت الآن في وضع تعديل القائمة السابقة رقم ({activeTab.invoiceNo}) - سيتم تحديث السجلات والمخزون وحساب الزبون عند الحفظ.</span>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleCancelEditing}
              className="h-6 px-2 text-[11px] font-bold border-amber-500 text-amber-700 hover:bg-amber-500/20"
            >
              إلغاء التعديل
            </Button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 1. TOP HEADER BAR: Invoice Metadata & Customer Info                     */}
        {/* ========================================================================= */}
        <div className="shrink-0 p-3 md:px-4 bg-white dark:bg-slate-900 border-b shadow-sm space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Right: Date and Invoice No */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black text-slate-600 dark:text-slate-400">التاريخ:</span>
              <Input
                type="date"
                value={activeTab.invoiceDate}
                onChange={(e) => updateActiveTab({ invoiceDate: e.target.value })}
                className="h-8 w-36 xl:w-40 text-xs font-bold bg-slate-100 dark:bg-slate-800"
              />
              <span className="text-xs font-black text-slate-600 dark:text-slate-400 mr-1">رقم القائمة:</span>
              <Input
                type="text"
                value={activeTab.invoiceNo}
                onChange={(e) => updateActiveTab({ invoiceNo: e.target.value })}
                className="h-8 w-28 xl:w-36 text-xs font-black text-center bg-slate-100 dark:bg-slate-800 text-primary"
              />
            </div>

            {/* Center: Currency & Price Type & Warehouse */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black text-slate-600 dark:text-slate-400">العملة:</span>
              <select
                value={activeTab.currency}
                onChange={(e) => updateActiveTab({ currency: e.target.value as any })}
                className="h-8 px-2.5 text-xs font-bold rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <option value="IQD">دينار عراقي (د.ع)</option>
                <option value="USD">دولار أمريكي ($)</option>
              </select>

              <span className="text-xs font-black text-slate-600 dark:text-slate-400 mr-1">نوع السعر:</span>
              <select
                value={activeTab.priceType}
                onChange={(e) => handlePriceTypeChange(e.target.value as any)}
                className="h-8 px-2.5 text-xs font-bold rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <option value="retail">مفرد</option>
                <option value="wholesale">جملة</option>
                <option value="agent">وكيل</option>
              </select>

              <span className="text-xs font-black text-slate-600 dark:text-slate-400 mr-1">المخزن:</span>
              <select
                value={activeTab.warehouseId}
                onChange={(e) => updateActiveTab({ warehouseId: e.target.value })}
                className="h-8 px-2.5 text-xs font-bold rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 min-w-[110px]"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Left: Quick Barcode Input */}
            <div className="flex items-center gap-1.5 flex-1 sm:flex-initial justify-end min-w-[220px] max-w-sm">
              <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 shrink-0">الباركود السريع:</span>
              <div className="relative flex-1 sm:w-56 xl:w-64">
                <Input
                  ref={barcodeInputRef}
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={handleBarcodeScan}
                  placeholder="مسح الباركود والضغط Enter..."
                  className="h-8 w-full text-xs pr-7 bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 focus-visible:ring-emerald-500"
                />
                <Barcode className="h-3.5 w-3.5 text-emerald-600 absolute right-2 top-1/2 -translate-y-1/2 opacity-70" />
              </div>
            </div>
          </div>

          {/* Customer Quick Fields Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-12 gap-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800 items-center">
            {/* Customer Dropdown + Quick Add */}
            <div className="xl:col-span-4 flex items-center gap-1.5 min-w-0">
              <Label className="text-xs font-bold text-slate-600 dark:text-slate-400 shrink-0">الزبون:</Label>
              <div className="flex-1 flex gap-1 min-w-0">
                <select
                  value={activeTab.selectedCustomerId}
                  onChange={(e) => handleSelectCustomer(e.target.value)}
                  className="h-8 w-36 px-1.5 text-xs font-bold rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0"
                >
                  <option value="">زبون نقدي</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ''}
                    </option>
                  ))}
                </select>
                <Input
                  value={activeTab.customerName}
                  onChange={(e) => {
                    updateActiveTab({
                      customerName: e.target.value,
                      selectedCustomerId: e.target.value !== activeCustomer?.name ? '' : activeTab.selectedCustomerId
                    });
                  }}
                  placeholder="اسم الزبون..."
                  className="h-8 text-xs font-bold bg-white dark:bg-slate-800 flex-1 min-w-0"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setIsAddCustomerOpen(true)}
                  className="h-8 w-8 shrink-0 rounded-md border-primary/30 text-primary hover:bg-primary/10"
                  title="إضافة زبون جديد"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Customer Phone */}
            <div className="xl:col-span-2 flex items-center gap-1.5 min-w-0">
              <Label className="text-xs font-bold text-slate-600 dark:text-slate-400 shrink-0">الهاتف:</Label>
              <Input
                value={activeTab.customerPhone}
                onChange={(e) => updateActiveTab({ customerPhone: e.target.value })}
                placeholder="رقم الهاتف..."
                className="h-8 text-xs font-bold bg-white dark:bg-slate-800 flex-1"
              />
            </div>

            {/* Customer Address */}
            <div className="xl:col-span-3 flex items-center gap-1.5 min-w-0">
              <Label className="text-xs font-bold text-slate-600 dark:text-slate-400 shrink-0">العنوان:</Label>
              <Input
                value={activeTab.customerAddress}
                onChange={(e) => updateActiveTab({ customerAddress: e.target.value })}
                placeholder="العنوان أو المنطقة..."
                className="h-8 text-xs font-bold bg-white dark:bg-slate-800 flex-1"
              />
            </div>

            {/* Customer Balance Indicator */}
            <div className="xl:col-span-3 flex items-center justify-end gap-1.5 min-w-0">
              {activeCustomer && (
                <div
                  className={cn(
                    'px-2.5 py-1 rounded-md text-xs font-black flex items-center gap-1.5 border',
                    previousBalance > 0
                      ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300'
                      : 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300'
                  )}
                >
                  <span>الرصيد المستحق:</span>
                  <span className="font-mono">{previousBalance.toLocaleString()} د.ع</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. MINT GREEN ACCENT ROW: Fast Item Entry & Real-Time Product Info Badge  */}
        {/* ========================================================================= */}
        <div className="shrink-0 bg-[#e8f5e9] dark:bg-emerald-950/40 border-b border-[#c8e6c9] dark:border-emerald-800/50 p-2.5 md:px-4 shadow-sm">
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
                        // Fast Enter-to-add with quantity 1
                        addProductToCart(filteredProducts[highlightedIndex], 1);
                      } else if (quickSelectedProduct) {
                        addProductToCart(quickSelectedProduct, Math.max(1, quickQuantity));
                      } else if (quickQuery.trim()) {
                        addQuickLine();
                      }
                    }
                  }}
                  placeholder="المادة: اكتب الاسم أو الباركود ثم اضغط Enter للإضافة السريعة..."
                  className="h-9 pr-8 text-xs font-black bg-white dark:bg-slate-900 border-emerald-400/80 shadow-sm"
                />
                <Search className="h-4 w-4 text-emerald-700 absolute right-2.5 top-1/2 -translate-y-1/2 opacity-70" />
              </div>

              {/* Suggestions Dropdown */}
              {quickQuery && !quickSelectedProduct && (
                <div className="absolute z-50 top-10 right-0 left-0 max-h-64 overflow-y-auto rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((p, idx) => {
                      const stock = Number(p.stockQuantity || 0);
                      const isOutOfStock = stock <= 0;
                      return (
                        <button
                          type="button"
                          key={p.id}
                          onClick={() => {
                            addProductToCart(p, 1);
                          }}
                          className={cn(
                            'w-full px-3 py-2 text-right flex items-center justify-between text-xs transition-colors',
                            idx === highlightedIndex
                              ? 'bg-emerald-100/70 dark:bg-emerald-900/60 font-black'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800/80'
                          )}
                        >
                          <div>
                            <span className="font-black text-slate-900 dark:text-slate-100">{p.name}</span>
                            {p.brand && (
                              <span className="text-[10px] text-primary mr-1.5 font-bold">
                                [{p.brand}]
                              </span>
                            )}
                            <span className="text-[10px] text-muted-foreground mr-2 font-mono">
                              {p.barcode || ''} | {isOutOfStock ? (allowNegativeStock ? 'المتوفر: 0 (مسموح بالسالب)' : 'نفذت الكمية') : `المتوفر: ${stock}`}
                            </span>
                          </div>
                          <span className="font-black text-emerald-700 dark:text-emerald-400">
                            {Number(priceFor(p)).toLocaleString()} {activeTab.currency === 'USD' ? '$' : 'د.ع'}
                          </span>
                        </button>
                      );
                    })
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

          {/* Compact Product Info Card (Appears when an item is selected or highlighted) */}
          {previewProduct && (
            <div className="mt-2 pt-2 border-t border-emerald-300/50 flex flex-wrap items-center gap-3 text-xs">
              <span className="font-black text-slate-800 dark:text-slate-100">
                {previewProduct.name} {previewProduct.brand ? `[${previewProduct.brand}]` : ''}
              </span>
              <span className="text-slate-600 dark:text-slate-400 font-mono">
                المتوفر: {Number(previewProduct.stockQuantity || 0) <= 0 && allowNegativeStock ? '0 (مسموح بالسالب)' : `${previewProduct.stockQuantity || 0}`}
              </span>
              <span className="text-slate-600 dark:text-slate-400 font-mono">
                الكلفة: {Number(previewProduct.purchasePrice || 0).toLocaleString()} د.ع
              </span>
              <span className="text-emerald-700 dark:text-emerald-300 font-mono font-bold">
                المفرد: {Number(previewProduct.retailPrice || 0).toLocaleString()} د.ع
              </span>
              <span className="text-blue-700 dark:text-blue-300 font-mono font-bold">
                الجملة: {Number(previewProduct.wholesalePrice || 0).toLocaleString()} د.ع
              </span>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 3. CENTER TABLE: Grid of Invoice Line Items with Below-Cost Warnings    */}
        {/* ========================================================================= */}
        <div className="flex-1 min-h-0 overflow-auto bg-white dark:bg-slate-900 custom-scrollbar">
          <table className="w-full text-right border-collapse text-xs">
            <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-b shadow-sm font-black">
              <tr>
                <th className="p-2.5 w-10 text-center border-l">ت</th>
                <th className="p-2.5 w-36 border-l">الباركود</th>
                <th className="p-2.5 min-w-[200px] border-l">اسم المادة</th>
                <th className="p-2.5 w-32 text-center border-l">العدد</th>
                <th className="p-2.5 w-32 text-center border-l">سعر البيع</th>
                <th className="p-2.5 w-32 text-center border-l">المجموع</th>
                <th className="p-2.5 w-36 border-l">الرقم التسلسلي</th>
                <th className="p-2.5 w-28 border-l">تاريخ النفاذية</th>
                <th className="p-2.5 min-w-[140px] border-l">الملاحظة</th>
                <th className="p-2.5 w-12 text-center">حذف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-bold">
              {activeTab.cart.map((item, idx) => {
                const cost = Number(item.cost || 0);
                const isBelowCost = cost > 0 && item.price < cost;
                return (
                  <tr
                    key={item.id}
                    className={cn(
                      'hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors',
                      isBelowCost && 'bg-amber-50/40 dark:bg-amber-950/20'
                    )}
                  >
                    <td className="p-2 text-center text-muted-foreground border-l">{idx + 1}</td>
                    <td className="p-2 font-mono text-[11px] text-slate-600 dark:text-slate-400 border-l">
                      {item.barcode || '-'}
                    </td>
                    <td className="p-2 font-black text-slate-900 dark:text-slate-100 border-l">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span>{item.name}</span>
                        <span className="text-[10px] text-muted-foreground font-normal">({item.unit})</span>
                        {item.brand && (
                          <span className="text-[10px] text-primary font-bold">[{item.brand}]</span>
                        )}
                        {isBelowCost && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 font-bold flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> أقل من الكلفة ({cost.toLocaleString()} د.ع)
                          </span>
                        )}
                      </div>
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
                          className="w-12 h-6 text-center font-black rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
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
                          updateActiveTab({
                            cart: activeTab.cart.map((i) => (i.id === item.id ? { ...i, serialNo: val } : i))
                          });
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
                          updateActiveTab({
                            cart: activeTab.cart.map((i) => (i.id === item.id ? { ...i, expiryDate: val } : i))
                          });
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
                          updateActiveTab({
                            cart: activeTab.cart.map((i) => (i.id === item.id ? { ...i, notes: val } : i))
                          });
                        }}
                        placeholder="ملاحظات..."
                        className="w-full h-6 px-1.5 text-[11px] font-medium rounded border border-slate-200 dark:border-slate-700 bg-transparent"
                      />
                    </td>
                    <td className="p-1 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          updateActiveTab({
                            cart: activeTab.cart.filter((i) => i.id !== item.id)
                          })
                        }
                        className="h-6 w-6 rounded hover:bg-red-100 dark:hover:bg-red-950/50 text-red-600 inline-flex items-center justify-center transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {activeTab.cart.length === 0 && (
            <div className="h-48 flex flex-col items-center justify-center text-muted-foreground gap-2">
              <FileText className="h-10 w-10 opacity-30 stroke-1" />
              <p className="text-xs font-bold">لم يتم إضافة مواد إلى الفاتورة حتى الآن</p>
              <p className="text-[11px] opacity-70">
                امسح الباركود أو ابحث عن المادة في الشريط العلوي الأخضر واضغط Enter للإضافة المباشرة
              </p>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 4. BOTTOM SUMMARY & ACTION BUTTONS BAR                                   */}
        {/* ========================================================================= */}
        <div className="shrink-0 bg-white dark:bg-slate-900 border-t p-3 md:px-4 shadow-lg flex flex-wrap items-center justify-between gap-4">
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
                {netTotal.toLocaleString()} {activeTab.currency === 'USD' ? '$' : 'د.ع'}
              </span>
            </div>
          </div>

          {/* Center: Financial Balances & Discount */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Discount Inputs */}
            <div className="flex items-center gap-1.5 border rounded-lg p-1 bg-slate-50 dark:bg-slate-800">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">نوع الخصم:</span>
              <select
                value={activeTab.discountType}
                onChange={(e) => updateActiveTab({ discountType: e.target.value as any })}
                className="h-7 px-1.5 text-xs font-bold rounded border bg-white dark:bg-slate-900"
              >
                <option value="fixed">مقطوعة</option>
                <option value="percent">نسبة %</option>
              </select>
              <Input
                type="number"
                min="0"
                value={activeTab.discountValue}
                onChange={(e) => updateActiveTab({ discountValue: Number(e.target.value) || 0 })}
                className="h-7 w-20 text-center text-xs font-black bg-white dark:bg-slate-900"
                placeholder="0"
              />
            </div>

            {/* Previous Balance */}
            <div className="flex items-center gap-1 text-xs">
              <span className="font-bold text-slate-600 dark:text-slate-400">الرصيد السابق:</span>
              <span className="h-7 px-2 flex items-center font-black rounded bg-slate-100 dark:bg-slate-800 border text-slate-800 dark:text-slate-200 font-mono">
                {previousBalance.toLocaleString()}
              </span>
            </div>

            {/* Paid Amount (الواصل) */}
            <div className="flex items-center gap-1 text-xs">
              <span className="font-bold text-emerald-700 dark:text-emerald-400">الواصل:</span>
              <Input
                type="number"
                min="0"
                value={activeTab.paidAmount}
                onChange={(e) => {
                  updateActiveTab({
                    isPaidManuallySet: true,
                    paidAmount: Number(e.target.value) || 0
                  });
                }}
                className="h-7 w-24 text-center text-xs font-black text-emerald-700 bg-white dark:bg-slate-800 border-emerald-300 font-mono"
              />
              <button
                type="button"
                onClick={() => {
                  updateActiveTab({
                    isPaidManuallySet: false,
                    paidAmount: netTotal
                  });
                }}
                className="h-7 px-2 text-[10px] font-black rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition-colors"
              >
                كامل المبلغ
              </button>
            </div>

            {/* Remaining (الباقي) */}
            <div className="flex items-center gap-1 text-xs">
              <span className="font-bold text-red-600 dark:text-red-400">الباقي:</span>
              <span className="h-7 px-2 flex items-center font-black rounded bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 font-mono">
                {remaining.toLocaleString()}
              </span>
            </div>

            {/* Current Balance (الرصيد الحالي) */}
            <div className="flex items-center gap-1 text-xs">
              <span className="font-bold text-slate-600 dark:text-slate-400">الرصيد الحالي:</span>
              <span className="h-7 px-2 flex items-center font-black rounded bg-slate-100 dark:bg-slate-800 border font-mono">
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

          {/* Right Side: Primary Action Buttons */}
          <div className="flex items-center gap-2">
            {/* New Invoice Button */}
            <Button
              type="button"
              onClick={handleNewInvoice}
              className="h-10 px-4 bg-[#1e293b] hover:bg-[#0f172a] text-white font-black text-xs gap-1.5 shadow-sm rounded-lg"
            >
              <Plus className="h-4 w-4" />
              <span>جديد</span>
            </Button>

            {/* Save Button */}
            <Button
              type="button"
              disabled={saving || activeTab.cart.length === 0}
              onClick={handleSaveInvoice}
              className="h-10 px-6 bg-[#0f172a] hover:bg-[#1e1e2f] text-white font-black text-xs gap-1.5 shadow-md rounded-lg"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>{activeTab.editingSaleId ? 'حفظ التعديلات' : 'حفظ'}</span>
            </Button>

            {/* Delete / Clear Button */}
            <Button
              type="button"
              disabled={activeTab.cart.length === 0}
              onClick={() => {
                if (window.confirm('هل أنت متأكد من مسح بنود الفاتورة الحالية؟')) {
                  updateActiveTab({ cart: [] });
                }
              }}
              className="h-10 px-4 bg-[#ef4444] hover:bg-[#dc2626] text-white font-black text-xs gap-1.5 shadow-sm rounded-lg"
            >
              <Trash2 className="h-4 w-4" />
              <span>حذف</span>
            </Button>

            {/* Print Button */}
            <Button
              type="button"
              disabled={activeTab.cart.length === 0}
              onClick={() => setIsPrintPreviewOpen(true)}
              variant="outline"
              className="h-10 px-4 font-black text-xs gap-1.5 rounded-lg border-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Printer className="h-4 w-4" />
              <span>معاينة وطباعة</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DIALOG: Historical Invoice Search Result                                  */}
      {/* ========================================================================= */}
      <Dialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen}>
        <DialogContent className="rounded-2xl max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-primary">تفاصيل القائمة المسترجعة</DialogTitle>
          </DialogHeader>
          {searchedSale && (
            <div className="space-y-3 py-2 text-xs">
              <div className="flex justify-between border-b pb-2">
                <span className="font-bold text-muted-foreground">رقم القائمة:</span>
                <span className="font-black text-primary font-mono">{searchedSale.invoice_no}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-bold text-muted-foreground">تاريخ الإنشاء:</span>
                <span className="font-bold">{searchedSale.created_at?.split('T')[0]}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-bold text-muted-foreground">اسم الزبون:</span>
                <span className="font-black">{searchedSale.customer_name || 'زبون نقدي'}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-bold text-muted-foreground">المبلغ الصافي:</span>
                <span className="font-black text-emerald-700 font-mono">
                  {Number(searchedSale.total_amount || 0).toLocaleString()} د.ع
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-bold text-muted-foreground">عدد المواد:</span>
                <span className="font-bold">{(searchedSale.items || []).length} مواد</span>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              className="gap-1.5 font-black bg-primary text-white"
              onClick={() => handleLoadSaleForEditing(searchedSale)}
            >
              <Edit className="h-4 w-4" />
              <span>تعديل في المبيعات</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSearchDialogOpen(false)}
            >
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG: + إضافة مادة جديدة من داخل المبيعات                              */}
      {/* ========================================================================= */}
      <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
        <DialogContent className="rounded-2xl max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-primary flex items-center gap-2">
              <PackagePlus className="h-5 w-5" />
              <span>إضافة مادة جديدة إلى المخزن</span>
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleQuickSaveProduct} className="space-y-4 py-2">
            <div>
              <Label className="font-black text-xs">اسم المادة *</Label>
              <Input name="name" required placeholder="مثال: فلتر زيت تويوتا أصلي" className="h-9 mt-1 font-bold text-xs" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-black text-xs">الباركود</Label>
                <Input name="barcode" placeholder="الباركود أو اتركه فارغاً" className="h-9 mt-1 font-mono text-xs" />
              </div>
              <div>
                <Label className="font-black text-xs">الوحدة</Label>
                <Input name="unit" defaultValue="قطعة" className="h-9 mt-1 font-bold text-xs" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="font-black text-xs">سعر التكلفة</Label>
                <Input name="purchasePrice" type="number" min="0" defaultValue="0" className="h-9 mt-1 font-mono text-xs" />
              </div>
              <div>
                <Label className="font-black text-xs">سعر المفرد</Label>
                <Input name="retailPrice" type="number" min="0" defaultValue="0" className="h-9 mt-1 font-mono text-xs text-emerald-700" />
              </div>
              <div>
                <Label className="font-black text-xs">سعر الجملة</Label>
                <Input name="wholesalePrice" type="number" min="0" defaultValue="0" className="h-9 mt-1 font-mono text-xs text-blue-700" />
              </div>
            </div>

            <div>
              <Label className="font-black text-xs">الرصيد الأولي للمخزن</Label>
              <Input name="stockQuantity" type="number" min="0" defaultValue="1" className="h-9 mt-1 font-mono text-xs" />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button type="submit" disabled={savingNewItem} className="font-black bg-primary text-white gap-1.5">
                {savingNewItem ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span>حفظ وإدراج في الفاتورة</span>
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsAddProductOpen(false)}>
                إلغاء
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG: + إضافة زبون جديد من داخل المبيعات                               */}
      {/* ========================================================================= */}
      <Dialog open={isAddCustomerOpen} onOpenChange={setIsAddCustomerOpen}>
        <DialogContent className="rounded-2xl max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-primary flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              <span>إضافة زبون جديد</span>
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleQuickSaveCustomer} className="space-y-4 py-2">
            <div>
              <Label className="font-black text-xs">اسم الزبون / الشركة *</Label>
              <Input name="name" required placeholder="مثال: شركة النور للمقاولات" className="h-9 mt-1 font-bold text-xs" />
            </div>

            <div>
              <Label className="font-black text-xs">رقم الهاتف</Label>
              <Input name="phone" placeholder="07XXXXXXXXX" className="h-9 mt-1 font-mono text-xs" />
            </div>

            <div>
              <Label className="font-black text-xs">العنوان</Label>
              <Input name="address" placeholder="المدينة / المنطقة" className="h-9 mt-1 font-bold text-xs" />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button type="submit" disabled={savingNewItem} className="font-black bg-primary text-white gap-1.5">
                {savingNewItem ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span>حفظ واختيار</span>
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsAddCustomerOpen(false)}>
                إلغاء
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Printable Invoice Container (Hidden on screen, ONLY visible to printer) */}
      <div className="printable-invoice-wrapper hidden print:block">
        <PrintableInvoice
          invoiceNo={lastCompletedInvoice?.invoiceNo || activeTab.invoiceNo}
          date={lastCompletedInvoice?.date || activeTab.invoiceDate}
          customer={{
            name: lastCompletedInvoice?.customerName || activeTab.customerName,
            phone: lastCompletedInvoice?.customerPhone || activeTab.customerPhone,
            address: lastCompletedInvoice?.customerAddress || activeTab.customerAddress,
            debtor: activeTab.customerDebtor
          }}
          cashierName={currentUser?.displayName || 'المسؤول'}
          priceType={activeTab.priceType}
          currency={activeTab.currency}
          items={lastCompletedInvoice?.cart || activeTab.cart}
          subtotal={lastCompletedInvoice?.subtotal || subtotal}
          discountAmount={lastCompletedInvoice?.discountAmount || discountAmount}
          netTotal={lastCompletedInvoice?.netTotal || netTotal}
          paidAmount={lastCompletedInvoice?.paidAmount || activeTab.paidAmount}
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
          invoiceNo: activeTab.invoiceNo,
          date: activeTab.invoiceDate,
          customer: {
            name: activeTab.customerName,
            phone: activeTab.customerPhone,
            address: activeTab.customerAddress,
            debtor: activeTab.customerDebtor
          },
          cashierName: currentUser?.displayName || 'المسؤول',
          priceType: activeTab.priceType,
          currency: activeTab.currency,
          items: activeTab.cart,
          subtotal,
          discountAmount,
          netTotal,
          paidAmount: activeTab.paidAmount,
          remaining,
          previousBalance,
          currentBalance
        }}
      />
    </>
  );
}
