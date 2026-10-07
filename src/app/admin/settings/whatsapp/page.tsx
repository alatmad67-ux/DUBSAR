'use client';

import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Save, 
  Send, 
  CheckCircle2, 
  Smartphone,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { InventoryService } from '@/services/inventory-service';

export default function WhatsAppSettingsPage() {
  const [enabled, setEnabled] = useState(false);
  const [defaultCountryCode, setDefaultCountryCode] = useState('+964');
  const [messageTemplate, setMessageTemplate] = useState(
    'عزيزي {customerName}، شكراً لتعاملك مع دوبسار. رقم فاتورتك: {invoiceNo}، المبلغ الإجمالي: {totalAmount} د.ع.'
  );
  const [instanceId, setInstanceId] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load local config
    const saved = localStorage.getItem('dubsar_whatsapp_config');
    if (saved) {
      try {
        const config = JSON.parse(saved);
        setEnabled(config.enabled ?? false);
        setDefaultCountryCode(config.defaultCountryCode || '+964');
        setMessageTemplate(config.messageTemplate || messageTemplate);
        setInstanceId(config.instanceId || '');
        setApiToken(config.apiToken || '');
      } catch (e) {}
    }
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      const config = {
        enabled,
        defaultCountryCode,
        messageTemplate,
        instanceId,
        apiToken,
        updatedAt: Date.now()
      };

      localStorage.setItem('dubsar_whatsapp_config', JSON.stringify(config));
      toast({ title: 'تم حفظ إعدادات واتساب بنجاح' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'فشل حفظ الإعدادات' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-300 pb-16" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-emerald-600" />
            <span>إعدادات ربط WhatsApp</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            تهيئة إرسال الفواتير والإشعارات التلقائية للزبائن عبر تطبيق الواتساب
          </p>
        </div>

        <Button onClick={handleSave} disabled={loading} className="font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
          <Save className="h-4 w-4" />
          <span>حفظ التغييرات</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* General Options */}
        <Card className="rounded-2xl border shadow-sm bg-white dark:bg-slate-900">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-base font-black">خيارات الإرسال التلقائي</CardTitle>
            <CardDescription className="text-xs">تفعيل إرسال ملخص الفاتورة تلقائياً عند إتمام البيع</CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-2 space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border">
              <div>
                <span className="text-xs font-black block">تفعيل إرسال فواتير WhatsApp</span>
                <span className="text-[11px] text-muted-foreground">فتح نافذة المحادثة تلقائياً برقم الزبون</span>
              </div>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">مفتاح الدولة الافتراضي</label>
              <Input 
                value={defaultCountryCode} 
                onChange={e => setDefaultCountryCode(e.target.value)}
                placeholder="+964"
                className="h-10 rounded-xl font-mono text-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* API Credentials */}
        <Card className="rounded-2xl border shadow-sm bg-white dark:bg-slate-900">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-base font-black">إعدادات بوابة WhatsApp API (اختياري)</CardTitle>
            <CardDescription className="text-xs">ربط موفّر خدمة الإرسال المباشر بدون فتح التطبيق</CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-2 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">رقم المعرّف (Instance ID)</label>
              <Input 
                value={instanceId} 
                onChange={e => setInstanceId(e.target.value)}
                placeholder="instance12345"
                className="h-10 rounded-xl font-mono text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">مفتاح API Token</label>
              <Input 
                type="password"
                value={apiToken} 
                onChange={e => setApiToken(e.target.value)}
                placeholder="••••••••••••••••"
                className="h-10 rounded-xl font-mono text-xs"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Message Template */}
      <Card className="rounded-2xl border shadow-sm bg-white dark:bg-slate-900">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-base font-black">قالب الرسالة الافتراضية</CardTitle>
          <CardDescription className="text-xs">استخدم المتغيرات التلقائية لتخصيص نص الرسالة للعميل</CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-2 space-y-4">
          <Textarea 
            value={messageTemplate}
            onChange={e => setMessageTemplate(e.target.value)}
            className="rounded-xl min-h-[100px] text-xs font-medium leading-relaxed"
          />

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
              <Info className="h-4 w-4 text-blue-500" />
              <span>المتغيرات المدعومة داخل القالب:</span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1 font-mono text-[11px]">
              <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border">{`{customerName}`} - اسم الزبون</span>
              <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border">{`{invoiceNo}`} - رقم الفاتورة</span>
              <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border">{`{totalAmount}`} - إجمالي الفاتورة</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
