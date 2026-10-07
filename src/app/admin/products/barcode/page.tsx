'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Barcode, 
  Printer, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Settings2, 
  Check, 
  ArrowRight, 
  Sliders,
  Layers,
  Sparkles,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InventoryService } from '@/services/inventory-service';
import { PrintEngine, BarcodeLabelItem, BarcodeLabelConfig, generateCode128Svg } from '@/services/print-engine';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function BarcodeStudioPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const preSelectedId = searchParams.get('productId');

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [businessName, setBusinessName] = useState('مؤسسة دوبسار');

  // Selected items queue for printing
  const [printQueue, setPrintQueue] = useState<BarcodeLabelItem[]>([]);

  // Config
  const [labelSize, setLabelSize] = useState<'38x25' | '50x30' | '40x20' | 'custom'>('38x25');
  const [customWidth, setCustomWidth] = useState(38);
  const [customHeight, setCustomHeight] = useState(25);
  const [showStoreName, setShowStoreName] = useState(true);
  const [showProductName, setShowProductName] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [showBarcodeNumber, setShowBarcodeNumber] = useState(true);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [priceType, setPriceType] = useState<'retail' | 'wholesale'>('retail');
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    // Load store name from settings
    try {
      const saved = localStorage.getItem('dubsar_app_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.businessName) setBusinessName(parsed.businessName);
      }
    } catch {}

    // Load products
    InventoryService.getProducts()
      .then((items) => {
        setProducts(items || []);
        if (preSelectedId) {
          const target = items.find((p: any) => p.id === preSelectedId);
          if (target) {
            setPrintQueue([{
              productName: target.name,
              barcode: target.barcode || target.sku || '000000',
              price: priceType === 'wholesale' ? Number(target.wholesalePrice || 0) : Number(target.retailPrice || 0),
              unit: target.unit,
              businessName,
              copies: 1
            }]);
          }
        }
      })
      .catch((e) => {
        console.error(e);
        toast({ variant: 'destructive', title: 'فشل تحميل المواد' });
      })
      .finally(() => setLoading(false));
  }, [preSelectedId]);

  // Derived dimensions
  const activeDimensions = useMemo(() => {
    switch (labelSize) {
      case '38x25': return { w: 38, h: 25 };
      case '50x30': return { w: 50, h: 30 };
      case '40x20': return { w: 40, h: 20 };
      default: return { w: customWidth || 38, h: customHeight || 25 };
    }
  }, [labelSize, customWidth, customHeight]);

  // Search filtered products
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return products.filter((p: any) => 
      (p.name && p.name.toLowerCase().includes(q)) || 
      (p.barcode && p.barcode.includes(q)) ||
      (p.sku && p.sku.toLowerCase().includes(q))
    ).slice(0, 10);
  }, [products, searchQuery]);

  const addToQueue = (product: any) => {
    setPrintQueue(prev => {
      const existingIndex = prev.findIndex(item => item.barcode === (product.barcode || product.sku));
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].copies += 1;
        return updated;
      }
      return [...prev, {
        productName: product.name,
        barcode: product.barcode || product.sku || String(Date.now()).slice(-6),
        price: priceType === 'wholesale' ? Number(product.wholesalePrice || 0) : Number(product.retailPrice || 0),
        unit: product.unit,
        businessName,
        copies: 1
      }];
    });
    setSearchQuery('');
  };

  const updateCopies = (index: number, delta: number) => {
    setPrintQueue(prev => {
      const updated = [...prev];
      const newCount = updated[index].copies + delta;
      if (newCount <= 0) {
        return updated.filter((_, i) => i !== index);
      }
      updated[index].copies = newCount;
      return updated;
    });
  };

  const removeFromQueue = (index: number) => {
    setPrintQueue(prev => prev.filter((_, i) => i !== index));
  };

  const totalLabelsCount = useMemo(() => {
    return printQueue.reduce((sum, item) => sum + item.copies, 0);
  }, [printQueue]);

  const handlePrint = async () => {
    if (printQueue.length === 0) {
      toast({ variant: 'destructive', title: 'يرجى اختيار مادة واحدة على الأقل للطباعة' });
      return;
    }

    setIsPrinting(true);
    try {
      const config: BarcodeLabelConfig = {
        widthMm: activeDimensions.w,
        heightMm: activeDimensions.h,
        showStoreName,
        showProductName,
        showPrice,
        showBarcodeNumber,
        fontSize
      };

      await PrintEngine.printBarcodeLabels(printQueue, config);
      toast({ title: 'تم إرسال أمر طباعة الباركود بنجاح' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'فشل إرسال أمر الطباعة', description: String(e) });
    } finally {
      setIsPrinting(false);
    }
  };

  // Live preview first item
  const previewItem = printQueue[0] || {
    productName: 'عينة: بطارية هوندا أصلية',
    barcode: '628100123456',
    price: 35000,
    unit: 'قطعة',
    businessName: businessName || 'مؤسسة دوبسار',
    copies: 1
  };

  const previewSvg = useMemo(() => {
    return generateCode128Svg(previewItem.barcode, 32);
  }, [previewItem.barcode]);

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-300 pb-16" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin/products" className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1">
              <ArrowRight className="h-3.5 w-3.5" />
              <span>العودة للمواد</span>
            </Link>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Barcode className="h-7 w-7 text-primary" />
            <span>استوديو طباعة باركود المنتجات</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            توليد وطباعة ملصقات الباركود والأسعار بدقة متجهة عالية لكافة أنواع طابعات الملصقات الحرارية
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handlePrint}
            disabled={printQueue.length === 0 || isPrinting}
            className="font-black gap-2 h-11 px-6 bg-primary hover:bg-primary/95 text-white shadow-lg shadow-primary/20"
          >
            {isPrinting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
            <span>طباعة الملصقات ({totalLabelsCount})</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Product Selector & Queue (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Search Box */}
          <Card className="rounded-2xl border shadow-sm">
            <CardHeader className="p-4 pb-2 border-b">
              <CardTitle className="text-sm font-black flex items-center gap-2">
                <Search className="h-4 w-4 text-primary" />
                <span>اختر المواد لطباعة ملصقاتها</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="relative">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن مادة باسمها، الباركود، أو رمز SKU..."
                  className="h-11 pr-10 text-xs font-bold rounded-xl"
                />
                <Search className="h-4 w-4 absolute right-3 top-3.5 text-muted-foreground" />
              </div>

              {/* Suggestions Dropdown */}
              {searchResults.length > 0 && (
                <div className="border rounded-xl divide-y max-h-56 overflow-y-auto bg-card shadow-lg">
                  {searchResults.map((p) => (
                    <div 
                      key={p.id}
                      onClick={() => addToQueue(p)}
                      className="p-3 hover:bg-muted/50 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div>
                        <span className="font-bold text-xs block">{p.name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{p.barcode || 'بدون باركود'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs font-mono text-primary">
                          {Number(priceType === 'wholesale' ? p.wholesalePrice : p.retailPrice).toLocaleString()} د.ع
                        </span>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Print Queue List */}
          <Card className="rounded-2xl border shadow-sm">
            <CardHeader className="p-4 pb-2 border-b flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-black flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                <span>قائمة الملصقات المطلوب طباعتها ({printQueue.length})</span>
              </CardTitle>
              {printQueue.length > 0 && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setPrintQueue([])}
                  className="h-7 text-xs text-destructive hover:text-destructive gap-1"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>تفريغ الكل</span>
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {printQueue.length > 0 ? (
                <div className="divide-y max-h-[380px] overflow-y-auto">
                  {printQueue.map((item, idx) => (
                    <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-muted/20">
                      <div className="space-y-0.5 max-w-[240px]">
                        <span className="font-bold text-xs block truncate">{item.productName}</span>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                          <span>{item.barcode}</span>
                          <span>•</span>
                          <span className="text-primary font-bold">{Number(item.price).toLocaleString()} د.ع</span>
                        </div>
                      </div>

                      {/* Copies Controls */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-bold">النسخ:</span>
                        <div className="flex items-center border rounded-lg overflow-hidden bg-background">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-7 w-7 rounded-none" 
                            onClick={() => updateCopies(idx, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-9 text-center font-mono font-bold text-xs">{item.copies}</span>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-7 w-7 rounded-none" 
                            onClick={() => updateCopies(idx, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7 text-destructive" 
                          onClick={() => removeFromQueue(idx)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground text-xs space-y-2">
                  <Barcode className="h-10 w-10 mx-auto opacity-30 text-primary" />
                  <p className="font-bold">لم تختر أي مادة بعد</p>
                  <p className="text-[11px]">ابحث عن مادة أعلاه لإضافتها إلى قائمة الطباعة</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Options & Live Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Label Customization Options */}
          <Card className="rounded-2xl border shadow-sm">
            <CardHeader className="p-4 pb-2 border-b">
              <CardTitle className="text-sm font-black flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-primary" />
                <span>إعدادات وتخصيص الملصق</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Size Preset */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">قياس ورق الملصقات</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={labelSize === '38x25' ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs font-bold h-9"
                    onClick={() => setLabelSize('38x25')}
                  >
                    38×25 مم (شائع)
                  </Button>
                  <Button
                    type="button"
                    variant={labelSize === '50x30' ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs font-bold h-9"
                    onClick={() => setLabelSize('50x30')}
                  >
                    50×30 مم
                  </Button>
                  <Button
                    type="button"
                    variant={labelSize === '40x20' ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs font-bold h-9"
                    onClick={() => setLabelSize('40x20')}
                  >
                    40×20 مم
                  </Button>
                </div>
              </div>

              {/* Price Type */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">نوع السعر المطبوع</Label>
                <Select value={priceType} onValueChange={(val: any) => setPriceType(val)}>
                  <SelectTrigger className="h-9 text-xs font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="retail">سعر البيع المفرد</SelectItem>
                    <SelectItem value="wholesale">سعر البيع بالجملة</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Toggles */}
              <div className="space-y-2.5 pt-2 border-t text-xs font-bold">
                <div className="flex items-center justify-between">
                  <span>إظهار اسم المنشأة / المحل</span>
                  <Switch checked={showStoreName} onCheckedChange={setShowStoreName} />
                </div>
                <div className="flex items-center justify-between">
                  <span>إظهار اسم المادة</span>
                  <Switch checked={showProductName} onCheckedChange={setShowProductName} />
                </div>
                <div className="flex items-center justify-between">
                  <span>إظهار السعر</span>
                  <Switch checked={showPrice} onCheckedChange={setShowPrice} />
                </div>
                <div className="flex items-center justify-between">
                  <span>إظهار رقم الباركود كنص</span>
                  <Switch checked={showBarcodeNumber} onCheckedChange={setShowBarcodeNumber} />
                </div>
              </div>

              {/* Font Size */}
              <div className="space-y-1.5 pt-2 border-t">
                <Label className="text-xs font-bold">حجم خط اسم المادة</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={fontSize === 'small' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="text-xs font-bold h-8"
                    onClick={() => setFontSize('small')}
                  >
                    صغير
                  </Button>
                  <Button
                    type="button"
                    variant={fontSize === 'medium' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="text-xs font-bold h-8"
                    onClick={() => setFontSize('medium')}
                  >
                    متوسط
                  </Button>
                  <Button
                    type="button"
                    variant={fontSize === 'large' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="text-xs font-bold h-8"
                    onClick={() => setFontSize('large')}
                  >
                    كبير
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live Preview Box */}
          <Card className="rounded-2xl border shadow-sm bg-slate-50 dark:bg-slate-900/50">
            <CardHeader className="p-4 pb-2 border-b">
              <CardTitle className="text-sm font-black flex items-center justify-between">
                <span>المعاينة المباشرة للملصق (1:1)</span>
                <span className="text-[11px] font-mono text-muted-foreground">{activeDimensions.w} × {activeDimensions.h} مم</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex items-center justify-center">
              {/* Exact Sticker Simulation */}
              <div 
                className="bg-white text-black rounded shadow-md border border-slate-300 flex flex-col justify-between items-center p-2 text-center select-none overflow-hidden transition-all duration-200"
                style={{
                  width: `${activeDimensions.w * 3.8}px`,
                  height: `${activeDimensions.h * 3.8}px`,
                  minHeight: `${activeDimensions.h * 3.8}px`
                }}
              >
                {showStoreName && (
                  <div className="text-[10px] font-bold text-slate-700 truncate w-full">
                    {businessName}
                  </div>
                )}
                {showProductName && (
                  <div className={`font-black text-slate-900 leading-tight truncate w-full ${fontSize === 'small' ? 'text-[10px]' : fontSize === 'large' ? 'text-xs font-extrabold' : 'text-[11px]'}`}>
                    {previewItem.productName}
                  </div>
                )}
                <div className="w-[90%] my-0.5" dangerouslySetInnerHTML={{ __html: previewSvg }} />
                {showBarcodeNumber && (
                  <div className="text-[9px] font-mono tracking-wider font-bold text-slate-800">
                    {previewItem.barcode}
                  </div>
                )}
                {showPrice && (
                  <div className="text-xs font-black font-mono border-t border-black w-[85%] pt-0.5 text-black">
                    {Number(previewItem.price).toLocaleString()} د.ع
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
