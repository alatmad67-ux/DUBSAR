
'use client';

import { 
  Store, 
  Globe, 
  Phone, 
  MapPin, 
  Save, 
  Shield, 
  MessageCircle,
  Smartphone,
  Palette,
  BellRing,
  Link as LinkIcon,
  CreditCard,
  Cloud,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

export default function AdminSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast({ title: "تم الحفظ", description: "تم تحديث إعدادات النظام بنجاح." });
    }, 1500);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight">الإعدادات والربط</h1>
          <p className="text-muted-foreground font-medium text-base">إدارة معلومات المجمع، الأمان، وتفضيلات المظهر والخدمات السحابية.</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="rounded-2xl font-black h-14 shadow-2xl shadow-primary/30 gap-3 px-10 text-lg">
          {isSaving ? <Loader2 className="h-6 w-6 animate-spin" /> : <Save className="h-6 w-6" />}
          حفظ كافة التغييرات
        </Button>
      </div>

      <Tabs defaultValue="store" className="space-y-8">
        <TabsList className="bg-white dark:bg-card p-1.5 rounded-[24px] h-16 border shadow-sm w-full md:w-fit overflow-x-auto no-scrollbar">
          <TabsTrigger value="store" className="rounded-2xl px-10 font-black text-sm data-[state=active]:bg-primary data-[state=active]:text-white transition-all">معلومات المجمع</TabsTrigger>
          <TabsTrigger value="integrations" className="rounded-2xl px-10 font-black text-sm data-[state=active]:bg-primary data-[state=active]:text-white transition-all">الخدمات السحابية</TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-2xl px-10 font-black text-sm data-[state=active]:bg-primary data-[state=active]:text-white transition-all">الإشعارات</TabsTrigger>
          <TabsTrigger value="appearance" className="rounded-2xl px-10 font-black text-sm data-[state=active]:bg-primary data-[state=active]:text-white transition-all">المظهر</TabsTrigger>
          <TabsTrigger value="security" className="rounded-2xl px-10 font-black text-sm data-[state=active]:bg-primary data-[state=active]:text-white transition-all">الأمان</TabsTrigger>
        </TabsList>

        <TabsContent value="store" className="space-y-8 animate-in slide-in-from-bottom-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="rounded-[40px] border-none shadow-sm overflow-hidden">
              <CardHeader className="bg-primary/5 p-8 border-b border-primary/5">
                <CardTitle className="flex items-center gap-3 text-2xl font-black">
                  <Store className="h-7 w-7 text-primary" /> المعلومات الأساسية
                </CardTitle>
                <CardDescription className="font-bold text-sm">البيانات الرسمية التي تظهر للعملاء في الفواتير والتطبيق.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <Label className="font-black text-sm mr-1 uppercase tracking-widest opacity-60">اسم المجمع التجاري</Label>
                  <Input defaultValue="مجمع محمد علاء" className="rounded-2xl h-14 bg-muted/30 border-none font-bold text-lg px-6" />
                </div>
                <div className="space-y-2">
                  <Label className="font-black text-sm mr-1 uppercase tracking-widest opacity-60">الوصف التسويقي</Label>
                  <Textarea placeholder="اكتب وصفاً مختصراً للمجمع..." className="rounded-2xl bg-muted/30 border-none min-h-[120px] p-6 font-medium leading-relaxed" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-black text-sm mr-1 opacity-60">رقم الهاتف الأساسي</Label>
                    <Input defaultValue="07700000000" className="rounded-2xl h-14 bg-muted/30 border-none text-left font-black" dir="ltr" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black text-sm mr-1 opacity-60">رقم الواتساب (للطلبات)</Label>
                    <Input defaultValue="07700000000" className="rounded-2xl h-14 bg-muted/30 border-none text-left font-black" dir="ltr" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[40px] border-none shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/30 p-8 border-b">
                <CardTitle className="flex items-center gap-3 text-2xl font-black">
                  <MapPin className="h-7 w-7 text-primary" /> الموقع والتواصل
                </CardTitle>
                <CardDescription className="font-bold text-sm">عناوين الفروع وروابط حسابات التواصل الاجتماعي.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <Label className="font-black text-sm mr-1 opacity-60">العنوان الرئيسي</Label>
                  <Input defaultValue="بغداد، الكرادة، ساحة كهرمانة" className="rounded-2xl h-14 bg-muted/30 border-none font-bold px-6" />
                </div>
                <div className="space-y-2">
                  <Label className="font-black text-sm mr-1 opacity-60">رابط خرائط جوجل (Google Maps)</Label>
                  <Input placeholder="https://goo.gl/maps/..." className="rounded-2xl h-14 bg-muted/30 border-none text-left font-medium px-6" dir="ltr" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                   <div className="space-y-2">
                    <Label className="font-black text-sm mr-1 opacity-60">رابط صفحة فيسبوك</Label>
                    <Input placeholder="facebook.com/..." className="rounded-2xl h-14 bg-muted/30 border-none text-left font-medium" dir="ltr" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black text-sm mr-1 opacity-60">معرف إنستغرام</Label>
                    <Input placeholder="@username" className="rounded-2xl h-14 bg-muted/30 border-none text-left font-medium" dir="ltr" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-8 animate-in slide-in-from-bottom-4">
           <Card className="rounded-[40px] border-none shadow-sm max-w-3xl overflow-hidden">
              <CardHeader className="bg-blue-500/5 p-8 border-b border-blue-500/10">
                <CardTitle className="flex items-center gap-3 text-2xl font-black">
                  <Cloud className="h-7 w-7 text-blue-500" /> تكامل Cloudinary (رفع الصور)
                </CardTitle>
                <CardDescription className="font-bold text-sm">إعدادات التخزين السحابي لصور المنتجات وأوامر الورشة.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                 <div className="flex items-center justify-between p-6 rounded-3xl bg-blue-500/5 border border-blue-500/10">
                    <div className="flex items-center gap-4">
                       <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                          <Cloud className="h-6 w-6 text-blue-500" />
                       </div>
                       <div>
                          <p className="font-black text-lg leading-none">حالة الاتصال: متصل</p>
                          <p className="text-xs font-bold text-blue-600 mt-1 uppercase tracking-tighter">Connected to dgnao6qwq</p>
                       </div>
                    </div>
                    <Badge className="bg-green-100 text-green-700 border-none font-black px-4 py-1.5 rounded-full flex gap-1 items-center">
                       <CheckCircle2 className="h-3 w-3" /> نشط ومستقر
                    </Badge>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <Label className="font-black text-xs opacity-60 uppercase tracking-widest">Cloud Name</Label>
                       <Input disabled defaultValue="dgnao6qwq" className="rounded-2xl h-14 bg-muted/30 border-none font-black opacity-50" />
                    </div>
                    <div className="space-y-2">
                       <Label className="font-black text-xs opacity-60 uppercase tracking-widest">Upload Preset</Label>
                       <Input disabled defaultValue="MMA-store" className="rounded-2xl h-14 bg-muted/30 border-none font-black opacity-50" />
                    </div>
                 </div>
                 <div className="p-6 rounded-3xl border-2 border-dashed border-muted-foreground/10 bg-muted/5">
                    <p className="text-xs font-bold text-muted-foreground leading-relaxed">
                       * ملاحظة: يتم جلب مفاتيح الـ API من متغيرات البيئة (Environment Variables) لضمان أمان النظام. لتعديلها يرجى التواصل مع فريق التطوير التقني.
                    </p>
                 </div>
              </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="notifications" className="animate-in slide-in-from-bottom-4">
           <Card className="rounded-[40px] border-none shadow-sm max-w-3xl">
              <CardHeader className="p-8">
                <CardTitle className="flex items-center gap-3 text-2xl font-black">
                  <BellRing className="h-7 w-7 text-primary" /> تفضيلات الإشعارات
                </CardTitle>
                <CardDescription className="font-bold text-sm">التحكم في متى وكيف يتم إخطار الإدارة والعملاء.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-8">
                 <div className="flex items-center justify-between p-6 rounded-3xl bg-muted/20 hover:bg-muted/40 transition-colors">
                    <div className="space-y-1">
                       <p className="font-black text-lg">إشعارات الطلبات الجديدة</p>
                       <p className="text-sm text-muted-foreground font-medium">إرسال إشعار فوري للمدراء عند استلام طلب شراء جديد.</p>
                    </div>
                    <Switch defaultChecked className="scale-110 data-[state=checked]:bg-primary" />
                 </div>
                 <div className="flex items-center justify-between p-6 rounded-3xl bg-muted/20 hover:bg-muted/40 transition-colors">
                    <div className="space-y-1">
                       <p className="font-black text-lg">تنبيهات انخفاض المخزون</p>
                       <p className="text-sm text-muted-foreground font-medium">تنبيه المسؤولين عند وصول أي منتج للحد الأدنى (أقل من 5 قطع).</p>
                    </div>
                    <Switch defaultChecked className="scale-110 data-[state=checked]:bg-primary" />
                 </div>
                 <div className="flex items-center justify-between p-6 rounded-3xl bg-muted/20 hover:bg-muted/40 transition-colors">
                    <div className="space-y-1">
                       <p className="font-black text-lg">رسائل واتساب آلية</p>
                       <p className="text-sm text-muted-foreground font-medium">تجهيز مسودات رسائل الواتساب للعملاء عند تغيير حالة الطلب أو الورشة.</p>
                    </div>
                    <Switch defaultChecked className="scale-110 data-[state=checked]:bg-primary" />
                 </div>
              </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="appearance" className="animate-in slide-in-from-bottom-4">
           <Card className="rounded-[40px] border-none shadow-sm max-w-3xl">
              <CardHeader className="p-8">
                <CardTitle className="flex items-center gap-3 text-2xl font-black">
                  <Palette className="h-7 w-7 text-primary" /> مظهر المنصة والبراند
                </CardTitle>
                <CardDescription className="font-bold text-sm">تخصيص الألوان والسمات المرئية للوحة الإدارة وتطبيق العميل.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-8">
                 <div className="flex items-center justify-between p-6 rounded-3xl border-2 border-primary/10">
                    <div className="space-y-1">
                       <p className="font-black text-lg">الوضع الليلي الذكي</p>
                       <p className="text-sm text-muted-foreground font-medium">التحول التلقائي للمظهر الداكن بناءً على إعدادات الجهاز.</p>
                    </div>
                    <Switch className="scale-110 data-[state=checked]:bg-primary" />
                 </div>
                 <div className="space-y-6">
                    <p className="text-sm font-black uppercase tracking-widest opacity-60">اللون الأساسي للنظام (Brand Primary Color)</p>
                    <div className="flex gap-6">
                       <div className="group flex flex-col items-center gap-2">
                          <div className="h-14 w-14 rounded-3xl bg-primary border-4 border-white shadow-xl ring-4 ring-primary cursor-pointer hover:scale-110 transition-transform" />
                          <span className="text-[10px] font-black uppercase tracking-tighter">Vibrant Orange</span>
                       </div>
                       <div className="group flex flex-col items-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
                          <div className="h-14 w-14 rounded-3xl bg-blue-600 border-4 border-white shadow-sm cursor-pointer hover:scale-110 transition-transform" />
                          <span className="text-[10px] font-black uppercase tracking-tighter">Classic Blue</span>
                       </div>
                       <div className="group flex flex-col items-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
                          <div className="h-14 w-14 rounded-3xl bg-emerald-600 border-4 border-white shadow-sm cursor-pointer hover:scale-110 transition-transform" />
                          <span className="text-[10px] font-black uppercase tracking-tighter">Modern Green</span>
                       </div>
                    </div>
                 </div>
              </CardContent>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

