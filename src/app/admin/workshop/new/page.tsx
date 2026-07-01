
'use client';

import { 
  ChevronRight, 
  Save, 
  User, 
  Bike, 
  ClipboardList, 
  Camera,
  Calendar,
  AlertCircle,
  Loader2,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { useState } from "react";
import { useFirestore } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { uploadToCloudinary } from "@/lib/cloudinary";
import Image from "next/image";

export default function NewRepairOrderPage() {
  const db = useFirestore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files).map(file => uploadToCloudinary(file));
      const urls = await Promise.all(uploadPromises);
      setUploadedPhotos(prev => [...prev, ...urls]);
      toast({ title: "تم الرفع", description: "تم رفع صور الحالة بنجاح." });
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل رفع الصور." });
    } finally {
      setIsUploading(false);
    }
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const orderData = {
      orderNumber: `RE-${Math.floor(Math.random() * 90000) + 10000}`,
      customerName: formData.get('customerName'),
      phoneNumber: formData.get('phoneNumber'),
      bikeBrand: formData.get('bikeBrand'),
      bikeModel: formData.get('bikeModel'),
      bikeType: formData.get('bikeType'),
      bikeColor: formData.get('bikeColor'),
      plateNumber: formData.get('plateNumber'),
      problemDescription: formData.get('problemDescription'),
      bikePhotos: uploadedPhotos,
      status: 'received',
      partsUsed: [],
      laborCost: 0,
      totalAmount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, 'repairOrders'), orderData);
      toast({ title: "تم بنجاح", description: "تم إنشاء أمر التصليح بنجاح." });
      router.push('/admin/workshop');
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ", description: "حدث خطأ أثناء حفظ البيانات." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
           <Link href="/admin/workshop">
              <Button variant="ghost" size="icon" className="rounded-xl bg-white shadow-sm">
                <ChevronRight className="h-5 w-5 rotate-180" />
              </Button>
           </Link>
           <div>
              <h1 className="text-2xl font-black">أمر تصليح جديد</h1>
              <p className="text-xs text-muted-foreground font-medium">إدخال بيانات الدراجة والمشكلة المبلغ عنها.</p>
           </div>
        </div>
        <Button 
          form="repair-form" 
          type="submit" 
          className="rounded-xl font-bold h-11 shadow-lg shadow-primary/20 gap-2 px-8"
          disabled={loading || isUploading}
        >
          <Save className="h-5 w-5" /> {loading ? "جاري الحفظ..." : "حفظ أمر التصليح"}
        </Button>
      </div>

      <form id="repair-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 rounded-[32px] border-none shadow-sm h-fit">
           <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-black">
                 <User className="h-5 w-5 text-primary" /> بيانات العميل
              </CardTitle>
           </CardHeader>
           <CardContent className="space-y-4">
              <div className="space-y-2">
                 <Label className="font-bold mr-1">اسم العميل</Label>
                 <Input name="customerName" required placeholder="الاسم الكامل" className="rounded-2xl h-12 bg-muted/30 border-none" />
              </div>
              <div className="space-y-2">
                 <Label className="font-bold mr-1">رقم الهاتف</Label>
                 <Input name="phoneNumber" required placeholder="07XXXXXXXXX" className="rounded-2xl h-12 bg-muted/30 border-none text-left" dir="ltr" />
              </div>
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex gap-3">
                 <AlertCircle className="h-5 w-5 text-primary shrink-0" />
                 <p className="text-[10px] font-bold text-primary/80">تأكد من صحة رقم الهاتف لإرسال تحديثات الحالة عبر الواتساب لاحقاً.</p>
              </div>
           </CardContent>
        </Card>

        <Card className="md:col-span-2 rounded-[32px] border-none shadow-sm">
           <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-black">
                 <Bike className="h-5 w-5 text-primary" /> بيانات الدراجة
              </CardTitle>
           </CardHeader>
           <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                 <Label className="font-bold mr-1">الماركة (Brand)</Label>
                 <Input name="bikeBrand" required placeholder="مثال: Honda" className="rounded-2xl h-12 bg-muted/30 border-none" />
              </div>
              <div className="space-y-2">
                 <Label className="font-bold mr-1">الموديل (Model)</Label>
                 <Input name="bikeModel" required placeholder="مثال: CBR 600" className="rounded-2xl h-12 bg-muted/30 border-none" />
              </div>
              <div className="space-y-2">
                 <Label className="font-bold mr-1">رقم اللوحة</Label>
                 <Input name="plateNumber" placeholder="رقم الدراجة" className="rounded-2xl h-12 bg-muted/30 border-none" />
              </div>
              <div className="space-y-2">
                 <Label className="font-bold mr-1">اللون</Label>
                 <Input name="bikeColor" placeholder="لون الدراجة" className="rounded-2xl h-12 bg-muted/30 border-none" />
              </div>
           </CardContent>
        </Card>

        <Card className="md:col-span-3 rounded-[32px] border-none shadow-sm">
           <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-black">
                 <ClipboardList className="h-5 w-5 text-primary" /> تفاصيل المشكلة
              </CardTitle>
           </CardHeader>
           <CardContent className="space-y-6">
              <div className="space-y-2">
                 <Label className="font-bold mr-1">وصف المشكلة / طلب العميل</Label>
                 <Textarea name="problemDescription" required placeholder="اكتب تفاصيل العطل أو الصيانة المطلوبة..." className="rounded-2xl bg-muted/30 border-none min-h-[120px]" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                 <div className="space-y-4">
                    <Label className="font-bold block">صور الدراجة عند الاستلام (Cloudinary)</Label>
                    <div className="flex flex-wrap gap-4">
                       {uploadedPhotos.map((url, i) => (
                         <div key={i} className="relative h-24 w-24 rounded-2xl overflow-hidden border bg-muted shadow-sm">
                            <Image src={url} alt="Bike Status" fill className="object-cover" />
                            <button 
                              type="button" 
                              onClick={() => setUploadedPhotos(prev => prev.filter((_, idx) => idx !== i))}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                            >
                              <X className="h-3 w-3" />
                            </button>
                         </div>
                       ))}
                       <label className="h-24 w-24 rounded-2xl border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center text-muted-foreground gap-1 hover:border-primary/50 transition-colors cursor-pointer bg-muted/5">
                          {isUploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Camera className="h-6 w-6" />}
                          <span className="text-[10px] font-bold">إضافة صورة</span>
                          <input type="file" multiple accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={isUploading} />
                       </label>
                    </div>
                 </div>
              </div>
           </CardContent>
        </Card>
      </form>
    </div>
  );
}
