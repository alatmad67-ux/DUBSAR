
'use client';

import { 
  Bike, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Image as ImageIcon,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, orderBy, addDoc, doc, deleteDoc } from "firebase/firestore";
import { useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { toast } from "@/hooks/use-toast";

export default function MotorcycleTypesPage() {
  const db = useFirestore();
  const typesQuery = useMemo(() => query(collection(db, 'motorcycleTypes'), orderBy('name')), [db]);
  const { data: types, loading } = useCollection(typesQuery);
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      setUploadedImageUrl(url);
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل رفع الصورة." });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await addDoc(collection(db, 'motorcycleTypes'), {
        name: formData.get('name'),
        image: uploadedImageUrl,
        createdAt: Date.now()
      });
      setIsAddOpen(false);
      setUploadedImageUrl("");
      toast({ title: "تم الإضافة", description: "تم إضافة نوع دراجة جديد بنجاح." });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل الحفظ." });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد؟")) return;
    await deleteDoc(doc(db, 'motorcycleTypes', id));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight">أنواع الدراجات</h1>
          <p className="text-muted-foreground font-medium text-sm">إدارة الفئات الرئيسية للدراجات التي تظهر في الواجهة.</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl h-11 font-bold gap-2 shadow-lg shadow-primary/20">
              <Plus className="h-5 w-5" /> إضافة نوع جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[32px]">
            <DialogHeader><DialogTitle className="text-2xl font-black">إضافة نوع دراجة</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-6 pt-4">
               <div className="space-y-2">
                 <Label className="font-bold">اسم النوع (مثال: سكوتر، رياضي)</Label>
                 <Input name="name" required className="rounded-xl h-12 bg-muted/30 border-none" />
               </div>
               <div className="space-y-4">
                 <Label className="font-bold">صورة تمثيلية</Label>
                 <div className="relative aspect-video rounded-2xl border-2 border-dashed bg-muted/20 overflow-hidden flex items-center justify-center">
                    {uploadedImageUrl ? (
                      <Image src={uploadedImageUrl} alt="Preview" fill className="object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 opacity-40">
                         {isUploading ? <Loader2 className="h-8 w-8 animate-spin" /> : <ImageIcon className="h-10 w-10" />}
                         <span className="text-xs font-bold">{isUploading ? 'جاري الرفع...' : 'ارفع صورة النوع'}</span>
                      </div>
                    )}
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} disabled={isUploading} />
                 </div>
               </div>
               <DialogFooter>
                 <Button type="submit" disabled={isUploading} className="w-full h-12 rounded-xl font-black">حفظ النوع</Button>
               </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {loading ? (
          Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-48 rounded-[32px]" />)
        ) : types.map((type: any) => (
          <Card key={type.id} className="rounded-[32px] border-none shadow-sm overflow-hidden group hover:shadow-xl transition-all">
            <div className="relative aspect-square">
               <Image src={type.image || `https://picsum.photos/seed/${type.id}/400/400`} alt={type.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5">
                  <h3 className="text-white font-black text-lg">{type.name}</h3>
               </div>
               <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <Button variant="secondary" size="icon" className="h-8 w-8 rounded-lg bg-white/90 backdrop-blur-sm"><Edit2 className="h-4 w-4" /></Button>
                  <Button variant="destructive" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handleDelete(type.id)}><Trash2 className="h-4 w-4" /></Button>
               </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

