'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Key, 
  Copy, 
  Check, 
  Loader2, 
  Sparkles, 
  PhoneCall, 
  Lock, 
  Laptop,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { LicenseManager, LicenseStatus } from '@/core/license/license-manager';

interface LicenseGateProps {
  children: React.ReactNode;
}

export function LicenseGate({ children }: LicenseGateProps) {
  const [status, setStatus] = useState<LicenseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [activationKey, setActivationKey] = useState('');
  const [activating, setActivating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const checkStatus = async () => {
    setLoading(true);
    try {
      const res = await LicenseManager.verifyStatus();
      setStatus(res);
    } catch (e: any) {
      console.error(e);
      setStatus({
        isValid: false,
        plan: 'unlicensed',
        currentDeviceId: LicenseManager.getMachineFingerprint(),
        errorMessage: 'تعذر التحقق من حالة الترخيص.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleCopyDeviceId = () => {
    const id = status?.currentDeviceId || LicenseManager.getMachineFingerprint();
    navigator.clipboard.writeText(id);
    setCopied(true);
    toast({ title: "تم نسخ معرف الجهاز", description: "يمكنك إرساله للدعم الفني لإصدار كود الترخيص." });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activationKey.trim()) {
      setErrorMsg("يرجى لصق كود الترخيص أولاً.");
      return;
    }

    setActivating(true);
    setErrorMsg('');
    try {
      const result = await LicenseManager.activate(activationKey);
      if (result.success) {
        toast({
          title: "🎉 تم تفعيل DUBSAR بنجاح!",
          description: `مرحباً بك، الترخيص مسجل باسم: ${result.status.businessName || 'النشاط التجاري'}`
        });
        setStatus(result.status);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "كود الترخيص غير صالح.");
      toast({
        variant: "destructive",
        title: "فشل التفعيل",
        description: err.message || "تأكد من صحة كود الترخيص وتطابقه مع هذا الجهاز."
      });
    } finally {
      setActivating(false);
    }
  };

  // While checking
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white" dir="rtl">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-bold text-slate-300">جاري التحقق من الترخيص الرقمي لـ DUBSAR...</p>
        </div>
      </div>
    );
  }

  // If valid, render normal application
  if (status?.isValid) {
    return <>{children}</>;
  }

  // Unlicensed: Render Professional Activation Gate
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white select-none" dir="rtl">
      <Card className="w-full max-w-xl rounded-[36px] border-2 border-white/10 bg-slate-900/95 shadow-2xl backdrop-blur-xl overflow-hidden text-white">
        
        {/* Header */}
        <div className="p-8 pb-6 border-b border-white/10 bg-gradient-to-r from-primary/20 via-transparent to-amber-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="h-14 w-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shadow-lg">
                <Lock className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  <span>DUBSAR 2.0</span>
                  <Badge variant="outline" className="text-[10px] bg-amber-500/20 text-amber-300 border-amber-500/40 font-mono">
                    Lifetime Edition
                  </Badge>
                </h1>
                <p className="text-xs text-slate-300 font-bold mt-0.5">
                  تفعيل رخصة الاستخدام الدائم للنظام
                </p>
              </div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
              <ShieldAlert className="h-5 w-5 text-amber-400" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs font-bold leading-relaxed flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              البرنامج غير مفعل حالياً. نظام DUBSAR يُباع بترخيص رسمي دائم (Lifetime) لمرة واحدة فقط دون أي اشتراكات شهرية، ويعمل دون الحاجة لاتصال مستمر بالإنترنت بعد أول تفعيل.
            </div>
          </div>

          {/* Hardware ID Section */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-black text-slate-300 flex items-center gap-1.5">
                <Laptop className="h-3.5 w-3.5 text-primary" />
                معرف هذا الجهاز (Hardware ID):
              </span>
              <span className="text-[10px] text-slate-400">مطلوب لربط الترخيص بهذا الجهاز</span>
            </div>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={status?.currentDeviceId || LicenseManager.getMachineFingerprint()}
                className="h-12 rounded-xl font-mono text-sm font-black bg-slate-950/80 border-white/15 text-primary tracking-wider"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleCopyDeviceId}
                className="h-12 rounded-xl px-4 font-bold border-white/20 bg-white/5 hover:bg-white/10 text-white shrink-0 gap-1.5"
                title="نسخ المعرف"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                <span className="text-xs">{copied ? "تم النسخ" : "نسخ"}</span>
              </Button>
            </div>
          </div>

          {/* Activation Key Input Form */}
          <form onSubmit={handleActivate} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-300 flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5 text-amber-400" />
                كود الترخيص الرقمي (License Activation Key):
              </label>
              <Textarea
                rows={3}
                placeholder="الصق هنا كود الترخيص المستلم من الدعم الفني (يبدأ بـ eyJ...)"
                value={activationKey}
                onChange={(e) => setActivationKey(e.target.value)}
                className="rounded-xl font-mono text-xs p-3 bg-slate-950/80 border-white/15 text-slate-200 resize-none focus-visible:ring-amber-500"
              />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold">
                {errorMsg}
              </div>
            )}

            <Button
              type="submit"
              disabled={activating}
              className="w-full h-14 rounded-2xl text-base font-black bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-xl transition-all gap-2"
            >
              {activating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>جاري التحقق الرقمي وتفعيل الرخصة...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-5 w-5" />
                  <span>تفعيل رخصة DUBSAR Lifetime الآن</span>
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-950/60 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 font-bold">
          <div className="flex items-center gap-2">
            <PhoneCall className="h-4 w-4 text-emerald-400" />
            <span>لطلب وشراء رخصة الاستخدام: </span>
            <span className="font-mono text-white tracking-wider">07858833838</span>
          </div>
          <div className="text-[11px] text-slate-500">
            DUBSAR 2.0 • جميع الحقوق محفوظة
          </div>
        </div>
      </Card>
    </div>
  );
}
