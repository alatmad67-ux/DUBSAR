
'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2, Lock, User, ScrollText, WifiOff, Monitor, Store, ShieldCheck, Upload, Minus, X } from "lucide-react";
import { LocalAuthService } from "@/services/local-auth-service";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [startup, setStartup] = useState<"checking" | "setup" | "login" | "error">("checking");
  const [setupStep, setSetupStep] = useState<1 | 2>(1);
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupError, setSetupError] = useState("");
  const [setupData, setSetupData] = useState({ businessName: "", phone: "", address: "", businessType: "", logo: "", invoiceHeaderImage: "" });
  const [managerData, setManagerData] = useState({ displayName: "", username: "", password: "", confirmPassword: "" });

  useEffect(() => {
    let mounted = true;
    import('@tauri-apps/api/core')
      .then(({ invoke }) => invoke('set_login_window'))
      .catch(() => {});

    LocalAuthService.getSetupStatus()
      .then((status) => mounted && setStartup(status?.needsSetup ? "setup" : "login"))
      .catch((error) => {
        console.error("Setup status failed", error);
        if (mounted) {
          setSetupError(error instanceof Error ? error.message : "تعذر الاتصال بقاعدة البيانات المحلية");
          setStartup("error");
        }
      });
    return () => { mounted = false; };
  }, []);

  const readImage = (file: File | undefined, field: "logo" | "invoiceHeaderImage") => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setSetupError("يرجى اختيار ملف صورة صالح.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setSetupData((current) => ({ ...current, [field]: String(reader.result || "") }));
    reader.onerror = () => setSetupError("تعذر قراءة ملف الصورة.");
    reader.readAsDataURL(file);
  };

  const continueSetup = (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError("");
    if (!setupData.businessName.trim() || !setupData.phone.trim() || !setupData.address.trim() || !setupData.businessType.trim() || !setupData.logo || !setupData.invoiceHeaderImage) {
      setSetupError("أكمل بيانات النشاط واختر الشعار وترويسة فاتورة A4 قبل المتابعة.");
      return;
    }
    setSetupStep(2);
  };

  const completeSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError("");
    if (!managerData.displayName.trim() || !managerData.username.trim() || !managerData.password) {
      setSetupError("أكمل اسم المدير واسم المستخدم وكلمة المرور.");
      return;
    }
    if (managerData.password.length < 4) {
      setSetupError("كلمة المرور يجب أن تتكون من 4 محارف على الأقل.");
      return;
    }
    if (managerData.password !== managerData.confirmPassword) {
      setSetupError("تأكيد كلمة المرور غير مطابق.");
      return;
    }
    setSetupLoading(true);
    try {
      await LocalAuthService.saveAppSettings(setupData);
      await LocalAuthService.createFirstAdmin(managerData.username.trim(), managerData.displayName.trim(), managerData.password);
      setUsername(managerData.username.trim());
      setPin("");
      setStartup("login");
      setSetupStep(1);
      toast({ title: "اكتمل إعداد النظام", description: "تم إنشاء المدير. يمكنك تسجيل الدخول الآن." });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("First-admin creation failed", error);
      setSetupError(message || "تعذر إكمال إعداد النظام.");
    } finally {
      setSetupLoading(false);
    }
  };

  const [loginError, setLoginError] = useState("");

  const handleLocalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoading(true);

    try {
      const user = await LocalAuthService.login(username, pin);
      if (user) {
        localStorage.setItem('dubsar_session', JSON.stringify(user));
        toast({ title: "تم الدخول بنجاح", description: `مرحباً ${user.displayName}` });
        try {
          const { invoke } = await import('@tauri-apps/api/core');
          await invoke('set_main_window');
        } catch {}
        router.push("/admin");
      } else {
        setLoginError("اسم المستخدم أو رمز المرور غير صحيح.");
      }
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "حدث خطأ في تسجيل الدخول.");
    } finally {
      setLoading(false);
    }
  };

  const handleMinimize = async () => {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('app_minimize');
    } catch {
      // fallback
    }
  };

  const handleClose = async () => {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('app_close');
    } catch {
      window.close();
    }
  };

  const WindowHeader = () => (
    <div 
      data-tauri-drag-region 
      className="fixed top-0 left-0 right-0 h-9 flex items-center justify-between px-3 select-none z-50 bg-slate-900/5 backdrop-blur-sm"
    >
      <div data-tauri-drag-region className="flex items-center gap-2 text-xs font-bold text-slate-500">
        <ScrollText className="h-3.5 w-3.5 text-primary" />
        <span>DUBSAR 2.0</span>
      </div>
      <div className="flex items-center gap-1" data-tauri-drag-region="false">
        <button 
          type="button"
          onClick={handleMinimize} 
          className="h-6 w-7 rounded hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
          title="تصغير"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <button 
          type="button"
          onClick={handleClose} 
          className="h-6 w-7 rounded hover:bg-red-500 hover:text-white flex items-center justify-center text-slate-600 transition-colors"
          title="إغلاق"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );

  if (startup === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]" dir="rtl">
        <WindowHeader />
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (startup === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4" dir="rtl">
        <WindowHeader />
        <Card className="w-full max-w-sm rounded-2xl border shadow-lg bg-white p-6"><CardHeader className="p-0 mb-4"><CardTitle className="text-lg font-black text-destructive">تعذر تشغيل قاعدة البيانات</CardTitle><CardDescription className="font-bold text-xs mt-1">{setupError}</CardDescription></CardHeader><CardContent className="p-0"><Button className="w-full h-11 rounded-xl font-black text-sm" onClick={() => window.location.reload()}>إعادة المحاولة</Button></CardContent></Card>
      </div>
    );
  }

  if (startup === "setup") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4" dir="rtl">
        <WindowHeader />
        <Card className="w-full max-w-lg rounded-2xl border shadow-xl overflow-hidden bg-white">
          <CardHeader className="space-y-2 pt-6 pb-4 text-center">
            <div className="mx-auto h-12 w-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-md"><Store className="h-6 w-6" /></div>
            <CardTitle className="text-xl font-black text-primary">إعداد DUBSAR لأول مرة</CardTitle>
            <CardDescription className="font-bold text-xs">{setupStep === 1 ? "أدخل معلومات نشاطك لحفظها محلياً" : "أنشئ حساب المدير الأول للنظام"}</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {setupError && <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700">{setupError}</div>}
            {setupStep === 1 ? (
              <form onSubmit={continueSetup} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1"><Label className="font-bold text-xs">اسم النشاط</Label><Input required value={setupData.businessName} onChange={(e) => setSetupData({ ...setupData, businessName: e.target.value })} className="h-10 rounded-xl bg-slate-50 text-sm" /></div>
                  <div className="space-y-1"><Label className="font-bold text-xs">نوع النشاط</Label><Input required value={setupData.businessType} onChange={(e) => setSetupData({ ...setupData, businessType: e.target.value })} className="h-10 rounded-xl bg-slate-50 text-sm" placeholder="مثال: قطع غيار" /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1"><Label className="font-bold text-xs">رقم الهاتف</Label><Input required value={setupData.phone} onChange={(e) => setSetupData({ ...setupData, phone: e.target.value })} className="h-10 rounded-xl bg-slate-50 text-sm" /></div>
                  <div className="space-y-1"><Label className="font-bold text-xs">العنوان</Label><Input required value={setupData.address} onChange={(e) => setSetupData({ ...setupData, address: e.target.value })} className="h-10 rounded-xl bg-slate-50 text-sm" /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="h-14 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 cursor-pointer font-bold text-xs"><Upload className="h-4 w-4" />{setupData.logo ? "تم اختيار الشعار" : "رفع الشعار"}<input type="file" accept="image/*" className="hidden" onChange={(e) => readImage(e.target.files?.[0], "logo")} /></label>
                  <label className="h-14 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 cursor-pointer font-bold text-xs"><Upload className="h-4 w-4" />{setupData.invoiceHeaderImage ? "تم اختيار الترويسة" : "ترويسة A4"}<input type="file" accept="image/*" className="hidden" onChange={(e) => readImage(e.target.files?.[0], "invoiceHeaderImage")} /></label>
                </div>
                <Button type="submit" className="w-full h-11 rounded-xl font-black text-sm gap-2 mt-2"><ShieldCheck className="h-4 w-4" />متابعة إنشاء المدير</Button>
              </form>
            ) : (
              <form onSubmit={completeSetup} className="space-y-4">
                <div className="space-y-1"><Label className="font-bold text-xs">اسم المدير</Label><Input required value={managerData.displayName} onChange={(e) => setManagerData({ ...managerData, displayName: e.target.value })} className="h-10 rounded-xl bg-slate-50 text-sm" /></div>
                <div className="space-y-1"><Label className="font-bold text-xs">اسم المستخدم</Label><Input required value={managerData.username} onChange={(e) => setManagerData({ ...managerData, username: e.target.value })} className="h-10 rounded-xl bg-slate-50 text-sm" dir="ltr" /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div className="space-y-1"><Label className="font-bold text-xs">كلمة المرور</Label><Input required type="password" value={managerData.password} onChange={(e) => setManagerData({ ...managerData, password: e.target.value })} className="h-10 rounded-xl bg-slate-50 text-sm" /></div><div className="space-y-1"><Label className="font-bold text-xs">تأكيد كلمة المرور</Label><Input required type="password" value={managerData.confirmPassword} onChange={(e) => setManagerData({ ...managerData, confirmPassword: e.target.value })} className="h-10 rounded-xl bg-slate-50 text-sm" /></div></div>
                <div className="flex gap-2 pt-2"><Button type="button" variant="outline" className="h-11 rounded-xl font-bold text-sm" onClick={() => setSetupStep(1)}>رجوع</Button><Button type="submit" disabled={setupLoading} className="flex-1 h-11 rounded-xl font-black text-sm">{setupLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "إنشاء المدير وإكمال الإعداد"}</Button></div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F1F5F9] p-4 relative select-none" dir="rtl">
      <WindowHeader />
      <Card className="w-full max-w-[370px] rounded-2xl border border-slate-200/80 shadow-xl overflow-hidden bg-white">
        <CardHeader className="space-y-2 pt-8 pb-4 text-center">
          <div className="mx-auto flex flex-col items-center gap-1.5">
             <div className="h-12 w-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-md">
                <ScrollText className="h-6 w-6" />
             </div>
             <span className="text-2xl font-black text-primary tracking-tight">DUBSAR 2.0</span>
          </div>
          <CardDescription className="font-bold flex items-center justify-center gap-1.5 text-xs text-slate-500">
             <Monitor className="h-3.5 w-3.5 text-emerald-600" /> نظام الإدارة والمحاسبة المحلي
          </CardDescription>
        </CardHeader>
        
        <CardContent className="px-6 pb-8">
          {loginError && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-200/60 p-2.5 text-xs font-bold text-red-700 text-center">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLocalLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="font-bold text-xs text-slate-600 text-right block">اسم المستخدم</Label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="admin" 
                  className="h-11 rounded-xl pr-9 bg-slate-50 border-slate-200 font-bold text-sm" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  required 
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="font-bold text-xs text-slate-600 text-right block">كلمة المرور / الرمز</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  className="h-11 rounded-xl pr-9 bg-slate-50 border-slate-200 font-bold text-sm" 
                  value={pin} 
                  onChange={(e) => setPin(e.target.value)} 
                  required 
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 rounded-xl font-black text-sm gap-2 shadow-md mt-2 bg-primary hover:bg-primary/90" 
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "تسجيل الدخول"}
            </Button>
            
            <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-400">
               <WifiOff className="h-3 w-3" />
               <span>يعمل محلياً دون الحاجة للإنترنت</span>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
