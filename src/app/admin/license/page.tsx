'use client';

import { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  ShieldAlert, 
  Key, 
  Laptop, 
  Calendar, 
  CheckCircle2, 
  Building2,
  RefreshCw,
  LogOut,
  Sparkles,
  Lock,
  Copy,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LicenseManager, LicenseStatus } from "@/core/license/license-manager";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function LicensePage() {
  const [status, setStatus] = useState<LicenseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    checkLicense();
  }, []);

  const checkLicense = async () => {
    setLoading(true);
    try {
      const result = await LicenseManager.verifyStatus();
      setStatus(result);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyDeviceId = () => {
    if (status?.currentDeviceId) {
      navigator.clipboard.writeText(status.currentDeviceId);
      setCopied(true);
      toast({ title: "تم نسخ معرف الجهاز بنجاح" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDeactivate = () => {
    if (confirm("هل أنت متأكد من رغبتك في إلغاء تفعيل هذا الترخيص على هذا الجهاز؟ سيتوقف البرنامج عن العمل حتى يتم تفعيله مجدداً.")) {
      LicenseManager.deactivate();
      toast({ title: "تم إلغاء تفعيل الترخيص" });
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 select-none pb-16" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-2xl border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Lock className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground">بيانات ورخصة البرنامج (DUBSAR Lifetime)</h1>
            <p className="text-muted-foreground text-xs font-bold mt-0.5">
              تفاصيل ملكية النسخة، القيود الرقمية، ومعرف الجهاز المرتبط بالترخيص الدائم
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={checkLicense} 
            disabled={loading}
            className="h-10 rounded-xl font-bold gap-1.5"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            <span>إعادة التحقق الرقمي</span>
          </Button>
        </div>
      </div>

      {/* Main License Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className={cn(
            "rounded-[28px] border-2 shadow-sm overflow-hidden",
            status?.isValid ? "border-emerald-500/30 bg-card" : "border-rose-500/30 bg-card"
          )}>
            <CardHeader className={cn(
              "p-6 border-b flex flex-row items-center justify-between",
              status?.isValid ? "bg-emerald-500/5" : "bg-rose-500/5"
            )}>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-12 w-12 rounded-2xl flex items-center justify-center shadow-sm",
                  status?.isValid ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                )}>
                  {status?.isValid ? <ShieldCheck className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
                </div>
                <div>
                  <CardTitle className="text-xl font-black">
                    {status?.isValid ? "الترخيص مفعل وساري المفعول" : "الترخيص غير صالح أو غير مفعل"}
                  </CardTitle>
                  <CardDescription className="text-xs font-bold mt-0.5">
                    {status?.isValid ? "تم التحقق من التوقيع الرقمي للرخصة وتطابق معرف الجهاز" : (status?.errorMessage || "يرجى تفعيل النسخة")}
                  </CardDescription>
                </div>
              </div>

              <Badge className={cn(
                "px-3 py-1 font-bold text-xs rounded-xl",
                status?.isValid ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
              )}>
                {status?.isValid ? "Lifetime • دائم" : "غير مفعل"}
              </Badge>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Business Name */}
                <div className="p-4 rounded-2xl bg-muted/30 border space-y-1">
                  <span className="text-muted-foreground text-[11px] font-bold flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-primary" />
                    اسم النشاط / المؤسسة المرخصة:
                  </span>
                  <p className="text-base font-black text-foreground">
                    {status?.businessName || "غير محدد"}
                  </p>
                </div>

                {/* Plan Type */}
                <div className="p-4 rounded-2xl bg-muted/30 border space-y-1">
                  <span className="text-muted-foreground text-[11px] font-bold flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    نوع وخطة الترخيص:
                  </span>
                  <p className="text-base font-black text-amber-600 dark:text-amber-400 font-mono">
                    DUBSAR Lifetime (شراء دائم لمرة واحدة)
                  </p>
                </div>

                {/* License ID */}
                <div className="p-4 rounded-2xl bg-muted/30 border space-y-1">
                  <span className="text-muted-foreground text-[11px] font-bold flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5 text-primary" />
                    رقم الترخيص الرسمي (License ID):
                  </span>
                  <p className="text-sm font-mono font-black text-primary">
                    {status?.licenseId || "---"}
                  </p>
                </div>

                {/* Max Devices */}
                <div className="p-4 rounded-2xl bg-muted/30 border space-y-1">
                  <span className="text-muted-foreground text-[11px] font-bold flex items-center gap-1.5">
                    <Laptop className="h-3.5 w-3.5 text-primary" />
                    عدد الأجهزة المسموحة:
                  </span>
                  <p className="text-base font-black font-mono">
                    {status?.maxDevices || 1} جهاز
                  </p>
                </div>

                {/* Machine ID */}
                <div className="p-4 rounded-2xl bg-muted/30 border space-y-1 md:col-span-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-[11px] font-bold flex items-center gap-1.5">
                      <Laptop className="h-3.5 w-3.5 text-primary" />
                      معرف هذا الجهاز الحالي (Hardware ID):
                    </span>
                    <button 
                      onClick={handleCopyDeviceId}
                      className="text-xs text-primary font-bold flex items-center gap-1 hover:underline"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copied ? "تم النسخ" : "نسخ المعرف"}</span>
                    </button>
                  </div>
                  <p className="text-sm font-mono font-black text-foreground bg-background p-2.5 rounded-xl border mt-1">
                    {status?.currentDeviceId || "---"}
                  </p>
                </div>

                {/* Dates */}
                <div className="p-4 rounded-2xl bg-muted/30 border space-y-1">
                  <span className="text-muted-foreground text-[11px] font-bold flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    تاريخ التفعيل على هذا الجهاز:
                  </span>
                  <p className="text-xs font-mono font-bold">
                    {status?.activatedAt ? new Date(status.activatedAt).toLocaleString("ar-IQ") : "---"}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-muted/30 border space-y-1">
                  <span className="text-muted-foreground text-[11px] font-bold flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    تاريخ إصدار الترخيص:
                  </span>
                  <p className="text-xs font-mono font-bold">
                    {status?.issuedAt ? new Date(status.issuedAt).toLocaleDateString("ar-IQ") : "---"}
                  </p>
                </div>

              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info & Actions */}
        <div className="space-y-6">
          <Card className="rounded-[28px] border shadow-sm p-6 space-y-4">
            <h3 className="font-black text-base flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <span>ميزات ترخيص Lifetime</span>
            </h3>
            <ul className="space-y-2.5 text-xs text-muted-foreground font-bold">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>شراء دائم بدون اشتراكات أو فواتير شهرية</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>يعمل محلياً (Offline) بالكامل دون الحاجة لاتصال</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>حماية مشفرة ومقترنة بعتاد الجهاز الرسمي</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>تحديثات النظام المستمرة وتطويرات DUBSAR</span>
              </li>
            </ul>

            {status?.isValid && (
              <div className="pt-4 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDeactivate}
                  className="w-full rounded-xl font-black text-xs text-rose-600 hover:bg-rose-50 border-rose-200 h-10 gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>إلغاء تفعيل الترخيص على هذا الجهاز</span>
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
