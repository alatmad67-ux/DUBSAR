
'use client';

import { useState } from "react";
import { useAuth } from "@/firebase";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Chrome, Mail, Lock, Loader2, ArrowRight, Phone, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const auth = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // States
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handlePhonePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // تحويل رقم الهاتف لبريد وهمي داخلياً كما في التسجيل
      const cleanPhone = phoneNumber.replace(/\s/g, '');
      const fakeEmail = `${cleanPhone}@mma.store`;
      
      await signInWithEmailAndPassword(auth, fakeEmail, password);
      toast({ title: "تم تسجيل الدخول", description: "مرحباً بك مجدداً." });
      
      // التوجيه بناءً على ما إذا كان المدير
      if (cleanPhone === '07858833838') {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "خطأ في الدخول", 
        description: "رقم الهاتف أو كلمة المرور غير صحيحة." 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "تم تسجيل الدخول", description: "مرحباً بك مجدداً." });
      router.push("/");
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "خطأ في الدخول", 
        description: "تأكد من صحة البريد الإلكتروني وكلمة المرور." 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push("/");
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل تسجيل الدخول عبر جوجل." });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDF8F5] p-4 relative overflow-hidden">
      <Card className="w-full max-w-md rounded-[40px] border-none shadow-2xl overflow-hidden bg-white">
        <CardHeader className="space-y-4 pt-10 pb-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white shadow-lg">
            <span className="text-3xl font-black italic">M</span>
          </div>
          <div className="space-y-1">
            <CardTitle className="text-3xl font-black">مرحباً بك</CardTitle>
            <CardDescription className="font-medium">سجل دخولك للوصول إلى كافة خدماتنا</CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6 px-8">
          <Tabs defaultValue="phone" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-12 rounded-xl bg-muted/30 mb-6 p-1">
              <TabsTrigger value="phone" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">رقم الهاتف</TabsTrigger>
              <TabsTrigger value="email" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">البريد الإلكتروني</TabsTrigger>
            </TabsList>

            <TabsContent value="phone" className="space-y-4">
              <form onSubmit={handlePhonePasswordLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-bold mr-1">رقم الهاتف</Label>
                  <div className="relative">
                    <Phone className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                      type="tel" 
                      placeholder="07XXXXXXXXX" 
                      className="h-14 rounded-2xl pr-12 bg-muted/20 border-none text-left"
                      dir="ltr"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold mr-1">كلمة المرور</Label>
                  <div className="relative">
                    <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      className="h-14 rounded-2xl pr-12 bg-muted/20 border-none"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full h-14 rounded-2xl font-black text-lg gap-2 shadow-lg mt-2" disabled={loading}>
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "دخول"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="email" className="space-y-4">
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-bold mr-1">البريد الإلكتروني</Label>
                  <div className="relative">
                    <Mail className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                      type="email" 
                      placeholder="admin@mma.com" 
                      className="h-14 rounded-2xl pr-12 bg-muted/20 border-none"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold mr-1">كلمة المرور</Label>
                  <div className="relative">
                    <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      className="h-14 rounded-2xl pr-12 bg-muted/20 border-none"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full h-14 rounded-2xl font-black text-lg gap-2 shadow-lg mt-2" disabled={loading}>
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "دخول"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-4 text-muted-foreground font-bold">أو تابع عبر</span></div>
          </div>

          <Button variant="outline" className="w-full h-14 rounded-2xl border-2 font-black gap-3" onClick={handleGoogleLogin}>
            <Chrome className="h-5 w-5 text-red-500" />
            الدخول عبر جوجل
          </Button>
        </CardContent>
        
        <CardFooter className="pb-10 pt-4 flex flex-col gap-4">
          <p className="text-center text-sm text-muted-foreground font-medium">
            ليس لديك حساب؟{" "}
            <Link href="/register" className="text-primary font-bold hover:underline">إنشاء حساب جديد</Link>
          </p>
          <Button variant="ghost" className="rounded-full gap-2 text-xs font-bold" asChild>
             <Link href="/">تخطي والعودة للرئيسية <ArrowRight className="h-3 w-3" /></Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
