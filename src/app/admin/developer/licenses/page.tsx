'use client';

import React, { useState, useEffect } from 'react';
import { 
  Key, 
  ShieldCheck, 
  Sparkles, 
  Copy, 
  Check, 
  Share2, 
  ExternalLink, 
  Plus, 
  Laptop, 
  Building2, 
  Phone, 
  FileSpreadsheet, 
  Search, 
  Trash2, 
  RefreshCw,
  Edit,
  Printer,
  FileText,
  MapPin,
  Coins
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

export default function DeveloperLicenseHubPage() {
  const [licenses, setLicenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [serverOnline, setServerOnline] = useState(false);
  const [search, setSearch] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Form states
  const [businessName, setBusinessName] = useState('');
  const [customerOwner, setCustomerOwner] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [price, setPrice] = useState('250,000 د.ع');
  const [maxDevices, setMaxDevices] = useState('1');
  const [notes, setNotes] = useState('');
  const [generating, setGenerating] = useState(false);
  const [newlyGenerated, setNewlyGenerated] = useState<any | null>(null);

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Invoice Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);

  const checkAndLoad = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:4242/api/licenses', { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data = await res.json();
        setLicenses(data);
        setServerOnline(true);
      } else {
        setServerOnline(false);
      }
    } catch {
      setServerOnline(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAndLoad();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'اسم النشاط التجاري مطلوب.' });
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch('http://127.0.0.1:4242/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          businessName, 
          customerOwner,
          deviceBinding: deviceId, 
          maxDevices, 
          phone, 
          address,
          price,
          notes 
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل التوليد');

      setNewlyGenerated(data);
      toast({ title: '🎉 تم إنشاء وتوقيع الترخيص وإعداد الفاتورة بنجاح!' });
      navigator.clipboard.writeText(data.armoredKey);
      await checkAndLoad();
    } catch (err: any) {
      toast({ 
        variant: 'destructive', 
        title: 'تعذر الاتصال بمحرك التوقيع', 
        description: 'يرجى تشغيل أداة الترخيص بالضغط على "تشغيل_مدير_التراخيص.vbs" أو ملف bat أولاً.' 
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      const res = await fetch('http://127.0.0.1:4242/api/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseId: editingItem.licenseId,
          updates: {
            businessName: editingItem.businessName,
            customerOwner: editingItem.customerOwner,
            phone: editingItem.phone,
            address: editingItem.address,
            price: editingItem.price,
            maxDevices: editingItem.maxDevices,
            deviceBinding: editingItem.deviceBinding,
            notes: editingItem.notes
          }
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل التحديث');

      toast({ title: 'تم حفظ تعديلات العميل بنجاح!' });
      setIsEditDialogOpen(false);
      await checkAndLoad();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'خطأ أثناء التعديل', description: err.message });
    }
  };

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    toast({ title: 'تم نسخ كود التفعيل للحافظة' });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleWhatsApp = (item: any) => {
    let cleanPhone = (item.phone || '').replace(/\D/g, '');
    if (cleanPhone.startsWith('07')) {
      cleanPhone = '964' + cleanPhone.substring(1);
    } else if (cleanPhone.startsWith('7')) {
      cleanPhone = '964' + cleanPhone;
    }

    const msg = `🌟 مرحباً بكم في نظام DUBSAR 2.0 Pro\n\nتم إصدار فاتورة الشراء ورخصة الاستخدام الدائم (Lifetime) بنجاح:\n• المنشأة: ${item.businessName}\n• رقم الترخيص: ${item.licenseId}\n• المبلغ المدفوع: ${item.price || 'مدفوع بالكامل'}\n• المطور المعتمد: حسين صلاح (07858833838)\n\n🔐 كود التفعيل الرقمي المعتمد الخاص بكم:\n${item.armoredKey}\n\nطريقة التفعيل السريع:\n1. افتح برنامج DUBSAR على جهازك.\n2. الصق الكود أعلاه في نافذة التفعيل.\n3. اضغط "تفعيل رخصة DUBSAR Lifetime".\n\nشكراً لتعاملكم معنا ونتمنى لكم عملاً مباركاً وناجحاً! 🌹`;
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const filtered = licenses.filter(l => 
    (l.businessName || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.customerOwner || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.phone || '').includes(search) ||
    (l.address || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.licenseId || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300 select-none pb-20" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-3xl border shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black text-xl shadow-md">
            👑
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-foreground">مركز إصدار وتوقيع التراخيص والفواتير</h1>
              <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30">
                Developer Suite
              </Badge>
            </div>
            <p className="text-muted-foreground text-xs font-bold mt-0.5">
              توليد، تعديل، وإدارة تراخيص DUBSAR 2.0 Lifetime وفواتير الشراء المعتمدة • المطور: حسين صلاح (07858833838)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={serverOnline ? 'default' : 'secondary'} className={serverOnline ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}>
            {serverOnline ? 'محرك التوقيع متصل' : 'يرجى تشغيل محرك التراخيص'}
          </Badge>
          <Button variant="outline" size="sm" onClick={checkAndLoad} className="h-10 rounded-xl font-bold gap-1 text-xs">
            <RefreshCw className="h-3.5 w-3.5" />
            <span>تحديث</span>
          </Button>
        </div>
      </div>

      {/* Main Generator Form */}
      <Card className="rounded-[28px] border shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <h2 className="text-base font-black flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>إصدار رخصة وفاتورة شراء جديدة لزبون</span>
          </h2>
          <span className="text-xs text-muted-foreground font-bold">توقيع رقمي بمفتاح ECDSA الخاص</span>
        </div>

        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div className="space-y-1.5">
              <label className="text-xs font-black">اسم المحل / النشاط التجاري *</label>
              <Input 
                required 
                placeholder="مثال: أسواق النور المركزية..." 
                value={businessName} 
                onChange={(e) => setBusinessName(e.target.value)}
                className="h-12 rounded-xl font-bold bg-muted/20" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black">اسم صاحب المحل / المسؤول</label>
              <Input 
                placeholder="مثال: السيد أحمد علي..." 
                value={customerOwner} 
                onChange={(e) => setCustomerOwner(e.target.value)}
                className="h-12 rounded-xl font-bold bg-muted/20" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black">رقم هاتف / واتساب الزبون</label>
              <Input 
                placeholder="مثال: 07858833838" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)}
                className="h-12 rounded-xl font-mono font-bold bg-muted/20" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black">العنوان / المحافظة</label>
              <Input 
                placeholder="مثال: بغداد - الكرادة..." 
                value={address} 
                onChange={(e) => setAddress(e.target.value)}
                className="h-12 rounded-xl font-bold bg-muted/20" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black">سعر شراء النظام</label>
              <Input 
                placeholder="مثال: 250,000 د.ع" 
                value={price} 
                onChange={(e) => setPrice(e.target.value)}
                className="h-12 rounded-xl font-bold text-amber-600 bg-muted/20 font-mono" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black">عدد الأجهزة المسموحة</label>
              <select 
                value={maxDevices} 
                onChange={(e) => setMaxDevices(e.target.value)}
                className="w-full h-12 px-3 rounded-xl border bg-muted/20 font-bold text-xs"
              >
                <option value="1">1 جهاز (كاشير واحد - الافتراضي)</option>
                <option value="2">2 جهازين (كاشير + إدارة)</option>
                <option value="3">3 أجهزة (شبكة محلية)</option>
                <option value="5">5 أجهزة</option>
                <option value="10">10 أجهزة</option>
              </select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-black">معرّف جهاز الزبون (Hardware ID):</label>
              <Input 
                placeholder="مثال: DB-DEV-XXXX (أو اتركه فارغاً لترخيص غير مقيد بكمبيوتر محدد)" 
                value={deviceId} 
                onChange={(e) => setDeviceId(e.target.value)}
                className="h-12 rounded-xl font-mono font-bold bg-muted/20 text-primary" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black">ملاحظات إضافية</label>
              <Input 
                placeholder="اختياري..." 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)}
                className="h-12 rounded-xl bg-muted/20" 
              />
            </div>

          </div>

          <Button 
            type="submit" 
            disabled={generating}
            className="w-full h-14 rounded-2xl text-base font-black bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-lg gap-2 cursor-pointer"
          >
            <Sparkles className="h-5 w-5" />
            <span>توليد وتوقيع كود الترخيص الرقمي وإعداد الفاتورة</span>
          </Button>
        </form>

        {/* Newly Generated Result Card */}
        {newlyGenerated && (
          <div className="p-5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-black text-sm text-amber-900 dark:text-amber-200">
                🎉 تم إصدار الترخيص رقم: {newlyGenerated.record?.licenseId}
              </span>
              <Badge className="bg-emerald-600 text-white font-mono text-[10px]">Signed & Verified</Badge>
            </div>
            <textarea 
              readOnly 
              rows={2} 
              value={newlyGenerated.armoredKey} 
              className="w-full p-2.5 rounded-xl font-mono text-xs bg-background border select-all" 
            />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => handleCopy(newlyGenerated.armoredKey)} className="rounded-xl font-bold text-xs gap-1.5 bg-amber-600 hover:bg-amber-700">
                <Copy className="h-3.5 w-3.5" />
                <span>نسخ الكود</span>
              </Button>
              <Button size="sm" onClick={() => handleWhatsApp(newlyGenerated.record)} className="rounded-xl font-bold text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
                <Share2 className="h-3.5 w-3.5" />
                <span>إرسال واتساب للزبون</span>
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setSelectedInvoice(newlyGenerated.record); setIsInvoiceDialogOpen(true); }} className="rounded-xl font-bold text-xs gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                <span>عرض الفاتورة والشهادة</span>
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Registry Table & Real-time Search */}
      <Card className="rounded-[28px] border shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-base font-black">سجل العملاء والتراخيص الصادرة ({licenses.length})</h2>
            <p className="text-xs text-muted-foreground font-bold">بحث فوري باسم المحل، رقم الهاتف، المسؤول، أو العنوان لتعديل البيانات</p>
          </div>
          <div className="w-full sm:w-80 relative">
            <Input 
              placeholder="🔍 بحث سريع: بالاسم، الهاتف، العنوان..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="w-full h-11 rounded-xl bg-muted/20 text-xs font-bold" 
            />
            {search && (
              <span className="absolute left-3 top-3 text-[11px] font-bold text-amber-600">
                {filtered.length} نتيجة
              </span>
            )}
          </div>
        </div>

        <div className="rounded-2xl border overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-muted/50 font-black border-b">
              <tr>
                <th className="p-3">رقم الترخيص</th>
                <th className="p-3">اسم النشاط</th>
                <th className="p-3">المسؤول</th>
                <th className="p-3">الهاتف</th>
                <th className="p-3">العنوان</th>
                <th className="p-3">سعر الشراء</th>
                <th className="p-3 text-center">الأجهزة</th>
                <th className="p-3">تاريخ الإصدار</th>
                <th className="p-3 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y font-bold">
              {filtered.length > 0 ? (
                filtered.map((l: any) => (
                  <tr key={l.licenseId} className="hover:bg-muted/10">
                    <td className="p-3 font-mono font-black text-amber-600">{l.licenseId}</td>
                    <td className="p-3 text-foreground font-black">{l.businessName}</td>
                    <td className="p-3 text-muted-foreground">{l.customerOwner || '---'}</td>
                    <td className="p-3 font-mono text-amber-600">{l.phone || '---'}</td>
                    <td className="p-3 text-muted-foreground text-[11px]">{l.address || '---'}</td>
                    <td className="p-3 font-mono text-emerald-600">{l.price || '---'}</td>
                    <td className="p-3 text-center font-mono">{l.maxDevices || 1}</td>
                    <td className="p-3 text-muted-foreground text-[11px] font-mono">{l.issuedAtFormatted || '---'}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => { setEditingItem(l); setIsEditDialogOpen(true); }}
                          className="h-7 text-[11px] rounded-lg font-bold px-2 text-amber-600 hover:bg-amber-50"
                          title="تعديل بيانات العميل"
                        >
                          <Edit className="h-3 w-3" />
                          <span>تعديل</span>
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleCopy(l.armoredKey)} 
                          className="h-7 text-[11px] rounded-lg font-bold px-2"
                          title="نسخ الكود"
                        >
                          <Copy className="h-3 w-3" />
                          <span>{copiedKey === l.armoredKey ? 'تم' : 'نسخ'}</span>
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => { setSelectedInvoice(l); setIsInvoiceDialogOpen(true); }}
                          className="h-7 text-[11px] rounded-lg font-bold px-2 text-indigo-600 border-indigo-200"
                          title="الفاتورة والشهادة"
                        >
                          <FileText className="h-3 w-3" />
                          <span>فاتورة</span>
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleWhatsApp(l)} 
                          className="h-7 text-[11px] rounded-lg font-bold px-2 text-emerald-600 border-emerald-200"
                          title="واتساب"
                        >
                          <Share2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-muted-foreground font-bold">
                    {serverOnline ? 'لا توجد تراخيص مطابقة في السجل' : 'شغّل أداة "تشغيل_مدير_التراخيص.vbs" لربط السجل مباشرة'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Customer Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-xl rounded-3xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <Edit className="h-4 w-4 text-amber-500" />
              <span>تعديل بيانات العميل والترخيص</span>
            </DialogTitle>
          </DialogHeader>

          {editingItem && (
            <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-black">اسم المحل / النشاط</label>
                  <Input 
                    required 
                    value={editingItem.businessName || ''} 
                    onChange={(e) => setEditingItem({ ...editingItem, businessName: e.target.value })} 
                    className="h-10 text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black">اسم صاحب المحل / المسؤول</label>
                  <Input 
                    value={editingItem.customerOwner || ''} 
                    onChange={(e) => setEditingItem({ ...editingItem, customerOwner: e.target.value })} 
                    className="h-10 text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black">رقم الهاتف / واتساب</label>
                  <Input 
                    value={editingItem.phone || ''} 
                    onChange={(e) => setEditingItem({ ...editingItem, phone: e.target.value })} 
                    className="h-10 text-xs font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black">العنوان / المحافظة</label>
                  <Input 
                    value={editingItem.address || ''} 
                    onChange={(e) => setEditingItem({ ...editingItem, address: e.target.value })} 
                    className="h-10 text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black">سعر شراء النظام</label>
                  <Input 
                    value={editingItem.price || ''} 
                    onChange={(e) => setEditingItem({ ...editingItem, price: e.target.value })} 
                    className="h-10 text-xs font-bold text-amber-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black">عدد الأجهزة</label>
                  <select 
                    value={editingItem.maxDevices || '1'} 
                    onChange={(e) => setEditingItem({ ...editingItem, maxDevices: e.target.value })} 
                    className="w-full h-10 px-3 rounded-xl border bg-background font-bold text-xs"
                  >
                    <option value="1">1 جهاز (كاشير واحد)</option>
                    <option value="2">2 جهازين</option>
                    <option value="3">3 أجهزة</option>
                    <option value="5">5 أجهزة</option>
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-black">معرف الجهاز (Binding):</label>
                  <Input 
                    value={editingItem.deviceBinding || ''} 
                    onChange={(e) => setEditingItem({ ...editingItem, deviceBinding: e.target.value })} 
                    className="h-10 text-xs font-mono text-primary"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-black">ملاحظات</label>
                  <Input 
                    value={editingItem.notes || ''} 
                    onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })} 
                    className="h-10 text-xs"
                  />
                </div>
              </div>

              <DialogFooter className="gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} className="rounded-xl">إلغاء</Button>
                <Button type="submit" className="rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black">حفظ التعديلات</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Invoice & Certificate View Dialog */}
      <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
        <DialogContent className="max-w-3xl rounded-3xl p-6" dir="rtl">
          <DialogHeader>
            <div className="flex justify-between items-center w-full">
              <DialogTitle className="text-base font-black flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                <span>فاتورة شراء وسند تفعيل رخصة DUBSAR 2.0 المعتمدة</span>
              </DialogTitle>
              <Button size="sm" onClick={() => window.print()} className="gap-1.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-600 text-slate-950">
                <Printer className="h-3.5 w-3.5" />
                <span>طباعة A4</span>
              </Button>
            </div>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-5 p-5 rounded-2xl border bg-card text-foreground">
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <h3 className="text-xl font-black text-primary">DUBSAR 2.0 PRO • Desktop POS</h3>
                  <p className="text-xs text-muted-foreground font-bold">نظام إدارة المبيعات ونقاط البيع والمخازن المتكامل</p>
                  <p className="text-xs text-amber-600 font-bold mt-1">تطوير وبرمجة: حسين صلاح • هاتف: 07858833838</p>
                </div>
                <div className="text-left font-mono">
                  <span className="text-[10px] font-black uppercase text-muted-foreground">رقم الفاتورة والترخيص</span>
                  <p className="text-sm font-black text-amber-600">{selectedInvoice.licenseId}</p>
                  <p className="text-[11px] text-muted-foreground">{selectedInvoice.issuedAtFormatted}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-muted/20 p-3.5 rounded-xl border">
                <div>
                  <span className="text-muted-foreground font-bold">اسم المنشأة: </span>
                  <strong className="text-foreground">{selectedInvoice.businessName}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground font-bold">المسؤول: </span>
                  <strong>{selectedInvoice.customerOwner || '---'}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground font-bold">الهاتف: </span>
                  <strong className="font-mono">{selectedInvoice.phone || '---'}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground font-bold">العنوان: </span>
                  <strong>{selectedInvoice.address || '---'}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground font-bold">نوع الباقة: </span>
                  <strong className="text-emerald-600">Lifetime • مدى الحياة</strong>
                </div>
                <div>
                  <span className="text-muted-foreground font-bold">سعر الشراء: </span>
                  <strong className="text-amber-600 font-mono">{selectedInvoice.price || '250,000 د.ع'}</strong>
                </div>
              </div>

              <div className="space-y-1 bg-slate-950 text-white p-3.5 rounded-xl">
                <span className="text-[11px] font-bold text-amber-300">🔐 كود التفعيل الرقمي المعتمد:</span>
                <p className="font-mono text-[10px] text-amber-100 break-all select-all leading-tight">
                  {selectedInvoice.armoredKey}
                </p>
              </div>

              <div className="flex justify-between items-center text-xs text-muted-foreground border-t pt-3">
                <span>تعتبر هذه الوثيقة إثباتاً رسمياً لملكية رخصة برنامج DUBSAR 2.0 Pro.</span>
                <span className="font-bold text-foreground">المطور: حسين صلاح</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
