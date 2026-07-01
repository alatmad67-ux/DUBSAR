
'use client';

import { useState } from "react";
import { useAuth, useFirestore } from "@/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { User, Phone, Lock, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    displayName: "",
    phoneNumber: "",
    password: "",
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // تنظيف رقم الهاتف وتحويله لبريد وهمي للدخول بكلمة مرور
      const cleanPhone = formData.phoneNumber.replace(/\s/g, '');
      const fakeEmail = `${cleanPhone}@mma.store`;

      // 1. إنشاء الحساب في Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, fakeEmail, formData.password);
      const user = userCredential.user;

      // 2. تحديد الدور (مدير للرقم المحدد، عميل للبقية)
      const role = cleanPhone === '07858833838' ? 'admin' : 'retail_customer';

      // 3. إنشاء ملف التعريف في Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        displayName: formData.displayName,
        phoneNumber: cleanPhone,
        email: fakeEmail,
        role: role,
        createdAt: Date.now(),
      });

      toast({ title: "تم إنشاء الحساب", description: "مرحباً بك في مجمع محمد علاء." });
      router.push(role === 'admin' ? "/admin" : "/");
    } catch (error: any) {
      console.error(error);
      toast({ 
        variant: "destructive", 
        title: "خطأ في التسجيل", 
        description: error.message || "فشل إنشاء الحساب، يرجى المحاولة مرة أخرى." 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDF8F5] p-4">
      <Card className="w-full max-w-md rounded-[40px] border-none shadow-2xl overflow-hidden bg-white">
        <CardHeader className="space-y-4 pt-10 pb-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white shadow-lg">
            <span className="text-3xl font-black italic">M</span>
          </div>
          <div className="space-y-1">
            <CardTitle className="text-3xl font-black">إنشاء حساب جديد</CardTitle>
            <CardDescription className="font-medium">انضم إلينا للحصول على أفضل الخدمات</CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="px-8">
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label className="font-bold mr-1">الاسم الكامل</Label>
              <div className="relative">
                <User className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  placeholder="محمد علاء" 
                  className="h-14 rounded-2xl pr-12 bg-muted/20 border-none"
                  value={formData.displayName}
                  onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-bold mr-1">رقم الهاتف</Label>
              <div className="relative">
                <Phone className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  type="tel" 
                  placeholder="07XXXXXXXXX" 
                  className="h-14 rounded-2xl pr-12 bg-muted/20 border-none text-left"
                  dir="ltr"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
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
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-14 rounded-2xl font-black text-lg gap-2 shadow-lg mt-4" disabled={loading}>
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "إنشاء الحساب"}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="pb-10 pt-4 flex flex-col gap-4">
          <p className="text-center text-sm text-muted-foreground font-medium">
            لديك حساب بالفعل؟{" "}
            <Link href="/login" className="text-primary font-bold hover:underline">تسجيل الدخول</Link>
          </p>
          <Button variant="ghost" className="rounded-full gap-2 text-xs font-bold" asChild>
             <Link href="/">تخطي والعودة للرئيسية <ArrowRight className="h-3 w-3" /></Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
